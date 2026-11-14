import { useCallback, useEffect, useMemo, useState } from 'react';
import { rotationGroup, traceBeams } from '../game/beam.js';
import { findHint, nearestSolution } from '../game/solver.js';
import { starCapForHelpers } from '../game/catalog.js';
import { FRAGILE_TURNS } from '../game/constants.js';

const initialState = (level) => {
  const orients = level.tiles.map((tile) => tile.orient ?? 0);
  return { orients, turns: orients.slice(), moves: 0, usedHelpers: [], hintTile: null, ghostSegments: null };
};

/** One tap: the tile turns, along with its twins. */
const rotated = (s, tiles, tileIndex) => {
  const orients = s.orients.slice();
  const turns = s.turns.slice();
  for (const i of rotationGroup(tiles, tileIndex)) {
    orients[i] ^= 1;
    turns[i] += 1;
  }
  return { ...s, orients, turns, moves: s.moves + 1, hintTile: s.hintTile === tileIndex ? null : s.hintTile };
};

/** Turns a cracking mirror has left (Infinity for every other tile). */
const turnsLeftOf = (tile, turns) => (tile.fragile ? Math.max(0, FRAGILE_TURNS - (turns - (tile.orient ?? 0))) : Infinity);

/** The board cells a beam passes through or ends in (for lifting fog). */
function cellsTouched(trace, width) {
  const cells = new Set();
  for (const { x1, y1, x2, y2 } of trace.segments) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2;
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x1 + ((x2 - x1) * i) / Math.max(1, steps));
      const y = Math.round(y1 + ((y2 - y1) * i) / Math.max(1, steps));
      cells.add(y * width + x);
    }
  }
  return cells;
}

/**
 * Play state for one level: orientations, moves, helpers, and the live beam trace.
 * Cracking mirrors stop turning once their turns are used up; fog lifts for good wherever light reaches.
 * Re-keys itself when the level changes.
 */
export function usePuzzle(level) {
  const [state, setState] = useState(() => ({ levelId: level.id, ...initialState(level) }));
  const current = state.levelId === level.id ? state : { levelId: level.id, ...initialState(level) };
  if (current !== state) setState(current);

  const trace = useMemo(() => traceBeams(level, current.orients), [level, current.orients]);

  // Cracked mirrors (no turns left) are fixed from now on, also for hints and the Lens.
  const turnsLeft = useMemo(() => level.tiles.map((tile, i) => turnsLeftOf(tile, current.turns[i])), [level.tiles, current.turns]);
  const solverLevel = useMemo(
    () =>
      turnsLeft.some((left) => left === 0)
        ? { ...level, tiles: level.tiles.map((tile, i) => (turnsLeft[i] === 0 ? { ...tile, locked: true } : tile)) }
        : level,
    [level, turnsLeft],
  );

  // Fog lifts for good once light touches a cell.
  const [revealed, setRevealed] = useState(() => ({ levelId: level.id, cells: new Set() }));
  useEffect(() => {
    const touched = cellsTouched(trace, level.width);
    setRevealed((r) => {
      const base = r.levelId === level.id ? r.cells : new Set();
      if ([...touched].every((cell) => base.has(cell))) return r.levelId === level.id ? r : { levelId: level.id, cells: base };
      return { levelId: level.id, cells: new Set([...base, ...touched]) };
    });
  }, [trace, level.id, level.width]);
  const revealedCells = revealed.levelId === level.id ? revealed.cells : new Set();

  const rotate = useCallback(
    (tileIndex) =>
      setState((s) => {
        if (turnsLeftOf(level.tiles[tileIndex], s.turns[tileIndex]) === 0) return s;
        return rotated(s, level.tiles, tileIndex);
      }),
    [level.tiles],
  );

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
        const target = nearestSolution(solverLevel, current.orients);
        if (!target) return false;
        setState((s) => markUsed(s, { ghostSegments: traceBeams(level, target).segments }));
        return true;
      }
      const tileIndex = findHint(solverLevel, current.orients);
      if (tileIndex === null) return false;
      if (helperId === 'hint') setState((s) => markUsed(s, { hintTile: tileIndex }));
      if (helperId === 'autoturn') setState((s) => markUsed(rotated(s, level.tiles, tileIndex)));
      return true;
    },
    [level, solverLevel, current.orients],
  );

  const clearGhost = useCallback(() => setState((s) => ({ ...s, ghostSegments: null })), []);

  return {
    ...current,
    trace,
    turnsLeft,
    revealedCells,
    starCap: starCapForHelpers(current.usedHelpers),
    rotate,
    restart,
    applyHelper,
    clearGhost,
  };
}
