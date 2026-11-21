import { usePlayer } from '../state/PlayerContext.jsx';
import { solvedLevelCount } from '../game/pals.js';
import { isFeatureOpen } from '../game/unlocks.js';
import { areAllLevelsOpen } from '../lib/openAllLevels.js';

/** Is this extra open for the player yet (unlocks.js)? The owner's "open every level" switch opens them all. */
export function useFeature(id) {
  const { progress } = usePlayer();
  return areAllLevelsOpen() || isFeatureOpen(id, solvedLevelCount(progress.levels));
}
