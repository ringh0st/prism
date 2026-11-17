import { DIFFICULTY } from './constants.js';

/** How long the quick win stays before the next level starts by itself. */
export const QUICK_WIN_MS = 2400;

/**
 * A plain win on the main road, with no news to show: the game flows straight on to the next level (like a merge
 * game's instant "one more"). Big moments keep the full win screen: Hard and boss wins, milestones, a finished world,
 * a Pal growing up or found, a new Glow level or title, Pal records, a rescued Glowbug, new stickers, diamonds, and a
 * gift or present this win has just brought.
 */
export function isQuietWin(result, { difficulty, hasNext, hasWaitingGift }) {
  if (!result || !hasNext || hasWaitingGift || difficulty !== DIFFICULTY.NORMAL) return false;
  return !(
    result.isSkipped ||
    result.isFirstToday ||
    result.milestone ||
    result.completesWorld ||
    result.palGrewTo ||
    result.levelUp ||
    result.newTitle ||
    result.newRecords?.length ||
    result.glowbug ||
    result.newStickers?.length ||
    result.diamondsEarned > 0
  );
}

/** A level reached through the quick flow opens straight onto the board, unless its card has something to teach. */
export const opensWithoutCard = ({ difficulty, isFirstSteps, newPieceCount }) =>
  difficulty === DIFFICULTY.NORMAL && !isFirstSteps && newPieceCount === 0;
