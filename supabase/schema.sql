-- Prism database setup.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Profiles: one per player, created automatically on first sign-in.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  sparks integer not null default 30 check (sparks >= 0),
  daily_streak integer not null default 0 check (daily_streak >= 0),
  last_daily_date date,
  beam_theme text not null default 'sunbeam',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Progress: best result per player per level.
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id text not null,
  stars smallint not null check (stars between 0 and 3),
  best_moves integer check (best_moves >= 0),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

-- ---------------------------------------------------------------------------
-- Levels: managed by admins in the in-game editor.
-- Published levels are shown to everyone and override built-in levels with the same id.
-- ---------------------------------------------------------------------------
create table if not exists public.levels (
  id text primary key,
  world integer not null check (world >= 1),
  level_index integer not null check (level_index >= 1),
  difficulty text not null default 'normal' check (difficulty in ('normal', 'hard', 'extra')),
  name text not null default '',
  par integer not null check (par >= 1),
  data jsonb not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create index if not exists levels_world_order on public.levels (world, level_index);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists progress_touch on public.progress;
create trigger progress_touch before update on public.progress
  for each row execute function public.touch_updated_at();
drop trigger if exists levels_touch on public.levels;
create trigger levels_touch before update on public.levels
  for each row execute function public.touch_updated_at();

-- Create a profile when someone signs in for the first time.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Players can permanently delete their own account (and, by cascade, all their data).
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security: each player only sees and edits their own data.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.levels enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Players may update their own profile, but never their admin flag.
revoke update on public.profiles from authenticated;
grant update (display_name, sparks, daily_streak, last_daily_date, beam_theme) on public.profiles to authenticated;

drop policy if exists "Read own progress" on public.progress;
create policy "Read own progress" on public.progress
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Write own progress" on public.progress;
create policy "Write own progress" on public.progress
  for insert with check (user_id = auth.uid());

drop policy if exists "Update own progress" on public.progress;
create policy "Update own progress" on public.progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Delete own progress" on public.progress;
create policy "Delete own progress" on public.progress
  for delete using (user_id = auth.uid());

drop policy if exists "Everyone reads published levels" on public.levels;
create policy "Everyone reads published levels" on public.levels
  for select using (is_published or public.is_admin());

drop policy if exists "Admins manage levels" on public.levels;
create policy "Admins manage levels" on public.levels
  for all using (public.is_admin()) with check (public.is_admin());
