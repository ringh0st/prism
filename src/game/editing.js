import { BEAM_COLOR_NAMES, DIRECTION_NAMES, DIFFICULTY, LEVEL_SCHEMA_VERSION, TILE } from './constants.js';
import { analyzeLevel } from './solver.js';
import { traceBeams } from './beam.js';

const withTiles = (level, tiles) => ({ ...level, tiles });
const isAt = (x, y) => (tile) => tile.x === x && tile.y === y;
const cycle = (list, value) => list[(list.indexOf(value) + 1) % list.length];

export function createBlankLevel({ id = 'new-level', world = 1, index = 1, size = 6 } = {}) {
  return {
    id,
    version: LEVEL_SCHEMA_VERSION,
    world,
    index,
    name: '',
    difficulty: DIFFICULTY.NORMAL,
    width: size,
    height: size,
    par: 1,
    tiles: [],
  };
}

/** Build a fresh tile of the given type with sensible defaults. */
export function makeTile(type, x, y, { color = 'sun', dir = 'right' } = {}) {
  const tile = { x, y, type };
  if (type === TILE.EMITTER) Object.assign(tile, { dir, color });
  if (type === TILE.GEM || type === TILE.FILTER) tile.color = type === TILE.FILTER && color === 'sun' ? 'coral' : color;
  if (type === TILE.MIRROR || type === TILE.SPLITTER) tile.orient = 0;
  return tile;
}

export function placeTile(level, tile) {
  return withTiles(level, [...level.tiles.filter((t) => !isAt(tile.x, tile.y)(t)), tile]);
}

export function removeTileAt(level, x, y) {
  return withTiles(level, level.tiles.filter((t) => !isAt(x, y)(t)));
}

/** "Rotate" tool: turn mirrors, point emitters, recolor gems and filters. */
export function cycleTileAt(level, x, y) {
  return withTiles(
    level,
    level.tiles.map((tile) => {
      if (!isAt(x, y)(tile)) return tile;
      switch (tile.type) {
        case TILE.MIRROR:
        case TILE.SPLITTER:
          return { ...tile, orient: tile.orient ^ 1 };
        case TILE.EMITTER:
          return { ...tile, dir: cycle(DIRECTION_NAMES, tile.dir) };
        case TILE.GEM:
          return { ...tile, color: cycle(BEAM_COLOR_NAMES, tile.color) };
        case TILE.FILTER:
          return { ...tile, color: cycle(BEAM_COLOR_NAMES.filter((c) => c !== 'sun'), tile.color) };
        default:
          return tile;
      }
    }),
  );
}

export function toggleLockAt(level, x, y) {
  return withTiles(
    level,
    level.tiles.map((tile) =>
      isAt(x, y)(tile) && (tile.type === TILE.MIRROR || tile.type === TILE.SPLITTER) ? { ...tile, locked: !tile.locked } : tile,
    ),
  );
}

/** Change the board size, dropping tiles that no longer fit. */
export function resizeLevel(level, width, height) {
  return { ...level, width, height, tiles: level.tiles.filter((t) => t.x < width && t.y < height) };
}

/** Rotate pieces into the solution closest to the current position. */
export function applyNearestSolution(level) {
  const analysis = analyzeLevel(level);
  if (!analysis.isSolvable) return level;
  const start = analysis.rotatable.reduce((mask, i, bit) => mask | ((level.tiles[i].orient & 1) << bit), 0);
  const popcount = (n) => n.toString(2).replace(/0/g, '').length;
  const best = analysis.solutionMasks.reduce((a, b) => (popcount(a ^ start) <= popcount(b ^ start) ? a : b));
  const tiles = level.tiles.map((t) => ({ ...t }));
  analysis.rotatable.forEach((i, bit) => {
    tiles[i].orient = (best >> bit) & 1;
  });
  return withTiles(level, tiles);
}

/**
 * Scramble rotatable pieces so the level starts unsolved, aiming for at least `targetPar` moves.
 * @returns level with an updated `par`, or null if the level isn't solvable.
 */
export function scrambleLevel(level, random, targetPar = 1) {
  const solved = applyNearestSolution(level);
  if (!traceBeams(solved).isSolved) return null;
  let best = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const tiles = solved.tiles.map((t) =>
      (t.type === TILE.MIRROR || t.type === TILE.SPLITTER) && !t.locked && random.chance(0.6) ? { ...t, orient: t.orient ^ 1 } : t,
    );
    const candidate = withTiles(solved, tiles);
    if (traceBeams(candidate).isSolved) continue;
    const { par } = analyzeLevel(candidate);
    if (par && (!best || par > best.par)) best = { ...candidate, par };
    if (best && best.par >= targetPar) break;
  }
  return best;
}
