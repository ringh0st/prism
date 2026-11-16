/*
 * Boss battles: the last level of a world is a fight with Smudge, the cheeky shadow, in rounds (`level.phases`).
 *
 * - `level.tiles` is the first round's board; every later round changes the board before it (`changes`, applied in
 *   order: `{ do: 'remove', x, y }`, `{ do: 'turn', x, y, orient }` and `{ do: 'add', tile }`): Smudge pockets the
 *   gems, turns some mirrors, moves walls around and hides new gems.
 * - Each round has its own `par` (the fewest taps from its starting board); the level's `par` is their sum, so the
 *   stars and the move limit cover the whole fight. Each round is a puzzle of its own for the solver and the hints.
 * - Smudge stands on one empty cell per round (`smudge`). He has health: every gem lit for the first time in the
 *   round hits him once, and his weakness is the light itself: a beam through his cell hits him twice
 *   (`WEAKNESS_DAMAGE`). Lighting the last gem finishes the round, whatever health it had left.
 *
 * Everything here is pure: the game replays the round's taps, so an Undo takes the damage back too.
 */
import { TILE } from './constants.js';
import { buildCellIndex, cellsOnBeams, traceBeams } from './beam.js';

/** A beam through Smudge's cell hurts this much (a gem hurts 1). */
export const WEAKNESS_DAMAGE = 2;

/** Is this level a boss fight in rounds? */
export const isBossFight = (level) => Array.isArray(level?.phases) && level.phases.length > 1;

const cellOf = (width, tile) => tile.y * width + tile.x;

/** The same piece, whichever way it's turned? (A gem Smudge swapped for another color is a new piece.) */
export const isSamePiece = (a, b) => pieceKey(a) === pieceKey(b);
const pieceKey = (tile) =>
  JSON.stringify(
    Object.entries(tile)
      .filter(([key]) => key !== 'orient')
      .sort(([a], [b]) => (a < b ? -1 : 1)),
  );

/** The board after one round's changes (tiles that stay keep their order; new ones go at the end). */
export function applyPhaseChanges(tiles, changes = []) {
  let next = tiles.map((tile) => ({ ...tile }));
  for (const change of changes) {
    if (change.do === 'remove') next = next.filter((tile) => tile.x !== change.x || tile.y !== change.y);
    else if (change.do === 'turn') {
      const tile = next.find((t) => t.x === change.x && t.y === change.y);
      if (tile) tile.orient = change.orient;
    } else if (change.do === 'add') next.push({ ...change.tile });
  }
  return next;
}

const roundsCache = new WeakMap();

/**
 * Every round as a level of its own: the board at the round's start, its `par`, its `smudge` cell and its number
 * (`phase`, from 0). A level that isn't a fight is its own single round.
 */
export function phaseLevels(level) {
  if (!isBossFight(level)) return [level];
  if (roundsCache.has(level)) return roundsCache.get(level);
  const { phases, ...rest } = level;
  let tiles = level.tiles;
  const rounds = phases.map((phase, k) => {
    if (k > 0) tiles = applyPhaseChanges(tiles, phase.changes);
    return { ...rest, tiles, par: phase.par, phase: k, smudge: phase.smudge };
  });
  roundsCache.set(level, rounds);
  return rounds;
}

/** Smudge's health in one round: one per gem plus his weakness. */
export const phaseHealth = (round) => round.tiles.filter((tile) => tile.type === TILE.GEM).length + WEAKNESS_DAMAGE;

/** Smudge's health for the whole fight. */
export const fightHealth = (level) => phaseLevels(level).reduce((sum, round) => sum + phaseHealth(round), 0);

/** The damage done by the end of each round (where the health bar's notches go). */
export const roundHealthEnds = (level) => {
  let sum = 0;
  return phaseLevels(level).map((round) => (sum += phaseHealth(round)));
};

/** Moves the rounds after this one need at best (for the star meter). */
export const parAfterPhase = (level, phase) => phaseLevels(level).reduce((sum, round) => sum + (round.phase > phase ? round.par : 0), 0);

/** Does the light pass through Smudge's cell? */
const lightsSmudge = (round, trace) => round.smudge != null && cellsOnBeams(trace.segments, round.width, round.height).has(round.smudge);

/**
 * The damage done in a round so far, replaying its taps: every gem lit at some point (once each) plus the weakness
 * once the light has touched Smudge; a cleared round counts in full (and only a cleared one does).
 * @param tapGroups the tile groups turned by each tap still standing (twins turn together)
 * @returns {{ damage, litEver: Set, isWeaknessHit, isCleared }}
 */
export function phaseDamage(round, startOrients, tapGroups, cells = buildCellIndex(round)) {
  const orients = startOrients.slice();
  const litEver = new Set();
  let isWeaknessHit = false;
  const look = () => {
    const trace = traceBeams(round, orients, cells);
    trace.litGems.forEach((i) => litEver.add(i));
    if (!isWeaknessHit && lightsSmudge(round, trace)) isWeaknessHit = true;
    return trace;
  };
  let trace = look();
  for (const group of tapGroups) {
    for (const i of group) orients[i] ^= 1;
    trace = look();
  }
  // The last point always goes with the clearing blow, so the bar never empties while gems are still dark.
  const full = phaseHealth(round);
  const damage = trace.isSolved ? full : Math.min(full - 1, litEver.size + (isWeaknessHit ? WEAKNESS_DAMAGE : 0));
  return { damage, litEver, isWeaknessHit, isCleared: trace.isSolved };
}

/** Smudge's health left: the whole fight, less every round before this one, less this round's damage. */
export function healthLeft(level, phase, damage) {
  const before = phaseLevels(level)
    .slice(0, phase)
    .reduce((sum, round) => sum + phaseHealth(round), 0);
  return Math.max(0, fightHealth(level) - before - damage);
}

/**
 * Turn counts for the next round's board, so each piece keeps turning forward from where it was (the board shows a
 * turn only where Smudge really changed something); new pieces start at their orientation.
 */
export function carryTurns(round, turns, next) {
  const before = new Map(round.tiles.map((tile, i) => [cellOf(round.width, tile), i]));
  return next.tiles.map((tile) => {
    const orient = tile.orient ?? 0;
    const i = before.get(cellOf(next.width, tile));
    if (i === undefined || !isSamePiece(round.tiles[i], tile)) return orient;
    return turns[i] + ((((orient - turns[i]) % 2) + 2) % 2);
  });
}

/**
 * What Smudge changed between the player's board at the end of a round and the next round's start, for the board
 * to show: cells with new pieces, cells whose piece turned, and the pieces he took away (by cell).
 */
export function phaseChangeOf(round, orients, next) {
  const before = new Map(round.tiles.map((tile, i) => [cellOf(round.width, tile), i]));
  const after = new Set(next.tiles.map((tile) => cellOf(next.width, tile)));
  const added = new Set();
  const turned = new Set();
  next.tiles.forEach((tile) => {
    const cell = cellOf(next.width, tile);
    const i = before.get(cell);
    if (i === undefined || !isSamePiece(round.tiles[i], tile)) added.add(cell);
    else if ((orients[i] ?? 0) !== (tile.orient ?? 0)) turned.add(cell);
  });
  const removed = new Map();
  round.tiles.forEach((tile, i) => {
    const cell = cellOf(round.width, tile);
    if (!after.has(cell) || added.has(cell)) removed.set(cell, { ...tile, orient: orients[i] });
  });
  return { added, turned, removed };
}
