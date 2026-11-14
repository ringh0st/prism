import { useEffect, useState } from 'react';
import { loadEventLevels } from '../data/eventPack.js';

/** The puzzles of one weekend event, loaded when needed. @returns {{ levels: level[], isLoading }} */
export function useEventLevels(weekend) {
  const [state, setState] = useState({ weekend: null, levels: [] });
  useEffect(() => {
    if (!weekend) return undefined;
    let isCurrent = true;
    loadEventLevels(weekend).then((levels) => isCurrent && setState({ weekend, levels }));
    return () => {
      isCurrent = false;
    };
  }, [weekend]);
  return { levels: state.weekend === weekend ? state.levels : [], isLoading: Boolean(weekend) && state.weekend !== weekend };
}
