-- Anonymous play counts per built-in level and day: how often a level is started, won, runs out of
-- moves, or is left unfinished. No account, device or personal data is stored, only the totals, so
-- guests count too. Players can only add to the counts through record_level_play; only admins read them.
-- Run after schema.sql (uses public.is_admin()).

create table if not exists public.level_plays (
  level_id text not null,
  day date not null,
  starts integer not null default 0,
  wins integer not null default 0,
  out_of_moves integer not null default 0,
  quits integer not null default 0,
  primary key (level_id, day)
);

alter table public.level_plays enable row level security;

drop policy if exists "Admins read play counts" on public.level_plays;
create policy "Admins read play counts" on public.level_plays for select using (public.is_admin());

revoke insert, update, delete on public.level_plays from anon, authenticated;

create or replace function public.record_level_play(p_level_id text, p_event text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day date := (now() at time zone 'utc')::date;
begin
  if p_level_id is null or p_level_id !~ '^w[0-9]{1,2}-[0-9]{2}$' then
    raise exception 'Unknown level';
  end if;
  if p_event is null or p_event not in ('start', 'win', 'out_of_moves', 'quit') then
    raise exception 'Unknown event';
  end if;
  insert into public.level_plays as plays (level_id, day, starts, wins, out_of_moves, quits)
  values (
    p_level_id,
    v_day,
    (p_event = 'start')::int,
    (p_event = 'win')::int,
    (p_event = 'out_of_moves')::int,
    (p_event = 'quit')::int
  )
  on conflict (level_id, day) do update set
    starts = plays.starts + excluded.starts,
    wins = plays.wins + excluded.wins,
    out_of_moves = plays.out_of_moves + excluded.out_of_moves,
    quits = plays.quits + excluded.quits;
end;
$$;

revoke all on function public.record_level_play(text, text) from public;
grant execute on function public.record_level_play(text, text) to anon, authenticated;
