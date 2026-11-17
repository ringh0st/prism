import { buildCellIndex, cellsOnBeams, isRotatable, rotationGroup, traceBeams } from './beam.js';
import { analyzeLevel } from './solver.js';
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
export const MAX_RANDOM_SOLVE_RATE = 0.05;

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

/**
 * How tricky a level is (owner feedback: hard should mean tricky, not cluttered). Higher is trickier:
 * - traps: taps that look like progress right now (they light more Lumis, or more of the board) but are in no best
 *   solution, so the obvious move is wrong;
 * - the greedy player (solvesWithoutPlanning) getting stuck;
 * - how rarely random tapping solves it;
 * - a little for the taps needed, and a penalty for every turning piece beyond the taps (clutter).
 * @returns { score, traps, greedyFails, randomRate, idle } (idle: turning pieces no best solution touches)
 */
export function trickScore(level, analysis = analyzeLevel(level)) {
  const cells = buildCellIndex(level);
  const start = level.tiles.map((tile) => tile.orient ?? 0);
  const before = traceBeams(level, start, cells);
  const best = analysis.solutions.filter((solution) => popcount(solution.mask) === analysis.par);
  const inBest = (g) => best.some((solution) => (solution.mask >> g) & 1);
  let traps = 0;
  analysis.groups.forEach((group, g) => {
    if (inBest(g)) return;
    const turned = start.slice();
    for (const i of group) turned[i] ^= 1;
    const after = traceBeams(level, turned, cells);
    const lightsMore = after.litGems.size > before.litGems.size;
    const reachesFurther = cellsOnBeams(after.segments, level.width, level.height).size > cellsOnBeams(before.segments, level.width, level.height).size;
    if ((lightsMore || reachesFurther) && after.litShades.size === 0) traps++;
  });
  const idle = analysis.groups.filter((_, g) => !inBest(g)).length;
  const greedyFails = !solvesWithoutPlanning(level);
  const randomRate = randomSolveRate(level);
  const score = traps * 4 + (greedyFails ? 6 : 0) + (1 - randomRate) * 12 + analysis.par * 0.6 - Math.max(0, idle - traps - 1) * 1.2;
  return { score, traps, greedyFails, randomRate, idle };
}

const popcount = (n) => n.toString(2).replaceAll('0', '').length;
