import { generateLevel } from './generator.js';
import { createRandom } from '../lib/random.js';
import { DIFFICULTY, LEVEL_SCHEMA_VERSION } from './constants.js';

/** Local calendar date as YYYY-MM-DD, so the puzzle changes at the player's midnight. */
export function todayKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isYesterday(previousKey, todayDateKey = todayKey()) {
  if (!previousKey) return false;
  const day = new Date(`${todayDateKey}T12:00:00`);
  day.setDate(day.getDate() - 1);
  return todayKey(day) === previousKey;
}

const DAILY_PRESETS = [
  // Rotates through the week so some days are harder than others.
  { width: 6, height: 6, turns: [2, 3], splits: 1, decoys: 2, walls: 1, minPar: 3 },
  { width: 7, height: 7, turns: [2, 3], filters: 1, decoys: 3, walls: 2, minPar: 3 },
  { width: 7, height: 7, turns: [2, 3], shades: 2, decoys: 2, walls: 1, minPar: 3 },
  { width: 7, height: 7, turns: [2, 4], splits: 1, filters: 1, decoys: 3, walls: 2, minPar: 4 },
  { width: 6, height: 6, turns: [2, 3], decoys: 3, walls: 1, minPar: 3 },
  { width: 7, height: 7, turns: [2, 3], splits: 1, shades: 2, decoys: 2, walls: 2, minPar: 4 },
  { width: 8, height: 8, turns: [3, 4], splits: 1, filters: 1, shades: 1, decoys: 3, walls: 2, minPar: 5 },
];

const cache = new Map();

/** The same puzzle for every player on a given day (generated once, then cached). */
export function dailyLevelFor(dateKey = todayKey()) {
  if (!cache.has(dateKey)) cache.set(dateKey, generateDaily(dateKey));
  return cache.get(dateKey);
}

function generateDaily(dateKey) {
  const weekday = new Date(`${dateKey}T12:00:00`).getDay();
  const preset = DAILY_PRESETS[weekday];
  for (let attempt = 0; attempt < 40; attempt++) {
    const minPar = Math.max(1, preset.minPar - Math.floor(attempt / 10));
    const level = generateLevel({ ...preset, minPar }, createRandom(`daily-${dateKey}-${attempt}`), 80);
    if (level) {
      return {
        ...level,
        id: `daily-${dateKey}`,
        version: LEVEL_SCHEMA_VERSION,
        name: 'Daily puzzle',
        difficulty: weekday === 6 ? DIFFICULTY.HARD : DIFFICULTY.NORMAL,
        isDaily: true,
      };
    }
  }
  return null;
}
