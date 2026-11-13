import { sparksForDaily, sparksForNewStars, starsForMoves, STARTING_SPARKS } from './scoring.js';
import { isYesterday } from './daily.js';
import { DAILY_SPARK_PURCHASE_LIMIT, HELPER_IDS, INVENTORY_CAP, storeItem } from './catalog.js';

export const BEAM_THEMES = [
  { id: 'sunbeam', name: 'Sunbeam', color: '#FFD23F', starsToUnlock: 0 },
  { id: 'ember', name: 'Ember', color: '#FF7A45', starsToUnlock: 30 },
  { id: 'mint', name: 'Mint', color: '#3FE0C5', starsToUnlock: 60 },
  { id: 'blossom', name: 'Blossom', color: '#FF7EA6', starsToUnlock: 100 },
];

/** Every new player starts with one Hint and one Lens to discover helpers. */
export const STARTER_HELPERS = { hint: 1, lens: 1, autoturn: 0, skip: 0 };

/** A friendly, player-facing economy error (not enough sparks, limit reached…). */
export class EconomyError extends Error {}

export function createEmptyProgress() {
  return {
    levels: {},
    sparks: STARTING_SPARKS,
    diamonds: 0,
    helpers: { ...STARTER_HELPERS },
    sparkPurchases: { date: null, count: 0 },
    daily: { streak: 0, lastDate: null },
    beamTheme: 'sunbeam',
    claimedChests: [],
    hotStreak: 0,
  };
}

/** Fill in fields added after a player's progress was first saved. */
export function upgradeProgress(saved) {
  const empty = createEmptyProgress();
  return { ...empty, ...saved, helpers: { ...empty.helpers, ...saved?.helpers } };
}

export const totalStars = (progress) => Object.values(progress.levels).reduce((sum, entry) => sum + entry.stars, 0);

export const starsFor = (progress, levelId) => progress.levels[levelId]?.stars ?? 0;

export const isWorldComplete = (progress, worldLevels) =>
  worldLevels.length > 0 && worldLevels.every((level) => starsFor(progress, level.id) > 0);

/**
 * Record a finished level.
 * @param result { moves, starCap = 3, forcedStars } forcedStars is used by Skip.
 * @returns {{ progress, stars, previousStars, sparksEarned, isNewBest }}
 */
export function recordLevelResult(progress, level, { moves, starCap = 3, forcedStars = null }) {
  const stars = forcedStars ?? Math.min(starsForMoves(moves, level.par, level.difficulty), starCap);
  const previous = progress.levels[level.id];
  const previousStars = previous?.stars ?? 0;
  const sparksEarned = sparksForNewStars(previousStars, stars, level.difficulty);
  const bestMoves = [previous?.bestMoves, moves].filter((m) => Number.isFinite(m));
  const isNewBest = Number.isFinite(moves) && (!previous || !Number.isFinite(previous.bestMoves) || moves < previous.bestMoves);
  const next = {
    ...progress,
    sparks: progress.sparks + sparksEarned,
    levels: {
      ...progress.levels,
      [level.id]: {
        stars: Math.max(stars, previousStars),
        bestMoves: bestMoves.length ? Math.min(...bestMoves) : null,
      },
    },
  };
  return { progress: next, stars, previousStars, sparksEarned, isNewBest };
}

/** Daily puzzle: extends the streak if yesterday was played, pays out once per day. */
export function recordDailyResult(progress, dateKey) {
  const { daily } = progress;
  if (daily.lastDate === dateKey) return { progress, sparksEarned: 0, diamondsEarned: 0, streak: daily.streak, isFirstToday: false };
  const streak = isYesterday(daily.lastDate, dateKey) ? daily.streak + 1 : 1;
  const sparksEarned = sparksForDaily(streak);
  return {
    progress: { ...progress, sparks: progress.sparks + sparksEarned, daily: { streak, lastDate: dateKey } },
    sparksEarned,
    diamondsEarned: 0,
    streak,
    isFirstToday: true,
  };
}

/** A streak is only "alive" if the last daily was today or yesterday. */
export function currentStreak(progress, today) {
  const { lastDate, streak } = progress.daily;
  return lastDate === today || isYesterday(lastDate, today) ? streak : 0;
}

export function sparkPurchasesLeft(progress, today) {
  const used = progress.sparkPurchases.date === today ? progress.sparkPurchases.count : 0;
  return Math.max(0, DAILY_SPARK_PURCHASE_LIMIT - used);
}

/**
 * Guest purchases (sparks only). Mirrors the server rules in supabase/economy.sql.
 * @throws EconomyError with a player-facing message
 */
export function buyStoreItemLocally(progress, itemId, currency, today) {
  const item = storeItem(itemId);
  if (!item) throw new EconomyError('That item is not in the store.');
  if (currency !== 'sparks') throw new EconomyError('Sign in to use diamonds.');
  const price = item.price.sparks;
  if (!price) throw new EconomyError('This item needs diamonds. Sign in to get diamonds.');
  const helperId = item.grants.helper;
  if (helperId && progress.helpers[helperId] + item.grants.quantity > INVENTORY_CAP) {
    throw new EconomyError(`You already have the maximum of ${INVENTORY_CAP}.`);
  }
  if (item.kind === 'helper' && sparkPurchasesLeft(progress, today) === 0) {
    throw new EconomyError('Daily limit reached: 3 helpers with sparks per day. Come back tomorrow!');
  }
  if (progress.sparks < price) throw new EconomyError('Not enough sparks.');

  const usedToday = progress.sparkPurchases.date === today ? progress.sparkPurchases.count : 0;
  return {
    ...progress,
    sparks: progress.sparks - price + (item.grants.sparks ?? 0),
    helpers: helperId ? { ...progress.helpers, [helperId]: progress.helpers[helperId] + item.grants.quantity } : progress.helpers,
    sparkPurchases: { date: today, count: usedToday + (item.kind === 'helper' ? 1 : 0) },
  };
}

/** @throws EconomyError when the player has none left */
export function consumeHelperLocally(progress, helperId) {
  if (!HELPER_IDS.includes(helperId) || (progress.helpers[helperId] ?? 0) < 1) {
    throw new EconomyError('You don’t have that helper.');
  }
  return { ...progress, helpers: { ...progress.helpers, [helperId]: progress.helpers[helperId] - 1 } };
}

/** Levels needed to open a chest: the first 10 or all 20 levels of the world. */
export function isChestUnlocked(progress, worldLevelRefs, levelsNeeded) {
  const needed = worldLevelRefs.slice(0, levelsNeeded);
  return needed.length === levelsNeeded && needed.every((ref) => starsFor(progress, ref.id) > 0);
}

/** Guest chest opening. Mirrors public.claim_chest() in supabase/progression.sql. */
export function claimChestLocally(progress, chestKey, reward) {
  if (progress.claimedChests.includes(chestKey)) throw new EconomyError('You already opened this chest.');
  return {
    ...progress,
    sparks: progress.sparks + reward.sparks,
    helpers: { ...progress.helpers, [reward.helper]: Math.min(INVENTORY_CAP, (progress.helpers[reward.helper] ?? 0) + 1) },
    claimedChests: [...progress.claimedChests, chestKey],
  };
}

/** Consecutive levels solved with three stars and no helpers (just for fun and bragging). */
export const nextHotStreak = (progress, { stars, usedHelpers }) => (stars === 3 && !usedHelpers ? progress.hotStreak + 1 : 0);

/** Apply balances returned by the server (signed-in players). */
export function withServerState(progress, state, today) {
  return {
    ...progress,
    sparks: state.sparks,
    diamonds: state.diamonds,
    helpers: { ...STARTER_HELPERS, ...state.helpers },
    daily: { streak: state.dailyStreak, lastDate: state.lastDailyDate },
    sparkPurchases: { date: today, count: state.sparkPurchasesToday },
    claimedChests: state.claimedChests ?? progress.claimedChests,
  };
}
