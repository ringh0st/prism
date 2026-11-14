import { EconomyError, totalStars } from './progress.js';
import { finishedWorldCount } from './titles.js';

/**
 * Pals: profile characters. You pick one starter on your first game, then unlock the rest by playing.
 * Only the partner Pal grows: 20 solved levels per form. Must match supabase/pals.sql.
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
  // Legendary Pals: rare and regal. They only arrive as Lucky Pal gifts (or by adoption).
  { id: 'leo', name: 'Leo', species: 'Lion cub', animal: 'Lion', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'koi', name: 'Koi', species: 'Lucky koi', animal: 'Koi', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'bamboo', name: 'Bamboo', species: 'Giant panda', animal: 'Panda', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'aurora', name: 'Aurora', species: 'Arctic fox', animal: 'Snowfox', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'storm', name: 'Storm', species: 'Tiger cub', animal: 'Tiger', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'plume', name: 'Plume', species: 'Peacock', animal: 'Peacock', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'nova', name: 'Nova', species: 'Narwhal', animal: 'Narwhal', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'luna', name: 'Luna', species: 'Snow leopard', animal: 'Leopard', rarity: 'legendary', unlock: { lucky: true } },
  // Mythic Pals, from myths and legends around the world. They join late in the adventure.
  { id: 'sol', name: 'Sol', species: 'Phoenix', animal: 'Phoenix', rarity: 'mythic', unlock: { worlds: 15 } },
  { id: 'kiri', name: 'Kiri', species: 'Qilin', animal: 'Qilin', rarity: 'mythic', unlock: { worlds: 18 } },
  { id: 'gryff', name: 'Gryff', species: 'Griffin', animal: 'Griffin', rarity: 'mythic', unlock: { worlds: 20 } },
  { id: 'nessa', name: 'Nessa', species: 'Loch Ness monster', animal: 'Nessie', rarity: 'mythic', unlock: { streak: 21 } },
  { id: 'dozy', name: 'Dozy', species: 'Baku dream-eater', animal: 'Baku', rarity: 'mythic', unlock: { worlds: 22 } },
  { id: 'nimbus', name: 'Nimbus', species: 'Pegasus', animal: 'Pegasus', rarity: 'mythic', unlock: { worlds: 25 } },
  { id: 'hopscotch', name: 'Hopscotch', species: 'Jackalope', animal: 'Jackalope', rarity: 'mythic', unlock: { streak: 45 } },
  { id: 'frosty', name: 'Frosty', species: 'Yeti', animal: 'Yeti', rarity: 'mythic', unlock: { worlds: 30 } },
  { id: 'fen', name: 'Fen', species: 'Fenrir wolf pup', animal: 'Wolf', rarity: 'mythic', unlock: { worlds: 35 } },
  { id: 'riddle', name: 'Riddle', species: 'Sphinx kitten', animal: 'Sphinx', rarity: 'mythic', unlock: { worlds: 40 } },
];

export const STARTER_PALS = PALS.filter((pal) => pal.isStarter);
export const palById = (id) => PALS.find((pal) => pal.id === id) ?? null;

/** How rare a Pal is: common (most), legendary or mythic. */
export const rarityOf = (pal) => pal?.rarity ?? 'common';
export const RARITY_NAMES = { common: 'Pal', legendary: 'Legendary', mythic: 'Mythic' };

/** Each Pal has five forms, Baby to Legend. */
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

/** Solved levels it takes the partner Pal to grow into its next form. */
export const PAL_GROWTH_LEVELS = 20;

/** Levels solved toward an owned Pal's next form ({ stage, growth }). */
export const growthOf = (owned) => owned?.growth ?? 0;

/**
 * Only the partner grows: each solved level (not skipped) adds one, and 20 grow it into its next form.
 * Other Pals keep their own progress for when they are the partner again.
 * @returns {{ progress, grewTo: object|null }} grewTo is the new form when it just grew.
 */
export function growPartnerLocally(progress) {
  const palId = progress.pal.id;
  const owned = progress.pal.owned[palId];
  if (!owned || stageOf(owned) >= MAX_PAL_STAGE) return { progress, grewTo: null };
  const growth = growthOf(owned) + 1;
  const grows = growth >= PAL_GROWTH_LEVELS;
  const next = { stage: stageOf(owned) + (grows ? 1 : 0), growth: grows ? 0 : growth };
  return {
    progress: { ...progress, pal: { ...progress.pal, owned: { ...progress.pal.owned, [palId]: next } } },
    grewTo: grows ? palStage(next.stage) : null,
  };
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
/** Diamonds to adopt a Pal, by rarity. Legendary and Mythic Pals are sold as each player's daily pick. */
export const ADOPT_PRICES = { common: 20, legendary: 40, mythic: 60 };
export const adoptPriceOf = (pal) => ADOPT_PRICES[rarityOf(pal)];

const DAY_ZERO = Date.UTC(2026, 0, 1);

/** Days since 1 Jan 2026 by the UTC calendar, so the game and the server agree on "today". */
export const utcDayNumber = (now = new Date()) =>
  Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - DAY_ZERO) / 86_400_000);

/** A player's number for their daily Shop picks: the sum of the character codes of their account id. */
export const seedFor = (text) => [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);

/**
 * Today's Shop pick of one rarity, chosen at random for this player and shown before buying (so it's
 * never a surprise purchase). It changes every day. Must match _daily_pick in supabase/pals.sql.
 */
export function dailyPalPick(progress, rarity, seed, now = new Date()) {
  const pool = PALS.filter((pal) => rarityOf(pal) === rarity && !progress.pal.owned[pal.id]);
  return pool.length ? pool[(utcDayNumber(now) + seed) % pool.length] : null;
}

/**
 * Lucky Pal gifts: every 200 solved levels, a free Pal you don't have yet, picked at random with these
 * odds (shown in the game). Free and earned, never bought. Must match claim_lucky_pal in supabase/pals.sql.
 */
export const LUCKY_PAL_EVERY = 200;
export const LUCKY_PAL_ODDS = { mythic: 0.1, legendary: 0.2, common: 0.7 };
export const LUCKY_PAL_FALLBACK_SPARKS = 300;

export const solvedLevelCount = (levels) => Object.entries(levels).filter(([id, entry]) => /^w\d+-\d{2}$/.test(id) && entry.stars > 0).length;

/** Lucky Pal gifts earned by solving levels and not opened yet. */
export const luckyPalsWaiting = (progress) => Math.floor(solvedLevelCount(progress.levels) / LUCKY_PAL_EVERY) - progress.luckyPals.claimed;

/** Which rarity a roll (0–1) lands on: 10% mythic, then 20% legendary, else common. */
export function luckyRarityFor(roll) {
  if (roll < LUCKY_PAL_ODDS.mythic) return 'mythic';
  if (roll < LUCKY_PAL_ODDS.mythic + LUCKY_PAL_ODDS.legendary) return 'legendary';
  return 'common';
}

/**
 * Open one Lucky Pal gift. The rolled rarity is tried first; if you own all of those, the next rarer
 * pool, then any Pal you don't have; if you have every Pal, sparks instead.
 * @returns {{ progress, palId: string|null, sparks: number }}
 */
export function claimLuckyPalLocally(progress, roll = Math.random(), pick = Math.random()) {
  if (luckyPalsWaiting(progress) < 1) throw new EconomyError('No Lucky Pal gift yet.');
  const missing = (rarity) => PALS.filter((pal) => rarityOf(pal) === rarity && !progress.pal.owned[pal.id]);
  const order = {
    mythic: ['mythic', 'legendary', 'common'],
    legendary: ['legendary', 'mythic', 'common'],
    common: ['common', 'legendary', 'mythic'],
  };
  const pool = order[luckyRarityFor(roll)].map(missing).find((pals) => pals.length > 0);
  const luckyPals = { claimed: progress.luckyPals.claimed + 1 };
  if (!pool) {
    return {
      progress: { ...progress, luckyPals, sparks: progress.sparks + LUCKY_PAL_FALLBACK_SPARKS },
      palId: null,
      sparks: LUCKY_PAL_FALLBACK_SPARKS,
    };
  }
  const pal = pool[Math.min(pool.length - 1, Math.floor(pick * pool.length))];
  const owned = { ...progress.pal.owned, [pal.id]: { stage: 0 } };
  return { progress: { ...progress, luckyPals, pal: { ...progress.pal, id: progress.pal.id ?? pal.id, owned } }, palId: pal.id, sparks: 0 };
}

export const accessoryById = (id) => PAL_ACCESSORIES.find((item) => item.id === id) ?? null;

export function unlockText({ stars, worlds, streak, lucky }) {
  if (lucky) return 'Lucky Pal gift';
  if (stars) return `Collect ${stars} ★`;
  if (worlds) return `Finish ${worlds} ${worlds === 1 ? 'world' : 'worlds'}`;
  return `Reach a ${streak}-day streak`;
}

/** Is this Pal yours to pick? Owned Pals stay unlocked even if a streak later breaks. */
export function isPalUnlocked(progress, pal) {
  if (progress.pal.owned[pal.id]) return true;
  if (!progress.pal.id && pal.isStarter) return true;
  const { stars, worlds, streak, lucky } = pal.unlock;
  if (lucky) return false;
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

/** Can this Pal be adopted now? Any regular Pal you don't have; Legendary and Mythic ones only as today's pick. */
export function canAdopt(progress, pal, seed, now = new Date()) {
  if (!pal || progress.pal.owned[pal.id]) return false;
  const rarity = rarityOf(pal);
  return rarity === 'common' || dailyPalPick(progress, rarity, seed, now)?.id === pal.id;
}
