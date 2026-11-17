import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import TileArt, { TileDefs } from './TileArt.jsx';
import BeamLayer from './BeamLayer.jsx';
import DarknessLayer from './DarknessLayer.jsx';
import { fadeLeft, gloomsNow, isEclipseMove, powerLeft } from '../../game/darkness.js';
import LensPath from './LensPath.jsx';
import GlowbugArt from '../glowbugs/GlowbugArt.jsx';
import { glowbugById } from '../../game/glowbugs.js';
import { glowbugName } from '../../i18n/groveText.js';
import { describeTile } from '../../game/describe.js';
import { cellsOnBeams, isRotatable as tileIsRotatable } from '../../game/beam.js';
import { TILE } from '../../game/constants.js';
import { boardThemeFor } from '../../game/boardThemes.js';
import { flyToCounter, gemBurst, glint } from '../../lib/effects.js';
import CoachHand from './CoachHand.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { DarkCounter, SmudgeArt } from './darkTileArt.jsx';
import styles from './Board.module.css';

/** Name tags for the first levels, so new players know which piece is which (translation keys). */
// The 3D board (three.js) loads only when it's used, so the flat board stays light.
const Board3D = lazy(() => import('../board3d/Board3D.jsx'));
// Themed worlds (the Library…) are drawn with React Three Fiber, loaded only when one is played.
const BoardFiber = lazy(() => import('../boardFiber/BoardFiber.jsx'));

/** Glints per turn at most, so a long new stretch of light stays a quick sparkle. */
const MAX_GLINTS = 6;
const COACH_LABELS = { [TILE.EMITTER]: 'board.lamp', [TILE.GEM]: 'board.gem' };

/**
 * Interactive puzzle board.
 *
 * @param level        { width, height, tiles }
 * @param orients      current orientation per tile index
 * @param turns        rotation count per tile index (drives the rotate animation)
 * @param trace        result of traceBeams()
 * @param onActivate   (cellIndex, tileIndex|-1) when a cell is tapped or Enter/Space is pressed
 * @param highlightTile tile index the Hint points at (ring and "turn me" badge)
 * @param spotlightTile tile index to gently pulse (a newly introduced piece)
 * @param isEditing    in the editor every cell is actionable
 * @param ghostSegments faint preview of the solved light path (Lens helper)
 * @param mood         surprise look: normal | disco | night | boss
 * @param turnsLeft    turns each cracking mirror has left (a cracked one can't turn)
 * @param revealedCells cells the light has reached (fog lifts there); null shows everything (editor)
 * @param glowbug      { id, cell, isAwake, isFreed }: a Glowbug sleeping on a cell (it wakes in the light)
 * @param onBlocked    (cellIndex, tileIndex) when a piece that can't turn is tapped (so it can say why)
 * @param nudgedCell   cell to give a little "nope" shake
 * @param lookHere     Set of cells to softly glow: the free "look around here" step of the hint ladder
 * @param coach        first-levels coaching: { tile: tile index the hand points at, or null; labels: show Lamp/Gem tags }
 * @param darkness     the darkness now (darkness.js): creeping shadows, countdowns on fading gems and dying lamps
 * @param darkMoves    moves that still stand (for the eclipse countdown)
 * @param is3d         draw the board as a 3D tabletop (prototype): the buttons stay, placed over the 3D pieces
 */
export default function Board({
  level,
  orients,
  turns,
  trace,
  onActivate,
  highlightTile = null,
  spotlightTile = null,
  isEditing = false,
  isLocked = false,
  ghostSegments = null,
  mood = 'normal',
  label = 'Puzzle board',
  turnsLeft = null,
  revealedCells = null,
  glowbug = null,
  coach = null,
  lookHere = null,
  onBlocked = null,
  nudgedCell = null,
  darkness = null,
  darkMoves = 0,
  is3d = false,
}) {
  const { t, lang } = useI18n();
  const { width, height, tiles } = level;
  const [focusedCell, setFocusedCell] = useState(0);
  const cellRefs = useRef([]);
  const boardRef = useRef(null);
  // In 3D, where each cell's piece is on screen (from Board3D), so its button sits over it.
  const [cellRects, setCellRects] = useState(null);
  const allTurns = useMemo(() => tiles.map((_, i) => turns[i] ?? orients[i] ?? 0), [tiles, turns, orients]);

  const tileAtCell = useMemo(() => {
    const map = Array.from({ length: width * height }, () => -1);
    tiles.forEach((tile, i) => {
      map[tile.y * width + tile.x] = i;
    });
    return map;
  }, [tiles, width, height]);

  const moveFocus = (cell) => {
    const next = Math.max(0, Math.min(width * height - 1, cell));
    setFocusedCell(next);
    cellRefs.current[next]?.focus();
  };

  const onKeyDown = (event, cell) => {
    const x = cell % width;
    const moves = {
      ArrowRight: x < width - 1 ? cell + 1 : cell,
      ArrowLeft: x > 0 ? cell - 1 : cell,
      ArrowDown: cell + width < width * height ? cell + width : cell,
      ArrowUp: cell - width >= 0 ? cell - width : cell,
      Home: cell - x,
      End: cell - x + width - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      moveFocus(moves[event.key]);
    }
  };

  // A burst of light on each gem the moment it lights up (not in the editor, not on the first draw).
  const litBefore = useRef(null);
  useEffect(() => {
    const previous = litBefore.current;
    litBefore.current = trace.litGems;
    if (!previous || isEditing) return;
    for (const tileIndex of trace.litGems) {
      if (previous.has(tileIndex)) continue;
      const tile = tiles[tileIndex];
      const color = getComputedStyle(document.documentElement)
        .getPropertyValue(`--beam-${tile.color ?? 'sun'}`)
        .trim();
      const cell = cellRefs.current[tile.y * width + tile.x];
      gemBurst(cell, color || null);
      // The gem's spark flies to its place in the gem counter above the board.
      flyToCounter(cell, document.querySelector(`[data-gem-slot="${tileIndex}"]`), color || undefined);
    }
  }, [trace.litGems, tiles, width, isEditing]);

  const hasLitShade = trace.litShades.size > 0;
  // Where each creeping shadow is, for the screen reader (the layer draws them).
  const gloomAt = useMemo(
    () =>
      new Map(
        darkness
          ? gloomsNow(level, darkness)
              .filter((g) => !g.isBurned)
              .map((g) => [g.cell, g])
          : [],
      ),
    [level, darkness],
  );
  // What the 3D board shows (it draws the pieces itself; countdowns and Smudge ride on the buttons over them).
  const state3d = useMemo(
    () =>
      is3d
        ? {
            turns: allTurns,
            trace,
            turnsLeft,
            revealedCells,
            darkenedTile: darkness?.lost?.tile ?? null,
            glooms: darkness ? gloomsNow(level, darkness) : [],
            lookHere,
          }
        : null,
    [is3d, allTurns, trace, turnsLeft, revealedCells, darkness, level, lookHere],
  );
  const eclipseIn = is3d && darkness && level.eclipse ? level.eclipse - (darkMoves % level.eclipse) : null;
  const litPlates = useMemo(() => (isEditing ? new Set() : cellsOnBeams(trace.segments, width, height)), [trace.segments, width, height, isEditing]);
  // Every turn that sends the light somewhere new sparkles along the new stretch, one cell after another, so a turn
  // never feels dead even before a gem lights up (a few glints at most; nothing for reduced motion).
  const platesBefore = useRef(null);
  useEffect(() => {
    const previous = platesBefore.current;
    platesBefore.current = litPlates;
    if (!previous || isEditing) return undefined;
    const fresh = [...litPlates].filter((cell) => !previous.has(cell)).slice(0, MAX_GLINTS);
    const timers = fresh.map((cell, n) => setTimeout(() => glint(cellRefs.current[cell], null), n * 55));
    return () => timers.forEach(clearTimeout);
  }, [litPlates, isEditing]);

  return (
    <div
      ref={boardRef}
      dir="ltr"
      className={`${styles.board} ${is3d ? styles.board3d : ''} ${styles[mood] ?? ''} ${hasLitShade ? styles.alarm : ''} ${trace.isSolved && !isEditing ? styles.solved : ''} ${
        darkness && isEclipseMove(level, darkMoves) ? styles.eclipse : ''
      }`}
      style={{ '--cols': width, '--rows': height }}
    >
      <TileDefs />
      {is3d && (
        <Suspense fallback={null}>
          {boardThemeFor(level) ? (
            <BoardFiber
              level={level}
              theme={boardThemeFor(level)}
              state={state3d}
              onLayout={setCellRects}
              onTapCell={(cell) => cellRefs.current[cell]?.click()}
            />
          ) : (
            <Board3D
              level={level}
              state={state3d}
              onLayout={setCellRects}
              onTapCell={(cell) => cellRefs.current[cell]?.click()}
              surfaceRef={boardRef}
            />
          )}
        </Suspense>
      )}
      {!is3d && (
        <div className={styles.floor} aria-hidden="true">
          {/* A checkerboard in the world's colors; the cells the light passes through glow in its color. */}
          {Array.from({ length: width * height }, (_, cell) => (
            <span
              key={cell}
              className={`${styles.plate} ${(Math.floor(cell / width) + (cell % width)) % 2 ? styles.plateAlt : ''} ${litPlates.has(cell) ? styles.plateLit : ''}`}
            />
          ))}
        </div>
      )}
      {!is3d && <BeamLayer width={width} height={height} segments={trace.segments} />}
      {darkness && !is3d && <DarknessLayer level={level} darkness={darkness} moves={darkMoves} />}
      <div className={`${styles.cells} ${is3d ? styles.cells3d : ''}`} role="grid" aria-label={label} aria-rowcount={height} aria-colcount={width}>
        {Array.from({ length: height }, (_, row) => (
          <div role="row" key={row} className={styles.row}>
            {Array.from({ length: width }, (_, col) => {
              const cell = row * width + col;
              const tileIndex = tileAtCell[cell];
              const tile = tileIndex >= 0 ? tiles[tileIndex] : null;
              const left = turnsLeft?.[tileIndex] ?? Infinity;
              const canRotate = tile ? tileIsRotatable(tile) && left > 0 : false;
              const isFogged = Boolean(tile?.fog) && revealedCells !== null && !revealedCells.has(cell);
              const isLit =
                tileIndex >= 0 && (trace.litGems.has(tileIndex) || trace.litShades.has(tileIndex) || Boolean(trace.litSwitches?.has(tileIndex)));
              const isOpen = tile?.type === TILE.GATE && Boolean(trace.openGates?.has(tile.pair));
              const isActionable = !isLocked && (isEditing || canRotate);
              // The darkness: a countdown on fading gems and dying lamps, and a gem it took.
              const darkCount =
                !darkness || !tile
                  ? undefined
                  : tile.fade
                    ? fadeLeft(level, darkness, tileIndex)
                    : tile.power !== undefined
                      ? powerLeft(level, darkness, tileIndex)
                      : undefined;
              const isDarkened = darkness?.lost?.tile === tileIndex && tile?.type === TILE.GEM;
              const gloom = gloomAt.get(cell);
              const darkWords = [
                darkCount != null && t(tile.fade ? 'ui.cell.fadeLeft' : 'ui.cell.powerLeft', { count: darkCount }),
                isDarkened && t('ui.cell.darkened'),
                gloom && t('ui.cell.gloom', { count: gloom.stepsLeft }),
              ].filter(Boolean);
              const description =
                describeTile(tile, { orient: orients[tileIndex], isLit, isOpen, isRotatable: canRotate, isFogged, turnsLeft: left }, t) +
                (darkWords.length ? `, ${darkWords.join(', ')}` : '');
              return (
                <div
                  role="gridcell"
                  key={col}
                  className={styles.cellWrap}
                  style={
                    is3d && cellRects
                      ? {
                          position: 'absolute',
                          left: cellRects[cell].left,
                          top: cellRects[cell].top,
                          width: cellRects[cell].width,
                          height: cellRects[cell].height,
                        }
                      : undefined
                  }
                >
                  <button
                    ref={(element) => {
                      cellRefs.current[cell] = element;
                    }}
                    type="button"
                    data-cell={cell}
                    className={`${styles.cell} ${isActionable ? styles.actionable : ''} ${
                      highlightTile === tileIndex && tileIndex >= 0 ? styles.hint : ''
                    } ${
                      spotlightTile === tileIndex && tileIndex >= 0 ? styles.spotlight : ''
                    } ${coach?.tile === tileIndex && tileIndex >= 0 ? styles.coached : ''} ${lookHere?.has(cell) ? styles.lookHere : ''} ${(tile?.type === TILE.SHADE && isLit) || nudgedCell === cell ? styles.shake : ''}`}
                    tabIndex={cell === focusedCell ? 0 : -1}
                    aria-label={`${description}${glowbug?.cell === cell ? `. ${t(glowbug.isAwake ? 'ui.cell.glowbugAwake' : 'ui.cell.glowbugAsleep', { name: glowbugName(lang, glowbugById(glowbug.id)) })}` : ''}. ${t('ui.cell.position', { row: row + 1, col: col + 1 })}`}
                    aria-disabled={!isActionable || undefined}
                    onFocus={() => setFocusedCell(cell)}
                    onKeyDown={(event) => onKeyDown(event, cell)}
                    onClick={() => (isActionable ? onActivate(cell, tileIndex) : !isLocked && tile && onBlocked?.(cell, tileIndex))}
                  >
                    {glowbug?.cell === cell && (
                      <span className={`${styles.glowbug} ${tile ? styles.glowbugOnTile : ''} ${glowbug.isFreed ? styles.glowbugFreed : ''}`}>
                        <GlowbugArt id={glowbug.id} size="100%" isAwake={glowbug.isAwake} />
                      </span>
                    )}
                    {coach?.tile === tileIndex && tileIndex >= 0 && <CoachHand />}
                    {coach?.labels && COACH_LABELS[tile?.type] && (
                      <span className={styles.coachLabel} aria-hidden="true">
                        {t(tile.type === TILE.GEM && boardThemeFor(level) ? 'board.lumi' : COACH_LABELS[tile.type])}
                      </span>
                    )}
                    {is3d && gloom && (
                      <svg className={styles.overlay3d} viewBox="0 0 100 100" aria-hidden="true">
                        <SmudgeArt />
                      </svg>
                    )}
                    {is3d && darkCount != null && !isDarkened && !isFogged && (
                      <svg className={styles.overlay3d} viewBox="0 0 100 100" aria-hidden="true">
                        <DarkCounter value={darkCount} />
                      </svg>
                    )}
                    {tile && !is3d && (
                      <TileArt
                        tile={tile}
                        turns={turns[tileIndex] ?? orients[tileIndex] ?? 0}
                        isLit={isLit}
                        isOpen={isOpen}
                        isRotatable={canRotate}
                        turnsLeft={left}
                        isFogged={isFogged}
                        darkCount={darkCount}
                        isDarkened={isDarkened}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {eclipseIn !== null && (
        <div className={styles.darknessPieces} aria-hidden="true">
          <span className={`${styles.eclipseChip} ${eclipseIn === 1 ? styles.eclipseSoon : ''}`}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <circle cx="12" cy="12" r="8" fill="#f0c14e" />
              <circle cx="15" cy="10" r="7" fill="#4a3a30" />
            </svg>
            {eclipseIn}
          </span>
        </div>
      )}
      {ghostSegments && !is3d && <LensPath width={width} height={height} segments={ghostSegments} />}
    </div>
  );
}
