-- Lumipals social: forgiving daily streaks (shields) and the weekly worldwide top players.
-- Run in Supabase → SQL Editor AFTER progression.sql. Safe to run more than once.
--
-- Privacy: the leaderboard never shows real names or photos. Every player appears under a
-- friendly generated nickname (for example "Sunny Otter 42"), which matters for an all-ages game.

alter table public.profiles
  add column if not exists streak_shields integer not null default 0 check (streak_shields between 0 and 2),
  add column if not exists claimed_weekly_rewards date[] not null default '{}',
  add column if not exists last_gift_date date;

-- ---------------------------------------------------------------------------
-- Weekly scores: one row per player per week (Monday 00:00 UTC). Written only by the functions below.
-- ---------------------------------------------------------------------------
create table if not exists public.weekly_scores (
  week_start date not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null default 0 check (score >= 0),
  updated_at timestamptz not null default now(),
  primary key (week_start, user_id)
);

create index if not exists weekly_scores_rank on public.weekly_scores (week_start, score desc, updated_at);

alter table public.weekly_scores enable row level security;
-- No policies: players read the board through weekly_leaderboard(), which only exposes nicknames.

create or replace function public._week_start(p_at timestamptz default now())
returns date
language sql
stable
as $$
  select date_trunc('week', p_at at time zone 'utc')::date;
$$;

-- A friendly, stable nickname made from the account id (never a real name).
create or replace function public._nickname_for(p_user uuid)
returns text
language sql
immutable
as $$
  select (array['Sunny', 'Brave', 'Clever', 'Gentle', 'Happy', 'Lucky', 'Mellow', 'Nimble', 'Quiet', 'Rosy', 'Swift', 'Witty'])
           [1 + abs(('x' || substr(md5(p_user::text), 1, 7))::bit(28)::integer) % 12]
    || ' '
    || (array['Otter', 'Fox', 'Panda', 'Robin', 'Koala', 'Finch', 'Hedgehog', 'Lynx', 'Puffin', 'Badger', 'Wren', 'Seal'])
           [1 + abs(('x' || substr(md5(p_user::text), 8, 7))::bit(28)::integer) % 12]
    || ' '
    || (10 + abs(('x' || substr(md5(p_user::text), 15, 7))::bit(28)::integer) % 90)::text;
$$;

create or replace function public._add_weekly_points(p_user uuid, p_points integer)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.weekly_scores (week_start, user_id, score)
  values (public._week_start(), p_user, greatest(0, p_points))
  on conflict (week_start, user_id) do update
    set score = public.weekly_scores.score + excluded.score,
        updated_at = case when excluded.score > 0 then now() else public.weekly_scores.updated_at end;
$$;

-- Built-in levels unlock in order, so a level only scores when the one before it was finished.
create or replace function public._is_level_reachable(p_user uuid, p_level_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_match text[] := regexp_match(p_level_id, '^w([0-9]+)-([0-9]{2})$');
  v_index integer;
begin
  if v_match is null then
    return true;
  end if;
  v_index := v_match[2]::integer;
  if v_index <= 1 then
    return true;
  end if;
  return exists (
    select 1 from public.progress
    where user_id = p_user and level_id = format('w%s-%s', v_match[1], lpad((v_index - 1)::text, 2, '0')) and stars > 0
  );
end;
$$;

-- Balances now also report streak shields.
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
    'claimedChests', to_jsonb(p.claimed_chests)
  )
  from public.profiles p
  where p.id = p_user;
$$;

-- Level results: as in progression.sql, plus weekly points for new stars.
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

  if p_stars > v_previous and public._difficulty_multiplier(p_level_id) > 0 and public._is_level_reachable(v_user, p_level_id) then
    perform public._add_weekly_points(v_user, p_stars - v_previous);
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

-- The forgiving daily streak. Must match nextDailyStreak() in src/game/progress.js:
-- shields cover missed days, every 7th day earns a shield (max 2), and each daily is worth 3 weekly points.
create or replace function public.record_daily(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_profile public.profiles;
  v_missed integer;
  v_keeps boolean;
  v_streak integer;
  v_shields_used integer := 0;
  v_shield_earned boolean;
  v_sparks integer;
  v_diamonds integer;
begin
  -- Allow for time zones: the player's "today" is within a day of the server's.
  if p_date < current_date - 1 or p_date > current_date + 1 then
    raise exception using message = 'That daily puzzle is not available.';
  end if;

  select * into v_profile from public.profiles where id = v_user for update;
  if v_profile.last_daily_date = p_date then
    return public._economy_state(v_user) || jsonb_build_object(
      'sparksEarned', 0, 'diamondsEarned', 0, 'streak', v_profile.daily_streak,
      'shieldsUsed', 0, 'shieldEarned', false, 'isFirstToday', false);
  end if;

  v_missed := case when v_profile.last_daily_date is null then null else p_date - v_profile.last_daily_date - 1 end;
  v_keeps := v_missed is not null and v_missed >= 0 and v_missed <= v_profile.streak_shields;
  v_streak := case when v_keeps then v_profile.daily_streak + 1 else 1 end;
  if v_keeps then
    v_shields_used := v_missed;
  end if;
  v_shield_earned := v_streak % 7 = 0 and v_profile.streak_shields - v_shields_used < 2;
  v_sparks := 20 + least(v_streak, 7) * 5;
  v_diamonds := case when v_streak % 7 = 0 then 1 else 0 end;

  update public.profiles
    set sparks = sparks + v_sparks,
        diamonds = diamonds + v_diamonds,
        daily_streak = v_streak,
        last_daily_date = p_date,
        streak_shields = streak_shields - v_shields_used + case when v_shield_earned then 1 else 0 end
    where id = v_user;

  perform public._add_weekly_points(v_user, 3);

  return public._economy_state(v_user) || jsonb_build_object(
    'sparksEarned', v_sparks, 'diamondsEarned', v_diamonds, 'streak', v_streak,
    'shieldsUsed', v_shields_used, 'shieldEarned', v_shield_earned, 'isFirstToday', true);
end;
$$;

-- The free daily gift: 15 sparks once per day. Must match DAILY_GIFT_SPARKS in src/game/catalog.js.
create or replace function public.claim_daily_gift(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_sparks constant integer := 15;
  v_last date;
begin
  -- Allow for time zones: the player's "today" is within a day of the server's.
  if p_date < current_date - 1 or p_date > current_date + 1 then
    raise exception using message = 'That gift is not available.';
  end if;
  select last_gift_date into v_last from public.profiles where id = v_user for update;
  if v_last is not null and p_date <= v_last then
    raise exception using message = 'You already opened today’s gift. Come back tomorrow!';
  end if;
  update public.profiles set sparks = sparks + v_sparks, last_gift_date = p_date where id = v_user;
  return public._economy_state(v_user) || jsonb_build_object('sparksEarned', v_sparks);
end;
$$;

-- ---------------------------------------------------------------------------
-- Weekly leaderboard
-- ---------------------------------------------------------------------------

-- Rewards for last week's top 10. Must match WEEKLY_REWARDS in src/game/catalog.js.
create or replace function public.weekly_reward(p_rank integer)
returns jsonb
language sql
immutable
as $$
  select case
    when p_rank = 1 then '{"diamonds": 5, "sparks": 500}'::jsonb
    when p_rank = 2 then '{"diamonds": 3, "sparks": 300}'::jsonb
    when p_rank = 3 then '{"diamonds": 2, "sparks": 200}'::jsonb
    when p_rank between 4 and 10 then '{"diamonds": 0, "sparks": 100}'::jsonb
    else null
  end;
$$;

create or replace function public._weekly_ranking(p_week date)
returns table (user_id uuid, score integer, rank bigint)
language sql
stable
security definer
set search_path = public
as $$
  select s.user_id, s.score, row_number() over (order by s.score desc, s.updated_at asc)
  from public.weekly_scores s
  where s.week_start = p_week and s.score > 0;
$$;

-- This week's top 50 (nicknames only) and the caller's own place. Readable by everyone.
create or replace function public.weekly_leaderboard()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ranking as (select * from public._weekly_ranking(public._week_start()))
  select jsonb_build_object(
    'weekStart', public._week_start(),
    'endsAt', (public._week_start() + 7)::timestamp at time zone 'utc',
    'top', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank', r.rank, 'nickname', public._nickname_for(r.user_id), 'score', r.score, 'isMe', r.user_id = auth.uid())
        order by r.rank)
      from ranking r where r.rank <= 50), '[]'::jsonb),
    'me', (
      select jsonb_build_object('rank', r.rank, 'score', r.score, 'nickname', public._nickname_for(r.user_id))
      from ranking r where r.user_id = auth.uid()),
    'myNickname', case when auth.uid() is null then null else public._nickname_for(auth.uid()) end
  );
$$;

-- Collects the reward for finishing in last week's top 10. Returns null reward when there is none.
create or replace function public.claim_weekly_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_week date := public._week_start() - 7;
  v_rank bigint;
  v_reward jsonb;
  v_profile public.profiles;
begin
  select r.rank into v_rank from public._weekly_ranking(v_week) r where r.user_id = v_user;
  v_reward := public.weekly_reward(v_rank::integer);
  select * into v_profile from public.profiles where id = v_user for update;
  if v_reward is null or v_week = any (v_profile.claimed_weekly_rewards) then
    return public._economy_state(v_user) || jsonb_build_object('reward', null);
  end if;

  update public.profiles set
    sparks = sparks + (v_reward ->> 'sparks')::integer,
    diamonds = diamonds + (v_reward ->> 'diamonds')::integer,
    claimed_weekly_rewards = array_append(claimed_weekly_rewards, v_week)
  where id = v_user;

  return public._economy_state(v_user) || jsonb_build_object('reward', v_reward || jsonb_build_object('rank', v_rank, 'weekStart', v_week));
end;
$$;

revoke all on function public._week_start(timestamptz) from public, anon, authenticated;
revoke all on function public._nickname_for(uuid) from public, anon, authenticated;
revoke all on function public._add_weekly_points(uuid, integer) from public, anon, authenticated;
revoke all on function public._is_level_reachable(uuid, text) from public, anon, authenticated;
revoke all on function public._weekly_ranking(date) from public, anon, authenticated;
revoke all on function public.claim_weekly_reward() from public, anon;
grant execute on function public.weekly_leaderboard() to anon, authenticated;
grant execute on function public.claim_weekly_reward() to authenticated;
revoke all on function public.claim_daily_gift(date) from public, anon;
grant execute on function public.claim_daily_gift(date) to authenticated;
