import { useEffect, useMemo, useRef, useState } from 'react';
import TileArt, { TileDefs } from './TileArt.jsx';
import BeamLayer from './BeamLayer.jsx';
import LensPath from './LensPath.jsx';
import GlowbugArt from '../glowbugs/GlowbugArt.jsx';
import { glowbugById } from '../../game/glowbugs.js';
import { describeTile } from '../../game/describe.js';
import { isRotatable as tileIsRotatable } from '../../game/beam.js';
import { TILE } from '../../game/constants.js';
import { gemBurst } from '../../lib/effects.js';
import CoachHand from './CoachHand.jsx';
import styles from './Board.module.css';

/** Name tags for the first levels, so new players know which piece is which. */
const COACH_LABELS = { [TILE.EMITTER]: 'Lamp', [TILE.GEM]: 'Gem' };

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
}) {
  const { width, height, tiles } = level;
  const [focusedCell, setFocusedCell] = useState(0);
  const cellRefs = useRef([]);

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

  // A little starburst on each gem the moment it lights up (not in the editor, not on the first draw).
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
      gemBurst(cellRefs.current[tile.y * width + tile.x], color || null);
    }
  }, [trace.litGems, tiles, width, isEditing]);

  const hasLitShade = trace.litShades.size > 0;

  return (
    <div
      className={`${styles.board} ${styles[mood] ?? ''} ${hasLitShade ? styles.alarm : ''} ${trace.isSolved && !isEditing ? styles.solved : ''}`}
      style={{ '--cols': width, '--rows': height }}
    >
      <TileDefs />
      <div className={styles.floor} aria-hidden="true">
        {Array.from({ length: width * height }, (_, cell) => (
          <span key={cell} className={styles.plate} />
        ))}
      </div>
      <BeamLayer width={width} height={height} segments={trace.segments} />
      <div className={styles.cells} role="grid" aria-label={label} aria-rowcount={height} aria-colcount={width}>
        {Array.from({ length: height }, (_, row) => (
          <div role="row" key={row} className={styles.row}>
            {Array.from({ length: width }, (_, col) => {
              const cell = row * width + col;
              const tileIndex = tileAtCell[cell];
              const tile = tileIndex >= 0 ? tiles[tileIndex] : null;
              const left = turnsLeft?.[tileIndex] ?? Infinity;
              const canRotate = tile ? tileIsRotatable(tile) && left > 0 : false;
              const isFogged = Boolean(tile?.fog) && revealedCells !== null && !revealedCells.has(cell);
              const isLit = tileIndex >= 0 && (trace.litGems.has(tileIndex) || trace.litShades.has(tileIndex));
              const isActionable = !isLocked && (isEditing || canRotate);
              const description = describeTile(tile, { orient: orients[tileIndex], isLit, isRotatable: canRotate, isFogged, turnsLeft: left });
              return (
                <div role="gridcell" key={col} className={styles.cellWrap}>
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
                    aria-label={`${description}${glowbug?.cell === cell ? `. ${glowbugById(glowbug.id).name} the Glowbug is ${glowbug.isAwake ? 'awake' : 'asleep'} here` : ''}. Row ${row + 1}, column ${col + 1}`}
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
                        {COACH_LABELS[tile.type]}
                      </span>
                    )}
                    {tile && (
                      <TileArt
                        tile={tile}
                        turns={turns[tileIndex] ?? orients[tileIndex] ?? 0}
                        isLit={isLit}
                        isRotatable={canRotate}
                        turnsLeft={left}
                        isFogged={isFogged}
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {ghostSegments && <LensPath width={width} height={height} segments={ghostSegments} />}
    </div>
  );
}
