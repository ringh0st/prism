-- Lumipals gifts: the 7-day gift calendar (replaces the flat daily gift) and the partner Pal's presents.
-- Run in Supabase → SQL Editor AFTER rush.sql (and again after re-running social.sql, pals.sql or grove.sql,
-- which define older versions of these functions). Safe to run more than once.
-- Rules must match src/game/gifts.js (a test checks the calendar, odds and items).

alter table public.profiles
  add column if not exists gift_days integer not null default 0,
  add column if not exists presents_opened integer not null default 0,
  -- Sure Legendary presents: those for every 100 solved levels opened, and the last Sunday one (player's date).
  add column if not exists legendary_milestones integer not null default 0,
  add column if not exists legendary_sunday date,
  add column if not exists win_gift_date date,
  add column if not exists win_gifts_opened integer not null default 0,
  -- Glowbug rows whose diamond was collected (see glowbugs.sql).
  add column if not exists glowbug_rows_claimed text[] not null default '{}',
  -- Pal adoption limits (see adopt_pal in pals.sql), here too so _economy_state works on any run order.
  add column if not exists rare_adopt_week integer,
  add column if not exists rare_adopts integer not null default 0;

-- Balances also report the gift calendar, presents and win gifts (same as grove.sql, plus the gift fields).
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
    'giftDays', p.gift_days,
    'presentsOpened', p.presents_opened,
    'legendaryMilestones', p.legendary_milestones,
    'legendarySunday', p.legendary_sunday,
    'winGiftDate', p.win_gift_date,
    'winGiftsOpened', p.win_gifts_opened,
    'sparkPurchasesToday', case when p.spark_purchase_date = current_date then p.spark_purchases_today else 0 end,
    'claimedChests', to_jsonb(p.claimed_chests),
    'pal', jsonb_build_object('id', p.pal_id, 'owned', p.pals, 'accessories', to_jsonb(p.pal_accessories), 'wearing', to_jsonb(p.pal_wearing)),
    'grove', jsonb_build_object('items', to_jsonb(p.grove_items), 'placed', to_jsonb(p.grove_placed)),
    'luckyPalsClaimed', p.lucky_pals_claimed,
    'glowbugRowsClaimed', to_jsonb(p.glowbug_rows_claimed),
    'rareAdopts', case when p.rare_adopt_week = public._adopt_week((now() at time zone 'utc')::date) then p.rare_adopts else 0 end
  )
  from public.profiles p
  where p.id = p_user;
$$;

-- Adds one helper, or 10 sparks when that helper is already full (5). Returns the sparks added.
create or replace function public._give_helper(p_user uuid, p_helper text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_held integer;
begin
  select coalesce((helpers ->> p_helper)::integer, 0) into v_held from public.profiles where id = p_user;
  if v_held >= 5 then
    update public.profiles set sparks = sparks + 10 where id = p_user;
    return 10;
  end if;
  update public.profiles set helpers = jsonb_set(helpers, array[p_helper], to_jsonb(v_held + 1)) where id = p_user;
  return 0;
end;
$$;

-- ---------------------------------------------------------------------------
-- The 7-day gift calendar. Must match GIFT_CALENDAR in src/game/gifts.js.
-- A missed day pauses the calendar; it never resets.
-- ---------------------------------------------------------------------------
create or replace function public._gift_calendar(p_day integer)
returns jsonb
language sql
immutable
as $$
  select case p_day
    when 0 then '{"sparks": 15}'::jsonb
    when 1 then '{"sparks": 20, "helper": "hint"}'::jsonb
    when 2 then '{"sparks": 25, "helper": "spareMoves"}'::jsonb
    when 3 then '{"sparks": 25, "helper": "lens"}'::jsonb
    when 4 then '{"sparks": 30, "helper": "steadyHand"}'::jsonb
    when 5 then '{"sparks": 30, "helper": "autoturn"}'::jsonb
    when 6 then '{"sparks": 60, "diamonds": 1, "isBig": true}'::jsonb
  end;
$$;

create or replace function public.claim_daily_gift(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_last date;
  v_days integer;
  v_gift jsonb;
  v_sparks integer;
  v_helper text;
  v_extra integer := 0;
begin
  -- Allow for time zones: the player's "today" is within a day of the server's.
  if p_date < current_date - 1 or p_date > current_date + 1 then
    raise exception using message = 'That gift is not available.';
  end if;
  select last_gift_date, gift_days into v_last, v_days from public.profiles where id = v_user for update;
  if v_last is not null and p_date <= v_last then
    raise exception using message = 'You already opened today’s gift. Come back tomorrow!';
  end if;

  v_gift := public._gift_calendar(v_days % 7);
  v_sparks := (v_gift ->> 'sparks')::integer;
  v_helper := v_gift ->> 'helper';
  update public.profiles set
    sparks = sparks + v_sparks,
    diamonds = diamonds + coalesce((v_gift ->> 'diamonds')::integer, 0),
    last_gift_date = p_date,
    gift_days = gift_days + 1
  where id = v_user;
  if v_helper is not null then
    v_extra := public._give_helper(v_user, v_helper);
  end if;
  v_gift := jsonb_build_object(
    'sparks', v_sparks + v_extra,
    'helper', case when v_extra > 0 then null else v_helper end,
    'diamonds', v_gift -> 'diamonds',
    'isBig', coalesce(v_gift -> 'isBig', 'false'::jsonb)
  );
  return public._economy_state(v_user) || jsonb_build_object('gift', v_gift, 'sparksEarned', v_sparks + v_extra);
end;
$$;

-- ---------------------------------------------------------------------------
-- The partner Pal's presents: one per 10 stars from built-in levels. Each holds 20 sparks plus a surprise:
-- 45% a helper, 30% a bag of 40 more sparks, 25% an outfit piece or Grove decor the player doesn't own.
-- A surprise that can't be given (helpers full, everything owned) becomes the sparks bag.
-- How special it is (shown as it opens): Plain 65%, Rare 23% (+20 sparks), Epic 9% (+40 sparks, a sure item),
-- Legendary 3% (+80 sparks, a sure item and a diamond). Must match PRESENT_* in src/game/gifts.js.
-- ---------------------------------------------------------------------------
create or replace function public._present_items()
returns text[]
language sql
immutable
as $$
  select array['outfit:scarf', 'outfit:beanie', 'outfit:bow', 'outfit:partyHat', 'outfit:balloon', 'outfit:medal',
               'decor:logBench', 'decor:flowerPatch', 'decor:fireflyJar', 'decor:berryBush', 'decor:glowShrooms', 'decor:kites'];
$$;

-- Puts one present into the player's profile: p_rarity_roll (0-100) decides how special it is.
-- Returns the gift. Callers check and count what was opened.
create or replace function public._give_present(p_user uuid, p_rarity_roll double precision)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_rarity_roll double precision := p_rarity_roll;
  v_roll double precision := random() * 100;
  v_rarity text;
  v_bonus integer;
  v_sure_item boolean;
  v_diamonds integer := 0;
  v_helper text;
  v_item text;
  v_sparks integer := 20;
  v_gift jsonb;
begin
  select * into v_profile from public.profiles where id = p_user;
  if v_rarity_roll < 65 then v_rarity := 'plain'; v_bonus := 0; v_sure_item := false;
  elsif v_rarity_roll < 88 then v_rarity := 'rare'; v_bonus := 20; v_sure_item := false;
  elsif v_rarity_roll < 97 then v_rarity := 'epic'; v_bonus := 40; v_sure_item := true;
  else v_rarity := 'legendary'; v_bonus := 80; v_sure_item := true; v_diamonds := 1;
  end if;

  if v_sure_item or v_roll >= 75 then
    select i into v_item from unnest(public._present_items()) as i
      where not (split_part(i, ':', 1) = 'outfit' and split_part(i, ':', 2) = any (v_profile.pal_accessories))
        and not (split_part(i, ':', 1) = 'decor' and split_part(i, ':', 2) = any (v_profile.grove_items))
      order by random() limit 1;
  elsif v_roll < 45 then
    select h into v_helper from unnest(array['hint', 'lens', 'autoturn', 'spareMoves', 'steadyHand', 'headStart']) as h
      where coalesce((v_profile.helpers ->> h)::integer, 0) < 5
      order by random() limit 1;
  end if;

  v_gift := jsonb_build_object('rarity', v_rarity);
  if v_helper is not null then
    v_gift := v_gift || jsonb_build_object('helper', v_helper);
    update public.profiles set helpers = jsonb_set(helpers, array[v_helper], to_jsonb(coalesce((helpers ->> v_helper)::integer, 0) + 1))
      where id = p_user;
  elsif v_item is not null then
    v_gift := v_gift || jsonb_build_object('item', jsonb_build_object('type', split_part(v_item, ':', 1), 'id', split_part(v_item, ':', 2)));
    if split_part(v_item, ':', 1) = 'outfit' then
      update public.profiles set pal_accessories = array_append(pal_accessories, split_part(v_item, ':', 2)) where id = p_user;
    else
      update public.profiles set grove_items = array_append(grove_items, split_part(v_item, ':', 2)) where id = p_user;
    end if;
  else
    v_sparks := v_sparks + 40; -- the bag of sparks
  end if;
  v_sparks := v_sparks + v_bonus;
  if v_diamonds > 0 then
    v_gift := v_gift || jsonb_build_object('diamonds', v_diamonds);
  end if;
  v_gift := v_gift || jsonb_build_object('sparks', v_sparks);
  update public.profiles set sparks = sparks + v_sparks, diamonds = diamonds + v_diamonds where id = p_user;
  return v_gift;
end;
$$;

create or replace function public.claim_present()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_profile public.profiles;
  v_stars integer;
  v_gift jsonb;
begin
  select * into v_profile from public.profiles where id = v_user for update;
  select coalesce(sum(stars), 0)::integer into v_stars from public.progress
    where user_id = v_user and level_id ~ '^w[0-9]+-[0-9]{2}$';
  if v_stars / 10 <= v_profile.presents_opened then
    raise exception using message = 'No present yet.';
  end if;
  v_gift := public._give_present(v_user, random() * 100);
  update public.profiles set presents_opened = presents_opened + 1 where id = v_user;
  return public._economy_state(v_user) || jsonb_build_object('gift', v_gift);
end;
$$;

-- Sure Legendary presents (a 3% chance felt like "never"): one for every 100 solved built-in levels, and one
-- every Sunday by the player's own date (p_date). A 100-level one opens first. Must match LEGENDARY_* in gifts.js.
create or replace function public.claim_legendary_present(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_profile public.profiles;
  v_solved integer;
  v_gift jsonb;
begin
  select * into v_profile from public.profiles where id = v_user for update;
  if v_profile.pal_id is null then
    raise exception using message = 'No present yet.';
  end if;
  select count(*)::integer into v_solved from public.progress
    where user_id = v_user and stars > 0 and level_id ~ '^w[0-9]+-[0-9]{2}$';
  if v_solved / 100 > v_profile.legendary_milestones then
    update public.profiles set legendary_milestones = legendary_milestones + 1 where id = v_user;
  elsif p_date between current_date - 1 and current_date + 1 and extract(isodow from p_date) = 7
    and v_profile.legendary_sunday is distinct from p_date then
    update public.profiles set legendary_sunday = p_date where id = v_user;
  else
    raise exception using message = 'No present yet.';
  end if;
  v_gift := public._give_present(v_user, 99.9);
  return public._economy_state(v_user) || jsonb_build_object('gift', v_gift);
end;
$$;

-- ---------------------------------------------------------------------------
-- Daily win gifts: the 1st, 3rd and 6th different level won each day (by the player's clock).
-- Must match WIN_GIFTS in src/game/gifts.js.
-- ---------------------------------------------------------------------------
create or replace function public._win_gift(p_index integer)
returns jsonb
language sql
immutable
as $$
  select case p_index
    when 0 then '{"wins": 1, "sparks": 10}'::jsonb
    when 1 then '{"wins": 3, "sparks": 15, "helper": "hint"}'::jsonb
    when 2 then '{"wins": 6, "sparks": 25, "helper": "lens"}'::jsonb
  end;
$$;

-- p_date: the player's today; p_since: when the player's today began (their local midnight).
create or replace function public.claim_win_gift(p_date date, p_since timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_profile public.profiles;
  v_opened integer;
  v_tier jsonb;
  v_wins integer;
  v_helper text;
  v_extra integer := 0;
begin
  if p_date < current_date - 1 or p_date > current_date + 1 or p_since < now() - interval '50 hours' or p_since > now() then
    raise exception using message = 'That gift is not available.';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  v_opened := case when v_profile.win_gift_date = p_date then v_profile.win_gifts_opened else 0 end;
  v_tier := public._win_gift(v_opened);
  -- Different built-in levels solved (not skipped) since the player's day began.
  select count(*)::integer into v_wins from public.progress
    where user_id = v_user and level_id ~ '^w[0-9]+-[0-9]{2}$' and stars > 0 and best_moves is not null and completed_at >= p_since;
  if v_tier is null or v_wins < (v_tier ->> 'wins')::integer then
    raise exception using message = 'No gift yet.';
  end if;

  v_helper := v_tier ->> 'helper';
  update public.profiles set
    sparks = sparks + (v_tier ->> 'sparks')::integer,
    win_gift_date = p_date,
    win_gifts_opened = v_opened + 1
  where id = v_user;
  if v_helper is not null then
    v_extra := public._give_helper(v_user, v_helper);
  end if;
  return public._economy_state(v_user) || jsonb_build_object('gift', jsonb_build_object(
    'sparks', (v_tier ->> 'sparks')::integer + v_extra,
    'helper', case when v_extra > 0 then null else v_helper end
  ));
end;
$$;

revoke all on function public._give_helper(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_daily_gift(date) from public, anon;
grant execute on function public.claim_daily_gift(date) to authenticated;
revoke all on function public.claim_present() from public, anon;
grant execute on function public.claim_present() to authenticated;
revoke all on function public._give_present(uuid, double precision) from public, anon, authenticated;
revoke all on function public.claim_legendary_present(date) from public, anon;
grant execute on function public.claim_legendary_present(date) to authenticated;
revoke all on function public.claim_win_gift(date, timestamptz) from public, anon;
grant execute on function public.claim_win_gift(date, timestamptz) to authenticated;
