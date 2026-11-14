-- Lumipals: the Grove, the Pals' home in the enchanted forest. Decor is bought with sparks and placed
-- in spots, one item per spot. Run in Supabase → SQL Editor AFTER nicknames.sql. Safe to run more than once.
-- Prices and spots must match GROVE_ITEMS in src/game/grove.js (a test checks).

alter table public.profiles
  add column if not exists grove_items text[] not null default '{}',
  add column if not exists grove_placed text[] not null default '{}';

-- Decor: price in sparks and the spot it goes in.
create or replace function public._grove_item(p_item text)
returns jsonb
language sql
immutable
as $$
  select case p_item
    when 'mushroomHouse' then '{"price": 120, "spot": "home"}'::jsonb
    when 'acornCottage' then '{"price": 160, "spot": "home"}'::jsonb
    when 'treehouse' then '{"price": 220, "spot": "home"}'::jsonb
    when 'logBench' then '{"price": 40, "spot": "seat"}'::jsonb
    when 'treeSwing' then '{"price": 90, "spot": "seat"}'::jsonb
    when 'hammock' then '{"price": 110, "spot": "seat"}'::jsonb
    when 'fireflyJar' then '{"price": 50, "spot": "light"}'::jsonb
    when 'glowShrooms' then '{"price": 70, "spot": "light"}'::jsonb
    when 'lanternString' then '{"price": 90, "spot": "light"}'::jsonb
    when 'flowerPatch' then '{"price": 40, "spot": "garden"}'::jsonb
    when 'berryBush' then '{"price": 60, "spot": "garden"}'::jsonb
    when 'pumpkinPatch' then '{"price": 75, "spot": "garden"}'::jsonb
    when 'lilyPond' then '{"price": 90, "spot": "water"}'::jsonb
    when 'wishingWell' then '{"price": 120, "spot": "water"}'::jsonb
    when 'fountain' then '{"price": 150, "spot": "water"}'::jsonb
    when 'kites' then '{"price": 80, "spot": "sky"}'::jsonb
    when 'moonStars' then '{"price": 100, "spot": "sky"}'::jsonb
    when 'rainbow' then '{"price": 150, "spot": "sky"}'::jsonb
    else null
  end;
$$;

-- Balances also report the player's Pals and Grove (same as pals.sql, plus 'grove').
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
    'grove', jsonb_build_object('items', to_jsonb(p.grove_items), 'placed', to_jsonb(p.grove_placed)),
    'luckyPalsClaimed', p.lucky_pals_claimed
  )
  from public.profiles p
  where p.id = p_user;
$$;

create or replace function public.buy_grove_item(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_price integer := (public._grove_item(p_item) ->> 'price')::integer;
  v_profile public.profiles;
begin
  if v_price is null then
    raise exception using message = 'That decor is not in the shop.';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  if p_item = any (v_profile.grove_items) then
    raise exception using message = 'You already have this.';
  end if;
  if v_profile.sparks < v_price then
    raise exception using message = 'Not enough sparks.';
  end if;
  update public.profiles set sparks = sparks - v_price, grove_items = array_append(grove_items, p_item) where id = v_user;
  return public._economy_state(v_user);
end;
$$;

-- Place owned decor in its spot (replacing whatever was there), or put it away.
create or replace function public.place_grove_item(p_item text, p_place boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_spot text := public._grove_item(p_item) ->> 'spot';
begin
  if v_spot is null then
    raise exception using message = 'That decor is not in the shop.';
  end if;
  if p_place and not exists (select 1 from public.profiles where id = v_user and p_item = any (grove_items)) then
    raise exception using message = 'Buy it first.';
  end if;
  update public.profiles set grove_placed =
    array(select item from unnest(grove_placed) as item where public._grove_item(item) ->> 'spot' <> v_spot)
    || case when p_place then array[p_item] else '{}'::text[] end
  where id = v_user;
  return public._economy_state(v_user);
end;
$$;

revoke all on function public.buy_grove_item(text) from public, anon;
revoke all on function public.place_grove_item(text, boolean) from public, anon;
grant execute on function public.buy_grove_item(text) to authenticated;
grant execute on function public.place_grove_item(text, boolean) to authenticated;
