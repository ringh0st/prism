-- Prism economy: diamonds, helpers, store and purchases.
-- Run in Supabase → SQL Editor AFTER schema.sql. Safe to run more than once.
--
-- From here on, signed-in players' currencies only change through the functions below,
-- which check every rule on the server. The game cannot edit balances directly.

-- ---------------------------------------------------------------------------
-- Profile columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists diamonds integer not null default 0 check (diamonds >= 0),
  add column if not exists helpers jsonb not null default '{"hint": 1, "lens": 1, "autoturn": 0, "skip": 0}',
  add column if not exists rewarded_worlds integer[] not null default '{}',
  add column if not exists perfected_worlds integer[] not null default '{}',
  add column if not exists spark_purchases_today integer not null default 0,
  add column if not exists spark_purchase_date date;

-- Players may only change cosmetic fields themselves.
revoke update on public.profiles from authenticated;
grant update (display_name, beam_theme) on public.profiles to authenticated;

-- Progress is written only through record_level_result / merge_guest_progress.
drop policy if exists "Write own progress" on public.progress;
drop policy if exists "Update own progress" on public.progress;
drop policy if exists "Delete own progress" on public.progress;

-- ---------------------------------------------------------------------------
-- Store catalog (must match src/game/catalog.js)
-- ---------------------------------------------------------------------------
create table if not exists public.store_items (
  id text primary key,
  kind text not null check (kind in ('helper', 'sparks')),
  price_sparks integer check (price_sparks > 0),
  price_diamonds integer check (price_diamonds > 0),
  grant_helper text,
  grant_quantity integer not null default 0,
  grant_sparks integer not null default 0
);

insert into public.store_items (id, kind, price_sparks, price_diamonds, grant_helper, grant_quantity, grant_sparks) values
  ('hint', 'helper', 15, 1, 'hint', 1, 0),
  ('lens', 'helper', 40, 1, 'lens', 1, 0),
  ('autoturn', 'helper', null, 2, 'autoturn', 1, 0),
  ('skip', 'helper', null, 5, 'skip', 1, 0),
  ('sparks-small', 'sparks', null, 2, null, 0, 150),
  ('sparks-medium', 'sparks', null, 5, null, 0, 400),
  ('sparks-large', 'sparks', null, 10, null, 0, 1000)
on conflict (id) do update set
  kind = excluded.kind,
  price_sparks = excluded.price_sparks,
  price_diamonds = excluded.price_diamonds,
  grant_helper = excluded.grant_helper,
  grant_quantity = excluded.grant_quantity,
  grant_sparks = excluded.grant_sparks;

alter table public.store_items enable row level security;
drop policy if exists "Everyone reads the store" on public.store_items;
create policy "Everyone reads the store" on public.store_items for select using (true);

-- Real-money packs, mapped to the Lemon Squeezy product variants ("Prism Diamonds").
create table if not exists public.diamond_packs (
  id text primary key,
  diamonds integer not null check (diamonds > 0),
  variant_id text unique
);

insert into public.diamond_packs (id, diamonds, variant_id) values
  ('diamonds-10', 10, '2372489'),
  ('diamonds-60', 60, '2372493'),
  ('diamonds-130', 130, '2372494')
on conflict (id) do update set diamonds = excluded.diamonds, variant_id = excluded.variant_id;

alter table public.diamond_packs enable row level security;
drop policy if exists "Everyone reads diamond packs" on public.diamond_packs;
create policy "Everyone reads diamond packs" on public.diamond_packs for select using (true);

-- One row per real-money order. Written only by the payment webhook (service role).
create table if not exists public.purchases (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  pack_id text not null references public.diamond_packs (id),
  diamonds integer not null,
  amount_cents integer,
  currency text,
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.purchases enable row level security;
drop policy if exists "Read own purchases" on public.purchases;
create policy "Read own purchases" on public.purchases for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Internal helpers
-- ---------------------------------------------------------------------------
create or replace function public._require_user()
returns uuid
language plpgsql
stable
as $$
begin
  if auth.uid() is null then
    raise exception using message = 'Please sign in first.';
  end if;
  return auth.uid();
end;
$$;

create or replace function public._economy_state(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'sparks', p.sparks,
    'diamonds', p.diamonds,
    'helpers', p.helpers,
    'dailyStreak', p.daily_streak,
    'lastDailyDate', p.last_daily_date,
    'sparkPurchasesToday', case when p.spark_purchase_date = current_date then p.spark_purchases_today else 0 end
  )
  from public.profiles p
  where p.id = p_user;
$$;

create or replace function public._difficulty_multiplier(p_level_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  -- Unknown or unpublished level ids earn nothing, so made-up results can't farm sparks.
  select coalesce(
    (select case difficulty when 'extra' then 3 when 'hard' then 2 else 1 end
     from public.levels where id = p_level_id and is_published),
    0
  );
$$;

-- Pays 1 diamond the first time a world is completed, and 1 more when every level has 3 stars.
create or replace function public._award_world_rewards(p_user uuid, p_world integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_done integer;
  v_perfect integer;
  v_profile public.profiles;
  v_awarded integer := 0;
begin
  select count(*) into v_total from public.levels where world = p_world and is_published;
  if v_total = 0 then
    return 0;
  end if;

  select count(*) filter (where pr.stars > 0), count(*) filter (where pr.stars = 3)
  into v_done, v_perfect
  from public.levels l
  join public.progress pr on pr.level_id = l.id and pr.user_id = p_user
  where l.world = p_world and l.is_published;

  select * into v_profile from public.profiles where id = p_user for update;

  if v_done = v_total and not (p_world = any (v_profile.rewarded_worlds)) then
    update public.profiles
      set diamonds = diamonds + 1, rewarded_worlds = array_append(rewarded_worlds, p_world)
      where id = p_user;
    v_awarded := v_awarded + 1;
  end if;
  if v_perfect = v_total and not (p_world = any (v_profile.perfected_worlds)) then
    update public.profiles
      set diamonds = diamonds + 1, perfected_worlds = array_append(perfected_worlds, p_world)
      where id = p_user;
    v_awarded := v_awarded + 1;
  end if;
  return v_awarded;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public functions the game calls
-- ---------------------------------------------------------------------------
create or replace function public.economy_state()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public._economy_state(public._require_user());
$$;

create or replace function public.record_level_result(p_level_id text, p_stars integer, p_moves integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_previous integer;
  v_sparks integer;
  v_world integer;
  v_diamonds integer := 0;
begin
  if p_stars < 1 or p_stars > 3 then
    raise exception using message = 'Invalid result.';
  end if;

  select coalesce((select stars from public.progress where user_id = v_user and level_id = p_level_id), 0) into v_previous;
  v_sparks := greatest(0, p_stars - v_previous) * 5 * public._difficulty_multiplier(p_level_id);

  insert into public.progress (user_id, level_id, stars, best_moves)
  values (v_user, p_level_id, p_stars, p_moves)
  on conflict (user_id, level_id) do update set
    stars = greatest(public.progress.stars, excluded.stars),
    best_moves = least(public.progress.best_moves, excluded.best_moves),
    completed_at = now();

  update public.profiles set sparks = sparks + v_sparks where id = v_user;

  select world into v_world from public.levels where id = p_level_id;
  if v_world is not null then
    v_diamonds := public._award_world_rewards(v_user, v_world);
  end if;

  return public._economy_state(v_user) || jsonb_build_object('sparksEarned', v_sparks, 'diamondsEarned', v_diamonds);
end;
$$;

-- Moves a guest's local stars into their account on first sign-in. Sparks are recalculated
-- from the stars, so edited local balances can't be carried over.
create or replace function public.merge_guest_progress(p_levels jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_entry jsonb;
  v_sparks integer := 0;
  v_diamonds integer := 0;
  v_result jsonb;
begin
  if jsonb_typeof(p_levels) <> 'array' or jsonb_array_length(p_levels) > 1000 then
    raise exception using message = 'Invalid progress.';
  end if;
  for v_entry in select * from jsonb_array_elements(p_levels) loop
    if (v_entry ->> 'levelId') like 'daily-%' then
      continue;
    end if;
    v_result := public.record_level_result(
      v_entry ->> 'levelId',
      least(3, greatest(1, (v_entry ->> 'stars')::integer)),
      nullif(v_entry ->> 'bestMoves', '')::integer
    );
    v_sparks := v_sparks + (v_result ->> 'sparksEarned')::integer;
    v_diamonds := v_diamonds + (v_result ->> 'diamondsEarned')::integer;
  end loop;
  return public._economy_state(v_user) || jsonb_build_object('sparksEarned', v_sparks, 'diamondsEarned', v_diamonds);
end;
$$;

create or replace function public.record_daily(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_profile public.profiles;
  v_streak integer;
  v_sparks integer;
  v_diamonds integer;
begin
  -- Allow for time zones: the player's "today" is within a day of the server's.
  if p_date < current_date - 1 or p_date > current_date + 1 then
    raise exception using message = 'That daily puzzle is not available.';
  end if;

  select * into v_profile from public.profiles where id = v_user for update;
  if v_profile.last_daily_date = p_date then
    return public._economy_state(v_user)
      || jsonb_build_object('sparksEarned', 0, 'diamondsEarned', 0, 'streak', v_profile.daily_streak, 'isFirstToday', false);
  end if;

  v_streak := case when v_profile.last_daily_date = p_date - 1 then v_profile.daily_streak + 1 else 1 end;
  v_sparks := 20 + least(v_streak, 7) * 5;
  v_diamonds := case when v_streak % 7 = 0 then 1 else 0 end;

  update public.profiles
    set sparks = sparks + v_sparks,
        diamonds = diamonds + v_diamonds,
        daily_streak = v_streak,
        last_daily_date = p_date
    where id = v_user;

  return public._economy_state(v_user)
    || jsonb_build_object('sparksEarned', v_sparks, 'diamondsEarned', v_diamonds, 'streak', v_streak, 'isFirstToday', true);
end;
$$;

create or replace function public.buy_store_item(p_item_id text, p_currency text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_item public.store_items;
  v_profile public.profiles;
  v_owned integer;
  v_purchases_today integer;
begin
  select * into v_item from public.store_items where id = p_item_id;
  if not found then
    raise exception using message = 'That item is not in the store.';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;

  if v_item.grant_helper is not null then
    v_owned := coalesce((v_profile.helpers ->> v_item.grant_helper)::integer, 0);
    if v_owned + v_item.grant_quantity > 5 then
      raise exception using message = 'You already have the maximum of 5.';
    end if;
  end if;

  if p_currency = 'sparks' then
    if v_item.price_sparks is null then
      raise exception using message = 'This item needs diamonds.';
    end if;
    v_purchases_today := case when v_profile.spark_purchase_date = current_date then v_profile.spark_purchases_today else 0 end;
    if v_item.kind = 'helper' and v_purchases_today >= 3 then
      raise exception using message = 'Daily limit reached: 3 helpers with sparks per day. Use diamonds or come back tomorrow.';
    end if;
    if v_profile.sparks < v_item.price_sparks then
      raise exception using message = 'Not enough sparks.';
    end if;
    update public.profiles
      set sparks = sparks - v_item.price_sparks,
          spark_purchases_today = v_purchases_today + case when v_item.kind = 'helper' then 1 else 0 end,
          spark_purchase_date = current_date
      where id = v_user;
  elsif p_currency = 'diamonds' then
    if v_item.price_diamonds is null then
      raise exception using message = 'This item needs sparks.';
    end if;
    if v_profile.diamonds < v_item.price_diamonds then
      raise exception using message = 'Not enough diamonds.';
    end if;
    update public.profiles set diamonds = diamonds - v_item.price_diamonds where id = v_user;
  else
    raise exception using message = 'Unknown currency.';
  end if;

  if v_item.grant_helper is not null then
    update public.profiles
      set helpers = jsonb_set(helpers, array[v_item.grant_helper], to_jsonb(v_owned + v_item.grant_quantity))
      where id = v_user;
  end if;
  if v_item.grant_sparks > 0 then
    update public.profiles set sparks = sparks + v_item.grant_sparks where id = v_user;
  end if;

  return public._economy_state(v_user);
end;
$$;

create or replace function public.use_helper(p_helper text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_owned integer;
begin
  select coalesce((helpers ->> p_helper)::integer, 0) into v_owned from public.profiles where id = v_user for update;
  if v_owned < 1 then
    raise exception using message = 'You don''t have that helper.';
  end if;
  update public.profiles set helpers = jsonb_set(helpers, array[p_helper], to_jsonb(v_owned - 1)) where id = v_user;
  return public._economy_state(v_user);
end;
$$;

-- ---------------------------------------------------------------------------
-- Payment webhook functions (service role only)
-- ---------------------------------------------------------------------------
create or replace function public.grant_purchase(
  p_order_id text, p_user_id uuid, p_pack_id text, p_amount_cents integer, p_currency text, p_provider text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_diamonds integer;
begin
  select diamonds into v_diamonds from public.diamond_packs where id = p_pack_id;
  if v_diamonds is null then
    raise exception 'Unknown pack %', p_pack_id;
  end if;
  insert into public.purchases (id, user_id, provider, pack_id, diamonds, amount_cents, currency)
  values (p_order_id, p_user_id, p_provider, p_pack_id, v_diamonds, p_amount_cents, p_currency)
  on conflict (id) do nothing;
  if not found then
    return false; -- already processed (webhooks can be delivered twice)
  end if;
  update public.profiles set diamonds = diamonds + v_diamonds where id = p_user_id;
  return true;
end;
$$;

create or replace function public.refund_purchase(p_order_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases;
begin
  update public.purchases set status = 'refunded', updated_at = now()
    where id = p_order_id and status = 'paid'
    returning * into v_purchase;
  if not found then
    return false;
  end if;
  update public.profiles set diamonds = greatest(0, diamonds - v_purchase.diamonds) where id = v_purchase.user_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
revoke all on function public._require_user() from public, anon;
revoke all on function public._economy_state(uuid) from public, anon, authenticated;
revoke all on function public._difficulty_multiplier(text) from public, anon, authenticated;
revoke all on function public._award_world_rewards(uuid, integer) from public, anon, authenticated;
revoke all on function public.grant_purchase(text, uuid, text, integer, text, text) from public, anon, authenticated;
revoke all on function public.refund_purchase(text) from public, anon, authenticated;
grant execute on function public.grant_purchase(text, uuid, text, integer, text, text) to service_role;
grant execute on function public.refund_purchase(text) to service_role;

revoke all on function public.economy_state() from public, anon;
revoke all on function public.record_level_result(text, integer, integer) from public, anon;
revoke all on function public.merge_guest_progress(jsonb) from public, anon;
revoke all on function public.record_daily(date) from public, anon;
revoke all on function public.buy_store_item(text, text) from public, anon;
revoke all on function public.use_helper(text) from public, anon;
grant execute on function public.economy_state() to authenticated;
grant execute on function public.record_level_result(text, integer, integer) to authenticated;
grant execute on function public.merge_guest_progress(jsonb) to authenticated;
grant execute on function public.record_daily(date) to authenticated;
grant execute on function public.buy_store_item(text, text) to authenticated;
grant execute on function public.use_helper(text) to authenticated;
