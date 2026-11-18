import { CLOCKWISE, DIRECTIONS, TILE } from './constants.js';

/** Reflect a direction off a mirror with the given orientation (0 = "/", 1 = "\"). */
export function reflect([dx, dy], orient) {
  return orient === 0 ? [-dy, -dx] : [dy, dx];
}

export function isRotatable(tile) {
  if (tile.type === TILE.EMITTER) return Boolean(tile.turnable);
  return (tile.type === TILE.MIRROR || tile.type === TILE.SPLITTER) && !tile.locked;
}

/** Where a lamp shines: its direction, or a quarter turn clockwise from it when a turning lamp is in state 1. */
export const lampDirection = (tile, orient = tile.orient ?? 0) => (tile.turnable && orient === 1 ? CLOCKWISE[tile.dir] : tile.dir);

/*
 * One-sided mirrors (`oneSided: 0 | 1`) reflect only from their silvered face and block light from behind.
 * Face 0 is the face whose normal points up-left for "/" and up-right for "" (the top of the drawn bar);
 * face 1 is the other side. Turning the mirror turns its faces with it.
 */
export const FACE_NORMALS = [
  [
    [-1, -1],
    [1, 1],
  ],
  [
    [1, -1],
    [-1, 1],
  ],
];
/** Does light travelling `dir` hit the silvered face of this one-sided mirror? */
export function hitsSilveredFace(dir, orient, face) {
  const [nx, ny] = FACE_NORMALS[orient][face];
  return nx * -dir[0] + ny * -dir[1] > 0;
}
/** Which face light travelling `dir` hits on a mirror in `orient` (to build one-sided mirrors that work). */
export const faceHitBy = (dir, orient) => (hitsSilveredFace(dir, orient, 0) ? 0 : 1);

/** The tiles that turn together when this one is tapped: itself, plus its twins (same `link`). */
export function rotationGroup(tiles, tileIndex) {
  const { link } = tiles[tileIndex];
  if (!link) return [tileIndex];
  return tiles.map((tile, i) => (tile.link === link && isRotatable(tile) ? i : -1)).filter((i) => i >= 0);
}

/** For each portal, the index of its partner (the other portal with the same `pair`). */
function portalPartners(tiles) {
  const partners = new Map();
  tiles.forEach((tile, i) => {
    if (tile.type !== TILE.PORTAL) return;
    const other = tiles.findIndex((t, j) => j !== i && t.type === TILE.PORTAL && t.pair === tile.pair);
    if (other >= 0) partners.set(i, other);
  });
  return partners;
}

/** An orientation the solver hasn't chosen yet; tracing light into such a piece throws NeedsDecision. */
export const UNDECIDED = -1;
export class NeedsDecision {
  constructor(tileIndex) {
    this.tileIndex = tileIndex;
  }
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
 * @param dark   optional darkness (darkness.js): { blockers: Map(cell -> shadow index), ranges: Map(lamp tile -> cells) }.
 *               A creeping shadow stops the light that reaches it (and is hit), and a dying lamp's light reaches only so far.
 * @returns {{ segments, hits, litGems, litShades, litSwitches, litGlooms, openGates, isSolved }}
 *   segments: [{ x1, y1, x2, y2, color }] in cell units, measured from cell centers
 *   hits: Map(tileIndex -> Set(color)) for gems, shades and switches the light reached
 *   openGates: the `pair` names of light gates whose switch is lit
 */
export function traceBeams(level, orients = null, cells = buildCellIndex(level), dark = null) {
  const voids = voidZone(level);
  const context = { cells, dark, voids };
  // Light gates open while their switch is lit, which can change where the light goes: trace again until
  // the open gates stop changing (a few rounds at most).
  const hasGates = level.tiles.some((tile) => tile.type === TILE.GATE);
  let openPairs = new Set();
  let result = traceOnce(level, orients, context, openPairs);
  for (let round = 0; hasGates && round < 4; round++) {
    const lit = new Set([...result.litSwitches].map((i) => level.tiles[i].pair));
    if (lit.size === openPairs.size && [...lit].every((pair) => openPairs.has(pair))) break;
    openPairs = lit;
    result = traceOnce(level, orients, context, openPairs);
  }
  return { ...result, openGates: openPairs };
}

/** Cells a void swallows light in: its own and the four next to it. */
function voidZone({ width, height, tiles }) {
  const zone = new Set();
  for (const tile of tiles) {
    if (tile.type !== TILE.VOID) continue;
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = tile.x + dx;
      const y = tile.y + dy;
      if (x >= 0 && y >= 0 && x < width && y < height) zone.add(y * width + x);
    }
  }
  return zone;
}

function traceOnce(level, orients, { cells, dark, voids }, openPairs) {
  const { width, height, tiles } = level;
  const orientOf = (i) => {
    const orient = orients ? orients[i] : (tiles[i].orient ?? 0);
    // The solver leaves pieces the light hasn't reached yet undecided (-1) and asks about them only when needed.
    if (orient === UNDECIDED) throw new NeedsDecision(i);
    return orient;
  };
  const segments = [];
  const hits = new Map();
  const visited = new Set();
  const queue = [];
  const partners = portalPartners(tiles);

  tiles.forEach((tile, i) => {
    if (tile.type === TILE.EMITTER) {
      const reach = dark?.ranges?.get(i) ?? Infinity;
      queue.push({ x: tile.x, y: tile.y, dir: DIRECTIONS[lampDirection(tile, orientOf(i))], color: tile.color ?? 'sun', left: reach });
    }
  });

  const litGlooms = new Set();
  const recordHit = (i, color) => {
    if (!hits.has(i)) hits.set(i, new Set());
    hits.get(i).add(color);
  };

  while (queue.length) {
    const beam = queue.pop();
    let { x, y, dir, color, left } = beam;
    let startX = x;
    let startY = y;
    const endSegment = (ex, ey) => {
      if (ex !== startX || ey !== startY) segments.push({ x1: startX, y1: startY, x2: ex, y2: ey, color });
    };

    for (;;) {
      // A dying lamp's light fades out once it has gone as far as the lamp can still reach.
      if (left <= 0) {
        endSegment(x + dir[0] * 0.4, y + dir[1] * 0.4);
        break;
      }
      const nx = x + dir[0];
      const ny = y + dir[1];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
        endSegment(x + dir[0] * 0.5, y + dir[1] * 0.5);
        break;
      }
      x = nx;
      y = ny;
      left--;
      const cell = y * width + x;
      // A creeping shadow catches the light (and burns), and a void swallows light next to it.
      if (dark?.blockers?.has(cell)) {
        endSegment(x, y);
        litGlooms.add(dark.blockers.get(cell));
        break;
      }
      if (voids.has(cell)) {
        endSegment(x, y);
        break;
      }
      const i = cells[cell];
      if (i < 0) continue;

      const tile = tiles[i];
      const key = `${x},${y},${dir[0]},${dir[1]},${color}`;
      if (visited.has(key)) {
        endSegment(x, y);
        break;
      }
      visited.add(key);

      if (tile.type === TILE.GATE && openPairs.has(tile.pair)) continue;
      if (tile.type === TILE.WALL || tile.type === TILE.EMITTER || tile.type === TILE.GATE) {
        endSegment(x - dir[0] * 0.5, y - dir[1] * 0.5);
        break;
      }
      if (tile.type === TILE.GEM || tile.type === TILE.SHADE || tile.type === TILE.SWITCH) {
        endSegment(x, y);
        recordHit(i, color);
        break;
      }
      // The dark back of a one-sided mirror stops the light.
      if (tile.type === TILE.MIRROR && tile.oneSided !== undefined && !hitsSilveredFace(dir, orientOf(i), tile.oneSided)) {
        endSegment(x, y);
        break;
      }
      endSegment(x, y);
      // Into one portal, out of its partner, still heading the same way.
      if (tile.type === TILE.PORTAL && partners.has(i)) {
        const exit = tiles[partners.get(i)];
        x = exit.x;
        y = exit.y;
      }
      startX = x;
      startY = y;
      if (tile.type === TILE.FILTER) {
        color = tile.color;
      } else if (tile.type === TILE.MIRROR) {
        dir = reflect(dir, orientOf(i));
      } else if (tile.type === TILE.SPLITTER) {
        queue.push({ x, y, dir, color, left });
        dir = reflect(dir, orientOf(i));
      } else if (tile.type === TILE.PRISM) {
        // A prism crystal splits the light in two, out to both sides.
        queue.push({ x, y, dir: reflect(dir, 0), color, left });
        dir = reflect(dir, 1);
      }
    }
  }

  const litGems = new Set();
  const litShades = new Set();
  const litSwitches = new Set();
  let gemCount = 0;
  tiles.forEach((tile, i) => {
    if (tile.type === TILE.GEM) {
      gemCount++;
      if (hits.get(i)?.has(tile.color)) litGems.add(i);
    } else if (tile.type === TILE.SHADE && hits.has(i)) {
      litShades.add(i);
    } else if (tile.type === TILE.SWITCH && hits.has(i)) {
      litSwitches.add(i);
    }
  });

  return {
    segments,
    hits,
    litGems,
    litShades,
    litSwitches,
    litGlooms,
    isSolved: gemCount > 0 && litGems.size === gemCount && litShades.size === 0,
  };
}

/** Every board cell the light passes through or ends in (from traceBeams' segments). */
export function cellsOnBeams(segments, width, height) {
  const cells = new Set();
  for (const { x1, y1, x2, y2 } of segments) {
    const steps = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2);
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x1 + ((x2 - x1) * i) / Math.max(1, steps));
      const y = Math.round(y1 + ((y2 - y1) * i) / Math.max(1, steps));
      if (x >= 0 && y >= 0 && x < width && y < height) cells.add(y * width + x);
    }
  }
  return cells;
}
