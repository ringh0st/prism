import { EconomyError, totalStars } from './progress.js';
import { finishedWorldCount } from './titles.js';

/**
 * Pals: profile characters. You pick one starter on your first game, then unlock the rest by playing.
 * Each Pal evolves through five forms as you solve new levels with it as your partner. Must match supabase/pals.sql.
 *
 * unlock: what makes a Pal available (starters can also be picked as your very first Pal).
 * animal: the word used in your public nickname ("Sunny Fox 42").
 */
export const PALS = [
  { id: 'ember', name: 'Ember', species: 'Fox', animal: 'Fox', isStarter: true, unlock: { stars: 30 } },
  { id: 'mossy', name: 'Mossy', species: 'Turtle', animal: 'Turtle', isStarter: true, unlock: { stars: 60 } },
  { id: 'coral', name: 'Coral', species: 'Axolotl', animal: 'Axolotl', isStarter: true, unlock: { streak: 3 } },
  { id: 'mochi', name: 'Mochi', species: 'Kitten', animal: 'Kitten', unlock: { stars: 90 } },
  { id: 'hoot', name: 'Hoot', species: 'Owl', animal: 'Owl', unlock: { stars: 120 } },
  { id: 'waffles', name: 'Waffles', species: 'Puppy', animal: 'Puppy', unlock: { stars: 150 } },
  { id: 'peep', name: 'Peep', species: 'Chick', animal: 'Chick', unlock: { worlds: 1 } },
  { id: 'bruno', name: 'Bruno', species: 'Bear cub', animal: 'Bear', unlock: { stars: 200 } },
  { id: 'biscuit', name: 'Biscuit', species: 'Bunny', animal: 'Bunny', unlock: { worlds: 2 } },
  { id: 'truffle', name: 'Truffle', species: 'Piglet', animal: 'Piglet', unlock: { stars: 250 } },
  { id: 'pebble', name: 'Pebble', species: 'Hedgehog', animal: 'Hedgehog', unlock: { streak: 7 } },
  { id: 'quartz', name: 'Quartz', species: 'Gem', animal: 'Gem', unlock: { stars: 300 } },
  { id: 'ribbit', name: 'Ribbit', species: 'Frog', animal: 'Frog', unlock: { worlds: 3 } },
  { id: 'cotton', name: 'Cotton', species: 'Lamb', animal: 'Lamb', unlock: { stars: 350 } },
  { id: 'squeak', name: 'Squeak', species: 'Mouse', animal: 'Mouse', unlock: { stars: 400 } },
  { id: 'maple', name: 'Maple', species: 'Red panda', animal: 'Panda', unlock: { worlds: 5 } },
  { id: 'otto', name: 'Otto', species: 'Otter', animal: 'Otter', unlock: { stars: 500 } },
  { id: 'buzz', name: 'Buzz', species: 'Bee', animal: 'Bee', unlock: { streak: 14 } },
  { id: 'kiko', name: 'Kiko', species: 'Koala', animal: 'Koala', unlock: { stars: 600 } },
  { id: 'splash', name: 'Splash', species: 'Seal', animal: 'Seal', unlock: { stars: 700 } },
  { id: 'shroomy', name: 'Shroomy', species: 'Mushroom sprite', animal: 'Sprite', unlock: { worlds: 8 } },
  { id: 'bandit', name: 'Bandit', species: 'Raccoon', animal: 'Raccoon', unlock: { stars: 800 } },
  { id: 'waddles', name: 'Waddles', species: 'Penguin', animal: 'Penguin', unlock: { stars: 1000 } },
  { id: 'fawn', name: 'Fawn', species: 'Deer', animal: 'Deer', unlock: { stars: 1200 } },
  { id: 'shelly', name: 'Shelly', species: 'Snail', animal: 'Snail', unlock: { streak: 30 } },
  { id: 'inky', name: 'Inky', species: 'Octopus', animal: 'Octopus', unlock: { stars: 1500 } },
  { id: 'puff', name: 'Puff', species: 'Cloud', animal: 'Cloud', unlock: { worlds: 12 } },
  { id: 'twinkle', name: 'Twinkle', species: 'Star', animal: 'Star', unlock: { stars: 1800 } },
  { id: 'starla', name: 'Starla', species: 'Unicorn', animal: 'Unicorn', unlock: { stars: 2400 } },
  { id: 'ziggy', name: 'Ziggy', species: 'Dragon', animal: 'Dragon', unlock: { stars: 3000 } },
];

export const STARTER_PALS = PALS.filter((pal) => pal.isStarter);
export const palById = (id) => PALS.find((pal) => pal.id === id) ?? null;

/** Evolution: every 100 new levels solved while the Pal is your partner, it grows into its next form. */
export const PAL_STAGES = [
  { id: 'baby', name: 'Baby', xp: 0 },
  { id: 'kid', name: 'Kid', xp: 100 },
  { id: 'teen', name: 'Teen', xp: 200 },
  { id: 'hero', name: 'Hero', xp: 300 },
  { id: 'legend', name: 'Legend', xp: 400 },
];

export function palStage(xp = 0) {
  const index = PAL_STAGES.findLastIndex((stage) => xp >= stage.xp);
  const next = PAL_STAGES[index + 1] ?? null;
  const current = PAL_STAGES[index];
  return { ...current, index, next, progress: next ? (xp - current.xp) / (next.xp - current.xp) : 1 };
}

/** Cosmetic accessories, bought with sparks (evolution itself can't be bought). */
export const PAL_ACCESSORIES = [
  { id: 'scarf', name: 'Cozy scarf', price: 40 },
  { id: 'bow', name: 'Bow tie', price: 50 },
  { id: 'partyHat', name: 'Party hat', price: 60 },
  { id: 'flowerCrown', name: 'Flower crown', price: 80 },
];

export const accessoryById = (id) => PAL_ACCESSORIES.find((item) => item.id === id) ?? null;

export function unlockText({ stars, worlds, streak }) {
  if (stars) return `Collect ${stars} ★`;
  if (worlds) return `Finish ${worlds} ${worlds === 1 ? 'world' : 'worlds'}`;
  return `Reach a ${streak}-day streak`;
}

/** Is this Pal yours to pick? Owned Pals stay unlocked even if a streak later breaks. */
export function isPalUnlocked(progress, pal) {
  if (progress.pal.owned[pal.id]) return true;
  if (!progress.pal.id && pal.isStarter) return true;
  const { stars, worlds, streak } = pal.unlock;
  if (stars) return totalStars(progress) >= stars;
  if (worlds) return finishedWorldCount(progress.levels) >= worlds;
  return progress.daily.streak >= streak;
}

// ---------------------------------------------------------------------------
// Guest rules. Signed-in players go through the matching functions in supabase/pals.sql.
// ---------------------------------------------------------------------------

/** Make a Pal your partner. @throws EconomyError if it isn't unlocked yet */
export function choosePalLocally(progress, palId) {
  const pal = palById(palId);
  if (!pal || !isPalUnlocked(progress, pal)) throw new EconomyError('That Pal isn’t unlocked yet.');
  const owned = { ...progress.pal.owned, [palId]: progress.pal.owned[palId] ?? { xp: 0 } };
  return { ...progress, pal: { ...progress.pal, id: palId, owned } };
}

/**
 * A new level was solved: the partner Pal grows.
 * @returns {{ progress, evolvedTo }} evolvedTo is the new stage when it just evolved, else null
 */
export function growPartnerPal(progress) {
  const { id, owned } = progress.pal;
  if (!id) return { progress, evolvedTo: null };
  const before = owned[id]?.xp ?? 0;
  const after = before + 1;
  const next = { ...progress, pal: { ...progress.pal, owned: { ...owned, [id]: { xp: after } } } };
  const evolved = palStage(after).index > palStage(before).index;
  return { progress: next, evolvedTo: evolved ? palStage(after) : null };
}

/** @throws EconomyError */
export function buyAccessoryLocally(progress, accessoryId) {
  const item = accessoryById(accessoryId);
  if (!item) throw new EconomyError('That item is not in the shop.');
  if (progress.pal.accessories.includes(accessoryId)) throw new EconomyError('You already have this.');
  if (progress.sparks < item.price) throw new EconomyError('Not enough sparks.');
  return { ...progress, sparks: progress.sparks - item.price, pal: { ...progress.pal, accessories: [...progress.pal.accessories, accessoryId] } };
}

/** Wear an owned accessory, or take it off with null. @throws EconomyError */
export function equipAccessoryLocally(progress, accessoryId) {
  if (accessoryId && !progress.pal.accessories.includes(accessoryId)) throw new EconomyError('Buy it first.');
  return { ...progress, pal: { ...progress.pal, accessory: accessoryId } };
}
