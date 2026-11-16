import { useEffect, useMemo, useRef, useState } from 'react';
import { bonusGoalState, freshPlay, isBonusGoalDone, playAfterTap, tilesInLight } from '../game/bonusGoals.js';
import { findBonusGoal } from '../lib/bonusGoalSearch.js';
import { sfx } from '../audio/sfx.js';

/**
 * The level's bonus goal (bonusGoals.js) and how this try is doing on it. The goal is worked out in the background
 * as the level opens; the play record follows the taps as they happen (an Undo doesn't take a tap back, a restart
 * starts over), so it's up to date in the same render that solves the level.
 * @returns {{ goal, state: 'open' | 'done' | 'missed' | null, play, wasDone, marked: tile indexes the board marks }}
 */
export function useBonusGoal({ level, enabled, puzzle, progress }) {
  const [found, setFound] = useState({ level: null, goal: null });
  useEffect(() => {
    if (!enabled) return undefined;
    const search = findBonusGoal(level);
    let isLive = true;
    search.promise.then((goal) => isLive && setFound({ level, goal }));
    return () => {
      isLive = false;
      search.cancel();
    };
  }, [enabled, level]);
  const goal = enabled && found.level === level ? found.goal : null;
  // Met before this visit (the win screen then shows it without paying again).
  const wasDone = useMemo(() => isBonusGoalDone(progress, level.id), [level.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { trace, taps, history, usedHelpers, darkness } = puzzle;
  const log = useRef(null);
  const tapped = useMemo(() => {
    const before = log.current?.level === level ? log.current : null;
    let play = before?.play ?? freshPlay();
    if (!before || history.length === 0) play = freshPlay();
    else if (taps.length > before.taps) {
      const tile = taps.at(-1);
      play = playAfterTap(play, tile, { litBefore: before.lit, litAfter: trace.litGems, wasInLight: before.inLight.has(tile) });
    }
    // Running this twice for one change (React's strict mode) finds the taps already counted and changes nothing.
    log.current = { level, play, taps: taps.length, lit: trace.litGems, inLight: tilesInLight(level, trace) };
    return play;
  }, [level, trace, taps, history.length]);
  const play = useMemo(
    () => ({ ...tapped, usedHelpers, burned: darkness?.burned.size ?? 0, isSolved: trace.isSolved }),
    [tapped, usedHelpers, darkness, trace.isSolved],
  );
  const state = goal ? bonusGoalState(goal, play) : null;

  // A little sparkle the moment the goal is in the bag (during play; the win screen has its own moment).
  const lastState = useRef(state);
  useEffect(() => {
    if (state === 'done' && lastState.current === 'open' && !trace.isSolved) sfx.sparkle();
    lastState.current = state;
  }, [state, trace.isSolved]);

  const marked = goal?.kind === 'untouched' ? goal.tiles : goal?.tile !== undefined ? [goal.tile] : [];
  return { goal, state, play, wasDone, marked };
}
