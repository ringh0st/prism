/*
 * Reading the anonymous play counts (supabase/play_stats.sql): how often a level is won per attempt,
 * and which levels are "walls" where many players run out of moves or give up.
 */
export const WALL_MIN_STARTS = 10;
export const WALL_WIN_RATE = 0.5;

/** Share of attempts that ended in a win (null with no attempts). */
export const winRateOf = (counts) => (counts?.starts ? Math.min(1, counts.wins / counts.starts) : null);

/** Levels with enough attempts and a low win rate, hardest first. @returns [{ levelId, ...counts, winRate }] */
export function findWalls(byLevel, { minStarts = WALL_MIN_STARTS, maxWinRate = WALL_WIN_RATE } = {}) {
  return [...byLevel]
    .map(([levelId, counts]) => ({ levelId, ...counts, winRate: winRateOf(counts) }))
    .filter((entry) => entry.starts >= minStarts && entry.winRate < maxWinRate)
    .sort((a, b) => a.winRate - b.winRate);
}
