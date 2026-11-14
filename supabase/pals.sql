-- Prism Pals: profile characters you pick, collect, grow and dress up.
-- Run in Supabase → SQL Editor AFTER social.sql. Safe to run more than once.
-- Rules must match src/game/pals.js (a test checks the unlocks and prices).

alter table public.profiles
  add column if not exists pal_id text,
  add column if not exists pals jsonb not null default '{}',
  add column if not exists pal_accessories text[] not null default '{}',
  add column if not exists pal_accessory text;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create or replace function public._pal_unlock(p_pal text)
returns jsonb
language sql
immutable
as $$
  select case p_pal
    when 'ember' then '{"starter": true, "stars": 30}'::jsonb
    when 'mossy' then '{"starter": true, "stars": 60}'::jsonb
    when 'coral' then '{"starter": true, "streak": 3}'::jsonb
    when 'mochi' then '{"stars": 90}'::jsonb
    when 'hoot' then '{"stars": 120}'::jsonb
    when 'waffles' then '{"stars": 150}'::jsonb
    when 'peep' then '{"worlds": 1}'::jsonb
    when 'bruno' then '{"stars": 200}'::jsonb
    when 'biscuit' then '{"worlds": 2}'::jsonb
    when 'truffle' then '{"stars": 250}'::jsonb
    when 'pebble' then '{"streak": 7}'::jsonb
    when 'quartz' then '{"stars": 300}'::jsonb
    when 'ribbit' then '{"worlds": 3}'::jsonb
    when 'cotton' then '{"stars": 350}'::jsonb
    when 'squeak' then '{"stars": 400}'::jsonb
    when 'maple' then '{"worlds": 5}'::jsonb
    when 'otto' then '{"stars": 500}'::jsonb
    when 'buzz' then '{"streak": 14}'::jsonb
    when 'kiko' then '{"stars": 600}'::jsonb
    when 'splash' then '{"stars": 700}'::jsonb
    when 'shroomy' then '{"worlds": 8}'::jsonb
    when 'bandit' then '{"stars": 800}'::jsonb
    when 'waddles' then '{"stars": 1000}'::jsonb
    when 'fawn' then '{"stars": 1200}'::jsonb
    when 'shelly' then '{"streak": 30}'::jsonb
    when 'inky' then '{"stars": 1500}'::jsonb
    when 'puff' then '{"worlds": 12}'::jsonb
    when 'twinkle' then '{"stars": 1800}'::jsonb
    when 'starla' then '{"stars": 2400}'::jsonb
    when 'ziggy' then '{"stars": 3000}'::jsonb
    else null
  end;
$$;

create or replace function public._pal_animal(p_pal text)
returns text
language sql
immutable
as $$
  select case p_pal
    when 'ember' then 'Fox'
    when 'mossy' then 'Turtle'
    when 'coral' then 'Axolotl'
    when 'mochi' then 'Kitten'
    when 'hoot' then 'Owl'
    when 'waffles' then 'Puppy'
    when 'peep' then 'Chick'
    when 'bruno' then 'Bear'
    when 'biscuit' then 'Bunny'
    when 'truffle' then 'Piglet'
    when 'pebble' then 'Hedgehog'
    when 'quartz' then 'Gem'
    when 'ribbit' then 'Frog'
    when 'cotton' then 'Lamb'
    when 'squeak' then 'Mouse'
    when 'maple' then 'Panda'
    when 'otto' then 'Otter'
    when 'buzz' then 'Bee'
    when 'kiko' then 'Koala'
    when 'splash' then 'Seal'
    when 'shroomy' then 'Sprite'
    when 'bandit' then 'Raccoon'
    when 'waddles' then 'Penguin'
    when 'fawn' then 'Deer'
    when 'shelly' then 'Snail'
    when 'inky' then 'Octopus'
    when 'puff' then 'Cloud'
    when 'twinkle' then 'Star'
    when 'starla' then 'Unicorn'
    when 'ziggy' then 'Dragon'
    else null
  end;
$$;

create or replace function public._accessory_price(p_item text)
returns integer
language sql
immutable
as $$
  select case p_item
    when 'scarf' then 40
    when 'bow' then 50
    when 'partyHat' then 60
    when 'flowerCrown' then 80
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------
create or replace function public._is_pal_unlocked(p_user uuid, p_pal text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rule jsonb := public._pal_unlock(p_pal);
  v_profile public.profiles;
  v_stars integer;
  v_worlds integer;
begin
  if v_rule is null then
    return false;
  end if;
  select * into v_profile from public.profiles where id = p_user;
  if v_profile.pals ? p_pal then
    return true;
  end if;
  if v_profile.pal_id is null and coalesce((v_rule ->> 'starter')::boolean, false) then
    return true;
  end if;
  if v_rule ? 'stars' then
    select coalesce(sum(stars), 0) into v_stars from public.progress where user_id = p_user;
    return v_stars >= (v_rule ->> 'stars')::integer;
  end if;
  if v_rule ? 'worlds' then
    select count(*) into v_worlds from (
      select (regexp_match(level_id, '^w([0-9]+)-[0-9]{2}$'))[1] as world
      from public.progress
      where user_id = p_user and stars > 0 and level_id ~ '^w[0-9]+-[0-9]{2}$'
      group by 1
      having count(*) >= 20
    ) finished;
    return v_worlds >= (v_rule ->> 'worlds')::integer;
  end if;
  return v_profile.daily_streak >= (v_rule ->> 'streak')::integer;
end;
$$;

-- Nicknames follow your partner Pal ("Sunny Fox 42"); without one, a random animal.
create or replace function public._nickname_for(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select (array['Sunny', 'Brave', 'Clever', 'Gentle', 'Happy', 'Lucky', 'Mellow', 'Nimble', 'Quiet', 'Rosy', 'Swift', 'Witty'])
           [1 + abs(('x' || substr(md5(p_user::text), 1, 7))::bit(28)::integer) % 12]
    || ' '
    || coalesce(
         (select public._pal_animal(pal_id) from public.profiles where id = p_user),
         (array['Otter', 'Fox', 'Panda', 'Robin', 'Koala', 'Finch', 'Hedgehog', 'Lynx', 'Puffin', 'Badger', 'Wren', 'Seal'])
           [1 + abs(('x' || substr(md5(p_user::text), 8, 7))::bit(28)::integer) % 12])
    || ' '
    || (10 + abs(('x' || substr(md5(p_user::text), 15, 7))::bit(28)::integer) % 90)::text;
$$;

-- Balances also report the player's Pals.
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
    'streakShields', p.streak_shields,
    'lastGiftDate', p.last_gift_date,
    'sparkPurchasesToday', case when p.spark_purchase_date = current_date then p.spark_purchases_today else 0 end,
    'claimedChests', to_jsonb(p.claimed_chests),
    'pal', jsonb_build_object('id', p.pal_id, 'owned', p.pals, 'accessories', to_jsonb(p.pal_accessories), 'accessory', p.pal_accessory)
  )
  from public.profiles p
  where p.id = p_user;
$$;

create or replace function public.choose_pal(p_pal text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
begin
  if not public._is_pal_unlocked(v_user, p_pal) then
    raise exception using message = 'That Pal isn’t unlocked yet.';
  end if;
  update public.profiles set
    pal_id = p_pal,
    pals = case when pals ? p_pal then pals else pals || jsonb_build_object(p_pal, jsonb_build_object('xp', 0)) end
  where id = v_user;
  return public._economy_state(v_user);
end;
$$;

create or replace function public.buy_accessory(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_price integer := public._accessory_price(p_item);
  v_profile public.profiles;
begin
  if v_price is null then
    raise exception using message = 'That item is not in the shop.';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if p_item = any (v_profile.pal_accessories) then
    raise exception using message = 'You already have this.';
  end if;
  if v_profile.sparks < v_price then
    raise exception using message = 'Not enough sparks.';
  end if;
  update public.profiles set sparks = sparks - v_price, pal_accessories = array_append(pal_accessories, p_item) where id = v_user;
  return public._economy_state(v_user);
end;
$$;

create or replace function public.equip_accessory(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
begin
  if p_item is not null and not exists (select 1 from public.profiles where id = v_user and p_item = any (pal_accessories)) then
    raise exception using message = 'Buy it first.';
  end if;
  update public.profiles set pal_accessory = p_item where id = v_user;
  return public._economy_state(v_user);
end;
$$;

-- Level results: as in social.sql, plus the partner Pal grows by one for each newly solved level.
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
  v_is_real_level boolean;
begin
  if p_stars < 1 or p_stars > 3 then
    raise exception using message = 'Invalid result.';
  end if;

  select coalesce((select stars from public.progress where user_id = v_user and level_id = p_level_id), 0) into v_previous;
  v_is_real_level := public._difficulty_multiplier(p_level_id) > 0;
  v_sparks := greatest(0, p_stars - v_previous) * 5 * public._difficulty_multiplier(p_level_id);

  if p_stars > v_previous and v_is_real_level and public._is_level_reachable(v_user, p_level_id) then
    perform public._add_weekly_points(v_user, p_stars - v_previous);
    if v_previous = 0 then
      update public.profiles set pals = jsonb_set(pals, array[pal_id, 'xp'], to_jsonb(coalesce((pals -> pal_id ->> 'xp')::integer, 0) + 1))
      where id = v_user and pal_id is not null and pals ? pal_id;
    end if;
  end if;

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

-- The weekly board also shows each player's Pal (id, growth and accessory).
create or replace function public.weekly_leaderboard()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ranking as (
    select r.*, p.pal_id, coalesce((p.pals -> p.pal_id ->> 'xp')::integer, 0) as pal_xp, p.pal_accessory
    from public._weekly_ranking(public._week_start()) r
    join public.profiles p on p.id = r.user_id
  )
  select jsonb_build_object(
    'weekStart', public._week_start(),
    'endsAt', (public._week_start() + 7)::timestamp at time zone 'utc',
    'top', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank', r.rank, 'nickname', public._nickname_for(r.user_id), 'score', r.score, 'isMe', r.user_id = auth.uid(),
        'pal', r.pal_id, 'palXp', r.pal_xp, 'accessory', r.pal_accessory)
        order by r.rank)
      from ranking r where r.rank <= 50), '[]'::jsonb),
    'me', (
      select jsonb_build_object('rank', r.rank, 'score', r.score, 'nickname', public._nickname_for(r.user_id),
        'pal', r.pal_id, 'palXp', r.pal_xp, 'accessory', r.pal_accessory)
      from ranking r where r.user_id = auth.uid()),
    'myNickname', case when auth.uid() is null then null else public._nickname_for(auth.uid()) end
  );
$$;

revoke all on function public._is_pal_unlocked(uuid, text) from public, anon, authenticated;
revoke all on function public._nickname_for(uuid) from public, anon, authenticated;
revoke all on function public.choose_pal(text) from public, anon;
revoke all on function public.buy_accessory(text) from public, anon;
revoke all on function public.equip_accessory(text) from public, anon;
grant execute on function public.choose_pal(text) to authenticated;
grant execute on function public.buy_accessory(text) to authenticated;
grant execute on function public.equip_accessory(text) to authenticated;
grant execute on function public.weekly_leaderboard() to anon, authenticated;
