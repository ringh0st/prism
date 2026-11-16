import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildCellIndex, cellsOnBeams, rotationGroup, traceBeams } from '../game/beam.js';
import { findSafeOrder, hasDarkness, replayDarkness } from '../game/darkness.js';
import { findHint, nearestSolution } from '../game/solver.js';
import { starCapForHelpers } from '../game/catalog.js';
import { FRAGILE_TURNS } from '../game/constants.js';

const initialState = (level) => {
  const orients = level.tiles.map((tile) => tile.orient ?? 0);
  return {
    orients,
    turns: orients.slice(),
    moves: 0,
    history: [],
    taps: [],
    undos: 0,
    usedHelpers: [],
    hintTile: null,
    ghostSegments: null,
    headStartTile: null,
    startOrients: null,
  };
};

/** Turns a tile and its twins (`by` 1 forward, -1 back for an undo). */
const turned = (s, tiles, tileIndex, by = 1) => {
  const orients = s.orients.slice();
  const turns = s.turns.slice();
  for (const i of rotationGroup(tiles, tileIndex)) {
    orients[i] ^= 1;
    turns[i] += by;
  }
  return { orients, turns };
};

/**
 * One tap: the tile turns, along with its twins. `history` keeps every tap as shown (for the solve replay);
 * `taps` are the ones an Undo can take back.
 */
const rotated = (s, tiles, tileIndex) => ({
  ...s,
  ...turned(s, tiles, tileIndex),
  moves: s.moves + 1,
  history: [...s.history, tileIndex],
  taps: [...s.taps, tileIndex],
  hintTile: s.hintTile === tileIndex ? null : s.hintTile,
});

/** Head Start: Lumi turns one mirror of the best solution before the first tap (not a move; ★★ at most, like a Hint). */
const withHeadStart = (s, level) => {
  const tileIndex = findHint(level, s.orients);
  if (tileIndex === null) return s;
  const start = turned(s, level.tiles, tileIndex);
  return { ...s, ...start, startOrients: start.orients, headStartTile: tileIndex, usedHelpers: [...s.usedHelpers, 'headStart'] };
};

/**
 * A hint that knows the darkness: the next tap toward the nearest solution in an order the darkness can't win
 * (darkness.js), or the plain hint when there's no safe order left.
 */
function safeHint(level, orients, darkness, moves, cells) {
  const target = nearestSolution(level, orients);
  if (!target) return null;
  const groups = [];
  const seen = new Set();
  target.forEach((orient, i) => {
    if (orient === orients[i] || seen.has(i)) return;
    const group = rotationGroup(level.tiles, i);
    group.forEach((j) => seen.add(j));
    groups.push(group);
  });
  const order = findSafeOrder(level, orients, groups, darkness, moves, cells);
  return order?.length ? groups[order[0]][0] : findHint(level, orients);
}

/** Turns a cracking mirror has left (Infinity for every other tile). */
const turnsLeftOf = (tile, turns) => (tile.fragile ? Math.max(0, FRAGILE_TURNS - (turns - (tile.orient ?? 0))) : Infinity);

/**
 * Play state for one level: orientations, moves, helpers, and the live beam trace.
 * Cracking mirrors stop turning once their turns are used up; fog lifts for good wherever light reaches.
 * Re-keys itself when the level changes.
 */
export function usePuzzle(level) {
  const [state, setState] = useState(() => ({ levelId: level.id, ...initialState(level) }));
  const current = state.levelId === level.id ? state : { levelId: level.id, ...initialState(level) };
  if (current !== state) setState(current);

  // The darkness (darkness.js) replays the taps that still stand, so an Undo takes it back a step too.
  const isDark = useMemo(() => hasDarkness(level), [level]);
  const cells = useMemo(() => buildCellIndex(level), [level]);
  const startOrients = useMemo(() => current.startOrients ?? level.tiles.map((tile) => tile.orient ?? 0), [current.startOrients, level]);
  const darkness = useMemo(
    () =>
      isDark
        ? replayDarkness(
            level,
            startOrients,
            current.taps.map((i) => rotationGroup(level.tiles, i)),
            cells,
          )
        : null,
    [isDark, level, startOrients, current.taps, cells],
  );
  const plainTrace = useMemo(() => (isDark ? null : traceBeams(level, current.orients, cells)), [isDark, level, current.orients, cells]);
  const trace = darkness?.trace ?? plainTrace;

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
    const touched = cellsOnBeams(trace.segments, level.width, level.height);
    setRevealed((r) => {
      const base = r.levelId === level.id ? r.cells : new Set();
      if ([...touched].every((cell) => base.has(cell))) return r.levelId === level.id ? r : { levelId: level.id, cells: base };
      return { levelId: level.id, cells: new Set([...base, ...touched]) };
    });
  }, [trace, level.id, level.width, level.height]);
  const revealedCells = revealed.levelId === level.id ? revealed.cells : new Set();

  const rotate = useCallback(
    (tileIndex) =>
      setState((s) => {
        if (turnsLeftOf(level.tiles[tileIndex], s.turns[tileIndex]) === 0) return s;
        return rotated(s, level.tiles, tileIndex);
      }),
    [level.tiles],
  );

  // A Head Start stays for the whole visit: a restart begins from the turned mirror again.
  const hasHeadStart = useRef(false);
  const fresh = useCallback(() => {
    const start = { levelId: level.id, ...initialState(level) };
    return hasHeadStart.current ? withHeadStart(start, level) : start;
  }, [level]);
  const restart = useCallback(() => setState(fresh()), [fresh]);
  const startWithHeadStart = useCallback(() => {
    hasHeadStart.current = true;
    setState((s) => (s.headStartTile === null && s.moves === 0 ? withHeadStart(s, level) : s));
  }, [level]);

  /** Undo: takes back the last tap. It still counts toward the stars, but gives the move back (`undos`). */
  const undo = useCallback(
    () =>
      setState((s) => {
        const tileIndex = s.taps.at(-1);
        if (tileIndex === undefined) return s;
        return { ...s, ...turned(s, level.tiles, tileIndex, -1), taps: s.taps.slice(0, -1), history: [...s.history, tileIndex], undos: s.undos + 1 };
      }),
    [level.tiles],
  );

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
      const tileIndex = darkness
        ? safeHint(solverLevel, current.orients, darkness, current.taps.length, cells)
        : findHint(solverLevel, current.orients);
      if (tileIndex === null) return false;
      if (helperId === 'hint') setState((s) => markUsed(s, { hintTile: tileIndex }));
      if (helperId === 'autoturn') setState((s) => markUsed(rotated(s, level.tiles, tileIndex)));
      return true;
    },
    [level, solverLevel, current.orients, darkness, current.taps.length, cells],
  );

  const clearGhost = useCallback(() => setState((s) => ({ ...s, ghostSegments: null })), []);

  return {
    ...current,
    trace,
    darkness,
    turnsLeft,
    revealedCells,
    starCap: starCapForHelpers(current.usedHelpers),
    rotate,
    restart,
    undo,
    startWithHeadStart,
    applyHelper,
    clearGhost,
  };
}
