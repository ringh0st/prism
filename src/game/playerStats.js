import { PALS, solvedLevelCount } from './pals.js';
import { finishedWorldCount } from './titles.js';

/** The numbers on a player card, worked out from this device's progress (same as the server's player_card). */
export function playerStatsOf(progress) {
  const builtIn = Object.entries(progress.levels).filter(([id, entry]) => /^w\d+-\d+$/.test(id) && entry.stars > 0);
  return {
    stars: builtIn.reduce((sum, [, entry]) => sum + entry.stars, 0),
    levelsSolved: solvedLevelCount(progress.levels),
    worldsFinished: finishedWorldCount(progress.levels),
    palsCount: Object.keys(progress.pal.owned).length,
  };
}

export const TOTAL_PALS = PALS.length;
