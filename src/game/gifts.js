import { EconomyError } from './progress.js';
import { INVENTORY_CAP } from './catalog.js';

/*
 * Gifts: the 7-day gift calendar and the partner Pal's presents. Every gift here is free and earned by playing;
 * the random part of a present is shown with its odds before it's opened. Must match supabase/gifts.sql.
 */

/**
 * One free gift a day, growing through the week. A missed day pauses the calendar (you pick up where you
 * left off); it never resets. Day 7's diamond needs an account, so guests get a Skip instead.
 */
export const GIFT_CALENDAR = [
  { sparks: 15 },
  { sparks: 20, helper: 'hint' },
  { sparks: 25 },
  { sparks: 25, helper: 'lens' },
  { sparks: 30 },
  { sparks: 30, helper: 'autoturn' },
  { sparks: 60, diamonds: 1, guestHelper: 'skip', isBig: true },
];

/** Which calendar day (0–6) the next gift is, after `giftDays` gifts opened. */
export const calendarDay = (giftDays) => giftDays % GIFT_CALENDAR.length;

/** The next calendar gift for this player: { sparks, helper, diamonds?, isBig }. */
export function calendarGift(giftDays, isSignedIn) {
  const { sparks, helper = null, diamonds, guestHelper, isBig = false } = GIFT_CALENDAR[calendarDay(giftDays)];
  if (diamonds && isSignedIn) return { sparks, helper, diamonds, isBig };
  return { sparks, helper: helper ?? guestHelper ?? null, isBig };
}

/** Today's gift is waiting (one a day). */
export const isDailyGiftReady = (progress, today) => progress.giftDate !== today;

/** Adds a helper, or 10 sparks instead when that helper is already full. */
function addHelper(progress, helper) {
  if ((progress.helpers[helper] ?? 0) >= INVENTORY_CAP) return { progress: { ...progress, sparks: progress.sparks + 10 }, extraSparks: 10 };
  return { progress: { ...progress, helpers: { ...progress.helpers, [helper]: (progress.helpers[helper] ?? 0) + 1 } }, extraSparks: 0 };
}

/** Opens today's calendar gift on this device (guests). @returns { progress, gift } @throws EconomyError */
export function claimCalendarGiftLocally(progress, today) {
  if (!isDailyGiftReady(progress, today)) throw new EconomyError('You already opened today’s gift. Come back tomorrow!');
  const gift = calendarGift(progress.giftDays, false);
  let next = { ...progress, sparks: progress.sparks + gift.sparks, giftDate: today, giftDays: progress.giftDays + 1 };
  let { sparks, helper } = gift;
  if (helper) {
    const added = addHelper(next, helper);
    next = added.progress;
    if (added.extraSparks) [sparks, helper] = [sparks + added.extraSparks, null];
  }
  return { progress: next, gift: { ...gift, sparks, helper } };
}

// ---------------------------------------------------------------------------
// The partner Pal's presents
// ---------------------------------------------------------------------------

/** Every 10 stars (from built-in levels), the partner Pal brings a present. */
export const PRESENT_EVERY_STARS = 10;
/** Every present holds these sparks, plus one surprise. */
export const PRESENT_BASE_SPARKS = 20;
/** The surprise and its odds (in %), shown to the player before opening. */
export const PRESENT_ODDS = [
  { kind: 'helper', chance: 45 },
  { kind: 'sparks', chance: 30, sparks: 40 },
  { kind: 'item', chance: 25 },
];
/** Things a present can hold: outfit pieces and Grove decor the player doesn't own yet. */
export const PRESENT_ITEMS = [
  { id: 'scarf', type: 'outfit' },
  { id: 'beanie', type: 'outfit' },
  { id: 'bow', type: 'outfit' },
  { id: 'partyHat', type: 'outfit' },
  { id: 'balloon', type: 'outfit' },
  { id: 'medal', type: 'outfit' },
  { id: 'logBench', type: 'decor' },
  { id: 'flowerPatch', type: 'decor' },
  { id: 'fireflyJar', type: 'decor' },
  { id: 'berryBush', type: 'decor' },
  { id: 'glowShrooms', type: 'decor' },
  { id: 'kites', type: 'decor' },
];
/** Helpers a present can hold. */
export const PRESENT_HELPERS = ['hint', 'lens', 'autoturn'];

const starsFromLevels = (levels) => Object.entries(levels).reduce((sum, [id, entry]) => sum + (/^w\d+-\d{2}$/.test(id) ? entry.stars : 0), 0);

/** Presents ready to open now. */
export const presentsWaiting = (progress) =>
  Math.max(0, Math.floor(starsFromLevels(progress.levels) / PRESENT_EVERY_STARS) - progress.presents.opened);

/** Stars collected toward the next present: { have, need }. */
export function presentProgress(progress) {
  const stars = starsFromLevels(progress.levels) - progress.presents.opened * PRESENT_EVERY_STARS;
  return { have: Math.max(0, Math.min(PRESENT_EVERY_STARS, stars)), need: PRESENT_EVERY_STARS };
}

/**
 * How special a present turns out. While it opens, a plain present can glow up a level at a time
 * (like a light growing brighter); the odds are shown before opening. A brighter present holds more:
 * extra sparks, and from Epic up a sure outfit piece or decor (when there's one you don't own yet).
 * A Legendary one also holds a diamond for accounts (guests get 40 more sparks instead).
 */
export const PRESENT_RARITIES = [
  { id: 'plain', chance: 65, bonusSparks: 0 },
  { id: 'rare', chance: 23, bonusSparks: 20 },
  { id: 'epic', chance: 9, bonusSparks: 40, sureItem: true },
  { id: 'legendary', chance: 3, bonusSparks: 80, sureItem: true, diamonds: 1 },
];
export const LEGENDARY_GUEST_SPARKS = 40;

/** Which rarity a 0–1 roll lands on. */
export function presentRarityFor(roll) {
  let edge = 0;
  for (const rarity of PRESENT_RARITIES) {
    edge += rarity.chance / 100;
    if (roll < edge) return rarity;
  }
  return PRESENT_RARITIES.at(-1);
}

const ownsItem = (progress, item) => (item.type === 'outfit' ? progress.pal.accessories : progress.grove.items).includes(item.id);

/**
 * What's inside a present. `rarityRoll` picks how special it is, `roll` the surprise by PRESENT_ODDS (Epic and
 * Legendary always hold an item when one is left), `pick` which one. A surprise that can't be given (every helper
 * full, every item owned) becomes the sparks bag instead.
 * @returns { rarity, sparks, helper?, item?, diamonds? }
 */
export function drawPresent(progress, { rarityRoll = Math.random(), roll = Math.random(), pick = Math.random(), isSignedIn = false } = {}) {
  const rarity = presentRarityFor(rarityRoll);
  const sparksBag = PRESENT_ODDS[1].sparks;
  const items = PRESENT_ITEMS.filter((item) => !ownsItem(progress, item));
  const helpers = PRESENT_HELPERS.filter((id) => (progress.helpers[id] ?? 0) < INVENTORY_CAP);
  const score = roll * 100;
  let surprise;
  if (rarity.sureItem || score >= PRESENT_ODDS[0].chance + PRESENT_ODDS[1].chance) {
    surprise = items.length ? { item: items[Math.floor(pick * items.length)] } : { sparks: sparksBag };
  } else if (score < PRESENT_ODDS[0].chance) {
    surprise = helpers.length ? { helper: helpers[Math.floor(pick * helpers.length)] } : { sparks: sparksBag };
  } else {
    surprise = { sparks: sparksBag };
  }
  const legendaryExtra = rarity.diamonds ? (isSignedIn ? { diamonds: rarity.diamonds } : { sparks: LEGENDARY_GUEST_SPARKS }) : {};
  const sparks = PRESENT_BASE_SPARKS + rarity.bonusSparks + (surprise.sparks ?? 0) + (legendaryExtra.sparks ?? 0);
  return { rarity: rarity.id, ...surprise, ...legendaryExtra, sparks };
}

/** Opens one present on this device (guests). @returns { progress, gift } @throws EconomyError */
export function openPresentLocally(progress, rolls) {
  if (presentsWaiting(progress) < 1) throw new EconomyError('No present yet.');
  const gift = drawPresent(progress, rolls);
  const next = { ...progress, sparks: progress.sparks + gift.sparks, presents: { opened: progress.presents.opened + 1 } };
  if (gift.helper) next.helpers = { ...progress.helpers, [gift.helper]: (progress.helpers[gift.helper] ?? 0) + 1 };
  if (gift.item?.type === 'outfit') next.pal = { ...progress.pal, accessories: [...progress.pal.accessories, gift.item.id] };
  if (gift.item?.type === 'decor') next.grove = { ...progress.grove, items: [...progress.grove.items, gift.item.id] };
  return { progress: next, gift };
}

// ---------------------------------------------------------------------------
// Daily win gifts
// ---------------------------------------------------------------------------

/**
 * Small gifts for the 1st, 3rd and 6th different level won each day (a Skip doesn't count). Nothing is lost
 * on a day without playing. Must match public._win_gift() in supabase/gifts.sql.
 */
export const WIN_GIFTS = [
  { wins: 1, sparks: 10 },
  { wins: 3, sparks: 15, helper: 'hint' },
  { wins: 6, sparks: 25, helper: 'lens' },
];

/** Notes a won level for today's count (each level counts once a day). */
export function recordDailyWin(progress, levelId, today) {
  const levels = progress.winsToday.date === today ? progress.winsToday.levels : [];
  if (levels.includes(levelId)) return progress;
  return { ...progress, winsToday: { date: today, levels: [...levels, levelId] } };
}

/** Different levels won today. */
export const winsToday = (progress, today) => (progress.winsToday.date === today ? progress.winsToday.levels.length : 0);

/** Win gifts already opened today. */
export const winGiftsOpened = (progress, today) => (progress.winGifts.date === today ? progress.winGifts.opened : 0);

/** The win gift ready to open now ({ wins, sparks, helper? }), or null. */
export function readyWinGift(progress, today) {
  const next = WIN_GIFTS[winGiftsOpened(progress, today)];
  return next && winsToday(progress, today) >= next.wins ? next : null;
}

/** How many win gifts are ready to open now (they can be opened together). */
export function readyWinGiftCount(progress, today) {
  const wins = winsToday(progress, today);
  return WIN_GIFTS.slice(winGiftsOpened(progress, today)).filter((tier) => wins >= tier.wins).length;
}

/** Opens today's next win gift on this device (guests). @returns { progress, gift } @throws EconomyError */
export function claimWinGiftLocally(progress, today) {
  const tier = readyWinGift(progress, today);
  if (!tier) throw new EconomyError('No gift yet.');
  let next = { ...progress, sparks: progress.sparks + tier.sparks, winGifts: { date: today, opened: winGiftsOpened(progress, today) + 1 } };
  let { sparks } = tier;
  let helper = tier.helper ?? null;
  if (helper) {
    const added = addHelper(next, helper);
    next = added.progress;
    if (added.extraSparks) [sparks, helper] = [sparks + added.extraSparks, null];
  }
  return { progress: next, gift: { sparks, helper } };
}

/** Several opened gifts as one: all the sparks and diamonds added up, every helper and item listed. */
export function mergeGifts(gifts) {
  return {
    sparks: gifts.reduce((sum, gift) => sum + (gift.sparks ?? 0), 0),
    diamonds: gifts.reduce((sum, gift) => sum + (gift.diamonds ?? 0), 0),
    helpers: gifts.map((gift) => gift.helper).filter(Boolean),
    items: gifts.map((gift) => gift.item).filter(Boolean),
  };
}
