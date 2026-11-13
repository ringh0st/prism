import { DIRECTIONS, TILE } from './constants.js';

/** Reflect a direction off a mirror with the given orientation (0 = "/", 1 = "\"). */
export function reflect([dx, dy], orient) {
  return orient === 0 ? [-dy, -dx] : [dy, dx];
}

export function isRotatable(tile) {
  return (tile.type === TILE.MIRROR || tile.type === TILE.SPLITTER) && !tile.locked;
}

/** Index tiles by cell so tracing is O(1) per step. */
export function buildCellIndex({ width, height, tiles }) {
  const cells = new Int16Array(width * height).fill(-1);
  tiles.forEach((tile, i) => {
    cells[tile.y * width + tile.x] = i;
  });
  return cells;
}

/**
 * Trace every beam on the board.
 *
 * @param level  { width, height, tiles }
 * @param orients optional array (by tile index) overriding each tile's `orient`
 * @param cells  optional prebuilt cell index (for the solver's hot loop)
 * @returns {{ segments, hits, litGems, litShades, isSolved }}
 *   segments: [{ x1, y1, x2, y2, color }] in cell units, measured from cell centers
 *   hits: Map(tileIndex -> Set(color)) for gems and shades the light reached
 */
export function traceBeams(level, orients = null, cells = buildCellIndex(level)) {
  const { width, height, tiles } = level;
  const orientOf = (i) => (orients ? orients[i] : tiles[i].orient ?? 0);
  const segments = [];
  const hits = new Map();
  const visited = new Set();
  const queue = [];

  tiles.forEach((tile) => {
    if (tile.type === TILE.EMITTER) {
      queue.push({ x: tile.x, y: tile.y, dir: DIRECTIONS[tile.dir], color: tile.color ?? 'sun' });
    }
  });

  const recordHit = (i, color) => {
    if (!hits.has(i)) hits.set(i, new Set());
    hits.get(i).add(color);
  };

  while (queue.length) {
    const beam = queue.pop();
    let { x, y, dir, color } = beam;
    let startX = x;
    let startY = y;
    const endSegment = (ex, ey) => {
      if (ex !== startX || ey !== startY) segments.push({ x1: startX, y1: startY, x2: ex, y2: ey, color });
    };

    for (;;) {
      const nx = x + dir[0];
      const ny = y + dir[1];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        endSegment(x + dir[0] * 0.5, y + dir[1] * 0.5);
        break;
      }
      x = nx;
      y = ny;
      const i = cells[y * width + x];
      if (i < 0) continue;

      const tile = tiles[i];
      const key = `${x},${y},${dir[0]},${dir[1]},${color}`;
      if (visited.has(key)) {
        endSegment(x, y);
        break;
      }
      visited.add(key);

      if (tile.type === TILE.WALL || tile.type === TILE.EMITTER) {
        endSegment(x - dir[0] * 0.5, y - dir[1] * 0.5);
        break;
      }
      if (tile.type === TILE.GEM || tile.type === TILE.SHADE) {
        endSegment(x, y);
        recordHit(i, color);
        break;
      }
      endSegment(x, y);
      startX = x;
      startY = y;
      if (tile.type === TILE.FILTER) {
        color = tile.color;
      } else if (tile.type === TILE.MIRROR) {
        dir = reflect(dir, orientOf(i));
      } else if (tile.type === TILE.SPLITTER) {
        queue.push({ x, y, dir, color });
        dir = reflect(dir, orientOf(i));
      }
    }
  }

  const litGems = new Set();
  const litShades = new Set();
  let gemCount = 0;
  tiles.forEach((tile, i) => {
    if (tile.type === TILE.GEM) {
      gemCount++;
      if (hits.get(i)?.has(tile.color)) litGems.add(i);
    } else if (tile.type === TILE.SHADE && hits.has(i)) {
      litShades.add(i);
    }
  });

  return {
    segments,
    hits,
    litGems,
    litShades,
    isSolved: gemCount > 0 && litGems.size === gemCount && litShades.size === 0,
  };
}
