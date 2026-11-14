import { DIFFICULTY } from './constants.js';
import { MAX_PAL_STAGE, stageOf } from './pals.js';

/*
 * Pal records: memorable things done together with a partner Pal (each Pal keeps its own), shown as badges
 * on the Pal. Just for pride: they pay nothing and can't be bought. Counted on this device.
 */
export const PAL_RECORDS = [
  { id: 'brave', stat: 'hard', goal: 5, icon: 'flame' },
  { id: 'perfect', stat: 'perfect', goal: 10, icon: 'star' },
  { id: 'combo', stat: 'triple', goal: 1, icon: 'spark' },
  { id: 'boss', stat: 'bossPerfect', goal: 1, icon: 'crown' },
  { id: 'grown', stat: 'stage', goal: MAX_PAL_STAGE, icon: 'heart' },
];

const statsOf = (progress, palId) => progress.palRecords[palId] ?? {};

/** How far a Pal is with each record: [{ id, icon, have, goal, isDone }]. */
export function palRecordsFor(progress, palId) {
  const stats = { ...statsOf(progress, palId), stage: stageOf(progress.pal.owned[palId]) };
  return PAL_RECORDS.map((record) => {
    const have = Math.min(record.goal, stats[record.stat] ?? 0);
    return { id: record.id, icon: record.icon, have, goal: record.goal, isDone: have >= record.goal };
  });
}

/**
 * Counts a won level toward the partner's records. `combo` is the most gems lit by one tap in that level.
 * @returns { progress, newRecords: [ids] } (records completed by this win)
 */
export function recordPalFeats(progress, { difficulty, stars, combo = 0 }) {
  const palId = progress.pal.id;
  if (!palId || !progress.pal.owned[palId]) return { progress, newRecords: [] };
  const before = palRecordsFor(progress, palId);
  const stats = { ...statsOf(progress, palId) };
  if (difficulty === DIFFICULTY.HARD || difficulty === DIFFICULTY.EXTRA) stats.hard = (stats.hard ?? 0) + 1;
  if (stars === 3) stats.perfect = (stats.perfect ?? 0) + 1;
  if (combo >= 3) stats.triple = (stats.triple ?? 0) + 1;
  if (difficulty === DIFFICULTY.EXTRA && stars === 3) stats.bossPerfect = (stats.bossPerfect ?? 0) + 1;
  const next = { ...progress, palRecords: { ...progress.palRecords, [palId]: stats } };
  const after = palRecordsFor(next, palId);
  return { progress: next, newRecords: after.filter((record, i) => record.isDone && !before[i].isDone).map((record) => record.id) };
}

export const recordIcon = (id) => PAL_RECORDS.find((record) => record.id === id)?.icon;
