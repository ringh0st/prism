-- Lumipals: Light Rush. A weekly run of 30 puzzles with one pot of spare moves; the score is how many
-- puzzles a run clears. Keeps each player's best for the week, pays milestone sparks once a week, and
-- shows a weekly board under public nicknames.
-- Run in Supabase → SQL Editor AFTER social.sql (uses _week_start, _nickname_for). Safe to run again.
-- Milestones must match RUSH_MILESTONES and RUSH_LENGTH in src/game/rush.js (a test checks).

create table if not exists public.rush_runs (
  user_id uuid not null references auth.users (id) on delete cascade,
  week date not null,                       -- the Monday (UTC) the week starts
  best integer not null default 0,          -- most puzzles cleared in one run this week
  paid integer[] not null default '{}',     -- milestones already paid this week
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

-- Only the functions below read or write it.
alter table public.rush_runs enable row level security;

-- Milestone (puzzles cleared) → sparks.
create or replace function public._rush_milestone_sparks(p_cleared integer)
returns integer
language sql
immutable
as $$
  select case p_cleared when 5 then 20 when 10 then 40 when 20 then 80 when 30 then 150 else 0 end;
$$;

create or replace function public._my_rush(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select jsonb_build_object('week', week, 'best', best, 'paid', to_jsonb(paid))
       from public.rush_runs where user_id = p_user and week = public._week_start()),
    jsonb_build_object('week', public._week_start(), 'best', 0, 'paid', '[]'::jsonb));
$$;

-- A run reached `p_cleared` puzzles (sent at each milestone and when the run ends).
create or replace function public.record_rush_run(p_cleared integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_week date := public._week_start();
  v_paid integer[];
  v_new integer[];
  v_sparks integer;
begin
  if p_cleared is null or p_cleared < 0 or p_cleared > 30 then
    raise exception using message = 'Invalid result.';
  end if;

  insert into public.rush_runs (user_id, week) values (v_user, v_week) on conflict do nothing;
  select paid into v_paid from public.rush_runs where user_id = v_user and week = v_week for update;
  select coalesce(array_agg(m), '{}') into v_new
    from unnest(array[5, 10, 20, 30]) m where m <= p_cleared and not (m = any (v_paid));
  select coalesce(sum(public._rush_milestone_sparks(m)), 0) into v_sparks from unnest(v_new) m;

  update public.rush_runs set
    best = greatest(best, p_cleared),
    paid = paid || v_new,
    updated_at = case when p_cleared > best then now() else updated_at end
  where user_id = v_user and week = v_week;
  if v_sparks > 0 then
    update public.profiles set sparks = sparks + v_sparks where id = v_user;
  end if;

  return public._economy_state(v_user) || jsonb_build_object('rush', public._my_rush(v_user), 'sparksEarned', v_sparks);
end;
$$;

create or replace function public.my_rush()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('rush', public._my_rush(public._require_user()));
$$;

-- This week's top 20 runs (ties: whoever got there first), and your own place.
create or replace function public.rush_board()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ranking as (
    select user_id, best, rank() over (order by best desc, updated_at) as rank
    from public.rush_runs
    where week = public._week_start() and best > 0
  )
  select jsonb_build_object(
    'week', public._week_start(),
    'top', coalesce((
      select jsonb_agg(jsonb_build_object('rank', r.rank, 'nickname', public._nickname_for(r.user_id), 'best', r.best, 'isMe', r.user_id = auth.uid())
        order by r.rank)
      from ranking r where r.rank <= 20), '[]'::jsonb),
    'me', (select jsonb_build_object('rank', r.rank, 'best', r.best) from ranking r where r.user_id = auth.uid())
  );
$$;

revoke all on function public._rush_milestone_sparks(integer) from public, anon, authenticated;
revoke all on function public._my_rush(uuid) from public, anon, authenticated;
revoke all on function public.record_rush_run(integer) from public, anon;
revoke all on function public.my_rush() from public, anon;
grant execute on function public.record_rush_run(integer) to authenticated;
grant execute on function public.my_rush() to authenticated;
grant execute on function public.rush_board() to anon, authenticated;
