import { useState } from 'react';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { readJson, writeJson } from '../../lib/storage.js';
import { navigate } from '../../hooks/useHashRoute.js';
import WelcomeTour from './WelcomeTour.jsx';

const SEEN_KEY = 'prism.welcomeSeen.v1';

/** Brand-new players (nothing solved, tour not seen) get the welcome tour, then go straight into level 1. */
export default function WelcomeNotice() {
  const { progress } = usePlayer();
  const [isDone, setIsDone] = useState(() => readJson(SEEN_KEY, false));
  const hasPlayed = Object.values(progress.levels).some((entry) => entry.stars > 0);
  if (isDone || hasPlayed) return null;
  const finish = () => {
    writeJson(SEEN_KEY, true);
    setIsDone(true);
    navigate('#/play/w1-01');
  };
  return <WelcomeTour onDone={finish} />;
}
