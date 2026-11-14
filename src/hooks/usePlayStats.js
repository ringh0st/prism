import { useEffect, useMemo, useRef } from 'react';
import { recordLevelPlay } from '../lib/playStats.js';

/**
 * Anonymous play counts for one built-in level: a start for each attempt, then how it ended
 * ('win', 'out_of_moves', or 'quit' when the player skips or leaves after making moves).
 */
export function usePlayStats(levelId, isTracked, moves) {
  const attempt = useRef({ isPlaying: false, moves: 0 });
  attempt.current.moves = moves;

  // Leaving the level mid-attempt (back to the map, closing the screen) counts as a quit.
  useEffect(
    () => () => {
      if (attempt.current.isPlaying && attempt.current.moves > 0) recordLevelPlay(levelId, 'quit');
      attempt.current.isPlaying = false;
    },
    [levelId],
  );

  return useMemo(
    () => ({
      start() {
        if (!isTracked) return;
        attempt.current.isPlaying = true;
        recordLevelPlay(levelId, 'start');
      },
      end(event) {
        if (!attempt.current.isPlaying) return;
        attempt.current.isPlaying = false;
        recordLevelPlay(levelId, event);
      },
    }),
    [levelId, isTracked],
  );
}
