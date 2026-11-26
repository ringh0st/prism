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

/**
 * Boosters: picked on the level card before a level starts (from World 2, in the main road only) and used up
 * at the start. They're held and bought like helpers (the same inventory, cap and 3-a-day sparks limit), but
 * never for diamonds. Spare Moves and Undo never touch the stars; Head Start counts like a Hint (★★ at most).
 */
export const BOOSTERS = {
  spareMoves: {
    id: 'spareMoves',
    name: 'Spare Moves',
    icon: 'plus',
    description: '3 more moves for this level. Stars still count your taps.',
    starCap: 3,
    moves: 3,
  },
  steadyHand: {
    id: 'steadyHand',
    name: 'Undo',
    icon: 'undo',
    description: 'Take back up to 2 taps. They don’t use up your moves.',
    starCap: 3,
    undos: 2,
  },
  headStart: {
    id: 'headStart',
    name: 'Head Start',
    icon: 'spark',
    description: 'Lumi turns one mirror into place before you start.',
    starCap: 2,
  },
};

export const BOOSTER_IDS = Object.keys(BOOSTERS);
/** Boosters open from this world on. */
export const BOOSTERS_FROM_WORLD = 2;
/** Boosters are offered (Shop, presents) once World 1's 20 levels are solved, when they can first be used. */
export const BOOSTERS_AFTER_SOLVED = (BOOSTERS_FROM_WORLD - 1) * 20;
export const areBoostersOpen = (solvedCount) => solvedCount >= BOOSTERS_AFTER_SOLVED;

/** A helper or a booster by id. */
export const toolFor = (id) => HELPERS[id] ?? BOOSTERS[id] ?? null;

/** You can hold at most this many of each helper. */
export const INVENTORY_CAP = 5;

/** Helpers bought with sparks per day (diamond purchases aren't limited). */
export const DAILY_SPARK_PURCHASE_LIMIT = 3;

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
  { id: 'spareMoves', kind: 'helper', price: { sparks: 60 }, grants: { helper: 'spareMoves', quantity: 1 } },
  { id: 'steadyHand', kind: 'helper', price: { sparks: 60 }, grants: { helper: 'steadyHand', quantity: 1 } },
  { id: 'headStart', kind: 'helper', price: { sparks: 60 }, grants: { helper: 'headStart', quantity: 1 } },
  { id: 'sparks-small', kind: 'sparks', price: { diamonds: 2 }, grants: { sparks: 150 } },
  { id: 'sparks-medium', kind: 'sparks', price: { diamonds: 5 }, grants: { sparks: 400 } },
  { id: 'sparks-large', kind: 'sparks', price: { diamonds: 10 }, grants: { sparks: 1000 } },
];

/** Real-money diamond packs. Prices are set at the payment provider (Stripe; Lemon Squeezy until March 2027; EUR); these are for display and must match. */
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

/** The strictest star cap among the helpers (and boosters) used this attempt (3 if none). */
export function starCapForHelpers(usedHelperIds) {
  return usedHelperIds.reduce((cap, id) => Math.min(cap, toolFor(id)?.starCap ?? 3), 3);
}
