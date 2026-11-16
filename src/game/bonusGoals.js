import { createRandom, hashString } from '../lib/random.js';
import { analyzeLevel } from './solver.js';
import { buildCellIndex, cellsOnBeams, rotationGroup, traceBeams } from './beam.js';
import { darknessStart, darknessStep, findSafeOrder, hasDarkness } from './darkness.js';
import { moveLimitFor } from './scoring.js';
import { TILE } from './constants.js';

/*
 * Bonus goals: one optional extra goal per built-in level (main road only), a reason to play a level again after
 * ★★★. ★★★ already means the fewest taps and no helpers, so the goals are about *how* the level is solved: the
 * order of the taps, or the darkness. Each level's goal is picked the same way every time (seeded by its id) from
 * the goals its board allows: a goal is offered only with a witness, taps that solve the level within its move
 * limit and meet the goal (a test replays every level's witness), and preferably only when some ★★★ order misses
 * it (so it's a real extra). Meeting it the first time pays a few sparks.
 *
 * - combo: light 2+ gems with one tap
 * - firstGem: the marked gem is the first one the light reaches (on its own)
 * - lastGem: the marked gem is the last one lit (on its own, by the tap that solves the level)
 * - followLight: only turn pieces the light is touching
 * - untouched: never turn the marked piece (another finish turns it, this one doesn't)
 * - burnAll: burn every one of Smudge's creeping shadows before the end
 * - noHelpers: the fallback when the board allows none of the others
 */
export const BONUS_GOAL_KINDS = ['combo', 'firstGem', 'lastGem', 'followLight', 'untouched', 'burnAll', 'noHelpers'];

/** Sparks for meeting a level's bonus goal the first time. Must match _bonus_goal_sparks() in supabase/bonus_goals.sql. */
export const BONUS_GOAL_SPARKS = 10;

/** Built-in main-road levels have a bonus goal, except the first steps (1-1 to 1-3), which teach the basics. */
export const hasBonusGoal = (levelId) => /^w\d+-\d+$/.test(levelId) && !/^w1-0[1-3]$/.test(levelId);

/** Random tap orders tried per level to find witnesses and to see which goals ★★★ doesn't already give. */
const SAMPLE_ORDERS = 16;

const popcount = (n) => {
  let count = 0;
  for (; n; n &= n - 1) count++;
  return count;
};
const bitsOf = (mask, size) => Array.from({ length: size }, (_, g) => g).filter((g) => (mask >> g) & 1);

/**
 * What a try did so far, as the game counts it: the first gems a tap lit (`firstLit`), the most gems one tap lit
 * (`bestCombo`), the gems the latest tap lit (`lastLit`), whether a piece out of the light was turned (`offLight`),
 * shadows burned, taps made (`history`, undone ones too) and helpers used.
 */
export const freshPlay = () => ({
  history: [],
  usedHelpers: [],
  firstLit: null,
  lastLit: [],
  bestCombo: 0,
  offLight: false,
  burned: 0,
  isSolved: false,
});

/**
 * One tap's effect on the play record: `litBefore` and `litAfter` are the lit gem tile indexes around it, and
 * `wasInLight` says whether the light touched the tapped piece.
 */
export function playAfterTap(play, tileIndex, { litBefore, litAfter, wasInLight }) {
  const newlyLit = [...litAfter].filter((i) => !litBefore.has(i));
  return {
    ...play,
    history: [...play.history, tileIndex],
    offLight: play.offLight || !wasInLight,
    firstLit: play.firstLit ?? (newlyLit.length ? newlyLit : null),
    lastLit: newlyLit,
    bestCombo: Math.max(play.bestCombo, newlyLit.length >= 2 ? newlyLit.length : 0),
  };
}

/**
 * Play taps from the start, the darkness included: the play record at the end (plus `lost` when the darkness won).
 * For finding witnesses and for tests.
 */
export function playTaps(level, taps, cells = buildCellIndex(level)) {
  const orients = level.tiles.map((tile) => tile.orient ?? 0);
  const isDark = hasDarkness(level);
  let dark = isDark ? darknessStart(level, orients, cells) : null;
  let trace = dark ? dark.trace : traceBeams(level, orients, cells);
  let play = freshPlay();
  for (const [n, tileIndex] of taps.entries()) {
    const wasInLight = tilesInLight(level, trace).has(tileIndex);
    for (const i of rotationGroup(level.tiles, tileIndex)) orients[i] ^= 1;
    dark = isDark ? darknessStep(level, dark, orients, n + 1, cells) : null;
    const next = dark ? dark.trace : traceBeams(level, orients, cells);
    play = playAfterTap(play, tileIndex, { litBefore: trace.litGems, litAfter: next.litGems, wasInLight });
    trace = next;
    if (dark?.lost) break; // the darkness won: nothing more to count
  }
  return { ...play, burned: dark?.burned.size ?? 0, isSolved: trace.isSolved && !dark?.lost, lost: Boolean(dark?.lost) };
}

/**
 * Where a try stands on the goal: 'done', 'missed' (can't be met any more this try) or 'open'. Goals that are
 * about the whole solve (never turn a piece, no helpers) are done only once the level is solved.
 */
export function bonusGoalState(goal, play) {
  switch (goal.kind) {
    case 'combo':
      return play.bestCombo >= 2 ? 'done' : 'open';
    case 'firstGem':
      if (!play.firstLit) return 'open';
      return play.firstLit.length === 1 && play.firstLit[0] === goal.tile ? 'done' : 'missed';
    case 'lastGem':
      return play.isSolved && play.lastLit.length === 1 && play.lastLit[0] === goal.tile ? 'done' : 'open';
    case 'followLight':
      if (play.offLight) return 'missed';
      return play.isSolved ? 'done' : 'open';
    case 'untouched':
      if (play.history.some((tileIndex) => goal.tiles.includes(tileIndex))) return 'missed';
      return play.isSolved ? 'done' : 'open';
    case 'burnAll':
      return play.burned >= goal.count ? 'done' : 'open';
    case 'noHelpers':
      if (play.usedHelpers.length) return 'missed';
      return play.isSolved ? 'done' : 'open';
    default:
      return 'open';
  }
}

/** Was the bonus goal met on this win? (A Skip never meets it.) */
export const isBonusGoalMet = (goal, play) => Boolean(goal) && play.isSolved && bonusGoalState(goal, play) === 'done';

/** The tile indexes the light touches now (a piece is "in the light" when a beam reaches its cell). */
export function tilesInLight(level, trace) {
  const lit = cellsOnBeams(trace.segments, level.width, level.height);
  return new Set(level.tiles.flatMap((tile, i) => (lit.has(tile.y * level.width + tile.x) ? [i] : [])));
}

/**
 * A quick order of taps, greedy: each move, a tap the darkness doesn't win with that burns, saves and lights the most
 * (with `random`, a little noise picks among the good ones). With `followLight` only pieces in the light are tapped.
 * @returns the tile index tapped at each move, or null when it gets stuck
 */
function greedyOrder(level, start, tapGroups, cells, { random = null, followLight = false } = {}) {
  const isDark = hasDarkness(level);
  const step = (state, orients, moves) => (isDark ? darknessStep(level, state, orients, moves, cells) : { trace: traceBeams(level, orients, cells) });
  const orients = start.slice();
  let state = isDark ? darknessStart(level, orients, cells) : { trace: traceBeams(level, orients, cells) };
  const left = tapGroups.map((_, t) => t);
  const taps = [];
  while (left.length) {
    const inLight = followLight ? tilesInLight(level, state.trace) : null;
    let best = null;
    for (const t of left) {
      const tile = inLight ? tapGroups[t].find((i) => inLight.has(i)) : tapGroups[t][0];
      if (tile === undefined) continue;
      for (const i of tapGroups[t]) orients[i] ^= 1;
      const next = step(state, orients, taps.length + 1);
      for (const i of tapGroups[t]) orients[i] ^= 1;
      if (next.lost) continue;
      const score = (next.burned?.size ?? 0) * 4 + (next.saved?.size ?? 0) * 2 + next.trace.litGems.size + (random ? random.next() * 3 : 0);
      if (!best || score > best.score) best = { t, tile, next, score };
    }
    if (!best) return null;
    for (const i of tapGroups[best.t]) orients[i] ^= 1;
    state = best.next;
    taps.push(best.tile);
    left.splice(left.indexOf(best.t), 1);
  }
  return state.trace.isSolved ? taps : null;
}

/**
 * Finishes within the move limit (fewest taps first) and the orders to try them in (tile indexes to tap): each
 * finish's taps as found, orders the darkness can't win, orders that follow the light, and seeded random ones.
 */
function ordersToTry(level, analysis, cells) {
  const start = level.tiles.map((tile) => tile.orient ?? 0);
  const limit = moveLimitFor(level.par, level.difficulty);
  const { groups } = analysis;
  const finishes = analysis.solutions
    .filter((solution) => popcount(solution.mask) <= limit)
    .sort((a, b) => popcount(a.mask) - popcount(b.mask))
    .map((solution) => ({ ...solution, taps: bitsOf(solution.mask, groups.length) }));
  if (!finishes.length) return { finishes, orders: [] };
  const random = createRandom(`bonus-orders-${level.id}`);
  const best = finishes[0].taps;
  const tapGroups = best.map((g) => groups[g]);
  const orders = finishes.map((finish) => finish.taps);
  for (let n = 0; n < SAMPLE_ORDERS; n++) orders.push(random.shuffle(random.pick(finishes.slice(0, 2)).taps));
  // On calm boards, each tap of the best finish last and first, to give combos and first and last gems a fair chance
  // (with the darkness most of those orders lose).
  for (const g of hasDarkness(level) ? [] : best) {
    const rest = best.filter((other) => other !== g);
    orders.push([...rest, g], [g, ...rest]);
  }
  const tileOrders = orders.map((taps) => taps.map((g) => groups[g][0]));
  const greedy = (options) => greedyOrder(level, start, tapGroups, cells, options);
  for (let n = 0; n < 4; n++) tileOrders.push(greedy({ followLight: true, random: n ? random : null }));
  if (hasDarkness(level)) {
    // Orders the darkness can't win: quick greedy ones (a few with a pinch of chance), the full search if those fail.
    const safe = Array.from({ length: SAMPLE_ORDERS / 2 }, (_, n) => greedy({ random: n ? random : null }));
    if (!safe.some(Boolean)) safe.push(findSafeOrder(level, start, tapGroups, null, 0, cells)?.map((t) => tapGroups[t][0]));
    tileOrders.push(...safe);
  }
  return { finishes, orders: tileOrders.filter(Boolean) };
}

/**
 * Every goal this board allows, each with a witness (tile indexes to tap, in order) and whether some ★★★ order
 * misses it (`isExtra`).
 * @returns [{ goal, taps, isExtra }]
 */
export function bonusGoalCandidates(level, analysis = analyzeLevel(level)) {
  const cells = buildCellIndex(level);
  const { finishes, orders } = ordersToTry(level, analysis, cells);
  if (!finishes.length) return [];
  const { groups } = analysis;
  const par = finishes[0].taps.length;
  const plays = orders.map((taps) => ({ taps, play: playTaps(level, taps, cells) })).filter(({ play }) => play.isSolved);
  if (!plays.length) return [];
  const perfect = plays.filter(({ taps }) => taps.length <= par);
  const gems = level.tiles.flatMap((tile, i) => (tile.type === TILE.GEM ? [i] : []));
  const goals = [
    { kind: 'combo' },
    { kind: 'followLight' },
    ...gems.flatMap((tile) => [
      { kind: 'firstGem', tile },
      { kind: 'lastGem', tile },
    ]),
  ];
  if (level.glooms?.length) goals.push({ kind: 'burnAll', count: level.glooms.length });
  // A piece one finish turns and another leaves alone (for ★★★ players, leaving it is the twist).
  const turnedSomewhere = new Set(finishes.flatMap((finish) => finish.taps));
  for (const g of turnedSomewhere) {
    if (finishes.some((finish) => !finish.taps.includes(g))) goals.push({ kind: 'untouched', tiles: groups[g].slice() });
  }

  const candidates = goals.flatMap((goal) => {
    const witness = plays.find(({ play }) => isBonusGoalMet(goal, play));
    return witness ? [{ goal, taps: witness.taps, isExtra: perfect.some(({ play }) => !isBonusGoalMet(goal, play)) }] : [];
  });
  return [...candidates, { goal: { kind: 'noHelpers' }, taps: plays[0].taps, isExtra: false }];
}

/** The level's bonus goal with its witness taps, or null (not a main-road level, or no finish found). */
export function bonusGoalWithWitness(level, analysis) {
  if (!hasBonusGoal(level.id)) return null;
  const candidates = bonusGoalCandidates(level, analysis);
  // Goals ★★★ doesn't already give come first; then any the board allows (No helpers is the last resort).
  const extras = candidates.filter((candidate) => candidate.isExtra);
  const others = candidates.filter((candidate) => candidate.goal.kind !== 'noHelpers');
  const pool = extras.length ? extras : others.length ? others : candidates;
  if (!pool.length) return null;
  // A kind first (so each comes up as often, however many gems or pieces a board has), then one of its goals.
  const pick = (items, salt) => items[hashString(`${salt}-${level.id}`) % items.length];
  const kind = pick([...new Set(pool.map((candidate) => candidate.goal.kind))], 'bonus');
  return pick(
    pool.filter((candidate) => candidate.goal.kind === kind),
    'bonus-pick',
  );
}

/** The level's bonus goal ({ kind, … }), or null. */
export const bonusGoalFor = (level, analysis) => bonusGoalWithWitness(level, analysis)?.goal ?? null;

/** Has this level's bonus goal been met before? */
export const isBonusGoalDone = (progress, levelId) => progress.bonusGoals.includes(levelId);

/** A guest meets a bonus goal: remembered, and the first time pays sparks. Mirrors claim_bonus_goals() in supabase/bonus_goals.sql. */
export function recordBonusGoalLocally(progress, levelId) {
  if (isBonusGoalDone(progress, levelId)) return { progress, sparksEarned: 0 };
  return {
    progress: { ...progress, sparks: progress.sparks + BONUS_GOAL_SPARKS, bonusGoals: [...progress.bonusGoals, levelId] },
    sparksEarned: BONUS_GOAL_SPARKS,
  };
}

/** Bonus goals met on this device or on the account (accounts sync them through the server). */
export const mergeBonusGoals = (local = [], server = []) => [...new Set([...local, ...server])];
