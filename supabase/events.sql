-- Lumipals: weekend events. Every Saturday and Sunday, 10 themed puzzles (made ahead of time, the same
-- for everyone); finishing all 10 pays a prize and earns that event's stamp.
-- Run in Supabase → SQL Editor AFTER grove.sql. Safe to run more than once.
-- The prize must match EVENT_PRIZE_SPARKS and EVENT_LEVELS in src/game/events.js (a test checks).

create table if not exists public.event_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  weekend date not null,               -- the event's Saturday
  stars jsonb not null default '{}',   -- best stars per puzzle: {"1": 3, "2": 2, …}
  prize_claimed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, weekend)
);

-- Only the functions below read or write it.
alter table public.event_progress enable row level security;

-- Every event a player took part in: { "2026-11-14": { "stars": {…}, "claimed": true }, … }
create or replace function public._my_events(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(weekend::text, jsonb_build_object('stars', stars, 'claimed', prize_claimed)), '{}'::jsonb)
  from public.event_progress
  where user_id = p_user;
$$;

-- An event is open on its Saturday and Sunday (with a day of slack either side for time zones).
create or replace function public._is_event_open(p_weekend date)
returns boolean
language sql
stable
as $$
  select extract(isodow from p_weekend) = 6 and current_date between p_weekend - 1 and p_weekend + 2;
$$;

-- The partner Pal grows with every solved puzzle, like in record_level_result (supabase/pals.sql).
create or replace function public._grow_partner_pal(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pal text;
  v_stage integer;
  v_growth integer;
begin
  select pal_id, coalesce((pals -> pal_id ->> 'stage')::integer, 0), coalesce((pals -> pal_id ->> 'growth')::integer, 0) + 1
    into v_pal, v_stage, v_growth
    from public.profiles where id = p_user and pals ? pal_id for update;
  if v_pal is null or v_stage >= 4 then
    return;
  end if;
  if v_growth >= 20 then
    v_stage := v_stage + 1;
    v_growth := 0;
  end if;
  update public.profiles set pals = jsonb_set(pals, array[v_pal], jsonb_build_object('stage', v_stage, 'growth', v_growth)) where id = p_user;
end;
$$;

create or replace function public.record_event_level(p_weekend date, p_number integer, p_stars integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
begin
  if p_number < 1 or p_number > 10 or p_stars < 1 or p_stars > 3 then
    raise exception using message = 'Invalid result.';
  end if;
  if not public._is_event_open(p_weekend) then
    raise exception using message = 'This event has ended. A new one starts on Saturday!';
  end if;

  insert into public.event_progress (user_id, weekend, stars)
  values (v_user, p_weekend, jsonb_build_object(p_number::text, p_stars))
  on conflict (user_id, weekend) do update set
    stars = public.event_progress.stars || jsonb_build_object(
      p_number::text, greatest(p_stars, coalesce((public.event_progress.stars ->> p_number::text)::integer, 0))),
    updated_at = now();

  perform public._grow_partner_pal(v_user);
  return public._economy_state(v_user) || jsonb_build_object('events', public._my_events(v_user));
end;
$$;

-- The prize for finishing all 10 can be collected any time after (it waits for you).
create or replace function public.claim_event_prize(p_weekend date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_row public.event_progress;
  v_solved integer;
begin
  select * into v_row from public.event_progress where user_id = v_user and weekend = p_weekend for update;
  select count(*) into v_solved from jsonb_each_text(coalesce(v_row.stars, '{}')) where value::integer > 0;
  if v_row is null or v_solved < 10 then
    raise exception using message = 'Finish all 10 puzzles to open the prize.';
  end if;
  if v_row.prize_claimed then
    raise exception using message = 'You already collected this prize.';
  end if;

  update public.event_progress set prize_claimed = true, updated_at = now() where user_id = v_user and weekend = p_weekend;
  update public.profiles set sparks = sparks + 150 where id = v_user;
  return public._economy_state(v_user) || jsonb_build_object('events', public._my_events(v_user));
end;
$$;

create or replace function public.my_events()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('events', public._my_events(public._require_user()));
$$;

revoke all on function public._my_events(uuid) from public, anon, authenticated;
revoke all on function public._grow_partner_pal(uuid) from public, anon, authenticated;
revoke all on function public.record_event_level(date, integer, integer) from public, anon;
revoke all on function public.claim_event_prize(date) from public, anon;
revoke all on function public.my_events() from public, anon;
grant execute on function public.record_event_level(date, integer, integer) to authenticated;
grant execute on function public.claim_event_prize(date) to authenticated;
grant execute on function public.my_events() to authenticated;
