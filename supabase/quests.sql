-- Lumipals: Pal quests. Each week the partner Pal asks for three small goals; each pays sparks once.
-- Progress is counted from the player's own level results this week (one row per level).
-- Run in Supabase → SQL Editor AFTER events.sql. Safe to run more than once.
-- Quests must match QUEST_PAIRS and questsForWeek in src/game/quests.js (a test checks).

create table if not exists public.pal_quest_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  week date not null,
  quest text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, week, quest)
);

alter table public.pal_quest_claims enable row level security;

-- Weeks start on Monday (UTC).
create or replace function public._quest_week()
returns date
language sql
stable
as $$
  select date_trunc('week', now() at time zone 'utc')::date;
$$;

-- kind, target and sparks of each quest.
create or replace function public._quest(p_quest text)
returns jsonb
language sql
immutable
as $$
  select case p_quest
    when 'solve5' then '{"kind": "solved", "target": 5, "sparks": 25}'::jsonb
    when 'solve10' then '{"kind": "solved", "target": 10, "sparks": 50}'::jsonb
    when 'perfect3' then '{"kind": "perfect", "target": 3, "sparks": 30}'::jsonb
    when 'perfect6' then '{"kind": "perfect", "target": 6, "sparks": 60}'::jsonb
    when 'hard1' then '{"kind": "hard", "target": 1, "sparks": 30}'::jsonb
    when 'hard3' then '{"kind": "hard", "target": 3, "sparks": 60}'::jsonb
  end;
$$;

-- This week's three quests: one of each kind, the bigger or smaller one taking turns.
create or replace function public._quests_for_week(p_week date)
returns text[]
language sql
immutable
as $$
  with n as (select ((p_week - date '2026-01-05') / 7) as n)
  select array[
    case when ((n % 2) + 2) % 2 = 0 then 'solve5' else 'solve10' end,
    case when (((n + 1) % 2) + 2) % 2 = 0 then 'perfect3' else 'perfect6' end,
    case when ((floor(n / 2.0)::integer % 2) + 2) % 2 = 0 then 'hard1' else 'hard3' end
  ] from n;
$$;

-- This week's counts from the player's level results, and which quests were claimed.
create or replace function public._my_quests(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with week_results as (
    select level_id, stars from public.progress
    where user_id = p_user and completed_at >= public._quest_week() and level_id ~ '^w[0-9]+-[0-9]+$'
  )
  select jsonb_build_object(
    'week', public._quest_week(),
    'solved', coalesce((select jsonb_agg(level_id) from week_results), '[]'::jsonb),
    'perfect', coalesce((select jsonb_agg(level_id) from week_results where stars = 3), '[]'::jsonb),
    'hard', coalesce((select jsonb_agg(level_id) from week_results where (regexp_match(level_id, '-([0-9]+)$'))[1]::integer % 5 = 0), '[]'::jsonb),
    'claimed', coalesce((select jsonb_agg(quest) from public.pal_quest_claims where user_id = p_user and week = public._quest_week()), '[]'::jsonb)
  );
$$;

create or replace function public.my_quests()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('quests', public._my_quests(public._require_user()));
$$;

create or replace function public.claim_pal_quest(p_quest text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_quest jsonb := public._quest(p_quest);
  v_log jsonb;
begin
  if v_quest is null or not (p_quest = any (public._quests_for_week(public._quest_week()))) then
    raise exception using message = 'That quest isn’t on this week’s list.';
  end if;
  v_log := public._my_quests(v_user);
  if jsonb_array_length(v_log -> (v_quest ->> 'kind')) < (v_quest ->> 'target')::integer then
    raise exception using message = 'This quest isn’t finished yet.';
  end if;

  insert into public.pal_quest_claims (user_id, week, quest) values (v_user, public._quest_week(), p_quest)
  on conflict do nothing;
  if not found then
    raise exception using message = 'You already collected this one.';
  end if;

  update public.profiles set sparks = sparks + (v_quest ->> 'sparks')::integer where id = v_user;
  return public._economy_state(v_user) || jsonb_build_object('quests', public._my_quests(v_user));
end;
$$;

revoke all on function public._my_quests(uuid) from public, anon, authenticated;
revoke all on function public.my_quests() from public, anon;
revoke all on function public.claim_pal_quest(text) from public, anon;
grant execute on function public.my_quests() to authenticated;
grant execute on function public.claim_pal_quest(text) to authenticated;
