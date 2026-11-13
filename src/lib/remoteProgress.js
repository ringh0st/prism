import { supabase } from './supabase.js';
import { createEmptyProgress } from '../game/progress.js';

/** Load a signed-in player's saved progress from the database. */
export async function fetchRemoteProgress(userId) {
  const [{ data: profile, error: profileError }, { data: rows, error: rowsError }] = await Promise.all([
    supabase.from('profiles').select('sparks, daily_streak, last_daily_date, beam_theme').eq('id', userId).maybeSingle(),
    supabase.from('progress').select('level_id, stars, best_moves').eq('user_id', userId),
  ]);
  if (profileError) throw profileError;
  if (rowsError) throw rowsError;

  const empty = createEmptyProgress();
  return {
    levels: Object.fromEntries((rows ?? []).map((row) => [row.level_id, { stars: row.stars, bestMoves: row.best_moves ?? 0 }])),
    sparks: profile?.sparks ?? empty.sparks,
    daily: { streak: profile?.daily_streak ?? 0, lastDate: profile?.last_daily_date ?? null },
    beamTheme: profile?.beam_theme ?? empty.beamTheme,
  };
}

/** Save progress. Pass levelIds to only send the levels that changed. */
export async function saveRemoteProgress(userId, progress, levelIds = Object.keys(progress.levels)) {
  const rows = levelIds
    .filter((id) => progress.levels[id])
    .map((id) => ({
      user_id: userId,
      level_id: id,
      stars: progress.levels[id].stars,
      best_moves: progress.levels[id].bestMoves,
    }));
  const requests = [
    supabase
      .from('profiles')
      .update({
        sparks: progress.sparks,
        daily_streak: progress.daily.streak,
        last_daily_date: progress.daily.lastDate,
        beam_theme: progress.beamTheme,
      })
      .eq('id', userId),
  ];
  if (rows.length) requests.push(supabase.from('progress').upsert(rows, { onConflict: 'user_id,level_id' }));
  const results = await Promise.all(requests);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
}
