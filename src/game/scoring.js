import { DIFFICULTY } from './constants.js';

export const MAX_STARS = 3;
export const STARTING_SPARKS = 30;
export const SPARKS_PER_STAR = 5;
export const DAILY_BASE_SPARKS = 20;

const DIFFICULTY_MULTIPLIER = {
  [DIFFICULTY.NORMAL]: 1,
  [DIFFICULTY.HARD]: 2,
  [DIFFICULTY.EXTRA]: 3,
};

/**
 * Moves allowed before the level is lost. Spare moves shrink on harder levels (tightened after playtesters
 * found the game too easy). Normal: par + a third (min 1) · Hard: par + 25% (min 1) · Extra Hard: par + 15% (min 1).
 */
export function moveLimitFor(par, difficulty = DIFFICULTY.NORMAL) {
  if (difficulty === DIFFICULTY.EXTRA) return par + Math.max(1, Math.ceil(par * 0.15));
  if (difficulty === DIFFICULTY.HARD) return par + Math.max(1, Math.ceil(par * 0.25));
  return par + Math.max(1, Math.ceil(par / 3));
}

/**
 * 3 stars at par, 2 stars in the first half of the spare moves, 1 star after that.
 * Helpers can lower the cap further (see catalog.js).
 */
export function starsForMoves(moves, par, difficulty = DIFFICULTY.NORMAL) {
  const twoStarLimit = par + Math.ceil((moveLimitFor(par, difficulty) - par) / 2);
  return moves <= par ? 3 : moves <= twoStarLimit ? 2 : 1;
}

/** Sparks for improving a level's best result (only the newly earned stars pay out). */
export function sparksForNewStars(previousStars, newStars, difficulty = DIFFICULTY.NORMAL) {
  const gained = Math.max(0, newStars - previousStars);
  return gained * SPARKS_PER_STAR * (DIFFICULTY_MULTIPLIER[difficulty] ?? 1);
}

/** Daily puzzle reward grows with the streak (capped at 7 days). */
export function sparksForDaily(streak) {
  return DAILY_BASE_SPARKS + Math.min(streak, 7) * 5;
}
