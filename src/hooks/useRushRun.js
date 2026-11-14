import { useCallback, useRef, useState } from 'react';
import { readJson, removeKey, writeJson } from '../lib/storage.js';
import { afterRushRestart, newRun, resumeRushRun, rushWeekOf } from '../game/rush.js';

const RUN_KEY = 'prism.rushRun.v1';

/** The run saved on this device, if it belongs to this week (moves made before leaving are spent). */
function savedRushRun() {
  const run = readJson(RUN_KEY, null);
  return run?.week === rushWeekOf() ? resumeRushRun(run) : null;
}

/**
 * The Light Rush run in progress, saved on every change (including each move), so leaving or closing
 * the app mid-puzzle counts like a restart instead of a free retry.
 */
export function useRushRun() {
  const [run, setRunState] = useState(savedRushRun);
  const runRef = useRef(run);

  const save = useCallback((next) => {
    runRef.current = next;
    if (next) writeJson(RUN_KEY, next);
    else removeKey(RUN_KEY);
    setRunState(next);
    return next;
  }, []);

  return {
    run,
    save,
    start: useCallback(() => save(newRun(rushWeekOf())), [save]),
    end: useCallback(() => save(null), [save]),
    moved: useCallback((moves) => runRef.current && save({ ...runRef.current, pending: moves }), [save]),
    restarted: useCallback((moves) => runRef.current && save(afterRushRestart(runRef.current, moves)), [save]),
  };
}
