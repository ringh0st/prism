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
 * The independent "switches" on a board: each rotatable tile on its own, except twins, which turn
 * together (one tap flips the whole group).
 * @returns tile-index groups
 */
function switchGroups(level) {
  const groups = [];
  const byLink = new Map();
  level.tiles.forEach((tile, i) => {
    if (!isRotatable(tile)) return;
    if (!tile.link) {
      groups.push([i]);
    } else if (byLink.has(tile.link)) {
      byLink.get(tile.link).push(i);
    } else {
      const group = [i];
      byLink.set(tile.link, group);
      groups.push(group);
    }
  });
  return groups;
}

const orientsFor = (startOrients, groups, mask) => {
  const orients = startOrients.slice();
  groups.forEach((group, bit) => {
    if ((mask >> bit) & 1) group.forEach((tileIndex) => (orients[tileIndex] ^= 1));
  });
  return orients;
};

/**
 * Explore every combination of switches (rotatable tiles; twins count as one). Each has two states,
 * so a solution's distance from the start is the number of switches flipped (one tap each).
 *
 * @returns {{ isSolvable, par, solutionCount, solutionMasks, groups, tooComplex }}
 *   par: minimum taps from the starting position to any solution; masks are relative to the start
 */
export function analyzeLevel(level, startOrients = level.tiles.map((t) => t.orient ?? 0)) {
  const groups = switchGroups(level);
  if (groups.length > MAX_SOLVER_PIECES) {
    return { isSolvable: false, par: null, solutionCount: 0, solutionMasks: [], groups, tooComplex: true };
  }

  const cells = buildCellIndex(level);
  const solutionMasks = [];
  let par = Infinity;
  for (let mask = 0; mask < 1 << groups.length; mask++) {
    if (traceBeams(level, orientsFor(startOrients, groups, mask), cells).isSolved) {
      solutionMasks.push(mask);
      par = Math.min(par, popcount(mask));
    }
  }

  return {
    isSolvable: solutionMasks.length > 0,
    par: solutionMasks.length ? par : null,
    solutionCount: solutionMasks.length,
    solutionMasks,
    groups,
    tooComplex: false,
  };
}

/**
 * The solved orientations closest to the current position (fewest taps away).
 * @returns orients array, or null if the level can't be solved
 */
export function nearestSolution(level, currentOrients) {
  const { isSolvable, solutionMasks, groups } = analyzeLevel(level, currentOrients);
  if (!isSolvable) return null;
  const best = solutionMasks.reduce((a, b) => (popcount(a) <= popcount(b) ? a : b));
  return orientsFor(currentOrients, groups, best);
}

/** The fewest taps that can still solve the level from here (twins count once), or null if it can't be solved. */
export function tapsLeft(level, currentOrients) {
  const { isSolvable, solutionMasks } = analyzeLevel(level, currentOrients);
  if (!isSolvable) return null;
  return Math.min(...solutionMasks.map(popcount));
}

/**
 * Suggest one tile to rotate that moves the player closer to the nearest solution.
 * @returns tile index, or null if already solved / unsolvable
 */
export function findHint(level, currentOrients) {
  const target = nearestSolution(level, currentOrients);
  if (!target) return null;
  const tileIndex = target.findIndex((orient, i) => orient !== currentOrients[i]);
  return tileIndex >= 0 ? tileIndex : null;
}
