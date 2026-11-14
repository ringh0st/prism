import { EconomyError, totalStars } from './progress.js';
import { finishedWorldCount, solvedCountByWorld } from './titles.js';

/**
 * Pals: profile characters. You pick one starter on your first game, then unlock the rest by playing.
 * Every finished world earns a Glow-up, and you choose which Pal grows into its next form. Must match supabase/pals.sql.
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

/** Each Pal has five forms. It grows one form each time you spend a Glow-up (earned per finished world) on it. */
export const PAL_STAGES = [
  { id: 'baby', name: 'Baby' },
  { id: 'junior', name: 'Junior' },
  { id: 'buddy', name: 'Buddy' },
  { id: 'champ', name: 'Champ' },
  { id: 'legend', name: 'Legend' },
];

export const MAX_PAL_STAGE = PAL_STAGES.length - 1;


/** A Pal's form (0 = Baby … 4 = Legend), with the next form or null. */
export function palStage(index = 0) {
  const safe = Math.max(0, Math.min(MAX_PAL_STAGE, index));
  return { ...PAL_STAGES[safe], index: safe, next: PAL_STAGES[safe + 1] ?? null };
}

/** The form index of an owned Pal entry ({ stage }). */
export const stageOf = (owned) => owned?.stage ?? 0;

/** One Glow-up for every finished world. */
export const glowUpsEarned = (progress) => finishedWorldCount(progress.levels);

/**
 * How close the next Glow-up is: the unfinished world nearest to done (the lowest one on a tie).
 * @returns {{ world: number, solved: number, needed: number }}
 */
export function nextGlowUpProgress(levels, levelsPerWorld = 20) {
  const counts = solvedCountByWorld(levels);
  let best = null;
  for (const [world, solved] of [...counts].sort(([a], [b]) => a - b)) {
    if (solved < levelsPerWorld && (!best || solved > best.solved)) best = { world, solved };
  }
  if (!best) {
    let world = 1;
    while (counts.has(world)) world += 1;
    best = { world, solved: 0 };
  }
  return { ...best, needed: levelsPerWorld };
}

/** Glow-ups earned by finishing worlds, minus those already spent growing Pals. */
export function glowUpsAvailable(progress) {
  const earned = glowUpsEarned(progress);
  const spent = Object.values(progress.pal.owned).reduce((sum, owned) => sum + stageOf(owned), 0);
  return Math.max(0, earned - spent);
}


/** Clothes and gear, bought with sparks. A Pal wears one item per slot: head, neck and hand. */
export const PAL_ACCESSORIES = [
  { id: 'beanie', name: 'Cozy beanie', slot: 'head', price: 50 },
  { id: 'partyHat', name: 'Party hat', slot: 'head', price: 60 },
  { id: 'flowerCrown', name: 'Flower crown', slot: 'head', price: 80 },
  { id: 'wizardHat', name: 'Wizard hat', slot: 'head', price: 90 },
  { id: 'headphones', name: 'Headphones', slot: 'head', price: 100 },
  { id: 'crown', name: 'Royal crown', slot: 'head', price: 150 },
  { id: 'scarf', name: 'Cozy scarf', slot: 'neck', price: 40 },
  { id: 'bow', name: 'Bow tie', slot: 'neck', price: 50 },
  { id: 'medal', name: 'Gold medal', slot: 'neck', price: 70 },
  { id: 'cape', name: 'Hero cape', slot: 'neck', price: 120 },
  { id: 'balloon', name: 'Balloon', slot: 'hand', price: 70 },
  { id: 'lantern', name: 'Little lantern', slot: 'hand', price: 80 },
  { id: 'magicWand', name: 'Magic wand', slot: 'hand', price: 110 },
  { id: 'heroShield', name: 'Hero shield', slot: 'hand', price: 120 },
  { id: 'sword', name: 'Brave sword', slot: 'hand', price: 130 },
];

export const PAL_SLOTS = [
  { id: 'head', name: 'Hats' },
  { id: 'neck', name: 'Neck & capes' },
  { id: 'hand', name: 'Gear' },
];

/** Adopting a Pal you choose (one you don't have yet) costs diamonds. Must match public.adopt_pal(). */
export const ADOPT_PAL_DIAMONDS = 20;

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
  const owned = { ...progress.pal.owned, [palId]: progress.pal.owned[palId] ?? { stage: 0 } };
  return { ...progress, pal: { ...progress.pal, id: palId, owned } };
}

/** Spend a Glow-up: the chosen Pal grows into its next form. @throws EconomyError */
export function glowUpPalLocally(progress, palId) {
  const owned = progress.pal.owned[palId];
  if (!owned) throw new EconomyError('That Pal isn’t on your team yet.');
  if (stageOf(owned) >= MAX_PAL_STAGE) throw new EconomyError('This Pal is already a Legend!');
  if (glowUpsAvailable(progress) < 1) throw new EconomyError('Finish a world to earn a Glow-up.');
  return { ...progress, pal: { ...progress.pal, owned: { ...progress.pal.owned, [palId]: { stage: stageOf(owned) + 1 } } } };
}

/** @throws EconomyError */
export function buyAccessoryLocally(progress, accessoryId) {
  const item = accessoryById(accessoryId);
  if (!item) throw new EconomyError('That item is not in the shop.');
  if (progress.pal.accessories.includes(accessoryId)) throw new EconomyError('You already have this.');
  if (progress.sparks < item.price) throw new EconomyError('Not enough sparks.');
  return { ...progress, sparks: progress.sparks - item.price, pal: { ...progress.pal, accessories: [...progress.pal.accessories, accessoryId] } };
}

/** Put on an owned item (replacing whatever was in its slot) or take it off. @throws EconomyError */
export function wearAccessoryLocally(progress, accessoryId, isWearing) {
  const item = accessoryById(accessoryId);
  if (!item) throw new EconomyError('That item is not in the shop.');
  if (isWearing && !progress.pal.accessories.includes(accessoryId)) throw new EconomyError('Buy it first.');
  const others = progress.pal.wearing.filter((id) => accessoryById(id)?.slot !== item.slot);
  return { ...progress, pal: { ...progress.pal, wearing: isWearing ? [...others, accessoryId] : others } };
}

/** Adopt a Pal of your choice (signed-in players pay with diamonds on the server). */
export function canAdopt(progress, palId) {
  return Boolean(palById(palId)) && !progress.pal.owned[palId];
}
