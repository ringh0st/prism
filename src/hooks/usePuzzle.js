import { useCallback, useMemo, useState } from 'react';
import { traceBeams } from '../game/beam.js';
import { findHint, nearestSolution } from '../game/solver.js';
import { starCapForHelpers } from '../game/catalog.js';

const initialState = (level) => {
  const orients = level.tiles.map((tile) => tile.orient ?? 0);
  return { orients, turns: orients.slice(), moves: 0, usedHelpers: [], hintTile: null, ghostSegments: null };
};

const rotated = (s, tileIndex) => {
  const orients = s.orients.slice();
  const turns = s.turns.slice();
  orients[tileIndex] ^= 1;
  turns[tileIndex] += 1;
  return { ...s, orients, turns, moves: s.moves + 1, hintTile: s.hintTile === tileIndex ? null : s.hintTile };
};

/**
 * Play state for one level: orientations, moves, helpers, and the live beam trace.
 * Re-keys itself when the level changes.
 */
export function usePuzzle(level) {
  const [state, setState] = useState(() => ({ levelId: level.id, ...initialState(level) }));
  const current = state.levelId === level.id ? state : { levelId: level.id, ...initialState(level) };
  if (current !== state) setState(current);

  const trace = useMemo(() => traceBeams(level, current.orients), [level, current.orients]);

  const rotate = useCallback((tileIndex) => setState((s) => rotated(s, tileIndex)), []);

  const restart = useCallback(() => setState({ levelId: level.id, ...initialState(level) }), [level]);

  /**
   * Apply a helper's effect to the board. Skip is handled by the screen.
   * @returns true if the helper did something
   */
  const applyHelper = useCallback(
    (helperId) => {
      const markUsed = (s, patch = {}) => ({ ...s, ...patch, usedHelpers: [...s.usedHelpers, helperId] });
      if (helperId === 'skip') {
        setState((s) => markUsed(s));
        return true;
      }
      if (helperId === 'lens') {
        const target = nearestSolution(level, current.orients);
        if (!target) return false;
        setState((s) => markUsed(s, { ghostSegments: traceBeams(level, target).segments }));
        return true;
      }
      const tileIndex = findHint(level, current.orients);
      if (tileIndex === null) return false;
      if (helperId === 'hint') setState((s) => markUsed(s, { hintTile: tileIndex }));
      if (helperId === 'autoturn') setState((s) => markUsed(rotated(s, tileIndex)));
      return true;
    },
    [level, current.orients],
  );

  const clearGhost = useCallback(() => setState((s) => ({ ...s, ghostSegments: null })), []);

  return {
    ...current,
    trace,
    starCap: starCapForHelpers(current.usedHelpers),
    rotate,
    restart,
    applyHelper,
    clearGhost,
  };
}
