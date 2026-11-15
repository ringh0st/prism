/*
 * The win streak: levels won in a row on the main road. While it lasts, every level starts with free boosters
 * (nothing is taken from the inventory, nothing is bought). Running out of moves ends it; leaving a level,
 * a restart or a Skip doesn't. Counted on this device.
 */

/** Wins in a row needed for each free booster. */
export const STREAK_BONUSES = [
  { wins: 3, booster: 'spareMoves' },
  { wins: 6, booster: 'steadyHand' },
];

/** The streak after a level: a win adds one, running out of moves ends it. */
export const nextWinStreak = (streak, { isWin }) => (isWin ? streak + 1 : 0);

/** The free boosters this streak gives the next level. */
export const streakBoosters = (streak) => STREAK_BONUSES.filter((bonus) => streak >= bonus.wins).map((bonus) => bonus.booster);

/** Wins still needed for the next free booster, or null when every bonus is on. */
export function winsToNextBonus(streak) {
  const next = STREAK_BONUSES.find((bonus) => streak < bonus.wins);
  return next ? next.wins - streak : null;
}
