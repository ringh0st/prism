-- Lumipals: player cards. Tap someone on the Top board to see their partner Pal and a few game stats.
-- Players are looked up by their place on this week's board (no account ids leave the server), and only
-- game facts are shared: nickname, Pal, title stars, levels, worlds and how many Pals they've collected.
-- Run in Supabase → SQL Editor AFTER quests.sql. Safe to run more than once.

create or replace function public.player_card(p_rank integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select r.user_id, r.score, r.rank
    from public._weekly_ranking(public._week_start()) r
    where r.rank = p_rank and p_rank between 1 and 50
  ),
  solved as (
    select g.level_id, g.stars, (regexp_match(g.level_id, '^w([0-9]+)-'))[1]::integer as world
    from public.progress g join ranked r on g.user_id = r.user_id
    where g.level_id ~ '^w[0-9]+-[0-9]+$' and g.stars > 0
  )
  select jsonb_build_object(
    'rank', r.rank,
    'nickname', public._nickname_for(r.user_id),
    'score', r.score,
    'isMe', r.user_id = auth.uid(),
    'pal', p.pal_id,
    'palStage', coalesce((p.pals -> p.pal_id ->> 'stage')::integer, 0),
    'wearing', to_jsonb(p.pal_wearing),
    'palsCount', (select count(*) from jsonb_object_keys(coalesce(p.pals, '{}'::jsonb))),
    'stars', (select coalesce(sum(stars), 0) from solved),
    'levelsSolved', (select count(*) from solved),
    'worldsFinished', (select count(*) from (select world from solved group by world having count(*) >= 20) w)
  )
  from ranked r join public.profiles p on p.id = r.user_id;
$$;

revoke all on function public.player_card(integer) from public;
grant execute on function public.player_card(integer) to anon, authenticated;
