-- Prism nicknames: players build their public name from two safe word lists,
-- and the weekly board shows nickname, Pal and title.
-- Run in Supabase → SQL Editor AFTER pals.sql. Safe to run more than once.
-- The word lists must match src/game/nicknames.js (a test checks).

alter table public.profiles
  add column if not exists nickname_word text,
  add column if not exists nickname_name text;

-- Players set their nickname only through set_nickname().
revoke update on public.profiles from authenticated;
grant update (display_name, beam_theme) on public.profiles to authenticated;

create or replace function public.set_nickname(p_word text, p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := public._require_user();
begin
  if not (p_word = any (array['Brave', 'Bright', 'Bubbly', 'Calm', 'Clever', 'Cozy', 'Dreamy', 'Fluffy', 'Gentle', 'Giggly', 'Golden', 'Happy', 'Jolly', 'Lucky', 'Mellow', 'Mighty', 'Nimble', 'Quiet', 'Rosy', 'Silly', 'Sleepy', 'Sparkly', 'Sunny', 'Swift', 'Tiny', 'Twinkly', 'Wise', 'Witty', 'Zippy', 'Shiny'])) or not (p_name = any (array['Fox', 'Turtle', 'Axolotl', 'Kitten', 'Owl', 'Puppy', 'Chick', 'Bear', 'Bunny', 'Piglet', 'Hedgehog', 'Gem', 'Frog', 'Lamb', 'Mouse', 'Panda', 'Otter', 'Bee', 'Koala', 'Seal', 'Sprite', 'Raccoon', 'Penguin', 'Deer', 'Snail', 'Octopus', 'Cloud', 'Star', 'Unicorn', 'Dragon', 'Firefly', 'Comet', 'Rainbow', 'Pixel', 'Wizard', 'Explorer'])) then
    raise exception using message = 'Please pick your nickname from the lists.';
  end if;
  update public.profiles set nickname_word = p_word, nickname_name = p_name where id = v_user;
  return public._economy_state(v_user) || jsonb_build_object('nickname', public._nickname_for(v_user));
end;
$$;

-- "Word Name 42": the player's chosen words if set, otherwise generated; the number never changes.
create or replace function public._nickname_for(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
           p.nickname_word,
           (array['Sunny', 'Brave', 'Clever', 'Gentle', 'Happy', 'Lucky', 'Mellow', 'Nimble', 'Quiet', 'Rosy', 'Swift', 'Witty'])
             [1 + abs(('x' || substr(md5(p_user::text), 1, 7))::bit(28)::integer) % 12])
    || ' '
    || coalesce(
         p.nickname_name,
         public._pal_animal(p.pal_id),
         (array['Otter', 'Fox', 'Panda', 'Robin', 'Koala', 'Finch', 'Hedgehog', 'Lynx', 'Puffin', 'Badger', 'Wren', 'Seal'])
           [1 + abs(('x' || substr(md5(p_user::text), 8, 7))::bit(28)::integer) % 12])
    || ' '
    || (10 + abs(('x' || substr(md5(p_user::text), 15, 7))::bit(28)::integer) % 90)::text
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
    select r.*, (select coalesce(sum(g.stars), 0) from public.progress g where g.user_id = r.user_id) as total_stars, p.pal_id, coalesce((p.pals -> p.pal_id ->> 'xp')::integer, 0) as pal_xp, p.pal_accessory
    from public._weekly_ranking(public._week_start()) r
    join public.profiles p on p.id = r.user_id
  )
  select jsonb_build_object(
    'weekStart', public._week_start(),
    'endsAt', (public._week_start() + 7)::timestamp at time zone 'utc',
    'top', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank', r.rank, 'nickname', public._nickname_for(r.user_id), 'score', r.score, 'isMe', r.user_id = auth.uid(),
        'pal', r.pal_id, 'palXp', r.pal_xp, 'accessory', r.pal_accessory, 'stars', r.total_stars)
        order by r.rank)
      from ranking r where r.rank <= 50), '[]'::jsonb),
    'me', (
      select jsonb_build_object('rank', r.rank, 'score', r.score, 'nickname', public._nickname_for(r.user_id),
        'pal', r.pal_id, 'palXp', r.pal_xp, 'accessory', r.pal_accessory, 'stars', r.total_stars)
      from ranking r where r.user_id = auth.uid()),
    'myNickname', case when auth.uid() is null then null else public._nickname_for(auth.uid()) end
  );
$$;

revoke all on function public._nickname_for(uuid) from public, anon, authenticated;
revoke all on function public.set_nickname(text, text) from public, anon;
grant execute on function public.set_nickname(text, text) to authenticated;
grant execute on function public.weekly_leaderboard() to anon, authenticated;
