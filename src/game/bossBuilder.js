/*
 * Builds a boss fight (bossFight.js) on top of a finished boss board for the level builder: after each round
 * Smudge pockets the gems, turns a few mirrors, moves a wall and hides new gems where some other set of turns
 * would light them. Every round is checked with the solver: it starts unsolved, needs between the plan's fewest
 * and most taps, can't be solved by random tapping, and Smudge stands on the light path of its solution (where
 * the light hits his weakness) but not in the light at the start.
 */
import { TILE } from './constants.js';
import { cellsOnBeams, isRotatable, traceBeams } from './beam.js';
import { analyzeLevel, nearestSolution } from './solver.js';
import { applyPhaseChanges, isSamePiece } from './bossFight.js';
import { MAX_RANDOM_SOLVE_RATE, randomSolveRate } from './levelQuality.js';
import { moveLimitFor } from './scoring.js';

const TRIES_PER_ROUND = 400;
const startOf = (level) => level.tiles.map((tile) => tile.orient ?? 0);
const cellOf = (level, tile) => tile.y * level.width + tile.x;
/** The tile turned to this orientation (unchanged when it already is). */
const withOrient = (tile, orient) => (orient === (tile.orient ?? 0) ? tile : { ...tile, orient });

/** Every cell the light passes through, with the colors that reach it. */
function lightColors(level, segments) {
  const colors = new Map();
  for (const segment of segments) {
    for (const cell of cellsOnBeams([segment], level.width, level.height)) {
      if (!colors.has(cell)) colors.set(cell, new Set());
      colors.get(cell).add(segment.color);
    }
  }
  return colors;
}

/** Turnable pieces grouped the way a tap turns them (twins together). */
function tapGroups(tiles) {
  const groups = new Map();
  tiles.forEach((tile, i) => {
    if (!isRotatable(tile)) return;
    const key = tile.link ? `link-${tile.link}` : `tile-${i}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  return [...groups.values()];
}

/** An empty cell on the solution's light path that the light doesn't reach at the start, or null. */
function smudgeCellFor(level, avoid, random) {
  const solved = nearestSolution(level, startOf(level));
  if (!solved) return null;
  const taken = new Set(level.tiles.map((tile) => cellOf(level, tile)));
  const litAtStart = cellsOnBeams(traceBeams(level).segments, level.width, level.height);
  const cells = [...cellsOnBeams(traceBeams(level, solved).segments, level.width, level.height)].filter(
    (cell) => !taken.has(cell) && !avoid.has(cell) && !litAtStart.has(cell),
  );
  return cells.length ? random.pick(cells.sort((a, b) => a - b)) : null;
}

/** These orientations with one group turned (a copy). */
const flipped = (orients, group) => orients.map((orient, i) => (group.includes(i) ? orient ^ 1 : orient));

/**
 * Turn `count` pieces one after another, each one a piece the light reaches at that moment (so every turn changes
 * where the light goes), with `keepShadesDark` never lighting a shadow crystal. @returns the new orientations (a copy)
 */
function walkLight(level, groups, orients, count, random, keepShadesDark = false) {
  const next = orients.slice();
  const turned = new Set();
  for (let n = 0; n < count; n++) {
    const lit = cellsOnBeams(traceBeams(level, next).segments, level.width, level.height);
    const onPath = groups.filter(
      (group, g) =>
        !turned.has(g) &&
        group.some((i) => lit.has(cellOf(level, level.tiles[i]))) &&
        !(keepShadesDark && traceBeams(level, flipped(next, group)).litShades.size),
    );
    if (!onPath.length) break;
    const group = random.pick(onPath);
    turned.add(groups.indexOf(group));
    for (const i of group) next[i] ^= 1;
  }
  return next;
}

/** The changes that turn `before` into `after` (pieces that stay keep their order; new ones are added at the end). */
function changesBetween(level, before, after) {
  const afterAt = new Map(after.map((tile) => [cellOf(level, tile), tile]));
  const beforeAt = new Map(before.map((tile) => [cellOf(level, tile), tile]));
  const changes = [];
  for (const tile of before) {
    const now = afterAt.get(cellOf(level, tile));
    if (!now || !isSamePiece(now, tile)) changes.push({ do: 'remove', x: tile.x, y: tile.y });
    else if ((now.orient ?? 0) !== (tile.orient ?? 0)) changes.push({ do: 'turn', x: tile.x, y: tile.y, orient: now.orient });
  }
  for (const tile of after) {
    const was = beforeAt.get(cellOf(level, tile));
    if (!was || !isSamePiece(was, tile)) changes.push({ do: 'add', tile });
  }
  return changes;
}

/** One try at Smudge's next move on this round's board, or null if it didn't make a good round. */
function tryNextRound(round, plan, random, avoid, isRelaxed) {
  const fewestGems = isRelaxed ? 1 : plan.gems[0];
  const solved = nearestSolution(round, startOf(round));
  if (!solved) return null;
  const board = { ...round, tiles: round.tiles.map((tile, i) => withOrient(tile, solved[i])) };

  // Smudge pockets the gems and moves a wall (or two).
  let tiles = board.tiles.filter((tile) => tile.type !== TILE.GEM);
  const walls = tiles.filter((tile) => tile.type === TILE.WALL && !tile.fog);
  const movedWalls = Math.min(walls.length, random.int(0, plan.walls));
  const gone = new Set(random.shuffle(walls).slice(0, movedWalls));
  tiles = tiles.filter((tile) => !gone.has(tile));

  // He turns a few mirrors on the light's path, and the new gems go where the light lands after a few other turns
  // (each one a piece the light reaches then), so the round needs real thinking rather than undoing his turns.
  const empty = { ...round, tiles };
  const groups = tapGroups(tiles);
  if (groups.length < plan.par[0] + 1) return null;
  const start = walkLight(
    empty,
    groups,
    tiles.map((tile) => tile.orient ?? 0),
    random.int(2, 3),
    random,
  );
  const target = walkLight(empty, groups, start, random.int(plan.par[0], plan.par[1] + 1), random, !isRelaxed);
  const litAtTarget = lightColors(empty, traceBeams(empty, target).segments);
  const taken = new Set(tiles.map((tile) => cellOf(round, tile)));
  for (const tile of gone) taken.add(cellOf(round, tile));
  const free = (cell) => !taken.has(cell) && !avoid.has(cell);

  const gemCount = random.int(fewestGems, plan.gems[1]);
  const candidates = [...litAtTarget.keys()].filter(free).sort((a, b) => a - b);
  for (const cell of random.shuffle(candidates)) {
    if (tiles.filter((tile) => tile.type === TILE.GEM).length >= gemCount) break;
    const color = random.pick([...litAtTarget.get(cell)].sort());
    const withGem = [...tiles, { x: cell % round.width, y: Math.floor(cell / round.width), type: TILE.GEM, color }];
    // Every gem so far still lit at the target, and none lit at the start.
    if (traceBeams({ ...round, tiles: withGem }, [...target, 0]).litGems.size !== withGem.filter((tile) => tile.type === TILE.GEM).length) continue;
    if (traceBeams({ ...round, tiles: withGem }, [...start, 0]).litGems.size) continue;
    tiles = withGem;
    target.push(0);
    start.push(0);
  }
  if (tiles.filter((tile) => tile.type === TILE.GEM).length < fewestGems) return null;

  // The walls he moved land where they don't block the target's light.
  const targetLight = cellsOnBeams(traceBeams({ ...round, tiles }, target).segments, round.width, round.height);
  const wallCells = random.shuffle(
    Array.from({ length: round.width * round.height }, (_, cell) => cell).filter((cell) => free(cell) && !targetLight.has(cell)),
  );
  for (const cell of wallCells.slice(0, movedWalls)) {
    tiles = [...tiles, { x: cell % round.width, y: Math.floor(cell / round.width), type: TILE.WALL }];
    start.push(0);
  }

  const nextTiles = tiles.map((tile, i) => withOrient(tile, start[i]));
  const next = { ...round, tiles: nextTiles };
  const analysis = analyzeLevel(next);
  if (!analysis.isSolvable || analysis.tooComplex || analysis.par < plan.par[0] || analysis.par > plan.par[1]) return null;
  if (traceBeams(next).isSolved) return null;
  const rated = { ...next, par: analysis.par };
  if (randomSolveRate(rated, { moveLimit: moveLimitFor(analysis.par, round.difficulty) }) > MAX_RANDOM_SOLVE_RATE) return null;
  const smudge = smudgeCellFor(rated, avoid, random);
  if (smudge === null) return null;
  const changes = changesBetween(round, round.tiles, nextTiles);
  if (JSON.stringify(applyPhaseChanges(round.tiles, changes)) !== JSON.stringify(nextTiles)) return null;
  return { par: analysis.par, smudge, changes };
}

/**
 * Turn a finished boss board into a fight in `plan.phases` rounds.
 * @param plan   { phases, par: [fewest, most] taps per later round, gems: [fewest, most], walls: most moved }
 * @param avoid  cells to keep free (the Glowbug's)
 * @returns the level with `phases` and the summed `par`, or null if no fight could be built
 */
export function addBossPhases(level, plan, random, avoid = new Set()) {
  let round = level;
  const firstSmudge = smudgeCellFor(round, avoid, random);
  if (firstSmudge === null) return null;
  const phases = [{ par: level.par, smudge: firstSmudge }];
  while (phases.length < plan.phases) {
    const keepFree = new Set([...avoid, ...phases.map((phase) => phase.smudge)]);
    let found = null;
    // A crowded board may only have room for one new gem: after half the tries, one will do.
    for (let attempt = 0; attempt < TRIES_PER_ROUND && !found; attempt++)
      found = tryNextRound(round, plan, random, keepFree, attempt >= TRIES_PER_ROUND / 2);
    if (!found) return null;
    phases.push(found);
    round = { ...round, tiles: applyPhaseChanges(round.tiles, found.changes) };
  }
  return { ...level, par: phases.reduce((sum, phase) => sum + phase.par, 0), phases };
}

/** A fight back to its first round's board alone (to build it again). */
export function withoutPhases(level) {
  if (!level.phases) return level;
  const { phases, ...rest } = level;
  return { ...rest, par: phases[0].par };
}
