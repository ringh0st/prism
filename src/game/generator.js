import { DIRECTIONS, TILE } from './constants.js';
import { reflect, traceBeams } from './beam.js';
import { analyzeLevel } from './solver.js';

const TINTS = ['coral', 'lime', 'sky'];

/**
 * @typedef {object} GeneratorOptions
 * @property {number} width
 * @property {number} height
 * @property {number} [emitters=1]   independent light sources
 * @property {number} [splits=0]     splitters that branch a beam to an extra gem
 * @property {[number, number]} [turns=[1,2]]   mirror turns per beam branch
 * @property {[number, number]} [segment=[1,3]] cells between turns
 * @property {number} [filters=0]    color filters on the solution path
 * @property {number} [decoys=0]     extra rotatable mirrors off the path
 * @property {number} [walls=0]
 * @property {number} [shades=0]     dark crystals that must stay unlit
 * @property {number} [lockedRatio=0] share of path mirrors that are fixed in place
 * @property {number} [minPar=1]     minimum taps needed to solve
 * @property {number} [maxPar=99]
 */

const key = (x, y) => `${x},${y}`;

function borderStart(width, height, random) {
  const side = random.pick(['top', 'right', 'bottom', 'left']);
  if (side === 'top') return { x: random.int(1, width - 2), y: 0, dir: 'down' };
  if (side === 'bottom') return { x: random.int(1, width - 2), y: height - 1, dir: 'up' };
  if (side === 'left') return { x: 0, y: random.int(1, height - 2), dir: 'right' };
  return { x: width - 1, y: random.int(1, height - 2), dir: 'left' };
}

function directionName([dx, dy]) {
  return Object.keys(DIRECTIONS).find((name) => DIRECTIONS[name][0] === dx && DIRECTIONS[name][1] === dy);
}

/** Build one solved board, or return null if the random walk got stuck. */
function buildSolvedBoard(options, random) {
  const { width, height, emitters = 1, splits = 0, turns = [1, 2], segment = [1, 3], filters = 0 } = options;
  const tiles = [];
  const occupied = new Map();
  const beamCells = new Set();
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < width && y < height;
  const isFree = (x, y) => inBounds(x, y) && !occupied.has(key(x, y)) && !beamCells.has(key(x, y));
  const place = (tile) => {
    tiles.push(tile);
    occupied.set(key(tile.x, tile.y), tile);
    beamCells.delete(key(tile.x, tile.y));
    return tile;
  };
  const pathMirrors = [];
  let splitsLeft = splits;
  let filtersLeft = filters;

  const walkBranch = (start) => {
    let { x, y } = start;
    let dir = start.dir;
    let color = start.color;
    const turnCount = random.int(turns[0], turns[1]);

    for (let turn = 0; turn <= turnCount; turn++) {
      const isLast = turn === turnCount;
      const length = random.int(segment[0], segment[1]);
      let moved = 0;
      while (moved < length && isFree(x + dir[0], y + dir[1])) {
        x += dir[0];
        y += dir[1];
        beamCells.add(key(x, y));
        moved++;
        // Drop a color filter on a straight stretch, never on the final cell.
        if (filtersLeft > 0 && moved < length && random.chance(0.35) && isFree(x + dir[0], y + dir[1])) {
          color = random.pick(TINTS);
          place({ x, y, type: TILE.FILTER, color });
          filtersLeft--;
        }
      }
      if (moved === 0) return false;

      if (isLast) {
        place({ x, y, type: TILE.GEM, color });
        return true;
      }

      const turnChoices = random.shuffle([reflect(dir, 0), reflect(dir, 1)]);
      const newDir = turnChoices.find(([dx, dy]) => isFree(x + dx, y + dy));
      if (!newDir) return false;
      const slashDir = reflect(dir, 0);
      const orient = slashDir[0] === newDir[0] && slashDir[1] === newDir[1] ? 0 : 1;
      const useSplitter = splitsLeft > 0 && isFree(x + dir[0], y + dir[1]) && random.chance(0.6);
      const tile = place({ x, y, type: useSplitter ? TILE.SPLITTER : TILE.MIRROR, orient, locked: false });
      pathMirrors.push({ tile, incoming: dir });
      if (useSplitter) {
        splitsLeft--;
        pendingBranches.push({ x, y, dir, color });
      }
      dir = newDir;
    }
    return true;
  };

  const pendingBranches = [];
  for (let e = 0; e < emitters; e++) {
    let start = null;
    for (let tries = 0; tries < 20 && !start; tries++) {
      const candidate = borderStart(width, height, random);
      if (isFree(candidate.x, candidate.y)) start = candidate;
    }
    if (!start) return null;
    place({ x: start.x, y: start.y, type: TILE.EMITTER, dir: start.dir, color: 'sun' });
    pendingBranches.push({ x: start.x, y: start.y, dir: DIRECTIONS[start.dir], color: 'sun' });
  }

  while (pendingBranches.length) {
    if (!walkBranch(pendingBranches.shift())) return null;
  }
  if (splitsLeft > 0) return null;
  return { tiles, occupied, beamCells, pathMirrors, isFree };
}

function decorate(board, options, random) {
  const { width, height, decoys = 0, walls = 0, shades = 0, lockedRatio = 0 } = options;
  const { tiles, pathMirrors, isFree } = board;
  const occupy = (tile) => {
    tiles.push(tile);
    board.occupied.set(key(tile.x, tile.y), tile);
  };

  // Shades: put them where a wrongly turned path mirror would send light.
  let shadesLeft = shades;
  for (const { tile, incoming } of random.shuffle(pathMirrors)) {
    if (shadesLeft === 0) break;
    const wrongDir = reflect(incoming, 1 - tile.orient);
    for (let step = 1, x = tile.x, y = tile.y; step <= 3; step++) {
      x += wrongDir[0];
      y += wrongDir[1];
      if (x < 0 || y < 0 || x >= width || y >= height || board.occupied.has(key(x, y))) break;
      if (isFree(x, y)) {
        occupy({ x, y, type: TILE.SHADE });
        shadesLeft--;
        break;
      }
    }
  }

  const freeCells = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (isFree(x, y)) freeCells.push([x, y]);
  const pool = random.shuffle(freeCells);
  for (let i = 0; i < decoys && pool.length; i++) {
    const [x, y] = pool.pop();
    occupy({ x, y, type: TILE.MIRROR, orient: random.int(0, 1), locked: false });
  }
  for (let i = 0; i < walls && pool.length; i++) {
    const [x, y] = pool.pop();
    occupy({ x, y, type: TILE.WALL });
  }
  for (const { tile } of pathMirrors) {
    if (tile.type === TILE.MIRROR && random.chance(lockedRatio)) tile.locked = true;
  }
}

function toLevelTiles(tiles) {
  return tiles.map(({ x, y, type, dir, color, orient, locked }) => {
    const tile = { x, y, type };
    if (dir !== undefined) tile.dir = typeof dir === 'string' ? dir : directionName(dir);
    if (color !== undefined) tile.color = color;
    if (orient !== undefined) tile.orient = orient;
    if (locked) tile.locked = true;
    return tile;
  });
}

/**
 * Generate a solvable, scrambled level.
 * @param {GeneratorOptions} options
 * @param random seeded random from createRandom()
 * @returns {{ width, height, tiles, par } | null}
 */
export function generateLevel(options, random, maxAttempts = 400) {
  const { width, height, minPar = 1, maxPar = 99 } = options;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board = buildSolvedBoard(options, random);
    if (!board) continue;
    decorate(board, options, random);
    const level = { width, height, tiles: toLevelTiles(board.tiles) };
    if (!traceBeams(level).isSolved) continue;

    const rotatable = level.tiles.filter((t) => (t.type === TILE.MIRROR || t.type === TILE.SPLITTER) && !t.locked);
    if (rotatable.length < minPar) continue;
    for (let scramble = 0; scramble < 12; scramble++) {
      const scrambled = { ...level, tiles: level.tiles.map((t) => ({ ...t })) };
      scrambled.tiles.forEach((t) => {
        if ((t.type === TILE.MIRROR || t.type === TILE.SPLITTER) && !t.locked && random.chance(0.65)) t.orient ^= 1;
      });
      if (traceBeams(scrambled).isSolved) continue;
      const analysis = analyzeLevel(scrambled);
      if (analysis.tooComplex || !analysis.isSolvable) break;
      if (analysis.par >= minPar && analysis.par <= maxPar) return { ...scrambled, par: analysis.par };
    }
  }
  return null;
}
