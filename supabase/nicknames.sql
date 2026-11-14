-- Prism nicknames: players type their own Top-board name (checked here) or keep a generated one,
-- and the weekly board shows nickname, Pal, form and title.
-- Run in Supabase → SQL Editor AFTER pals.sql. Safe to run more than once.

alter table public.profiles
  add column if not exists nickname text;

-- Players set their nickname only through set_nickname().
revoke update on public.profiles from authenticated;
grant update (display_name, beam_theme) on public.profiles to authenticated;

-- Must match nicknameProblem() in src/game/nicknames.js.
create or replace function public.set_nickname(p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
  v_nickname text := regexp_replace(btrim(coalesce(p_nickname, '')), '\s+', ' ', 'g');
  v_plain text;
begin
  if char_length(v_nickname) < 3 or char_length(v_nickname) > 16 then
    raise exception using message = 'Nicknames are 3 to 16 characters.';
  end if;
  if v_nickname !~ '^[[:alpha:][:digit:] ]+$' then
    raise exception using message = 'Letters, numbers and spaces only.';
  end if;
  if v_nickname ~ '[0-9]{5,}' then
    raise exception using message = 'Too many numbers in a row.';
  end if;
  v_plain := translate(regexp_replace(lower(v_nickname), '[[:space:]_.-]', '', 'g'), '0134573@$', 'oieasteas');
  if exists (select 1 from unnest(array['fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'cock', 'penis', 'vagina', 'boob', 'porn', 'sex', 'slut', 'whore', 'nigg', 'fag', 'nazi', 'hitler', 'rape', 'kill', 'piss', 'bastard', 'admin', 'moderator']) as part where position(part in v_plain) > 0) then
    raise exception using message = 'Let’s pick a friendlier name.';
  end if;
  update public.profiles set nickname = v_nickname where id = v_user;
  return public._economy_state(v_user) || jsonb_build_object('nickname', v_nickname);
end;
$$;

-- The player's own nickname if set, otherwise a generated one like "Sunny Fox 42".
create or replace function public._nickname_for(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    p.nickname,
    (array['Sunny', 'Brave', 'Clever', 'Gentle', 'Happy', 'Lucky', 'Mellow', 'Nimble', 'Quiet', 'Rosy', 'Swift', 'Witty'])
      [1 + abs(('x' || substr(md5(p_user::text), 1, 7))::bit(28)::integer) % 12]
    || ' '
    || coalesce(
         public._pal_animal(p.pal_id),
         (array['Otter', 'Fox', 'Panda', 'Robin', 'Koala', 'Finch', 'Hedgehog', 'Lynx', 'Puffin', 'Badger', 'Wren', 'Seal'])
           [1 + abs(('x' || substr(md5(p_user::text), 8, 7))::bit(28)::integer) % 12])
    || ' '
    || (10 + abs(('x' || substr(md5(p_user::text), 15, 7))::bit(28)::integer) % 90)::text)
  from public.profiles p
  where p.id = p_user;
$$;

-- The weekly board shows each player's nickname, Pal and total stars (the game turns stars into a title).
create or replace function public.weekly_leaderboard()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ranking as (
    select r.*, (select coalesce(sum(g.stars), 0) from public.progress g where g.user_id = r.user_id) as total_stars, p.pal_id, coalesce((p.pals -> p.pal_id ->> 'stage')::integer, 0) as pal_stage, p.pal_wearing
    from public._weekly_ranking(public._week_start()) r
    join public.profiles p on p.id = r.user_id
  )
  select jsonb_build_object(
    'weekStart', public._week_start(),
    'endsAt', (public._week_start() + 7)::timestamp at time zone 'utc',
    'top', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank', r.rank, 'nickname', public._nickname_for(r.user_id), 'score', r.score, 'isMe', r.user_id = auth.uid(),
        'pal', r.pal_id, 'palStage', r.pal_stage, 'wearing', to_jsonb(r.pal_wearing), 'stars', r.total_stars)
        order by r.rank)
      from ranking r where r.rank <= 50), '[]'::jsonb),
    'me', (
      select jsonb_build_object('rank', r.rank, 'score', r.score, 'nickname', public._nickname_for(r.user_id),
        'pal', r.pal_id, 'palStage', r.pal_stage, 'wearing', to_jsonb(r.pal_wearing), 'stars', r.total_stars)
      from ranking r where r.user_id = auth.uid()),
    'myNickname', case when auth.uid() is null then null else public._nickname_for(auth.uid()) end
  );
$$;

revoke all on function public._nickname_for(uuid) from public, anon, authenticated;
drop function if exists public.set_nickname(text, text);
revoke all on function public.set_nickname(text) from public, anon;
grant execute on function public.set_nickname(text) to authenticated;
grant execute on function public.weekly_leaderboard() to anon, authenticated;
