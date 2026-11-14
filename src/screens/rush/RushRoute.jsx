import { useEffect, useMemo, useState } from 'react';
import { useLevel } from '../../hooks/useLevel.js';
import { useRushRun } from '../../hooks/useRushRun.js';
import { navigate } from '../../hooks/useHashRoute.js';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { RUSH_MILESTONES, afterRushSolve, isRushComplete, rushLevelIds, rushRecordFor } from '../../game/rush.js';
import PlayScreen from '../play/PlayScreen.jsx';
import LoadingScreen from '../LoadingScreen.jsx';
import NotFoundScreen from '../NotFoundScreen.jsx';

/**
 * The current Light Rush puzzle (#/rush/play). The puzzle shown only moves on when the player taps
 * "Next puzzle", while the saved run updates the moment something happens.
 */
export default function RushRoute() {
  const { progress, recordRushRun } = usePlayer();
  const rush = useRushRun();
  const [shown, setShown] = useState(rush.run);
  // A new run can start on the same puzzle, so the screen key counts runs too.
  const [runNumber, setRunNumber] = useState(0);
  const levelIds = useMemo(() => (shown ? rushLevelIds(shown.week) : []), [shown]);
  const { level, isLoading } = useLevel(shown ? levelIds[shown.cleared] : null);

  useEffect(() => {
    if (!shown) navigate('#/rush');
  }, [shown]);

  if (!shown) return null;
  if (isLoading) return <LoadingScreen />;
  if (!level) return <NotFoundScreen />;

  const live = rush.run ?? shown;
  const bestBefore = rushRecordFor(progress, shown.week).best;
  const rushProps = {
    run: live,
    number: shown.cleared + 1,
    onMove: rush.moved,
    onRestart: rush.restarted,
    /** Solved: spares and bonus, and milestone sparks. @returns { next, sparksWon, isComplete } */
    async onSolved(moves) {
      const next = afterRushSolve(live, level.par, moves);
      const isComplete = isRushComplete(next);
      if (isComplete) rush.end();
      else rush.save(next);
      const isMilestone = RUSH_MILESTONES.some((milestone) => milestone.cleared === next.cleared);
      const sparksWon = isMilestone ? await recordRushRun(next.cleared) : 0;
      return { next, sparksWon, isComplete, isNewBest: next.cleared > bestBefore };
    },
    /** Out of moves: the run ends here. @returns { cleared, isNewBest } */
    async onRunOver() {
      rush.end();
      if (shown.cleared > 0) await recordRushRun(shown.cleared);
      return { cleared: shown.cleared, isNewBest: shown.cleared > bestBefore };
    },
    onNext: () => setShown(rush.run),
    onNewRun: () => {
      setShown(rush.start());
      setRunNumber((n) => n + 1);
    },
  };
  return <PlayScreen key={`${runNumber}-${shown.cleared}-${level.id}`} level={level} mode="rush" backHref="#/rush" rush={rushProps} />;
}
