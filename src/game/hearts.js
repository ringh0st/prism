import { DIFFICULTY } from './constants.js';

/*
 * Hearts: the challenge of a try on the main road (from World 2). A wrong turn, a tap that leaves the light further
 * from the solution (the fewest taps left goes up), breaks one; when they're gone the try is over. With hearts the
 * move limit loosens (`heartsMoveRoom`) so mistakes, not counting, end a try; stars still count taps as always.
 * Nothing to wait for: a restart brings them all back. An Undo of a wrong turn mends its heart.
 */

/** Hearts start in this world (World 1 teaches without them). */
export const HEARTS_FROM_WORLD = 2;
/** Hearts per try by difficulty. */
export const HEARTS_BY_DIFFICULTY = { [DIFFICULTY.NORMAL]: 2, [DIFFICULTY.HARD]: 2, [DIFFICULTY.EXTRA]: 1 };
/** Worlds 2–3 give one more while players learn them. */
export const GENTLE_HEART_WORLDS = 3;

/** Hearts for a try at this level (0 when the level has none). */
export function heartsFor(level) {
  if (!Number.isInteger(level.world) || level.world < HEARTS_FROM_WORLD) return 0;
  return (HEARTS_BY_DIFFICULTY[level.difficulty] ?? HEARTS_BY_DIFFICULTY[DIFFICULTY.NORMAL]) + (level.world <= GENTLE_HEART_WORLDS ? 1 : 0);
}

/** Extra moves on top of the usual limit while hearts are on: each wrong turn costs two (the turn and its fix). */
export const heartsMoveRoom = (hearts) => hearts * 2;

/** A tap was a wrong turn when the fewest taps still needed went up. */
export const isWrongTurn = (tapsLeftBefore, tapsLeftAfter) =>
  Number.isFinite(tapsLeftBefore) && Number.isFinite(tapsLeftAfter) && tapsLeftAfter > tapsLeftBefore;
