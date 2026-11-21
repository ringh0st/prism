-- Lumipals: daily missions. Three small goals each day (the player's own day, from their local midnight, like the
-- win gifts), each paying a few sparks once, plus a bonus with the last of the three.
-- Progress is counted from the player's own level results since their midnight (one row per level), the daily
-- puzzle from last_daily_date, and Glowbugs from glowbug_levels. Missions the server can't count (a combo, opening
-- a present) are guests-only and left out here.
-- Run in Supabase → SQL Editor AFTER economy.sql, gifts.sql and glowbugs.sql (it uses _require_user,
-- _economy_state, record_daily's last_daily_date and the glowbug_levels table). Safe to run more than once.
-- Missions must match DAILY_MISSIONS, MISSIONS_BONUS_SPARKS and dailyMissionIdsFor in src/game/dailyMissions.js
-- (a test checks).

-- The day's three, kept from the first time they're asked for, so they never change halfway through a day.
create table if not exists public.daily_mission_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  missions text[] not null,
  claimed text[] not null default '{}',
  primary key (user_id, day)
);

alter table public.daily_mission_days enable row level security;

-- Every mission the server can count: (position in DAILY_MISSIONS, id, kind, target, sparks, min_solved).
create or replace function public._daily_mission_pool()
returns table (pos integer, id text, kind text, target integer, sparks integer, min_solved integer)
language sql
immutable
as $$
  values
    (0, 'solve2', 'solved', 2, 10, 0),
    (1, 'solve3', 'solved', 3, 15, 0),
    (2, 'solve4', 'solved', 4, 20, 0),
    (3, 'perfect1', 'perfect', 1, 10, 0),
    (4, 'perfect2', 'perfect', 2, 15, 0),
    (5, 'daily1', 'daily', 1, 15, 3),
    (6, 'hard1', 'hard', 1, 20, 4),
    (7, 'glowbug1', 'glowbug', 1, 15, 40);
$$;

create or replace function public._daily_missions_bonus()
returns integer
language sql
immutable
as $$
  select 10;
$$;

-- The day's mission ids: a "solve" mission (sizes take turns), then the first two of different kinds in the
-- day's shuffle among those the player can do. Empty before 3 solved levels.
create or replace function public._daily_missions_for(p_day date, p_solved integer)
returns text[]
language plpgsql
immutable
as $$
declare
  v_day bigint := p_day - date '2025-12-31';
  v_picked text[];
  v_kinds text[];
  v_row record;
begin
  if p_solved < 3 then
    return array[]::text[];
  end if;
  select array[p.id], array[p.kind] into v_picked, v_kinds
    from public._daily_mission_pool() p where p.kind = 'solved'
    order by p.pos offset (v_day % 3 + 3) % 3 limit 1;
  for v_row in
    select p.id, p.kind from public._daily_mission_pool() p
    where p.kind <> 'solved' and p_solved >= p.min_solved
    order by ((v_day + 1) * (2 * p.pos + 1) * 2654435761) % 4294967296, p.pos
  loop
    if cardinality(v_picked) < 3 and not (v_row.kind = any (v_kinds)) then
      v_picked := v_picked || v_row.id;
      v_kinds := v_kinds || v_row.kind;
    end if;
  end loop;
  return v_picked;
end;
$$;

-- The player's day must be today or yesterday/tomorrow (time zones), starting at most 50 hours ago.
create or replace function public._check_mission_day(p_date date, p_since timestamptz)
returns void
language plpgsql
stable
as $$
begin
  if p_date is null or p_since is null or p_date < current_date - 1 or p_date > current_date + 1
    or p_since < now() - interval '50 hours' or p_since > now() then
    raise exception using message = 'That mission isn’t on today’s list.';
  end if;
end;
$$;

-- Draws and keeps the day's missions the first time (once the player has some to do).
create or replace function public._start_mission_day(p_user uuid, p_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missions text[];
begin
  if exists (select 1 from public.daily_mission_days where user_id = p_user and day = p_date) then
    return;
  end if;
  v_missions := public._daily_missions_for(p_date, (
    select count(*)::integer from public.progress
    where user_id = p_user and level_id ~ '^w[0-9]+-[0-9]{2}$' and stars > 0
  ));
  if cardinality(v_missions) > 0 then
    insert into public.daily_mission_days (user_id, day, missions) values (p_user, p_date, v_missions)
    on conflict do nothing;
  end if;
end;
$$;

-- Today's missions, the levels counted for each kind since the player's midnight, and what was collected.
create or replace function public._my_daily_missions(p_user uuid, p_date date, p_since timestamptz)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with today as (
    select level_id, stars from public.progress
    where user_id = p_user and completed_at >= p_since and level_id ~ '^w[0-9]+-[0-9]{2}$' and stars > 0 and best_moves is not null
  ), mission_day as (
    select missions, claimed from public.daily_mission_days where user_id = p_user and day = p_date
  )
  select jsonb_build_object(
    'date', p_date,
    'missions', coalesce((select to_jsonb(missions) from mission_day), '[]'::jsonb),
    'solved', coalesce((select jsonb_agg(level_id) from today), '[]'::jsonb),
    'perfect', coalesce((select jsonb_agg(level_id) from today where stars = 3), '[]'::jsonb),
    'hard', coalesce((select jsonb_agg(level_id) from today where (regexp_match(level_id, '-([0-9]+)$'))[1]::integer % 5 = 0), '[]'::jsonb),
    'glowbug', coalesce((select jsonb_agg(t.level_id) from today t join public.glowbug_levels g on g.level_id = t.level_id where t.stars = 3), '[]'::jsonb),
    'combo', '[]'::jsonb,
    'present', '[]'::jsonb,
    'claimed', coalesce((select to_jsonb(claimed) from mission_day), '[]'::jsonb)
  );
$$;

-- p_date: the player's today; p_since: when the player's today began (their local midnight).
create or replace function public.my_daily_missions(p_date date, p_since timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
begin
  perform public._check_mission_day(p_date, p_since);
  perform public._start_mission_day(v_user, p_date);
  return jsonb_build_object('missions', public._my_daily_missions(v_user, p_date, p_since));
end;
$$;

create or replace function public.claim_daily_mission(p_mission text, p_date date, p_since timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_day public.daily_mission_days;
  v_mission record;
  v_count integer;
  v_sparks integer;
begin
  perform public._check_mission_day(p_date, p_since);
  perform public._start_mission_day(v_user, p_date);
  select * into v_day from public.daily_mission_days where user_id = v_user and day = p_date for update;
  select * into v_mission from public._daily_mission_pool() p where p.id = p_mission;
  if v_day is null or v_mission is null or not (p_mission = any (v_day.missions)) then
    raise exception using message = 'That mission isn’t on today’s list.';
  end if;
  if p_mission = any (v_day.claimed) then
    raise exception using message = 'You already collected this one.';
  end if;

  if v_mission.kind = 'daily' then
    select (last_daily_date = p_date)::integer into v_count from public.profiles where id = v_user;
  else
    v_count := jsonb_array_length(public._my_daily_missions(v_user, p_date, p_since) -> v_mission.kind);
  end if;
  if coalesce(v_count, 0) < v_mission.target then
    raise exception using message = 'This mission isn’t finished yet.';
  end if;

  -- The last of the day's three brings the bonus too.
  v_sparks := v_mission.sparks
    + case when cardinality(v_day.claimed) + 1 = cardinality(v_day.missions) then public._daily_missions_bonus() else 0 end;
  update public.daily_mission_days set claimed = claimed || p_mission where user_id = v_user and day = p_date;
  update public.profiles set sparks = sparks + v_sparks where id = v_user;
  return public._economy_state(v_user) || jsonb_build_object(
    'missions', public._my_daily_missions(v_user, p_date, p_since),
    'gift', jsonb_build_object('sparks', v_sparks)
  );
end;
$$;

revoke all on function public._start_mission_day(uuid, date) from public, anon, authenticated;
revoke all on function public._my_daily_missions(uuid, date, timestamptz) from public, anon, authenticated;
revoke all on function public.my_daily_missions(date, timestamptz) from public, anon;
revoke all on function public.claim_daily_mission(text, date, timestamptz) from public, anon;
grant execute on function public.my_daily_missions(date, timestamptz) to authenticated;
grant execute on function public.claim_daily_mission(text, date, timestamptz) to authenticated;
