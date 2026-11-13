-- Prism progression: 1000 built-in levels (50 worlds × 20) and reward chests.
-- Run in Supabase → SQL Editor AFTER economy.sql. Safe to run more than once.
--
-- Built-in levels are recognized by their id (w1-01 … w50-20), so rewards work without
-- importing them into the levels table. Published levels from the editor still count too.

alter table public.profiles
  add column if not exists claimed_chests text[] not null default '{}';

-- Balances now also report which chests were opened.
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
    'sparkPurchasesToday', case when p.spark_purchase_date = current_date then p.spark_purchases_today else 0 end,
    'claimedChests', to_jsonb(p.claimed_chests)
  )
  from public.profiles p
  where p.id = p_user;
$$;

-- Ids of the levels that make up a world: the 20 built-in ones, or published ones for custom worlds.
create or replace function public._world_level_ids(p_world integer)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_world between 1 and 50 then
      array(select format('w%s-%s', p_world, lpad(i::text, 2, '0')) from generate_series(1, 20) as i)
    else
      array(select id from public.levels where world = p_world and is_published order by level_index)
  end;
$$;

-- Sparks multiplier for a level; 0 for unknown ids so made-up results earn nothing.
create or replace function public._difficulty_multiplier(p_level_id text)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_difficulty text;
  v_match text[];
begin
  select difficulty into v_difficulty from public.levels where id = p_level_id and is_published;
  if v_difficulty is null then
    v_match := regexp_match(p_level_id, '^w([0-9]+)-([0-9]{2})$');
    if v_match is null or v_match[1]::integer not between 1 and 50 or v_match[2]::integer not between 1 and 20 then
      return 0;
    end if;
    v_difficulty := case
      when v_match[2]::integer % 20 = 0 then 'extra'
      when v_match[2]::integer % 5 = 0 then 'hard'
      else 'normal'
    end;
  end if;
  return case v_difficulty when 'extra' then 3 when 'hard' then 2 else 1 end;
end;
$$;

create or replace function public._award_world_rewards(p_user uuid, p_world integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids text[] := public._world_level_ids(p_world);
  v_done integer;
  v_perfect integer;
  v_profile public.profiles;
  v_awarded integer := 0;
begin
  if coalesce(array_length(v_ids, 1), 0) = 0 then
    return 0;
  end if;
  select count(*) filter (where stars > 0), count(*) filter (where stars = 3)
  into v_done, v_perfect
  from public.progress
  where user_id = p_user and level_id = any (v_ids);

  select * into v_profile from public.profiles where id = p_user for update;
  if v_done = array_length(v_ids, 1) and not (p_world = any (v_profile.rewarded_worlds)) then
    update public.profiles set diamonds = diamonds + 1, rewarded_worlds = array_append(rewarded_worlds, p_world) where id = p_user;
    v_awarded := v_awarded + 1;
  end if;
  if v_perfect = array_length(v_ids, 1) and not (p_world = any (v_profile.perfected_worlds)) then
    update public.profiles set diamonds = diamonds + 1, perfected_worlds = array_append(perfected_worlds, p_world) where id = p_user;
    v_awarded := v_awarded + 1;
  end if;
  return v_awarded;
end;
$$;

-- Level results now find the world from the id as well.
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
  v_world := coalesce(v_world, (regexp_match(p_level_id, '^w([0-9]+)-'))[1]::integer);
  if v_world is not null then
    v_diamonds := public._award_world_rewards(v_user, v_world);
  end if;

  return public._economy_state(v_user) || jsonb_build_object('sparksEarned', v_sparks, 'diamondsEarned', v_diamonds);
end;
$$;

-- What's inside a chest. Must match chestRewardFor() in src/game/surprises.js.
create or replace function public.chest_reward(p_world integer, p_chest integer)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'sparks', case when p_chest = 2 then 40 + p_world * 4 else 20 + p_world * 2 end,
    'helper', (array['hint', 'lens', 'autoturn'])[((p_world + p_chest) % 3) + 1]
  );
$$;

-- Opens a reward chest once its levels are finished (chest 1 after 10 levels, chest 2 after 20).
create or replace function public.claim_chest(p_world integer, p_chest integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_chest_id text := format('w%s-c%s', p_world, p_chest);
  v_ids text[];
  v_done integer;
  v_reward jsonb := public.chest_reward(p_world, p_chest);
  v_helper text := v_reward ->> 'helper';
  v_profile public.profiles;
  v_owned integer;
begin
  if p_chest not in (1, 2) then
    raise exception using message = 'That chest doesn''t exist.';
  end if;
  v_ids := (public._world_level_ids(p_world))[1:case when p_chest = 1 then 10 else 20 end];
  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception using message = 'That chest doesn''t exist.';
  end if;
  select count(*) into v_done from public.progress where user_id = v_user and level_id = any (v_ids) and stars > 0;
  if v_done < array_length(v_ids, 1) then
    raise exception using message = 'Finish the levels before this chest to open it.';
  end if;

  select * into v_profile from public.profiles where id = v_user for update;
  if v_chest_id = any (v_profile.claimed_chests) then
    raise exception using message = 'You already opened this chest.';
  end if;
  v_owned := coalesce((v_profile.helpers ->> v_helper)::integer, 0);
  update public.profiles set
    sparks = sparks + (v_reward ->> 'sparks')::integer,
    helpers = jsonb_set(helpers, array[v_helper], to_jsonb(least(5, v_owned + 1))),
    claimed_chests = array_append(claimed_chests, v_chest_id)
  where id = v_user;

  return public._economy_state(v_user) || jsonb_build_object('reward', v_reward);
end;
$$;

revoke all on function public._world_level_ids(integer) from public, anon, authenticated;
revoke all on function public.claim_chest(integer, integer) from public, anon;
grant execute on function public.claim_chest(integer, integer) to authenticated;
