/*
 * The darkness: Smudge, a cheeky shadow, steals the light from the later worlds, and these pieces race the player
 * move by move (so the order of taps matters, not just which mirrors are turned):
 *
 * - creeping shadows (`level.glooms`: [{ trail: [cell…], gem: tile index }]) creep one cell along their trail per
 *   move toward a gem. Light that touches one burns it away for good (where it stands after the tap, or the cell
 *   it creeps into). If it gets past the end of its trail it swallows the gem and the level is lost. While it's
 *   there it blocks the light that reaches it.
 * - fading gems (`fade: n` on a gem): unless light reaches the gem within n ticks it goes dark for good. Once lit
 *   it's saved, though it still has to be lit at the end like every gem.
 * - dying lamps (`power: n, reach: r` on a lamp): the light reaches r cells plus the power left; each tick uses one,
 *   and once the power is gone the lamp goes out.
 * - eclipses (`level.eclipse: k`): every k-th move is dark, and the darkness takes two ticks instead of one.
 * - voids (a fixed tile) swallow light next to them; they live in beam.js, as they don't change with time.
 *
 * Everything here is pure: the game replays the taps so far (an Undo takes back the darkness too), and the level
 * builder and hints use the same rules to check that a safe order of taps exists.
 */
import { TILE } from './constants.js';
import { buildCellIndex, traceBeams } from './beam.js';

/** Does this level have anything that changes with time? */
export const hasDarkness = (level) =>
  Boolean(level.glooms?.length || level.eclipse || level.tiles.some((tile) => tile.fade || tile.power !== undefined));

/** Is this move (1, 2, 3…) an eclipse? */
export const isEclipseMove = (level, move) => Boolean(level.eclipse) && move > 0 && move % level.eclipse === 0;

/** Darkness ticks after `moves` moves: one per move, two on an eclipse. */
export const ticksAfter = (level, moves) => moves + (level.eclipse ? Math.floor(moves / level.eclipse) : 0);

/** How far each dying lamp still reaches after `ticks` ticks (lamps without power reach everywhere). */
function lampRanges(level, ticks) {
  const ranges = new Map();
  level.tiles.forEach((tile, i) => {
    if (tile.type === TILE.EMITTER && tile.power !== undefined) ranges.set(i, Math.max(0, tile.reach + tile.power - ticks));
  });
  return ranges;
}

/** Where each shadow that's still there stands after `ticks` ticks. */
const gloomCell = (gloom, ticks) => gloom.trail[Math.min(ticks, gloom.trail.length - 1)];

/** Trace the light with the shadows still there blocking it and the lamps' reach at these ticks. */
function darkTrace(level, orients, burned, ticks, cells) {
  const blockers = new Map();
  (level.glooms ?? []).forEach((gloom, g) => {
    if (!burned.has(g) && ticks < gloom.trail.length) blockers.set(gloomCell(gloom, ticks), g);
  });
  return traceBeams(level, orients, cells, { blockers, ranges: lampRanges(level, ticks) });
}

/** Gems that start fading and haven't been reached yet. */
const fadingGems = (level) => level.tiles.flatMap((tile, i) => (tile.type === TILE.GEM && tile.fade ? [i] : []));

/**
 * The darkness at the start of a level (before any tap): { ticks, burned, saved, lost, trace }.
 * `lost` is null, or { kind: 'swallowed' | 'faded' | 'lampOut', tile } once the darkness has won.
 */
export function darknessStart(level, orients, cells = buildCellIndex(level)) {
  const burned = new Set();
  let trace = darkTrace(level, orients, burned, 0, cells);
  trace.litGlooms.forEach((g) => burned.add(g));
  if (trace.litGlooms.size) trace = darkTrace(level, orients, burned, 0, cells);
  const saved = new Set(fadingGems(level).filter((i) => trace.litGems.has(i)));
  return { ticks: 0, burned, saved, lost: null, trace };
}

/**
 * The darkness after one more move: `moves` is the number of moves made including this one, `orients` the board
 * after it. Light first burns any shadow it reaches where it stands; the rest creep on (two cells on an eclipse),
 * burning if they creep into light; then a shadow past its trail swallows its gem, a fading gem out of time goes
 * dark, and a lamp out of power goes out.
 */
export function darknessStep(level, state, orients, moves, cells = buildCellIndex(level)) {
  if (state.lost) return state;
  const burned = new Set(state.burned);
  const before = darkTrace(level, orients, burned, state.ticks, cells);
  before.litGlooms.forEach((g) => burned.add(g));
  const ticks = ticksAfter(level, moves);
  let trace = darkTrace(level, orients, burned, ticks, cells);
  trace.litGlooms.forEach((g) => burned.add(g));
  if (trace.litGlooms.size) trace = darkTrace(level, orients, burned, ticks, cells);
  const saved = new Set([...state.saved, ...fadingGems(level).filter((i) => trace.litGems.has(i))]);

  let lost = null;
  (level.glooms ?? []).forEach((gloom, g) => {
    if (!lost && !burned.has(g) && ticks >= gloom.trail.length) lost = { kind: 'swallowed', tile: gloom.gem, gloom: g };
  });
  for (const i of fadingGems(level)) {
    if (!lost && !saved.has(i) && ticks >= level.tiles[i].fade) lost = { kind: 'faded', tile: i };
  }
  level.tiles.forEach((tile, i) => {
    if (!lost && tile.type === TILE.EMITTER && tile.power !== undefined && tile.power - ticks < 0) lost = { kind: 'lampOut', tile: i };
  });
  return { ticks, burned, saved, lost, trace: lost ? { ...trace, isSolved: false } : trace };
}

/**
 * Play the taps so far from the start: the darkness now (with its trace) and what each shadow is doing.
 * @param tapGroups the tile groups turned by each tap, in order (twins turn together)
 */
export function replayDarkness(level, startOrients, tapGroups, cells = buildCellIndex(level)) {
  const orients = startOrients.slice();
  let state = darknessStart(level, orients, cells);
  tapGroups.forEach((group, move) => {
    for (const i of group) orients[i] ^= 1;
    state = darknessStep(level, state, orients, move + 1, cells);
  });
  return state;
}

/** What the board shows for each shadow: where it is, where it's heading, and if it's gone. */
export function gloomsNow(level, state) {
  return (level.glooms ?? []).map((gloom, g) => ({
    index: g,
    cell: gloomCell(gloom, state.ticks),
    trail: gloom.trail.slice(Math.min(state.ticks, gloom.trail.length)),
    gem: gloom.gem,
    isBurned: state.burned.has(g),
    stepsLeft: Math.max(0, gloom.trail.length - state.ticks),
  }));
}

/** Ticks left for each fading gem (null once it's saved). */
export const fadeLeft = (level, state, tileIndex) => (state.saved.has(tileIndex) ? null : Math.max(0, level.tiles[tileIndex].fade - state.ticks));

/** Power left in a dying lamp. */
export const powerLeft = (level, state, tileIndex) => Math.max(0, level.tiles[tileIndex].power - state.ticks);

/** Most positions the safe-order search looks at before giving up (keeps the level builder and hints quick). */
const MAX_ORDER_NODES = 20000;

/**
 * An order for these taps that the darkness can't win, from a position and darkness state: a search over the taps
 * made so far that remembers dead ends, so it stays quick even for twenty taps.
 * @param tapGroups tile groups to turn, each once (twins turn together)
 * @returns indexes into tapGroups in a safe order, or null if there is none (or the search gave up)
 */
export function findSafeOrder(level, startOrients, tapGroups, state = null, moves = 0, cells = buildCellIndex(level)) {
  const count = tapGroups.length;
  const full = 2 ** count - 1;
  const deadEnds = new Set();
  const keyOf = (made, s) => `${made}|${[...s.burned].sort().join(',')}|${[...s.saved].sort().join(',')}`;
  const orients = startOrients.slice();
  const order = [];
  let nodes = 0;
  const search = (made, current) => {
    if (made === full) return current.trace.isSolved;
    if (++nodes > MAX_ORDER_NODES) return false;
    const key = keyOf(made, current);
    if (deadEnds.has(key)) return false;
    for (let t = 0; t < count; t++) {
      if (made & (2 ** t)) continue;
      for (const i of tapGroups[t]) orients[i] ^= 1;
      const next = darknessStep(level, current, orients, moves + order.length + 1, cells);
      order.push(t);
      const works = !next.lost && search(made + 2 ** t, next);
      if (works) return true;
      order.pop();
      for (const i of tapGroups[t]) orients[i] ^= 1;
    }
    deadEnds.add(key);
    return false;
  };
  return search(0, state ?? darknessStart(level, startOrients, cells)) ? order : null;
}

/**
 * How risky the order is: the share of random orders of these taps that the darkness wins (0 = any order works,
 * close to 1 = only a careful order works). Used by the level builder to keep the darkness meaningful but fair.
 */
export function orderRisk(level, startOrients, tapGroups, random, samples = 40, cells = buildCellIndex(level)) {
  // `random` is a seeded generator (src/lib/random.js), so a level is built the same way every time.
  let lost = 0;
  for (let n = 0; n < samples; n++) {
    const order = random.shuffle(tapGroups.map((_, t) => t));
    const orients = startOrients.slice();
    let state = darknessStart(level, orients, cells);
    order.forEach((t, move) => {
      for (const i of tapGroups[t]) orients[i] ^= 1;
      state = darknessStep(level, state, orients, move + 1, cells);
    });
    if (state.lost || !state.trace.isSolved) lost++;
  }
  return lost / samples;
}
