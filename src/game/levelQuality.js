import { isRotatable, rotationGroup, traceBeams } from './beam.js';
import { moveLimitFor } from './scoring.js';
import { createRandom } from '../lib/random.js';

/*
 * Is a level a real puzzle? Playtest research: boards that random tapping solves feel like busywork,
 * not a puzzle with a "catch". The level builder uses this to throw such boards away.
 */
const TRIALS = 300;

/** Share of random tappers (each tapping random turnable pieces until out of moves) who solve the level. */
export function randomSolveRate(level, { moveLimit = moveLimitFor(level.par, level.difficulty), seed = 'quality' } = {}) {
  const turnable = level.tiles.map((tile, i) => i).filter((i) => isRotatable(level.tiles[i]));
  if (turnable.length === 0) return 1;
  const random = createRandom(`${seed}-${level.width}x${level.height}-${level.tiles.length}`);
  let solved = 0;
  for (let trial = 0; trial < TRIALS; trial++) {
    const orients = level.tiles.map((tile) => tile.orient ?? 0);
    for (let move = 0; move < moveLimit; move++) {
      for (const j of rotationGroup(level.tiles, random.pick(turnable))) orients[j] ^= 1;
      if (traceBeams(level, orients).isSolved) {
        solved++;
        break;
      }
    }
  }
  return solved / TRIALS;
}

/** Highest random-solve rate a regular level may have (quick "rest" flavors and tutorials are exempt). */
export const MAX_RANDOM_SOLVE_RATE = 0.15;
