import { useEffect } from 'react';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { readJson, writeJson } from '../../lib/storage.js';
import { navigate } from '../../hooks/useHashRoute.js';

const STARTED_KEY = 'prism.firstLaunchDone.v1';

/**
 * A brand-new player goes straight from the splash into level 1-1, where the board itself teaches the
 * game (playtest research: the first win should come within seconds, and up-front tutorials don't help
 * simple games). Happens once; the picture tour is under Me → How to play.
 */
export default function FirstLaunch() {
  const { progress } = usePlayer();
  const hasPlayed = Object.values(progress.levels).some((entry) => entry.stars > 0);
  useEffect(() => {
    if (hasPlayed || readJson(STARTED_KEY, false)) return;
    writeJson(STARTED_KEY, true);
    navigate('#/play/w1-01');
  }, [hasPlayed]);
  return null;
}
