import { EconomyError } from './progress.js';

/**
 * The Grove: the Pals' home in the enchanted forest. Decor is bought with sparks (never random, never
 * diamonds-only) and placed in spots, one item per spot. Prices must match supabase/grove.sql (a test checks).
 */
export const GROVE_SPOTS = [
  { id: 'home', name: 'Homes' },
  { id: 'seat', name: 'Seats & swings' },
  { id: 'light', name: 'Lights' },
  { id: 'garden', name: 'Garden' },
  { id: 'water', name: 'Water' },
  { id: 'sky', name: 'Sky' },
];

export const GROVE_ITEMS = [
  { id: 'mushroomHouse', name: 'Mushroom house', spot: 'home', price: 120 },
  { id: 'acornCottage', name: 'Acorn cottage', spot: 'home', price: 160 },
  { id: 'treehouse', name: 'Treehouse', spot: 'home', price: 220 },
  { id: 'logBench', name: 'Log bench', spot: 'seat', price: 40 },
  { id: 'treeSwing', name: 'Tree swing', spot: 'seat', price: 90 },
  { id: 'hammock', name: 'Hammock', spot: 'seat', price: 110 },
  { id: 'fireflyJar', name: 'Firefly jar', spot: 'light', price: 50 },
  { id: 'glowShrooms', name: 'Glow mushrooms', spot: 'light', price: 70 },
  { id: 'lanternString', name: 'Lantern string', spot: 'light', price: 90 },
  { id: 'flowerPatch', name: 'Flower patch', spot: 'garden', price: 40 },
  { id: 'berryBush', name: 'Berry bush', spot: 'garden', price: 60 },
  { id: 'pumpkinPatch', name: 'Pumpkin patch', spot: 'garden', price: 75 },
  { id: 'lilyPond', name: 'Lily pond', spot: 'water', price: 90 },
  { id: 'wishingWell', name: 'Wishing well', spot: 'water', price: 120 },
  { id: 'fountain', name: 'Stone fountain', spot: 'water', price: 150 },
  { id: 'kites', name: 'Kites', spot: 'sky', price: 80 },
  { id: 'moonStars', name: 'Moon & stars', spot: 'sky', price: 100 },
  { id: 'rainbow', name: 'Rainbow', spot: 'sky', price: 150 },
];

export const groveItemById = (id) => GROVE_ITEMS.find((item) => item.id === id) ?? null;

/** @throws EconomyError */
export function buyGroveItemLocally(progress, itemId) {
  const item = groveItemById(itemId);
  if (!item) throw new EconomyError('That decor is not in the shop.');
  if (progress.grove.items.includes(itemId)) throw new EconomyError('You already have this.');
  if (progress.sparks < item.price) throw new EconomyError('Not enough sparks.');
  return { ...progress, sparks: progress.sparks - item.price, grove: { ...progress.grove, items: [...progress.grove.items, itemId] } };
}

/** Place owned decor in its spot (replacing what was there) or put it away. @throws EconomyError */
export function placeGroveItemLocally(progress, itemId, isPlacing) {
  const item = groveItemById(itemId);
  if (!item) throw new EconomyError('That decor is not in the shop.');
  if (isPlacing && !progress.grove.items.includes(itemId)) throw new EconomyError('Buy it first.');
  const others = progress.grove.placed.filter((id) => groveItemById(id)?.spot !== item.spot);
  return { ...progress, grove: { ...progress.grove, placed: isPlacing ? [...others, itemId] : others } };
}
