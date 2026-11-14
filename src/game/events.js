import { DIFFICULTY } from './constants.js';
import { todayKey } from './daily.js';

/*
 * Weekend events: every Saturday and Sunday a themed set of 10 puzzles, the same for everyone, rising
 * in difficulty. Finishing all 10 earns a prize and that event's stamp. Mirrors supabase/events.sql.
 * The puzzles are made ahead of time (`npm run events`, src/data/events/) and loaded when needed.
 */
export const EVENT_LEVELS = 10;
export const EVENT_PRIZE_SPARKS = 150;
/** Events open once World 1 is finished. */
export const EVENT_UNLOCK_WORLDS = 1;

/** The themes take turns, one per weekend. Each tweaks the puzzle generator. */
export const EVENT_THEMES = [
  { id: 'mirrorMadness', name: 'Mirror Madness', tagline: 'Mirrors, mirrors everywhere', icon: '🪞', preset: { turns: [3, 7], decoys: 4 } },
  { id: 'splitSpree', name: 'Split Spree', tagline: 'One beam is never enough', icon: '✂️', preset: { splits: 2 } },
  { id: 'colorCarnival', name: 'Color Carnival', tagline: 'Paint the gems', icon: '🎨', preset: { filters: 2 } },
  { id: 'shadowHunt', name: 'Shadow Hunt', tagline: 'Keep the dark ones dark', icon: '🌑', preset: { shades: 3 } },
  { id: 'twinTrouble', name: 'Twin Trouble', tagline: 'They always turn together', icon: '👯', preset: { twins: 2 } },
  { id: 'portalParty', name: 'Portal Party', tagline: 'Now you see it, now you don’t', icon: '🌀', preset: { portals: 1, splits: 1 } },
  { id: 'gemRush', name: 'Gem Rush', tagline: 'Two beams, lots of gems', icon: '💎', preset: { emitters: 2, splits: 1 } },
  { id: 'tinyTitans', name: 'Tiny Titans', tagline: 'Small boards, big brains', icon: '🐜', preset: { small: true, decoys: 3 } },
];

const DAY_MS = 86_400_000;
const noon = (key) => new Date(`${key}T12:00:00`);

/** The Saturday (YYYY-MM-DD) of the weekend event running on this date, or null on weekdays. */
export function eventWeekendOf(date = new Date()) {
  const day = date.getDay();
  if (day !== 6 && day !== 0) return null;
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - (day === 0 ? 1 : 0));
  return todayKey(saturday);
}

/** The Saturday of the next weekend event (today if it's Saturday). */
export function nextEventWeekend(date = new Date()) {
  const saturday = new Date(date);
  saturday.setDate(date.getDate() + ((6 - date.getDay() + 7) % 7));
  return todayKey(saturday);
}

/** Which theme a weekend gets (they take turns). */
export function eventThemeFor(weekend) {
  const weekNumber = Math.round((noon(weekend) - noon('2026-01-03')) / (7 * DAY_MS));
  return EVENT_THEMES[((weekNumber % EVENT_THEMES.length) + EVENT_THEMES.length) % EVENT_THEMES.length];
}

/** Generator settings for level n (1–10) of a weekend: bigger boards and longer solutions as you go. */
export function eventPresetFor(theme, number) {
  const { small = false, ...preset } = theme.preset;
  const ramp = (number - 1) / (EVENT_LEVELS - 1);
  const size = small ? 5 + Math.round(ramp) : 6 + Math.round(ramp * 2);
  const minPar = 3 + Math.round(ramp * 4);
  return {
    width: size,
    height: size,
    emitters: 1,
    turns: [2 + Math.round(ramp), 4 + Math.round(ramp * 3)],
    segment: [1, 3],
    decoys: 2 + Math.round(ramp * 2),
    walls: 1 + Math.round(ramp),
    lockedRatio: 0.1,
    minPar,
    maxPar: minPar + 4,
    ...preset,
  };
}

export const eventLevelId = (weekend, number) => `event-${weekend}-${number}`;

export function parseEventLevelId(id) {
  const match = /^event-(\d{4}-\d{2}-\d{2})-(\d+)$/.exec(id);
  return match ? { weekend: match[1], number: Number(match[2]) } : null;
}

/** Name and difficulty of event level n (1–10): 5 and 10 are Hard. */
export function eventLevelInfo(weekend, number) {
  return {
    id: eventLevelId(weekend, number),
    name: `${eventThemeFor(weekend).name} ${number}`,
    difficulty: number % 5 === 0 ? DIFFICULTY.HARD : DIFFICULTY.NORMAL,
  };
}

/** A player's results for one weekend: { stars: { [number]: stars }, claimed }. */
export const eventProgressOf = (progress, weekend) => progress.events?.[weekend] ?? { stars: {}, claimed: false };

export const solvedEventCount = (eventProgress) => Object.values(eventProgress.stars).filter((stars) => stars > 0).length;

export const isEventPrizeReady = (eventProgress) => !eventProgress.claimed && solvedEventCount(eventProgress) >= EVENT_LEVELS;

/** Stamps: the weekends whose event was finished, newest first. */
export const eventStamps = (progress) =>
  Object.entries(progress.events ?? {})
    .filter(([, entry]) => entry.claimed)
    .map(([weekend]) => ({ weekend, theme: eventThemeFor(weekend) }))
    .sort((a, b) => (a.weekend < b.weekend ? 1 : -1));

/** Record a solved event level on this device (guests). Keeps the best stars. */
export function recordEventLevelLocally(progress, weekend, number, stars) {
  const entry = eventProgressOf(progress, weekend);
  const best = Math.max(entry.stars[number] ?? 0, stars);
  return { ...progress, events: { ...progress.events, [weekend]: { ...entry, stars: { ...entry.stars, [number]: best } } } };
}

/** Collect the prize for finishing all 10 (guests). @throws Error when it isn't ready */
export function claimEventPrizeLocally(progress, weekend) {
  const entry = eventProgressOf(progress, weekend);
  if (!isEventPrizeReady(entry)) throw new Error('Finish all 10 puzzles to open the prize.');
  return { ...progress, sparks: progress.sparks + EVENT_PRIZE_SPARKS, events: { ...progress.events, [weekend]: { ...entry, claimed: true } } };
}
