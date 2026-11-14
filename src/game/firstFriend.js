import { STARTER_PALS } from './pals.js';

/*
 * The first Pal arrives as a surprise reward after a few solved levels, not as a choice up front, so
 * new players see a puzzle game first (and never think it's a pet game).
 */
export const FRIEND_AFTER_LEVELS = 5;

/** Solved built-in or other levels (at least one star). */
export const solvedCount = (levels) => Object.values(levels).filter((entry) => entry.stars > 0).length;

/** True when a player without a Pal has solved enough levels to meet one. */
export const isFriendDue = (progress, levels = progress.levels) => !progress.pal.id && solvedCount(levels) >= FRIEND_AFTER_LEVELS;

/** Which starter turns up: the same one for this player every time (from their shop seed). */
export const firstFriendFor = (progress) => STARTER_PALS[(progress.shopSeed ?? 0) % STARTER_PALS.length];
