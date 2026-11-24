-- Lumipals: Pals, profile characters you pick, collect, grow by playing (20 solved levels per form) and dress up.
-- Run in Supabase → SQL Editor AFTER social.sql. Safe to run more than once.
-- Rules must match src/game/pals.js (a test checks the unlocks and prices).

alter table public.profiles
  add column if not exists pal_id text,
  add column if not exists pals jsonb not null default '{}',
  add column if not exists pal_accessories text[] not null default '{}',
  add column if not exists pal_accessory text,
  add column if not exists pal_wearing text[] not null default '{}',
  add column if not exists lucky_pals_claimed integer not null default 0,
  -- Legendary/Mythic Pals adopted this week (at most 2 a week; see _adopt_week).
  add column if not exists rare_adopt_week integer,
  add column if not exists rare_adopts integer not null default 0;

-- Saves from before slots wore one item in pal_accessory.
update public.profiles set pal_wearing = array[pal_accessory] where pal_accessory is not null and pal_wearing = '{}';

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
    when 'tops' then '{"stars": 450}'::jsonb
    when 'maple' then '{"worlds": 5}'::jsonb
    when 'chomp' then '{"worlds": 6}'::jsonb
    when 'otto' then '{"stars": 500}'::jsonb
    when 'buzz' then '{"streak": 14}'::jsonb
    when 'kiko' then '{"stars": 600}'::jsonb
    when 'splash' then '{"stars": 700}'::jsonb
    when 'shroomy' then '{"worlds": 8}'::jsonb
    when 'stretch' then '{"worlds": 10}'::jsonb
    when 'bandit' then '{"stars": 800}'::jsonb
    when 'spike' then '{"stars": 900}'::jsonb
    when 'waddles' then '{"stars": 1000}'::jsonb
    when 'fawn' then '{"stars": 1200}'::jsonb
    when 'shelly' then '{"streak": 30}'::jsonb
    when 'inky' then '{"stars": 1500}'::jsonb
    when 'puff' then '{"worlds": 12}'::jsonb
    when 'twinkle' then '{"stars": 1800}'::jsonb
    when 'starla' then '{"stars": 2400}'::jsonb
    when 'ziggy' then '{"stars": 3000}'::jsonb
    when 'leo' then '{"lucky": true}'::jsonb
    when 'koi' then '{"lucky": true}'::jsonb
    when 'bamboo' then '{"lucky": true}'::jsonb
    when 'aurora' then '{"lucky": true}'::jsonb
    when 'storm' then '{"lucky": true}'::jsonb
    when 'plume' then '{"lucky": true}'::jsonb
    when 'nova' then '{"lucky": true}'::jsonb
    when 'luna' then '{"lucky": true}'::jsonb
    when 'mooncake' then '{"lucky": true}'::jsonb
    when 'marina' then '{"lucky": true}'::jsonb
    when 'rumble' then '{"lucky": true}'::jsonb
    when 'sol' then '{"worlds": 15}'::jsonb
    when 'kiri' then '{"worlds": 18}'::jsonb
    when 'gryff' then '{"worlds": 20}'::jsonb
    when 'nessa' then '{"streak": 21}'::jsonb
    when 'dozy' then '{"worlds": 22}'::jsonb
    when 'nimbus' then '{"worlds": 25}'::jsonb
    when 'hopscotch' then '{"streak": 45}'::jsonb
    when 'frosty' then '{"worlds": 30}'::jsonb
    when 'fen' then '{"worlds": 35}'::jsonb
    when 'riddle' then '{"worlds": 40}'::jsonb
    when 'jade' then '{"worlds": 28}'::jsonb
    when 'tide' then '{"worlds": 32}'::jsonb
    when 'hikari' then '{"worlds": 45}'::jsonb
    when 'basil' then '{"worlds": 38}'::jsonb
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
    when 'tops' then 'Trike'
    when 'maple' then 'Panda'
    when 'chomp' then 'Rex'
    when 'otto' then 'Otter'
    when 'buzz' then 'Bee'
    when 'kiko' then 'Koala'
    when 'splash' then 'Seal'
    when 'shroomy' then 'Sprite'
    when 'stretch' then 'Longneck'
    when 'bandit' then 'Raccoon'
    when 'spike' then 'Stego'
    when 'waddles' then 'Penguin'
    when 'fawn' then 'Deer'
    when 'shelly' then 'Snail'
    when 'inky' then 'Octopus'
    when 'puff' then 'Cloud'
    when 'twinkle' then 'Star'
    when 'starla' then 'Unicorn'
    when 'ziggy' then 'Dragon'
    when 'leo' then 'Lion'
    when 'koi' then 'Koi'
    when 'bamboo' then 'Panda'
    when 'aurora' then 'Snowfox'
    when 'storm' then 'Tiger'
    when 'plume' then 'Peacock'
    when 'nova' then 'Narwhal'
    when 'luna' then 'Leopard'
    when 'mooncake' then 'Moonbunny'
    when 'marina' then 'Seapony'
    when 'rumble' then 'Shisa'
    when 'sol' then 'Phoenix'
    when 'kiri' then 'Qilin'
    when 'gryff' then 'Griffin'
    when 'nessa' then 'Nessie'
    when 'dozy' then 'Baku'
    when 'nimbus' then 'Pegasus'
    when 'hopscotch' then 'Jackalope'
    when 'frosty' then 'Yeti'
    when 'fen' then 'Wolf'
    when 'riddle' then 'Sphinx'
    when 'jade' then 'Loong'
    when 'tide' then 'Kraken'
    when 'hikari' then 'Kitsune'
    when 'basil' then 'Basilisk'
    else null
  end;
$$;

-- Clothes and gear: price in sparks and the slot it is worn in. Must match PAL_ACCESSORIES in src/game/pals.js.
create or replace function public._accessory(p_item text)
returns jsonb
language sql
immutable
as $$
  select case p_item
    when 'beanie' then '{"price": 50, "slot": "head"}'::jsonb
    when 'partyHat' then '{"price": 60, "slot": "head"}'::jsonb
    when 'flowerCrown' then '{"price": 80, "slot": "head"}'::jsonb
    when 'wizardHat' then '{"price": 90, "slot": "head"}'::jsonb
    when 'headphones' then '{"price": 100, "slot": "head"}'::jsonb
    when 'crown' then '{"price": 150, "slot": "head"}'::jsonb
    when 'scarf' then '{"price": 40, "slot": "neck"}'::jsonb
    when 'bow' then '{"price": 50, "slot": "neck"}'::jsonb
    when 'medal' then '{"price": 70, "slot": "neck"}'::jsonb
    when 'cape' then '{"price": 120, "slot": "neck"}'::jsonb
    when 'balloon' then '{"price": 70, "slot": "hand"}'::jsonb
    when 'lantern' then '{"price": 80, "slot": "hand"}'::jsonb
    when 'magicWand' then '{"price": 110, "slot": "hand"}'::jsonb
    when 'heroShield' then '{"price": 120, "slot": "hand"}'::jsonb
    when 'sword' then '{"price": 130, "slot": "hand"}'::jsonb
    else null
  end;
$$;
drop function if exists public._accessory_price(text);

-- ---------------------------------------------------------------------------
-- Rules
-- ---------------------------------------------------------------------------
-- Every Pal, in the game's order (src/game/pals.js PALS).
create or replace function public._all_pals()
returns text[]
language sql
immutable
as $$
  select array[
    'ember', 'mossy', 'coral', 'mochi', 'hoot', 'waffles', 'peep', 'bruno', 'biscuit', 'truffle',
    'pebble', 'quartz', 'ribbit', 'cotton', 'squeak', 'tops', 'maple', 'chomp', 'otto', 'buzz',
    'kiko', 'splash', 'shroomy', 'stretch', 'bandit', 'spike', 'waddles', 'fawn', 'shelly', 'inky',
    'puff', 'twinkle', 'starla', 'ziggy', 'leo', 'koi', 'bamboo', 'aurora', 'storm', 'plume',
    'nova', 'luna', 'mooncake', 'marina', 'rumble', 'sol', 'kiri', 'gryff', 'nessa', 'dozy',
    'nimbus', 'hopscotch', 'frosty', 'fen', 'riddle', 'jade', 'tide', 'hikari', 'basil'
  ];
$$;

-- How rare a Pal is. Must match `rarity` in src/game/pals.js.
create or replace function public._pal_rarity(p_pal text)
returns text
language sql
immutable
as $$
  select case
    when p_pal in ('leo', 'koi', 'bamboo', 'aurora', 'storm', 'plume', 'nova', 'luna', 'mooncake', 'marina', 'rumble') then 'legendary'
    when p_pal in ('sol', 'kiri', 'gryff', 'nessa', 'dozy', 'nimbus', 'hopscotch', 'frosty', 'fen', 'riddle', 'jade', 'tide', 'hikari', 'basil') then 'mythic'
    else 'common'
  end;
$$;

-- Today's Shop pick of one rarity for a player, shown before buying (never a surprise purchase):
-- among the Pals of that rarity they don't have, number (days since 2026-01-01 + their seed) mod how
-- many there are. The seed is the sum of the character codes of their id. Must match dailyPalPick in pals.js.
create or replace function public._daily_pick(p_user uuid, p_rarity text, p_day date)
returns text
language sql
stable
security definer
set search_path = public
as $$
  with pool as (
    select pal, row_number() over (order by ord) - 1 as position, count(*) over () as size
    from unnest(public._all_pals()) with ordinality as t(pal, ord)
    where public._pal_rarity(pal) = p_rarity
      and not coalesce((select pals ? t.pal from public.profiles where id = p_user), false)
  ), seed as (
    select coalesce(sum(ascii(c)), 0) as value from regexp_split_to_table(p_user::text, '') as c
  )
  select pal from pool, seed
  where position = ((p_day - date '2026-01-01') + seed.value) % size;
$$;

-- The Shop's week (Monday to Sunday, UTC), counted from the week of 2026-01-01. Must match adoptWeekOf in pals.js.
create or replace function public._adopt_week(p_day date)
returns integer
language sql
immutable
as $$
  select floor(((p_day - date '2026-01-01') + 3) / 7.0)::integer;
$$;

-- This week's 6 Basic Pals in a player's Shop (some may already be on their team): among the Basic Pals in
-- catalog order, positions (seed + week * 6 + i * 7) mod how many there are. Must match weeklyAdoptShelf in pals.js.
create or replace function public._weekly_basics(p_user uuid, p_day date)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  with pool as (
    select pal, row_number() over (order by ord) - 1 as position, count(*) over () as size
    from unnest(public._all_pals()) with ordinality as t(pal, ord)
    where public._pal_rarity(pal) = 'common'
  ), seed as (
    select coalesce(sum(ascii(c)), 0) as value from regexp_split_to_table(p_user::text, '') as c
  )
  select coalesce(array_agg(pal), '{}') from pool, seed
  where position in (
    select (seed.value + public._adopt_week(p_day) * 6 + i * 7) % pool.size from generate_series(0, 5) as i
  );
$$;

-- Built-in worlds where all 20 levels have at least one star.
create or replace function public._finished_world_count(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer from (
    select (regexp_match(level_id, '^w([0-9]+)-[0-9]{2}$'))[1] as world
    from public.progress
    where user_id = p_user and stars > 0 and level_id ~ '^w[0-9]+-[0-9]{2}$'
    group by 1
    having count(*) >= 20
  ) finished;
$$;

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
  if v_rule ? 'lucky' then
    return false; -- Legendary Pals arrive as Lucky Pal gifts or from the Shop
  end if;
  if v_rule ? 'stars' then
    select coalesce(sum(stars), 0) into v_stars from public.progress where user_id = p_user;
    return v_stars >= (v_rule ->> 'stars')::integer;
  end if;
  if v_rule ? 'worlds' then
    return public._finished_world_count(p_user) >= (v_rule ->> 'worlds')::integer;
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
    'pal', jsonb_build_object('id', p.pal_id, 'owned', p.pals, 'accessories', to_jsonb(p.pal_accessories), 'wearing', to_jsonb(p.pal_wearing)),
    'luckyPalsClaimed', p.lucky_pals_claimed
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
    pals = case when pals ? p_pal then pals else pals || jsonb_build_object(p_pal, jsonb_build_object('stage', 0)) end
  where id = v_user;
  return public._economy_state(v_user);
end;
$$;

-- Pals now grow by playing (see record_level_result), so Glow-ups are gone.
drop function if exists public.glow_up_pal(text);

create or replace function public.buy_accessory(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_price integer := (public._accessory(p_item) ->> 'price')::integer;
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

-- Put on an owned item (replacing whatever is in the same slot), or take it off.
create or replace function public.wear_accessory(p_item text, p_wear boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_slot text := public._accessory(p_item) ->> 'slot';
begin
  if v_slot is null then
    raise exception using message = 'That item is not in the shop.';
  end if;
  if p_wear and not exists (select 1 from public.profiles where id = v_user and p_item = any (pal_accessories)) then
    raise exception using message = 'Buy it first.';
  end if;
  update public.profiles set pal_wearing =
    array(select item from unnest(pal_wearing) as item where public._accessory(item) ->> 'slot' <> v_slot)
    || case when p_wear then array[p_item] else '{}'::text[] end
  where id = v_user;
  return public._economy_state(v_user);
end;
$$;
drop function if exists public.equip_accessory(text);

-- Adopt a Pal for diamonds, priced by rarity (regular 20, Legendary 40, Mythic 60). Regular Pals can be
-- any you don't have; Legendary and Mythic ones only as today's pick for this player.
-- Must match ADOPT_PRICES and canAdopt in src/game/pals.js.
create or replace function public.adopt_pal(p_pal text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_rarity text := public._pal_rarity(p_pal);
  v_price integer := case public._pal_rarity(p_pal) when 'mythic' then 60 when 'legendary' then 40 else 20 end;
  v_profile public.profiles;
  v_today date := (now() at time zone 'utc')::date;
  v_week integer := public._adopt_week((now() at time zone 'utc')::date);
begin
  if public._pal_unlock(p_pal) is null then
    raise exception using message = 'That Pal doesn’t exist.';
  end if;
  if v_rarity <> 'common' and p_pal is distinct from public._daily_pick(v_user, v_rarity, v_today) then
    raise exception using message = 'That Pal isn’t in your Shop today. There’s a new pick tomorrow!';
  end if;
  if v_rarity = 'common' and not (p_pal = any (public._weekly_basics(v_user, v_today))) then
    raise exception using message = 'That Pal isn’t in your Shop this week. New friends come on Monday!';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  -- At most 2 Legendary or Mythic Pals a week, so each one stays a treat.
  if v_rarity <> 'common' and v_profile.rare_adopt_week = v_week and v_profile.rare_adopts >= 2 then
    raise exception using message = 'You adopted 2 rare Pals this week. More next week!';
  end if;
  if v_profile.pals ? p_pal then
    raise exception using message = 'This Pal is already on your team.';
  end if;
  if v_profile.diamonds < v_price then
    raise exception using message = 'Not enough diamonds.';
  end if;
  update public.profiles set
    diamonds = diamonds - v_price,
    pals = pals || jsonb_build_object(p_pal, jsonb_build_object('stage', 0)),
    pal_id = coalesce(pal_id, p_pal),
    rare_adopts = case when v_rarity = 'common' then rare_adopts when rare_adopt_week = v_week then rare_adopts + 1 else 1 end,
    rare_adopt_week = case when v_rarity = 'common' then rare_adopt_week else v_week end
  where id = v_user;
  return public._economy_state(v_user);
end;
$$;

-- Lucky Pal gifts: every 200 solved built-in levels, one free Pal you don't have yet, at random:
-- 10% Mythic, 20% Legendary, 70% any other Pal (falling back to another pool when one is complete,
-- and to 300 sparks when you have every Pal). Free and earned, never sold. Opens one gift per call;
-- `luckyPal` in the result is the new Pal's id (null when it paid sparks or none was waiting).
-- Must match claimLuckyPalLocally in src/game/pals.js.
create or replace function public.claim_lucky_pal()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_profile public.profiles;
  v_solved integer;
  v_roll double precision := random();
  v_order text[];
  v_rarity text;
  v_pal text;
begin
  select * into v_profile from public.profiles where id = v_user for update;
  select count(*)::integer into v_solved from public.progress
    where user_id = v_user and stars > 0 and level_id ~ '^w[0-9]+-[0-9]{2}$';
  if v_solved / 200 <= v_profile.lucky_pals_claimed then
    return public._economy_state(v_user) || jsonb_build_object('luckyPal', null, 'sparksEarned', 0);
  end if;

  v_order := case
    when v_roll < 0.1 then array['mythic', 'legendary', 'common']
    when v_roll < 0.3 then array['legendary', 'mythic', 'common']
    else array['common', 'legendary', 'mythic']
  end;
  foreach v_rarity in array v_order loop
    select pal into v_pal from unnest(public._all_pals()) as pal
      where public._pal_rarity(pal) = v_rarity and not (v_profile.pals ? pal)
      order by random() limit 1;
    exit when v_pal is not null;
  end loop;

  if v_pal is null then
    update public.profiles set lucky_pals_claimed = lucky_pals_claimed + 1, sparks = sparks + 300 where id = v_user;
    return public._economy_state(v_user) || jsonb_build_object('luckyPal', null, 'sparksEarned', 300);
  end if;
  update public.profiles set
    lucky_pals_claimed = lucky_pals_claimed + 1,
    pals = pals || jsonb_build_object(v_pal, jsonb_build_object('stage', 0)),
    pal_id = coalesce(pal_id, v_pal)
  where id = v_user;
  return public._economy_state(v_user) || jsonb_build_object('luckyPal', v_pal, 'sparksEarned', 0);
end;
$$;

-- Level results: as in social.sql, plus Pal growth: each solved level (not a Skip, which sends no moves) grows
-- the partner Pal by one; 20 grow it into its next form (5 forms: 0-4). Must match growPartnerLocally in pals.js.
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
  v_pal text;
  v_stage integer;
  v_growth integer;
begin
  if p_stars < 1 or p_stars > 3 then
    raise exception using message = 'Invalid result.';
  end if;

  select coalesce((select stars from public.progress where user_id = v_user and level_id = p_level_id), 0) into v_previous;
  v_is_real_level := public._difficulty_multiplier(p_level_id) > 0;
  v_sparks := greatest(0, p_stars - v_previous) * 5 * public._difficulty_multiplier(p_level_id);

  if p_stars > v_previous and v_is_real_level and public._is_level_reachable(v_user, p_level_id) then
    perform public._add_weekly_points(v_user, p_stars - v_previous);
  end if;

  insert into public.progress (user_id, level_id, stars, best_moves)
  values (v_user, p_level_id, p_stars, p_moves)
  on conflict (user_id, level_id) do update set
    stars = greatest(public.progress.stars, excluded.stars),
    best_moves = least(public.progress.best_moves, excluded.best_moves),
    completed_at = now();

  update public.profiles set sparks = sparks + v_sparks where id = v_user;

  if p_moves is not null then
    select pal_id, coalesce((pals -> pal_id ->> 'stage')::integer, 0), coalesce((pals -> pal_id ->> 'growth')::integer, 0) + 1
      into v_pal, v_stage, v_growth
      from public.profiles where id = v_user and pals ? pal_id for update;
    if v_pal is not null and v_stage < 4 then
      if v_growth >= 20 then
        v_stage := v_stage + 1;
        v_growth := 0;
      end if;
      update public.profiles set pals = jsonb_set(pals, array[v_pal], jsonb_build_object('stage', v_stage, 'growth', v_growth)) where id = v_user;
    end if;
  end if;

  select world into v_world from public.levels where id = p_level_id;
  v_world := coalesce(v_world, (regexp_match(p_level_id, '^w([0-9]+)-'))[1]::integer);
  if v_world is not null then
    v_diamonds := public._award_world_rewards(v_user, v_world);
  end if;

  return public._economy_state(v_user) || jsonb_build_object('sparksEarned', v_sparks, 'diamondsEarned', v_diamonds);
end;
$$;

-- The weekly board also shows each player's Pal (id, form and accessory).
create or replace function public.weekly_leaderboard()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ranking as (
    select r.*, p.pal_id, coalesce((p.pals -> p.pal_id ->> 'stage')::integer, 0) as pal_stage, p.pal_wearing
    from public._weekly_ranking(public._week_start()) r
    join public.profiles p on p.id = r.user_id
  )
  select jsonb_build_object(
    'weekStart', public._week_start(),
    'endsAt', (public._week_start() + 7)::timestamp at time zone 'utc',
    'top', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank', r.rank, 'nickname', public._nickname_for(r.user_id), 'score', r.score, 'isMe', r.user_id = auth.uid(),
        'pal', r.pal_id, 'palStage', r.pal_stage, 'wearing', to_jsonb(r.pal_wearing))
        order by r.rank)
      from ranking r where r.rank <= 50), '[]'::jsonb),
    'me', (
      select jsonb_build_object('rank', r.rank, 'score', r.score, 'nickname', public._nickname_for(r.user_id),
        'pal', r.pal_id, 'palStage', r.pal_stage, 'wearing', to_jsonb(r.pal_wearing))
      from ranking r where r.user_id = auth.uid()),
    'myNickname', case when auth.uid() is null then null else public._nickname_for(auth.uid()) end
  );
$$;

revoke all on function public._is_pal_unlocked(uuid, text) from public, anon, authenticated;
revoke all on function public._nickname_for(uuid) from public, anon, authenticated;
revoke all on function public.choose_pal(text) from public, anon;
revoke all on function public.buy_accessory(text) from public, anon;
revoke all on function public.wear_accessory(text, boolean) from public, anon;
revoke all on function public.adopt_pal(text) from public, anon;
grant execute on function public.choose_pal(text) to authenticated;
revoke all on function public._finished_world_count(uuid) from public, anon, authenticated;
grant execute on function public.buy_accessory(text) to authenticated;
grant execute on function public.wear_accessory(text, boolean) to authenticated;
grant execute on function public.adopt_pal(text) to authenticated;
revoke all on function public._daily_pick(uuid, text, date) from public, anon, authenticated;
revoke all on function public.claim_lucky_pal() from public, anon;
grant execute on function public.claim_lucky_pal() to authenticated;
grant execute on function public.weekly_leaderboard() to anon, authenticated;
