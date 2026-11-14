import { EconomyError } from './progress.js';

/*
 * Weekly theme collections: each week (Monday, UTC) the Shop features one theme's outfit pieces and
 * Grove decor. Some cost sparks, the showpieces diamonds. Themes take turns, so every collection comes
 * back later in the year (no "now or never" pressure). Mirrors supabase/themed_shop.sql (a test checks).
 */
export const THEMES = [
  {
    id: 'elvenWoods',
    name: 'Elven Woods',
    tagline: 'Leaf crowns, wizard staffs and a glowing forest',
    icon: '🍃',
    items: [
      { id: 'leafCrown', name: 'Leaf crown', kind: 'outfit', slot: 'head', price: 140, currency: 'sparks' },
      { id: 'moonCirclet', name: 'Moon circlet', kind: 'outfit', slot: 'head', price: 20, currency: 'diamonds' },
      { id: 'elvenCloak', name: 'Elven cloak', kind: 'outfit', slot: 'neck', price: 15, currency: 'diamonds' },
      { id: 'woodStaff', name: 'Crystal staff', kind: 'outfit', slot: 'hand', price: 160, currency: 'sparks' },
      { id: 'glowTree', name: 'Glow tree', kind: 'decor', spot: 'light', price: 180, currency: 'sparks' },
      { id: 'moonPool', name: 'Moonlit pool', kind: 'decor', spot: 'water', price: 220, currency: 'sparks' },
      { id: 'elvenTower', name: 'Stone tower', kind: 'decor', spot: 'home', price: 30, currency: 'diamonds' },
    ],
  },
  {
    id: 'autumnHarvest',
    name: 'Autumn Harvest',
    tagline: 'Pumpkins, apples and cozy hay',
    icon: '🍂',
    items: [
      { id: 'pumpkinHat', name: 'Pumpkin hat', kind: 'outfit', slot: 'head', price: 140, currency: 'sparks' },
      { id: 'strawHat', name: 'Straw hat', kind: 'outfit', slot: 'head', price: 20, currency: 'diamonds' },
      { id: 'leafScarf', name: 'Autumn scarf', kind: 'outfit', slot: 'neck', price: 120, currency: 'sparks' },
      { id: 'appleBasket', name: 'Apple basket', kind: 'outfit', slot: 'hand', price: 15, currency: 'diamonds' },
      { id: 'hayBench', name: 'Hay bale seat', kind: 'decor', spot: 'seat', price: 180, currency: 'sparks' },
      { id: 'appleTree', name: 'Apple tree', kind: 'decor', spot: 'garden', price: 220, currency: 'sparks' },
      { id: 'jackLanterns', name: 'Pumpkin lanterns', kind: 'decor', spot: 'light', price: 30, currency: 'diamonds' },
    ],
  },
  {
    id: 'winterWonderland',
    name: 'Winter Wonderland',
    tagline: 'Snowmen, earmuffs and an ice crown',
    icon: '❄️',
    items: [
      { id: 'earmuffs', name: 'Earmuffs', kind: 'outfit', slot: 'head', price: 140, currency: 'sparks' },
      { id: 'iceCrown', name: 'Ice crown', kind: 'outfit', slot: 'head', price: 20, currency: 'diamonds' },
      { id: 'snowScarf', name: 'Snowflake scarf', kind: 'outfit', slot: 'neck', price: 120, currency: 'sparks' },
      { id: 'snowGlobe', name: 'Snow globe', kind: 'outfit', slot: 'hand', price: 15, currency: 'diamonds' },
      { id: 'snowman', name: 'Snowman', kind: 'decor', spot: 'garden', price: 180, currency: 'sparks' },
      { id: 'iceLantern', name: 'Ice lantern', kind: 'decor', spot: 'light', price: 200, currency: 'sparks' },
      { id: 'snowCabin', name: 'Snowy cabin', kind: 'decor', spot: 'home', price: 30, currency: 'diamonds' },
    ],
  },
  {
    id: 'pirateCove',
    name: 'Pirate Cove',
    tagline: 'Ahoy! Treasure, flags and a little ship',
    icon: '🏴‍☠️',
    items: [
      { id: 'bandana', name: 'Pirate bandana', kind: 'outfit', slot: 'head', price: 140, currency: 'sparks' },
      { id: 'captainHat', name: 'Captain’s hat', kind: 'outfit', slot: 'head', price: 20, currency: 'diamonds' },
      { id: 'captainCoat', name: 'Captain’s collar', kind: 'outfit', slot: 'neck', price: 15, currency: 'diamonds' },
      { id: 'spyglass', name: 'Spyglass', kind: 'outfit', slot: 'hand', price: 160, currency: 'sparks' },
      { id: 'treasureChest', name: 'Treasure chest', kind: 'decor', spot: 'garden', price: 200, currency: 'sparks' },
      { id: 'pirateFlag', name: 'Pirate flags', kind: 'decor', spot: 'sky', price: 180, currency: 'sparks' },
      { id: 'littleShip', name: 'Little ship', kind: 'decor', spot: 'water', price: 30, currency: 'diamonds' },
    ],
  },
];

const ALL_ITEMS = THEMES.flatMap((theme) => theme.items.map((item) => ({ ...item, theme: theme.id })));
export const THEME_OUTFITS = ALL_ITEMS.filter((item) => item.kind === 'outfit');
export const THEME_DECOR = ALL_ITEMS.filter((item) => item.kind === 'decor');
export const themeItemById = (id) => ALL_ITEMS.find((item) => item.id === id) ?? null;
export const themeById = (id) => THEMES.find((theme) => theme.id === id) ?? null;

const WEEK_MS = 7 * 86_400_000;
const FIRST_MONDAY = Date.UTC(2026, 0, 5);

/** This week's theme (weeks start Monday, UTC; themes take turns). */
export function themeOfWeek(date = new Date()) {
  const n = Math.floor((date.getTime() - FIRST_MONDAY) / WEEK_MS);
  return THEMES[((n % THEMES.length) + THEMES.length) % THEMES.length];
}

/** The theme after this one (shown as "Next week"). */
export const nextTheme = (date = new Date()) => themeOfWeek(new Date(date.getTime() + WEEK_MS));

export const isThemeItemOnSale = (id, date = new Date()) => themeOfWeek(date).items.some((item) => item.id === id);

/** What stands between the player and this item: null if they can buy it. */
export function themeItemBlocker(progress, item, { isSignedIn = false } = {}) {
  const owned = item.kind === 'outfit' ? progress.pal.accessories : progress.grove.items;
  if (owned.includes(item.id)) return 'owned';
  if (item.currency === 'diamonds' && !isSignedIn) return 'signIn';
  const balance = item.currency === 'diamonds' ? progress.diamonds : progress.sparks;
  return balance < item.price ? 'short' : null;
}

/** Buy a theme item on this device (guests: sparks only). @throws EconomyError */
export function buyThemeItemLocally(progress, itemId, date = new Date()) {
  const item = themeItemById(itemId);
  if (!item || !isThemeItemOnSale(itemId, date)) throw new EconomyError('That isn’t in this week’s collection.');
  const blocker = themeItemBlocker(progress, item);
  if (blocker === 'owned') throw new EconomyError('You already have this.');
  if (blocker === 'signIn') throw new EconomyError('Sign in to use diamonds.');
  if (blocker === 'short') throw new EconomyError(`Not enough ${item.currency}.`);
  const paid = item.currency === 'diamonds' ? { diamonds: progress.diamonds - item.price } : { sparks: progress.sparks - item.price };
  return item.kind === 'outfit'
    ? { ...progress, ...paid, pal: { ...progress.pal, accessories: [...progress.pal.accessories, itemId] } }
    : { ...progress, ...paid, grove: { ...progress.grove, items: [...progress.grove.items, itemId] } };
}
