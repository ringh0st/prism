-- Lumipals: bonus goals. Every built-in main-road level has one optional bonus goal (src/game/bonusGoals.js); meeting
-- it the first time pays a few sparks, once per level. The game works out the goal and whether it was met (like the
-- moves sent to record_level_result); the server pays only for solved built-in levels, and only once each.
-- Run in Supabase → SQL Editor AFTER economy.sql. Safe to run more than once.
-- The sparks and the level rule must match BONUS_GOAL_SPARKS and hasBonusGoal in src/game/bonusGoals.js (a test checks).

create table if not exists public.bonus_goal_claims (
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, level_id)
);

alter table public.bonus_goal_claims enable row level security;

create or replace function public._bonus_goal_sparks()
returns integer
language sql
immutable
as $$
  select 10;
$$;

-- Bonus goals met on these levels (one new level after a win, or every level met on this device when syncing):
-- pays the new ones and returns the wallet plus every level whose bonus goal the account has met.
create or replace function public.claim_bonus_goals(p_levels text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_new integer;
begin
  if coalesce(cardinality(p_levels), 0) > 1000 then
    raise exception using message = 'Invalid progress.';
  end if;

  with fresh as (
    insert into public.bonus_goal_claims (user_id, level_id)
    select distinct v_user, wanted.id
    from unnest(coalesce(p_levels, '{}'::text[])) as wanted (id)
    where wanted.id ~ '^w[0-9]+-[0-9]+$'
      and wanted.id !~ '^w1-0[1-3]$'
      and exists (select 1 from public.progress p where p.user_id = v_user and p.level_id = wanted.id and p.stars > 0)
    on conflict do nothing
    returning 1
  )
  select count(*) into v_new from fresh;

  if v_new > 0 then
    update public.profiles set sparks = sparks + v_new * public._bonus_goal_sparks() where id = v_user;
  end if;
  return public._economy_state(v_user) || jsonb_build_object(
    'sparksEarned', v_new * public._bonus_goal_sparks(),
    'bonusGoals', coalesce((select jsonb_agg(c.level_id order by c.level_id) from public.bonus_goal_claims c where c.user_id = v_user), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.claim_bonus_goals(text[]) from public, anon;
grant execute on function public.claim_bonus_goals(text[]) to authenticated;
