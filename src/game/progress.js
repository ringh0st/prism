import { sparksForDaily, sparksForNewStars, starsForMoves, STARTING_SPARKS } from './scoring.js';
import { isYesterday } from './daily.js';

export const BEAM_THEMES = [
  { id: 'sunbeam', name: 'Sunbeam', color: '#FFD23F', starsToUnlock: 0 },
  { id: 'ember', name: 'Ember', color: '#FF7A45', starsToUnlock: 30 },
  { id: 'mint', name: 'Mint', color: '#3FE0C5', starsToUnlock: 60 },
  { id: 'blossom', name: 'Blossom', color: '#FF7EA6', starsToUnlock: 100 },
];

export function createEmptyProgress() {
  return {
    levels: {},
    sparks: STARTING_SPARKS,
    daily: { streak: 0, lastDate: null },
    beamTheme: 'sunbeam',
  };
}

export const totalStars = (progress) => Object.values(progress.levels).reduce((sum, entry) => sum + entry.stars, 0);

export const starsFor = (progress, levelId) => progress.levels[levelId]?.stars ?? 0;

/**
 * Record a finished level.
 * @returns {{ progress, stars, previousStars, sparksEarned, isNewBest }}
 */
export function recordLevelResult(progress, level, { moves, usedHint }) {
  const stars = starsForMoves(moves, level.par, { usedHint });
  const previous = progress.levels[level.id];
  const previousStars = previous?.stars ?? 0;
  const sparksEarned = sparksForNewStars(previousStars, stars, level.difficulty);
  const isNewBest = !previous || moves < previous.bestMoves;
  const next = {
    ...progress,
    sparks: progress.sparks + sparksEarned,
    levels: {
      ...progress.levels,
      [level.id]: {
        stars: Math.max(stars, previousStars),
        bestMoves: previous ? Math.min(previous.bestMoves, moves) : moves,
      },
    },
  };
  return { progress: next, stars, previousStars, sparksEarned, isNewBest };
}

/** Daily puzzle: extends the streak if yesterday was played, pays out once per day. */
export function recordDailyResult(progress, dateKey) {
  const { daily } = progress;
  if (daily.lastDate === dateKey) return { progress, sparksEarned: 0, streak: daily.streak, isFirstToday: false };
  const streak = isYesterday(daily.lastDate, dateKey) ? daily.streak + 1 : 1;
  const sparksEarned = sparksForDaily(streak);
  return {
    progress: { ...progress, sparks: progress.sparks + sparksEarned, daily: { streak, lastDate: dateKey } },
    sparksEarned,
    streak,
    isFirstToday: true,
  };
}

/** A streak is only "alive" if the last daily was today or yesterday. */
export function currentStreak(progress, today) {
  const { lastDate, streak } = progress.daily;
  return lastDate === today || isYesterday(lastDate, today) ? streak : 0;
}

export function spendSparks(progress, amount) {
  if (progress.sparks < amount) return null;
  return { ...progress, sparks: progress.sparks - amount };
}

/** Combine guest progress with an account's saved progress, keeping the best of both. */
export function mergeProgress(local, remote) {
  const levels = { ...remote.levels };
  for (const [id, entry] of Object.entries(local.levels)) {
    const other = levels[id];
    levels[id] = other
      ? { stars: Math.max(entry.stars, other.stars), bestMoves: Math.min(entry.bestMoves, other.bestMoves) }
      : entry;
  }
  const newerDaily = (local.daily.lastDate ?? '') > (remote.daily.lastDate ?? '') ? local.daily : remote.daily;
  return {
    levels,
    sparks: Math.max(local.sparks, remote.sparks),
    daily: newerDaily,
    beamTheme: remote.beamTheme ?? local.beamTheme,
  };
}
