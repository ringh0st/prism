import { buildCellIndex, isRotatable, traceBeams } from './beam.js';

/** Above this many rotatable tiles the exhaustive search gets too slow. */
export const MAX_SOLVER_PIECES = 16;

function popcount(n) {
  let count = 0;
  while (n) {
    n &= n - 1;
    count++;
  }
  return count;
}

/**
 * Explore every combination of rotatable tile orientations.
 * Each rotatable tile has 2 states, so a solution's distance from the start
 * is the number of tiles whose state differs (one tap each).
 *
 * @returns {{ isSolvable, par, solutionCount, solutionMasks, rotatable, tooComplex }}
 *   par: minimum taps from the starting position to any solution
 */
export function analyzeLevel(level, startOrients = level.tiles.map((t) => t.orient ?? 0)) {
  const rotatable = level.tiles.map((t, i) => (isRotatable(t) ? i : -1)).filter((i) => i >= 0);
  if (rotatable.length > MAX_SOLVER_PIECES) {
    return { isSolvable: false, par: null, solutionCount: 0, solutionMasks: [], rotatable, tooComplex: true };
  }

  const cells = buildCellIndex(level);
  const orients = startOrients.slice();
  const startMask = rotatable.reduce((mask, tileIndex, bit) => mask | ((startOrients[tileIndex] & 1) << bit), 0);
  const solutionMasks = [];
  let par = Infinity;

  for (let mask = 0; mask < 1 << rotatable.length; mask++) {
    rotatable.forEach((tileIndex, bit) => {
      orients[tileIndex] = (mask >> bit) & 1;
    });
    if (traceBeams(level, orients, cells).isSolved) {
      solutionMasks.push(mask);
      par = Math.min(par, popcount(mask ^ startMask));
    }
  }

  return {
    isSolvable: solutionMasks.length > 0,
    par: solutionMasks.length ? par : null,
    solutionCount: solutionMasks.length,
    solutionMasks,
    rotatable,
    tooComplex: false,
  };
}

/**
 * Suggest one tile to rotate that moves the player closer to the nearest solution.
 * @returns tile index, or null if already solved / unsolvable
 */
export function findHint(level, currentOrients) {
  const { isSolvable, solutionMasks, rotatable } = analyzeLevel(level, currentOrients);
  if (!isSolvable) return null;
  const currentMask = rotatable.reduce((mask, tileIndex, bit) => mask | ((currentOrients[tileIndex] & 1) << bit), 0);
  let best = null;
  for (const mask of solutionMasks) {
    const diff = mask ^ currentMask;
    if (diff === 0) return null;
    if (best === null || popcount(diff) < popcount(best)) best = diff;
  }
  const bit = Math.log2(best & -best);
  return rotatable[bit];
}
