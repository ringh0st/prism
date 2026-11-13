import { useCallback, useMemo, useState } from 'react';
import { traceBeams } from '../game/beam.js';
import { findHint } from '../game/solver.js';

const initialState = (level) => {
  const orients = level.tiles.map((tile) => tile.orient ?? 0);
  return { orients, turns: orients.slice(), moves: 0, usedHint: false, hintTile: null };
};

/**
 * Play state for one level: orientations, move count, hints, and the live beam trace.
 * Re-keys itself when the level changes.
 */
export function usePuzzle(level) {
  const [state, setState] = useState(() => ({ levelId: level.id, ...initialState(level) }));
  const current = state.levelId === level.id ? state : { levelId: level.id, ...initialState(level) };
  if (current !== state) setState(current);

  const trace = useMemo(() => traceBeams(level, current.orients), [level, current.orients]);

  const rotate = useCallback((tileIndex) => {
    setState((s) => {
      const orients = s.orients.slice();
      const turns = s.turns.slice();
      orients[tileIndex] ^= 1;
      turns[tileIndex] += 1;
      return { ...s, orients, turns, moves: s.moves + 1, hintTile: s.hintTile === tileIndex ? null : s.hintTile };
    });
  }, []);

  const restart = useCallback(() => setState({ levelId: level.id, ...initialState(level) }), [level]);

  /** Returns the hinted tile index, or null if no hint is available. */
  const revealHint = useCallback(() => {
    const tileIndex = findHint(level, current.orients);
    if (tileIndex !== null) setState((s) => ({ ...s, usedHint: true, hintTile: tileIndex }));
    return tileIndex;
  }, [level, current.orients]);

  return { ...current, trace, rotate, restart, revealHint };
}
