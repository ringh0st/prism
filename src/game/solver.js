import { NeedsDecision, UNDECIDED, buildCellIndex, isRotatable, traceBeams } from './beam.js';

/** Most switches a board may have (solutions are kept as bit masks). */
export const MAX_SOLVER_PIECES = 30;
/** Above this many explored positions the search gives up and the board counts as too complex. */
const MAX_SEARCH_NODES = 400000;

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

/**
 * Every way to solve the board, found by following the light: a switch is only decided once light reaches it,
 * so pieces the light never touches don't multiply the search (big boards with many decoys stay fast).
 * Each solution is { mask, care }: `care` holds the switches that matter, `mask` which of them are flipped
 * from the start (one tap each); switches outside `care` can stay as they are.
 *
 * @returns {{ isSolvable, par, solutionCount, solutions, groups, tooComplex }}
 *   par: minimum taps from the starting position to any solution
 */
export function analyzeLevel(level, startOrients = level.tiles.map((t) => t.orient ?? 0)) {
  const groups = switchGroups(level);
  if (groups.length > MAX_SOLVER_PIECES) return unsolved(groups, true);

  const groupOf = new Int16Array(level.tiles.length).fill(-1);
  groups.forEach((group, g) => group.forEach((tileIndex) => (groupOf[tileIndex] = g)));
  const cells = buildCellIndex(level);
  const orients = startOrients.slice();
  groups.forEach((group) => group.forEach((tileIndex) => (orients[tileIndex] = UNDECIDED)));
  const solutions = [];
  let nodes = 0;

  const explore = (mask, care) => {
    if (++nodes > MAX_SEARCH_NODES) return false;
    let trace;
    try {
      trace = traceBeams(level, orients, cells);
    } catch (needed) {
      if (!(needed instanceof NeedsDecision)) throw needed;
      const g = groupOf[needed.tileIndex];
      const bit = 1 << g;
      for (const flip of [0, 1]) {
        for (const tileIndex of groups[g]) orients[tileIndex] = startOrients[tileIndex] ^ flip;
        if (!explore(flip ? mask | bit : mask, care | bit)) return false;
      }
      for (const tileIndex of groups[g]) orients[tileIndex] = UNDECIDED;
      return true;
    }
    if (trace.isSolved) solutions.push({ mask, care });
    return true;
  };

  if (!explore(0, 0)) return unsolved(groups, true);
  const par = solutions.length ? Math.min(...solutions.map((solution) => popcount(solution.mask))) : null;
  return { isSolvable: solutions.length > 0, par, solutionCount: solutions.length, solutions, groups, tooComplex: false };
}

const unsolved = (groups, tooComplex) => ({ isSolvable: false, par: null, solutionCount: 0, solutions: [], groups, tooComplex });

/**
 * The solved orientations closest to the current position (fewest taps away).
 * @returns orients array, or null if the level can't be solved
 */
export function nearestSolution(level, currentOrients) {
  const { isSolvable, solutions, groups } = analyzeLevel(level, currentOrients);
  if (!isSolvable) return null;
  const best = solutions.reduce((a, b) => (popcount(a.mask) <= popcount(b.mask) ? a : b));
  const orients = currentOrients.slice();
  groups.forEach((group, g) => {
    if ((best.mask >> g) & 1) group.forEach((tileIndex) => (orients[tileIndex] ^= 1));
  });
  return orients;
}

/**
 * The level's solutions worked out once, so the fewest taps left can be read on every move without searching
 * again (the search takes a moment on big boards and slow phones).
 * @returns (currentOrients) => fewest taps still needed (twins count once), or null if it can't be solved
 */
export function tapsLeftFinder(level) {
  const start = level.tiles.map((t) => t.orient ?? 0);
  const { isSolvable, solutions, groups } = analyzeLevel(level, start);
  return (currentOrients) => {
    if (!isSolvable) return null;
    const current = groups.reduce((mask, group, bit) => (currentOrients[group[0]] !== start[group[0]] ? mask | (1 << bit) : mask), 0);
    let fewest = Infinity;
    for (const { mask, care } of solutions) fewest = Math.min(fewest, popcount((mask ^ current) & care));
    return fewest;
  };
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
