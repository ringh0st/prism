import { DIFFICULTY } from './constants.js';

/**
 * The game economy in one place. The database (supabase/economy.sql) enforces the same
 * prices for signed-in players; game.test.js checks the two stay in sync.
 *
 * Currencies:
 *  - sparks:   earned by playing (stars, daily puzzle). Can't be bought with money directly.
 *  - diamonds: premium. Earned by finishing worlds and weekly streaks, or bought. Account required.
 */

export const HELPERS = {
  hint: {
    id: 'hint',
    name: 'Hint',
    icon: 'hint',
    description: 'Highlights one piece to rotate.',
    starCap: 2,
  },
  lens: {
    id: 'lens',
    name: 'Lens',
    icon: 'lens',
    description: 'Shows the solved light path for 6 seconds.',
    starCap: 2,
  },
  autoturn: {
    id: 'autoturn',
    name: 'Auto-turn',
    icon: 'wand',
    description: 'Turns one piece into place for you.',
    starCap: 1,
  },
  skip: {
    id: 'skip',
    name: 'Skip',
    icon: 'skip',
    description: 'Completes the level with 1 star.',
    starCap: 1,
  },
};

export const HELPER_IDS = Object.keys(HELPERS);

/** You can hold at most this many of each helper. */
export const INVENTORY_CAP = 5;

/** Helpers bought with sparks per day (diamond purchases aren't limited). */
export const DAILY_SPARK_PURCHASE_LIMIT = 3;

/** How many helpers can be used in one attempt at a level. */
export const HELPERS_PER_ATTEMPT = {
  [DIFFICULTY.NORMAL]: 3,
  [DIFFICULTY.HARD]: 2,
  [DIFFICULTY.EXTRA]: 1,
};

export const LENS_DURATION_MS = 6000;

/**
 * Store items. `price` lists every currency the item can be bought with.
 * `grants` is what the player receives.
 */
export const STORE_ITEMS = [
  { id: 'hint', kind: 'helper', price: { sparks: 15, diamonds: 1 }, grants: { helper: 'hint', quantity: 1 } },
  { id: 'lens', kind: 'helper', price: { sparks: 40, diamonds: 1 }, grants: { helper: 'lens', quantity: 1 } },
  { id: 'autoturn', kind: 'helper', price: { diamonds: 2 }, grants: { helper: 'autoturn', quantity: 1 } },
  { id: 'skip', kind: 'helper', price: { diamonds: 5 }, grants: { helper: 'skip', quantity: 1 } },
  { id: 'sparks-small', kind: 'sparks', price: { diamonds: 2 }, grants: { sparks: 150 } },
  { id: 'sparks-medium', kind: 'sparks', price: { diamonds: 5 }, grants: { sparks: 400 } },
  { id: 'sparks-large', kind: 'sparks', price: { diamonds: 10 }, grants: { sparks: 1000 } },
];

/** Real-money diamond packs. Prices are set in Lemon Squeezy (store currency: EUR); these are for display and must match. */
export const DIAMOND_PACKS = [
  { id: 'diamonds-10', diamonds: 10, bonus: 0, displayPrice: '€0.99' },
  { id: 'diamonds-60', diamonds: 50, bonus: 10, displayPrice: '€4.99', tag: 'Popular' },
  { id: 'diamonds-130', diamonds: 100, bonus: 30, displayPrice: '€9.99', tag: 'Best value' },
];

/** Diamonds the game hands out. */
export const DIAMOND_REWARDS = {
  worldComplete: 1,
  worldPerfect: 1,
  streakWeek: 1,
};

/**
 * Weekly top players (worldwide, signed-in players). The week runs Monday to Sunday, UTC.
 * Score: +1 per new star earned, +3 per daily puzzle. Must match supabase/social.sql.
 */
export const WEEKLY_POINTS = { perNewStar: 1, perDaily: 3 };
export const WEEKLY_REWARDS = [
  { rank: 1, diamonds: 5, sparks: 500 },
  { rank: 2, diamonds: 3, sparks: 300 },
  { rank: 3, diamonds: 2, sparks: 200 },
  ...[4, 5, 6, 7, 8, 9, 10].map((rank) => ({ rank, diamonds: 0, sparks: 100 })),
];

export const weeklyRewardFor = (rank) => WEEKLY_REWARDS.find((reward) => reward.rank === rank) ?? null;

export const storeItem = (id) => STORE_ITEMS.find((item) => item.id === id) ?? null;

/** The strictest star cap among the helpers used this attempt (3 if none). */
export function starCapForHelpers(usedHelperIds) {
  return usedHelperIds.reduce((cap, id) => Math.min(cap, HELPERS[id]?.starCap ?? 3), 3);
}

export function helpersAllowedFor(difficulty) {
  return HELPERS_PER_ATTEMPT[difficulty] ?? HELPERS_PER_ATTEMPT[DIFFICULTY.NORMAL];
}
