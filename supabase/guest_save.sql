-- Lumipals: bringing a guest's save into an account at sign-in.
-- Run in Supabase → SQL Editor AFTER gifts.sql (and again after re-running it). Safe to run more than once.
--
-- Signing in used to move only the guest's levels and stars into the account; the account's Pals, outfits,
-- Grove, sparks and helpers then replaced the phone's, so a brand-new account wiped them (owner: her nephew lost
-- his game). Now the game sends the phone's save once and it is combined with the account: nothing is taken away,
-- the higher of each count is kept, and Pals, outfits and decor are joined. A save is only plausible for the
-- levels it solved (checked here, after the levels were merged), so this can't be used to hand out free things.
-- Must match combineSave / saveForAccount in src/game/guestSave.js.

create or replace function public.combine_guest_save(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_profile public.profiles;
  v_solved integer;
  v_stars integer;
  v_pals jsonb;
  v_id text;
  v_entry jsonb;
  v_stage integer;
  v_growth integer;
  v_grown integer := 0;
  v_rare integer := 0;
  v_item text;
  v_helper text;
begin
  if jsonb_typeof(p_save) <> 'object' then
    raise exception using message = 'Invalid progress.';
  end if;
  select * into v_profile from public.profiles where id = v_user for update;
  select count(*) filter (where stars > 0)::integer, coalesce(sum(stars), 0)::integer into v_solved, v_stars
    from public.progress where user_id = v_user and level_id ~ '^w[0-9]+-[0-9]{2}$';

  -- Pals: joined; a Pal both have keeps the further-grown copy. Growth is earned one solved level at a time,
  -- and Legendary/Mythic Pals come from gifts, so a save claiming more than its levels allow brings no Pals.
  v_pals := v_profile.pals;
  for v_id, v_entry in select key, value from jsonb_each(coalesce(p_save -> 'pals', '{}'::jsonb)) loop
    continue when not (v_id = any (public._all_pals())) or jsonb_typeof(v_entry) <> 'object';
    v_stage := least(4, greatest(0, coalesce((v_entry ->> 'stage')::integer, 0)));
    v_growth := least(19, greatest(0, coalesce((v_entry ->> 'growth')::integer, 0)));
    v_grown := v_grown + v_stage * 20 + v_growth;
    if public._pal_rarity(v_id) <> 'common' and not (v_profile.pals ? v_id) then
      v_rare := v_rare + 1;
    end if;
    if not (v_pals ? v_id) or coalesce((v_pals -> v_id ->> 'stage')::integer, 0) * 20 + coalesce((v_pals -> v_id ->> 'growth')::integer, 0) < v_stage * 20 + v_growth then
      v_pals := v_pals || jsonb_build_object(v_id, jsonb_build_object('stage', v_stage, 'growth', v_growth));
    end if;
  end loop;
  if v_grown > v_solved + 20 or v_rare > 2 + v_solved / 50 then
    v_pals := v_profile.pals;
  end if;

  update public.profiles set
    pals = v_pals,
    pal_id = coalesce(pal_id, case when v_pals ? (p_save ->> 'palId') then p_save ->> 'palId' end),
    pal_accessories = (select coalesce(array_agg(distinct i), '{}') from unnest(
      pal_accessories || array(select jsonb_array_elements_text(coalesce(p_save -> 'accessories', '[]'::jsonb)))) as i
      where public._accessory(i) is not null or public._theme_item(i) is not null),
    grove_items = (select coalesce(array_agg(distinct i), '{}') from unnest(
      grove_items || array(select jsonb_array_elements_text(coalesce(p_save -> 'groveItems', '[]'::jsonb)))) as i
      where public._grove_item(i) is not null or public._theme_item(i) is not null),
    sparks = greatest(sparks, least(coalesce((p_save ->> 'sparks')::integer, 0), 200 * v_solved + 1000)),
    presents_opened = greatest(presents_opened, least(coalesce((p_save ->> 'presentsOpened')::integer, 0), v_stars / 10)),
    lucky_pals_claimed = greatest(lucky_pals_claimed, least(coalesce((p_save ->> 'luckyPalsClaimed')::integer, 0), v_solved / 200)),
    legendary_milestones = greatest(legendary_milestones, least(coalesce((p_save ->> 'legendaryMilestones')::integer, 0), v_solved / 100)),
    legendary_pal_gift = legendary_pal_gift or coalesce((p_save ->> 'legendaryPalGift')::boolean, false),
    gift_days = greatest(gift_days, least(coalesce((p_save ->> 'giftDays')::integer, 0), 400))
  where id = v_user;

  -- What the phone wore and placed comes along when the account had nothing on.
  select * into v_profile from public.profiles where id = v_user;
  if cardinality(v_profile.pal_wearing) = 0 then
    update public.profiles set pal_wearing = array(
      select i from jsonb_array_elements_text(coalesce(p_save -> 'wearing', '[]'::jsonb)) as i where i = any (pal_accessories))
    where id = v_user;
  end if;
  if cardinality(v_profile.grove_placed) = 0 then
    update public.profiles set grove_placed = array(
      select i from jsonb_array_elements_text(coalesce(p_save -> 'grovePlaced', '[]'::jsonb)) as i where i = any (grove_items))
    where id = v_user;
  end if;
  -- Helpers: the higher count of each, at most 5 as always.
  for v_helper in select jsonb_object_keys(coalesce(p_save -> 'helpers', '{}'::jsonb)) loop
    continue when v_helper !~ '^[a-zA-Z]{2,20}$';
    update public.profiles set helpers = jsonb_set(helpers, array[v_helper],
      to_jsonb(greatest(coalesce((helpers ->> v_helper)::integer, 0), least(5, greatest(0, coalesce((p_save -> 'helpers' ->> v_helper)::integer, 0))))))
    where id = v_user;
  end loop;
  return public._economy_state(v_user);
end;
$$;

revoke all on function public.combine_guest_save(jsonb) from public, anon;
grant execute on function public.combine_guest_save(jsonb) to authenticated;
