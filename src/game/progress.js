import { sparksForDaily, sparksForNewStars, starsForMoves, STARTING_SPARKS } from './scoring.js';
import { daysBetween } from './daily.js';
import { DAILY_GIFT_SPARKS, DAILY_SPARK_PURCHASE_LIMIT, HELPER_IDS, INVENTORY_CAP, storeItem } from './catalog.js';

export const BEAM_THEMES = [
  { id: 'sunbeam', name: 'Sunbeam', color: '#FFD23F', starsToUnlock: 0 },
  { id: 'ember', name: 'Ember', color: '#FF7A45', starsToUnlock: 30 },
  { id: 'mint', name: 'Mint', color: '#3FE0C5', starsToUnlock: 60 },
  { id: 'blossom', name: 'Blossom', color: '#FF7EA6', starsToUnlock: 100 },
];

/** A streak shield covers one missed day. One is earned every 7-day streak, up to this many. */
export const MAX_STREAK_SHIELDS = 2;
export const STREAK_SHIELD_EVERY = 7;

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
    daily: { streak: 0, lastDate: null, shields: 0 },
    beamTheme: 'sunbeam',
    claimedChests: [],
    hotStreak: 0,
    giftDate: null,
    pal: { id: null, owned: {}, accessories: [], wearing: [] },
    grove: { items: [], placed: [] },
    luckyPals: { claimed: 0 },
    // Weekend events: { [saturday]: { stars: { [number]: stars }, claimed } } (see events.js).
    events: {},
    // Treats eaten (how many were found comes from the solved levels; see treats.js).
    treatsFed: 0,
    // This week's Pal quests: { week, solved, perfect, hard, claimed } (see quests.js).
    quests: null,
    // This week's Light Rush best and paid milestones: { week, best, paid } (see rush.js).
    rush: null,
    // A guest's number for their daily Shop picks (accounts use their id instead).
    shopSeed: Math.floor(Math.random() * 1000),
    nickname: null,
  };
}

/** Older saves wore a single `accessory`; Pals now wear one item per slot in `wearing`. */
function upgradePal({ accessory, ...pal }) {
  return accessory && pal.wearing.length === 0 ? { ...pal, wearing: [accessory] } : pal;
}

/** Fill in fields added after a player's progress was first saved. */
export function upgradeProgress(saved) {
  const empty = createEmptyProgress();
  return {
    ...empty,
    ...saved,
    helpers: { ...empty.helpers, ...saved?.helpers },
    daily: { ...empty.daily, ...saved?.daily },
    pal: upgradePal({ ...empty.pal, ...saved?.pal }),
    grove: { ...empty.grove, ...saved?.grove },
    luckyPals: { ...empty.luckyPals, ...saved?.luckyPals },
  };
}

export const totalStars = (progress) => Object.values(progress.levels).reduce((sum, entry) => sum + entry.stars, 0);

export const starsFor = (progress, levelId) => progress.levels[levelId]?.stars ?? 0;

export const isWorldComplete = (progress, worldLevels) => worldLevels.length > 0 && worldLevels.every((level) => starsFor(progress, level.id) > 0);

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
  // Only beating an earlier result counts as a new best (a first clear is just a clear).
  const isNewBest = Number.isFinite(moves) && Boolean(previous) && Number.isFinite(previous.bestMoves) && moves < previous.bestMoves;
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

/**
 * The forgiving daily streak. Mirrors public.record_daily() in supabase/social.sql.
 * Missed days are covered by shields when there are enough; every 7th day earns a shield.
 * @returns {{ streak, shields, shieldsUsed, shieldEarned }}
 */
export function nextDailyStreak(daily, dateKey) {
  const gap = daysBetween(daily.lastDate, dateKey);
  const shields = daily.shields ?? 0;
  const missedDays = gap === null ? Infinity : gap - 1;
  const keepsStreak = missedDays === 0 || (missedDays > 0 && missedDays <= shields);
  const streak = keepsStreak ? daily.streak + 1 : 1;
  const shieldsUsed = keepsStreak ? missedDays : 0;
  const shieldEarned = streak % STREAK_SHIELD_EVERY === 0 && shields - shieldsUsed < MAX_STREAK_SHIELDS;
  return { streak, shields: shields - shieldsUsed + (shieldEarned ? 1 : 0), shieldsUsed, shieldEarned };
}

/** Daily puzzle: extends the streak (shields cover missed days) and pays out once per day. */
export function recordDailyResult(progress, dateKey) {
  const { daily } = progress;
  if (daily.lastDate === dateKey) {
    return { progress, sparksEarned: 0, diamondsEarned: 0, streak: daily.streak, shieldsUsed: 0, shieldEarned: false, isFirstToday: false };
  }
  const { streak, shields, shieldsUsed, shieldEarned } = nextDailyStreak(daily, dateKey);
  const sparksEarned = sparksForDaily(streak);
  return {
    progress: { ...progress, sparks: progress.sparks + sparksEarned, daily: { streak, lastDate: dateKey, shields } },
    sparksEarned,
    diamondsEarned: 0,
    streak,
    shieldsUsed,
    shieldEarned,
    isFirstToday: true,
  };
}

/** A streak is "alive" while the missed days since the last daily can still be covered by shields. */
export function currentStreak(progress, today) {
  const { lastDate, streak, shields = 0 } = progress.daily;
  const gap = daysBetween(lastDate, today);
  return gap !== null && gap - 1 <= shields ? streak : 0;
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

/** The daily gift is waiting when it hasn't been collected today. */
export const isDailyGiftReady = (progress, today) => progress.giftDate !== today;

/** Guest daily gift. Mirrors public.claim_daily_gift() in supabase/social.sql. @throws EconomyError */
export function claimDailyGiftLocally(progress, today) {
  if (!isDailyGiftReady(progress, today)) throw new EconomyError('You already opened today’s gift. Come back tomorrow!');
  return { ...progress, sparks: progress.sparks + DAILY_GIFT_SPARKS, giftDate: today };
}

/** Consecutive levels solved with three stars and no helpers (just for fun and bragging). */
/** Perfect solves in a row; replaying a level that already had ★★★ keeps the streak but doesn't add to it. */
export const nextHotStreak = (progress, { stars, usedHelpers, previousStars = 0 }) =>
  stars === 3 && !usedHelpers ? progress.hotStreak + (previousStars === 3 ? 0 : 1) : 0;

/** Apply balances returned by the server (signed-in players). */
export function withServerState(progress, state, today) {
  return {
    ...progress,
    sparks: state.sparks,
    diamonds: state.diamonds,
    helpers: { ...STARTER_HELPERS, ...state.helpers },
    daily: { streak: state.dailyStreak, lastDate: state.lastDailyDate, shields: state.streakShields ?? 0 },
    sparkPurchases: { date: today, count: state.sparkPurchasesToday },
    claimedChests: state.claimedChests ?? progress.claimedChests,
    giftDate: state.lastGiftDate ?? progress.giftDate,
    // The account's Pals win, unless the account has none yet (then keep this device's choice).
    pal: state.pal?.id ? state.pal : progress.pal,
    grove: state.grove ?? progress.grove,
    luckyPals: { claimed: state.luckyPalsClaimed ?? progress.luckyPals.claimed },
    events: state.events ?? progress.events,
    quests: state.quests ?? progress.quests,
    rush: state.rush ?? progress.rush,
  };
}
