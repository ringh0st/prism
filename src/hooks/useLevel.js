import { useEffect, useState } from 'react';
import { useLevels } from '../state/LevelsContext.jsx';

/** Loads one level's data (downloading its world on first use). */
export function useLevel(levelId) {
  const { loadLevel } = useLevels();
  const [state, setState] = useState({ levelId, level: null, isLoading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setState({ levelId, level: null, isLoading: true });
    loadLevel(levelId)
      .then((level) => isCurrent && setState({ levelId, level, isLoading: false }))
      .catch(() => isCurrent && setState({ levelId, level: null, isLoading: false, isFailed: true }));
    return () => {
      isCurrent = false;
    };
  }, [levelId, loadLevel, attempt]);

  const retry = () => setAttempt((n) => n + 1);
  return state.levelId === levelId ? { ...state, retry } : { levelId, level: null, isLoading: true, retry };
}
