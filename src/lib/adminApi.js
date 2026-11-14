import { supabase } from './supabase.js';
import { levelFromRow, rowFromLevel } from '../state/LevelsContext.jsx';

const throwIfError = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const PAGE_SIZE = 1000;

/** Every row of a query, page by page (the API returns at most 1000 rows per request). */
async function allRows(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = throwIfError(await buildQuery().range(from, from + PAGE_SIZE - 1));
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

/** Every level in the database, including unpublished drafts (admins only, enforced by RLS). */
export async function fetchAllLevels() {
  const rows = throwIfError(
    await supabase
      .from('levels')
      .select('id, world, level_index, difficulty, name, par, data, is_published, updated_at')
      .order('world')
      .order('level_index'),
  );
  return rows.map((row) => ({ ...levelFromRow(row), updatedAt: row.updated_at }));
}

export async function saveLevel(level, { isPublished }) {
  const { data: session } = await supabase.auth.getSession();
  const row = { ...rowFromLevel(level, { isPublished }), updated_by: session.session?.user.id ?? null };
  throwIfError(await supabase.from('levels').upsert(row, { onConflict: 'id' }));
}

export async function deleteLevel(id) {
  throwIfError(await supabase.from('levels').delete().eq('id', id));
}

export async function deleteLevels(ids) {
  throwIfError(await supabase.from('levels').delete().in('id', ids));
}

/** Completion stats per level, aggregated from everyone's progress (admins can read all rows). */
export async function fetchLevelStats() {
  const rows = await allRows(() => supabase.from('progress').select('user_id, level_id, stars, best_moves').order('user_id').order('level_id'));
  const players = new Set(rows.map((row) => row.user_id));
  const byLevel = new Map();
  for (const row of rows) {
    const entry = byLevel.get(row.level_id) ?? { completions: 0, starTotal: 0, perfect: 0, movesTotal: 0 };
    entry.completions++;
    entry.starTotal += row.stars;
    entry.movesTotal += row.best_moves ?? 0;
    if (row.stars === 3) entry.perfect++;
    byLevel.set(row.level_id, entry);
  }
  return { playerCount: players.size, byLevel };
}

/** Anonymous play counts per level over the last `days` days (guests included): starts, wins, out of moves, quits. */
export async function fetchPlayCounts(days = 30) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const rows = await allRows(() =>
    supabase.from('level_plays').select('level_id, starts, wins, out_of_moves, quits').gte('day', since).order('level_id').order('day'),
  );
  const byLevel = new Map();
  for (const row of rows) {
    const entry = byLevel.get(row.level_id) ?? { starts: 0, wins: 0, outOfMoves: 0, quits: 0 };
    entry.starts += row.starts;
    entry.wins += row.wins;
    entry.outOfMoves += row.out_of_moves;
    entry.quits += row.quits;
    byLevel.set(row.level_id, entry);
  }
  return byLevel;
}
