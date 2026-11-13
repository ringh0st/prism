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

/** 3 stars at par, 2 stars within a small margin, otherwise 1. Helpers can lower the cap (see catalog.js). */
export function starsForMoves(moves, par) {
  const margin = Math.max(2, Math.ceil(par * 0.5));
  return moves <= par ? 3 : moves <= par + margin ? 2 : 1;
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
