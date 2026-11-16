import { buildCellIndex, cellsOnBeams, isRotatable, rotationGroup, traceBeams } from './beam.js';
import { darknessStart, darknessStep, hasDarkness } from './darkness.js';
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
export const MAX_RANDOM_SOLVE_RATE = 0.08;

/**
 * Can a player who doesn't plan solve it? Research on puzzle difficulty: what makes a puzzle feel hard is how many
 * moves go against the obvious greedy move, not how long the solution is. This player taps, each move, whatever
 * lights the most gems right now (then the most of the board), never lighting a shadow crystal, within the level's
 * move limit and the darkness's rules. A level it solves needs no thinking, so the level builder throws it away.
 */
export function solvesWithoutPlanning(level, moveLimit = moveLimitFor(level.par, level.difficulty)) {
  const cells = buildCellIndex(level);
  const dark = hasDarkness(level);
  const taps = level.tiles
    .map((tile, i) => i)
    .filter((i) => isRotatable(level.tiles[i]) && (!level.tiles[i].link || level.tiles.findIndex((t) => t.link === level.tiles[i].link) === i));
  const orients = level.tiles.map((tile) => tile.orient ?? 0);
  let state = dark ? darknessStart(level, orients, cells) : { trace: traceBeams(level, orients, cells), lost: null };
  for (let move = 1; move <= moveLimit && !state.trace.isSolved; move++) {
    let best = null;
    for (const tap of taps) {
      const turned = orients.slice();
      for (const i of rotationGroup(level.tiles, tap)) turned[i] ^= 1;
      const next = dark ? darknessStep(level, state, turned, move, cells) : { trace: traceBeams(level, turned, cells), lost: null };
      if (next.lost) continue;
      const { litGems, litShades, segments } = next.trace;
      const score = litGems.size * 1000 - litShades.size * 2000 + cellsOnBeams(segments, level.width, level.height).size;
      if (!best || score > best.score) best = { tap, score, next };
    }
    if (!best) return false;
    for (const i of rotationGroup(level.tiles, best.tap)) orients[i] ^= 1;
    state = best.next;
  }
  return state.trace.isSolved;
}
