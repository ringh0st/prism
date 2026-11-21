-- Do players come back? Anonymous counts per first day: how many new players started that day, and how many of
-- them came back the next day, later in their first week, or after a week. No account, device or personal data is
-- stored, only the totals, so guests count too. Players can only add to the counts through record_visit; only
-- admins read them. Run after schema.sql (uses public.is_admin()). Safe to run more than once.

create table if not exists public.player_returns (
  first_day date primary key,
  new_players integer not null default 0,
  next_day integer not null default 0,
  same_week integer not null default 0,
  after_week integer not null default 0
);

alter table public.player_returns enable row level security;

drop policy if exists "Admins read player returns" on public.player_returns;
create policy "Admins read player returns" on public.player_returns for select using (public.is_admin());

revoke insert, update, delete on public.player_returns from anon, authenticated;

-- p_kind: 'new' (first time ever), 'next_day', 'same_week' (days 2-7) or 'after_week'. Must match src/game/visits.js.
create or replace function public.record_visit(p_first_day date, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
begin
  if p_kind is null or p_kind not in ('new', 'next_day', 'same_week', 'after_week') then
    raise exception 'Unknown kind';
  end if;
  -- A player's own clock may be a day off from UTC; anything older than 90 days isn't counted.
  if p_first_day is null or p_first_day > v_today + 1 or p_first_day < v_today - 90 then
    raise exception 'Unknown day';
  end if;
  if p_kind = 'new' and p_first_day < v_today - 1 then
    raise exception 'Unknown day';
  end if;
  insert into public.player_returns as r (first_day, new_players, next_day, same_week, after_week)
  values (p_first_day, (p_kind = 'new')::int, (p_kind = 'next_day')::int, (p_kind = 'same_week')::int, (p_kind = 'after_week')::int)
  on conflict (first_day) do update set
    new_players = r.new_players + excluded.new_players,
    next_day = r.next_day + excluded.next_day,
    same_week = r.same_week + excluded.same_week,
    after_week = r.after_week + excluded.after_week;
end;
$$;

revoke all on function public.record_visit(date, text) from public;
grant execute on function public.record_visit(date, text) to anon, authenticated;
