import { EconomyError, totalStars } from './progress.js';
import { finishedWorldCount } from './titles.js';
import { THEME_OUTFITS } from './themes.js';

/**
 * Pals: profile characters. A first one (a starter) turns up after a few solved levels, then you unlock the rest by playing.
 * Only the partner Pal grows: 20 solved levels per form. Must match supabase/pals.sql.
 *
 * unlock: what makes a Pal available (starters can also be picked as your very first Pal).
 * animal: the word used in your public nickname ("Sunny Fox 42").
 * power: what the Pal does for you in levels while it's your partner (see palPowers.js).
 */
export const PALS = [
  { id: 'ember', power: 'moves', name: 'Ember', species: 'Fox', animal: 'Fox', isStarter: true, unlock: { stars: 30 } },
  { id: 'mossy', power: 'undo', name: 'Mossy', species: 'Turtle', animal: 'Turtle', isStarter: true, unlock: { stars: 60 } },
  { id: 'coral', power: 'hint', name: 'Coral', species: 'Axolotl', animal: 'Axolotl', isStarter: true, unlock: { streak: 3 } },
  { id: 'mochi', power: 'hint', name: 'Mochi', species: 'Kitten', animal: 'Kitten', unlock: { stars: 90 } },
  { id: 'hoot', power: 'hint', name: 'Hoot', species: 'Owl', animal: 'Owl', unlock: { stars: 120 } },
  { id: 'waffles', power: 'moves', name: 'Waffles', species: 'Puppy', animal: 'Puppy', unlock: { stars: 150 } },
  { id: 'peep', power: 'moves', name: 'Peep', species: 'Chick', animal: 'Chick', unlock: { worlds: 1 } },
  { id: 'bruno', power: 'undo', name: 'Bruno', species: 'Bear cub', animal: 'Bear', unlock: { stars: 200 } },
  { id: 'biscuit', power: 'moves', name: 'Biscuit', species: 'Bunny', animal: 'Bunny', unlock: { worlds: 2 } },
  { id: 'truffle', power: 'undo', name: 'Truffle', species: 'Piglet', animal: 'Piglet', unlock: { stars: 250 } },
  { id: 'pebble', power: 'undo', name: 'Pebble', species: 'Hedgehog', animal: 'Hedgehog', unlock: { streak: 7 } },
  { id: 'quartz', power: 'hint', name: 'Quartz', species: 'Gem', animal: 'Gem', unlock: { stars: 300 } },
  { id: 'ribbit', power: 'moves', name: 'Ribbit', species: 'Frog', animal: 'Frog', unlock: { worlds: 3 } },
  { id: 'cotton', power: 'undo', name: 'Cotton', species: 'Lamb', animal: 'Lamb', unlock: { stars: 350 } },
  { id: 'squeak', power: 'moves', name: 'Squeak', species: 'Mouse', animal: 'Mouse', unlock: { stars: 400 } },
  { id: 'tops', power: 'undo', name: 'Tops', species: 'Triceratops', animal: 'Trike', unlock: { stars: 450 } },
  { id: 'maple', power: 'moves', name: 'Maple', species: 'Red panda', animal: 'Panda', unlock: { worlds: 5 } },
  { id: 'chomp', power: 'moves', name: 'Chomp', species: 'T-rex', animal: 'Rex', unlock: { worlds: 6 } },
  { id: 'otto', power: 'moves', name: 'Otto', species: 'Otter', animal: 'Otter', unlock: { stars: 500 } },
  { id: 'buzz', power: 'moves', name: 'Buzz', species: 'Bee', animal: 'Bee', unlock: { streak: 14 } },
  { id: 'kiko', power: 'undo', name: 'Kiko', species: 'Koala', animal: 'Koala', unlock: { stars: 600 } },
  { id: 'splash', power: 'moves', name: 'Splash', species: 'Seal', animal: 'Seal', unlock: { stars: 700 } },
  { id: 'shroomy', power: 'hint', name: 'Shroomy', species: 'Mushroom sprite', animal: 'Sprite', unlock: { worlds: 8 } },
  { id: 'stretch', power: 'hint', name: 'Stretch', species: 'Brachiosaurus', animal: 'Longneck', unlock: { worlds: 10 } },
  { id: 'bandit', power: 'hint', name: 'Bandit', species: 'Raccoon', animal: 'Raccoon', unlock: { stars: 800 } },
  { id: 'spike', power: 'undo', name: 'Spike', species: 'Stegosaurus', animal: 'Stego', unlock: { stars: 900 } },
  { id: 'waddles', power: 'undo', name: 'Waddles', species: 'Penguin', animal: 'Penguin', unlock: { stars: 1000 } },
  { id: 'fawn', power: 'hint', name: 'Fawn', species: 'Deer', animal: 'Deer', unlock: { stars: 1200 } },
  { id: 'shelly', power: 'undo', name: 'Shelly', species: 'Snail', animal: 'Snail', unlock: { streak: 30 } },
  { id: 'inky', power: 'hint', name: 'Inky', species: 'Octopus', animal: 'Octopus', unlock: { stars: 1500 } },
  { id: 'puff', power: 'moves', name: 'Puff', species: 'Cloud', animal: 'Cloud', unlock: { worlds: 12 } },
  { id: 'twinkle', power: 'hint', name: 'Twinkle', species: 'Star', animal: 'Star', unlock: { stars: 1800 } },
  { id: 'starla', power: 'moves', name: 'Starla', species: 'Unicorn', animal: 'Unicorn', unlock: { stars: 2400 } },
  { id: 'ziggy', power: 'moves', name: 'Ziggy', species: 'Dragon', animal: 'Dragon', unlock: { stars: 3000 } },
  // Legendary Pals: rare and regal. They only arrive as Lucky Pal gifts (or by adoption).
  { id: 'leo', power: 'moves', name: 'Leo', species: 'Lion cub', animal: 'Lion', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'koi', power: 'hint', name: 'Koi', species: 'Lucky koi', animal: 'Koi', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'bamboo', power: 'undo', name: 'Bamboo', species: 'Giant panda', animal: 'Panda', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'aurora', power: 'undo', name: 'Aurora', species: 'Arctic fox', animal: 'Snowfox', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'storm', power: 'moves', name: 'Storm', species: 'Tiger cub', animal: 'Tiger', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'plume', power: 'hint', name: 'Plume', species: 'Peacock', animal: 'Peacock', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'nova', power: 'moves', name: 'Nova', species: 'Narwhal', animal: 'Narwhal', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'luna', power: 'hint', name: 'Luna', species: 'Snow leopard', animal: 'Leopard', rarity: 'legendary', unlock: { lucky: true } },
  // Legends from old stories: the Moon Rabbit (East Asia), the hippocampus (Greece) and the shisa (Okinawa).
  { id: 'mooncake', power: 'hint', name: 'Mooncake', species: 'Moon rabbit', animal: 'Moonbunny', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'marina', power: 'moves', name: 'Marina', species: 'Hippocampus', animal: 'Seapony', rarity: 'legendary', unlock: { lucky: true } },
  { id: 'rumble', power: 'undo', name: 'Rumble', species: 'Shisa lion-dog', animal: 'Shisa', rarity: 'legendary', unlock: { lucky: true } },
  // Mythic Pals, from myths and legends around the world. They join late in the adventure.
  { id: 'sol', power: 'moves', name: 'Sol', species: 'Phoenix', animal: 'Phoenix', rarity: 'mythic', unlock: { worlds: 15 } },
  { id: 'kiri', power: 'hint', name: 'Kiri', species: 'Qilin', animal: 'Qilin', rarity: 'mythic', unlock: { worlds: 18 } },
  { id: 'gryff', power: 'undo', name: 'Gryff', species: 'Griffin', animal: 'Griffin', rarity: 'mythic', unlock: { worlds: 20 } },
  { id: 'nessa', power: 'undo', name: 'Nessa', species: 'Loch Ness monster', animal: 'Nessie', rarity: 'mythic', unlock: { streak: 21 } },
  { id: 'dozy', power: 'hint', name: 'Dozy', species: 'Baku dream-eater', animal: 'Baku', rarity: 'mythic', unlock: { worlds: 22 } },
  { id: 'nimbus', power: 'moves', name: 'Nimbus', species: 'Pegasus', animal: 'Pegasus', rarity: 'mythic', unlock: { worlds: 25 } },
  { id: 'hopscotch', power: 'moves', name: 'Hopscotch', species: 'Jackalope', animal: 'Jackalope', rarity: 'mythic', unlock: { streak: 45 } },
  { id: 'frosty', power: 'undo', name: 'Frosty', species: 'Yeti', animal: 'Yeti', rarity: 'mythic', unlock: { worlds: 30 } },
  { id: 'fen', power: 'moves', name: 'Fen', species: 'Fenrir wolf pup', animal: 'Wolf', rarity: 'mythic', unlock: { worlds: 35 } },
  { id: 'riddle', power: 'hint', name: 'Riddle', species: 'Sphinx kitten', animal: 'Sphinx', rarity: 'mythic', unlock: { worlds: 40 } },
  { id: 'jade', power: 'undo', name: 'Jade', species: 'Eastern dragon', animal: 'Loong', rarity: 'mythic', unlock: { worlds: 28 } },
  { id: 'tide', power: 'moves', name: 'Tide', species: 'Baby kraken', animal: 'Kraken', rarity: 'mythic', unlock: { worlds: 32 } },
  { id: 'hikari', power: 'hint', name: 'Hikari', species: 'Kitsune', animal: 'Kitsune', rarity: 'mythic', unlock: { worlds: 45 } },
  { id: 'basil', power: 'undo', name: 'Basil', species: 'Basilisk', animal: 'Basilisk', rarity: 'mythic', unlock: { worlds: 38 } },
];

export const STARTER_PALS = PALS.filter((pal) => pal.isStarter);
export const palById = (id) => PALS.find((pal) => pal.id === id) ?? null;

/** How rare a Pal is: common (most), legendary or mythic. */
export const rarityOf = (pal) => pal?.rarity ?? 'common';
export const RARITY_NAMES = { common: 'Basic', legendary: 'Legendary', mythic: 'Mythic' };

/** Each Pal has five forms, Baby to Master. (The last one's id stays 'legend' so saved progress keeps working.) */
export const PAL_STAGES = [
  { id: 'baby', name: 'Baby' },
  { id: 'junior', name: 'Junior' },
  { id: 'buddy', name: 'Buddy' },
  { id: 'champ', name: 'Champ' },
  { id: 'legend', name: 'Master' },
];

export const MAX_PAL_STAGE = PAL_STAGES.length - 1;

/** A Pal's form (0 = Baby … 4 = Master), with the next form or null. */
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

/** The Shop shows 6 Basic Pals a week (some may already be on your team), so adopting stays a choice, not a sweep. */
export const ADOPT_SHELF_SIZE = 6;
/** Legendary and Mythic Pals adopted per week, at most (each one stays a treat). Must match adopt_pal in supabase/pals.sql. */
export const RARE_ADOPTS_PER_WEEK = 2;

/** The Shop's week number (weeks start on Monday, UTC). Must match _adopt_week in supabase/pals.sql. */
export const adoptWeekOf = (now = new Date()) => Math.floor((utcDayNumber(now) + 3) / 7);

/** This week's 6 Basic Pals in this player's Shop. Must match _weekly_basics in supabase/pals.sql. */
export function weeklyAdoptShelf(seed, now = new Date()) {
  const pool = PALS.filter((pal) => rarityOf(pal) === 'common');
  const week = adoptWeekOf(now);
  return Array.from({ length: ADOPT_SHELF_SIZE }, (_, i) => pool[(seed + week * ADOPT_SHELF_SIZE + i * 7) % pool.length]);
}

/** Legendary/Mythic adoptions left this week. */
export const rareAdoptsLeft = (progress) => Math.max(0, RARE_ADOPTS_PER_WEEK - (progress.rareAdopts ?? 0));

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

/** Every outfit piece: the regular ones plus the weekly theme collections'. */
export const ALL_OUTFITS = [...PAL_ACCESSORIES, ...THEME_OUTFITS];

export const accessoryById = (id) => ALL_OUTFITS.find((item) => item.id === id) ?? null;

/** Is this Pal yours to pick? Owned Pals stay unlocked even if a streak later breaks. */
/**
 * The Pals you can play with: every one you have or have unlocked (an unlocked Pal joins the moment you pick it),
 * youngest first so a Pal with growing still to do is easy to find.
 */
export function playablePals(progress) {
  const owned = (pal) => progress.pal.owned[pal.id];
  return PALS.filter((pal) => isPalUnlocked(progress, pal)).sort(
    (a, b) => stageOf(owned(a)) - stageOf(owned(b)) || growthOf(owned(a)) - growthOf(owned(b)),
  );
}

/** Pals the player can now pick that the "New Pal unlocked!" notice hasn't shown yet (`seenIds` from that notice). */
export const unannouncedPals = (progress, seenIds) =>
  progress.pal.id ? PALS.filter((pal) => !progress.pal.owned[pal.id] && !seenIds.includes(pal.id) && isPalUnlocked(progress, pal)) : [];

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
  // Only the regular shop items; theme pieces are bought through buyThemeItemLocally (they may cost diamonds).
  const item = PAL_ACCESSORIES.find((accessory) => accessory.id === accessoryId);
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

/**
 * Can this Pal be adopted now? A Basic Pal on this week's shelf that you don't have; a Legendary or Mythic one
 * only as today's pick, and at most 2 of those a week.
 */
export function canAdopt(progress, pal, seed, now = new Date()) {
  if (!pal || progress.pal.owned[pal.id]) return false;
  const rarity = rarityOf(pal);
  if (rarity === 'common') return weeklyAdoptShelf(seed, now).some((shelfPal) => shelfPal.id === pal.id);
  return rareAdoptsLeft(progress) > 0 && dailyPalPick(progress, rarity, seed, now)?.id === pal.id;
}
