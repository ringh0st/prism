-- Lumipals: weekly theme collections. Each week (Monday, UTC) the Shop features one theme's outfit pieces
-- and Grove decor, some for sparks and some for diamonds; themes take turns.
-- Run in Supabase → SQL Editor AFTER player_cards.sql. Run it again whenever you re-run pals.sql or
-- grove.sql (it updates wear_accessory and place_grove_item so theme items can be worn and placed).
-- Items, prices and the rotation must match src/game/themes.js (a test checks).

-- Every theme item: what it is, where it goes and its price.
create or replace function public._theme_item(p_item text)
returns jsonb
language sql
immutable
as $$
  select case p_item
    when 'leafCrown' then '{"kind": "outfit", "slot": "head", "price": 140, "currency": "sparks"}'::jsonb
    when 'moonCirclet' then '{"kind": "outfit", "slot": "head", "price": 20, "currency": "diamonds"}'::jsonb
    when 'elvenCloak' then '{"kind": "outfit", "slot": "neck", "price": 15, "currency": "diamonds"}'::jsonb
    when 'woodStaff' then '{"kind": "outfit", "slot": "hand", "price": 160, "currency": "sparks"}'::jsonb
    when 'glowTree' then '{"kind": "decor", "spot": "light", "price": 180, "currency": "sparks"}'::jsonb
    when 'moonPool' then '{"kind": "decor", "spot": "water", "price": 220, "currency": "sparks"}'::jsonb
    when 'elvenTower' then '{"kind": "decor", "spot": "home", "price": 30, "currency": "diamonds"}'::jsonb
    when 'pumpkinHat' then '{"kind": "outfit", "slot": "head", "price": 140, "currency": "sparks"}'::jsonb
    when 'strawHat' then '{"kind": "outfit", "slot": "head", "price": 20, "currency": "diamonds"}'::jsonb
    when 'leafScarf' then '{"kind": "outfit", "slot": "neck", "price": 120, "currency": "sparks"}'::jsonb
    when 'appleBasket' then '{"kind": "outfit", "slot": "hand", "price": 15, "currency": "diamonds"}'::jsonb
    when 'hayBench' then '{"kind": "decor", "spot": "seat", "price": 180, "currency": "sparks"}'::jsonb
    when 'appleTree' then '{"kind": "decor", "spot": "garden", "price": 220, "currency": "sparks"}'::jsonb
    when 'jackLanterns' then '{"kind": "decor", "spot": "light", "price": 30, "currency": "diamonds"}'::jsonb
    when 'earmuffs' then '{"kind": "outfit", "slot": "head", "price": 140, "currency": "sparks"}'::jsonb
    when 'iceCrown' then '{"kind": "outfit", "slot": "head", "price": 20, "currency": "diamonds"}'::jsonb
    when 'snowScarf' then '{"kind": "outfit", "slot": "neck", "price": 120, "currency": "sparks"}'::jsonb
    when 'snowGlobe' then '{"kind": "outfit", "slot": "hand", "price": 15, "currency": "diamonds"}'::jsonb
    when 'snowman' then '{"kind": "decor", "spot": "garden", "price": 180, "currency": "sparks"}'::jsonb
    when 'iceLantern' then '{"kind": "decor", "spot": "light", "price": 200, "currency": "sparks"}'::jsonb
    when 'snowCabin' then '{"kind": "decor", "spot": "home", "price": 30, "currency": "diamonds"}'::jsonb
    when 'bandana' then '{"kind": "outfit", "slot": "head", "price": 140, "currency": "sparks"}'::jsonb
    when 'captainHat' then '{"kind": "outfit", "slot": "head", "price": 20, "currency": "diamonds"}'::jsonb
    when 'captainCoat' then '{"kind": "outfit", "slot": "neck", "price": 15, "currency": "diamonds"}'::jsonb
    when 'spyglass' then '{"kind": "outfit", "slot": "hand", "price": 160, "currency": "sparks"}'::jsonb
    when 'treasureChest' then '{"kind": "decor", "spot": "garden", "price": 200, "currency": "sparks"}'::jsonb
    when 'pirateFlag' then '{"kind": "decor", "spot": "sky", "price": 180, "currency": "sparks"}'::jsonb
    when 'littleShip' then '{"kind": "decor", "spot": "water", "price": 30, "currency": "diamonds"}'::jsonb
    else null
  end;
$$;

-- Which theme each item belongs to.
create or replace function public._theme_of_item(p_item text)
returns text
language sql
immutable
as $$
  select case p_item
    when 'leafCrown' then 'elvenWoods'
    when 'moonCirclet' then 'elvenWoods'
    when 'elvenCloak' then 'elvenWoods'
    when 'woodStaff' then 'elvenWoods'
    when 'glowTree' then 'elvenWoods'
    when 'moonPool' then 'elvenWoods'
    when 'elvenTower' then 'elvenWoods'
    when 'pumpkinHat' then 'autumnHarvest'
    when 'strawHat' then 'autumnHarvest'
    when 'leafScarf' then 'autumnHarvest'
    when 'appleBasket' then 'autumnHarvest'
    when 'hayBench' then 'autumnHarvest'
    when 'appleTree' then 'autumnHarvest'
    when 'jackLanterns' then 'autumnHarvest'
    when 'earmuffs' then 'winterWonderland'
    when 'iceCrown' then 'winterWonderland'
    when 'snowScarf' then 'winterWonderland'
    when 'snowGlobe' then 'winterWonderland'
    when 'snowman' then 'winterWonderland'
    when 'iceLantern' then 'winterWonderland'
    when 'snowCabin' then 'winterWonderland'
    when 'bandana' then 'pirateCove'
    when 'captainHat' then 'pirateCove'
    when 'captainCoat' then 'pirateCove'
    when 'spyglass' then 'pirateCove'
    when 'treasureChest' then 'pirateCove'
    when 'pirateFlag' then 'pirateCove'
    when 'littleShip' then 'pirateCove'
    else null
  end;
$$;

-- This week's theme: they take turns, starting the week of 5 January 2026.
create or replace function public._theme_of_week()
returns text
language sql
stable
as $$
  select (array['elvenWoods', 'autumnHarvest', 'winterWonderland', 'pirateCove'])[
    (((floor(extract(epoch from (now() - timestamptz '2026-01-05 00:00:00+00')) / 604800)::integer % 4) + 4) % 4) + 1];
$$;

-- Buy a piece of this week's collection with sparks or diamonds (whichever it costs).
create or replace function public.buy_theme_item(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_item jsonb := public._theme_item(p_item);
  v_price integer;
  v_profile public.profiles;
begin
  if v_item is null or public._theme_of_item(p_item) <> public._theme_of_week() then
    raise exception using message = 'That isn’t in this week’s collection.';
  end if;
  v_price := (v_item ->> 'price')::integer;
  select * into v_profile from public.profiles where id = v_user for update;
  if (v_item ->> 'kind' = 'outfit' and p_item = any (v_profile.pal_accessories))
     or (v_item ->> 'kind' = 'decor' and p_item = any (v_profile.grove_items)) then
    raise exception using message = 'You already have this.';
  end if;
  if v_item ->> 'currency' = 'diamonds' then
    if v_profile.diamonds < v_price then
      raise exception using message = 'Not enough diamonds.';
    end if;
    update public.profiles set diamonds = diamonds - v_price where id = v_user;
  else
    if v_profile.sparks < v_price then
      raise exception using message = 'Not enough sparks.';
    end if;
    update public.profiles set sparks = sparks - v_price where id = v_user;
  end if;
  if v_item ->> 'kind' = 'outfit' then
    update public.profiles set pal_accessories = array_append(pal_accessories, p_item) where id = v_user;
  else
    update public.profiles set grove_items = array_append(grove_items, p_item) where id = v_user;
  end if;
  return public._economy_state(v_user);
end;
$$;

-- Where an outfit piece or decoration goes, for regular and theme items alike.
create or replace function public._outfit_slot(p_item text)
returns text
language sql
immutable
as $$
  select coalesce(public._accessory(p_item) ->> 'slot', public._theme_item(p_item) ->> 'slot');
$$;

create or replace function public._decor_spot(p_item text)
returns text
language sql
immutable
as $$
  select coalesce(public._grove_item(p_item) ->> 'spot', public._theme_item(p_item) ->> 'spot');
$$;

-- Put on an owned item (replacing whatever is in the same slot), or take it off. (Replaces pals.sql's.)
create or replace function public.wear_accessory(p_item text, p_wear boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_slot text := public._outfit_slot(p_item);
begin
  if v_slot is null then
    raise exception using message = 'That item is not in the shop.';
  end if;
  if p_wear and not exists (select 1 from public.profiles where id = v_user and p_item = any (pal_accessories)) then
    raise exception using message = 'Buy it first.';
  end if;
  update public.profiles set pal_wearing =
    array(select item from unnest(pal_wearing) as item where public._outfit_slot(item) is distinct from v_slot)
    || case when p_wear then array[p_item] else '{}'::text[] end
  where id = v_user;
  return public._economy_state(v_user);
end;
$$;

-- Place owned decor in its spot (replacing whatever was there), or put it away. (Replaces grove.sql's.)
create or replace function public.place_grove_item(p_item text, p_place boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_spot text := public._decor_spot(p_item);
begin
  if v_spot is null then
    raise exception using message = 'That decor is not in the shop.';
  end if;
  if p_place and not exists (select 1 from public.profiles where id = v_user and p_item = any (grove_items)) then
    raise exception using message = 'Buy it first.';
  end if;
  update public.profiles set grove_placed =
    array(select item from unnest(grove_placed) as item where public._decor_spot(item) is distinct from v_spot)
    || case when p_place then array[p_item] else '{}'::text[] end
  where id = v_user;
  return public._economy_state(v_user);
end;
$$;

revoke all on function public.buy_theme_item(text) from public, anon;
grant execute on function public.buy_theme_item(text) to authenticated;
