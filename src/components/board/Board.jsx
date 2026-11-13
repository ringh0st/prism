import { useMemo, useRef, useState } from 'react';
import TileArt, { TileDefs } from './TileArt.jsx';
import BeamLayer from './BeamLayer.jsx';
import { describeTile } from '../../game/describe.js';
import { isRotatable as tileIsRotatable } from '../../game/beam.js';
import { TILE } from '../../game/constants.js';
import styles from './Board.module.css';

/**
 * Interactive puzzle board.
 *
 * @param level        { width, height, tiles }
 * @param orients      current orientation per tile index
 * @param turns        rotation count per tile index (drives the rotate animation)
 * @param trace        result of traceBeams()
 * @param onActivate   (cellIndex, tileIndex|-1) when a cell is tapped or Enter/Space is pressed
 * @param highlightTile tile index to pulse (hints)
 * @param isEditing    in the editor every cell is actionable
 * @param ghostSegments faint preview of the solved light path (Lens helper)
 */
export default function Board({
  level,
  orients,
  turns,
  trace,
  onActivate,
  highlightTile = null,
  isEditing = false,
  isLocked = false,
  ghostSegments = null,
  label = 'Puzzle board',
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

  const hasLitShade = trace.litShades.size > 0;

  return (
    <div
      className={`${styles.board} ${hasLitShade ? styles.alarm : ''} ${trace.isSolved && !isEditing ? styles.solved : ''}`}
      style={{ '--cols': width, '--rows': height }}
    >
      <TileDefs />
      <div className={styles.floor} aria-hidden="true">
        {Array.from({ length: width * height }, (_, cell) => (
          <span key={cell} className={styles.plate} />
        ))}
      </div>
      <BeamLayer width={width} height={height} segments={trace.segments} ghostSegments={ghostSegments} />
      <div className={styles.cells} role="grid" aria-label={label} aria-rowcount={height} aria-colcount={width}>
        {Array.from({ length: height }, (_, row) => (
          <div role="row" key={row} className={styles.row}>
            {Array.from({ length: width }, (_, col) => {
              const cell = row * width + col;
              const tileIndex = tileAtCell[cell];
              const tile = tileIndex >= 0 ? tiles[tileIndex] : null;
              const canRotate = tile ? tileIsRotatable(tile) : false;
              const isLit = tileIndex >= 0 && (trace.litGems.has(tileIndex) || trace.litShades.has(tileIndex));
              const isActionable = !isLocked && (isEditing || canRotate);
              const description = describeTile(tile, { orient: orients[tileIndex], isLit, isRotatable: canRotate });
              return (
                <div role="gridcell" key={col} className={styles.cellWrap}>
                  <button
                    ref={(element) => {
                      cellRefs.current[cell] = element;
                    }}
                    type="button"
                    className={`${styles.cell} ${isActionable ? styles.actionable : ''} ${
                      highlightTile === tileIndex && tileIndex >= 0 ? styles.hint : ''
                    } ${tile?.type === TILE.SHADE && isLit ? styles.shake : ''}`}
                    tabIndex={cell === focusedCell ? 0 : -1}
                    aria-label={`${description}. Row ${row + 1}, column ${col + 1}`}
                    aria-disabled={!isActionable || undefined}
                    onFocus={() => setFocusedCell(cell)}
                    onKeyDown={(event) => onKeyDown(event, cell)}
                    onClick={() => isActionable && onActivate(cell, tileIndex)}
                  >
                    {tile && (
                      <TileArt tile={tile} turns={turns[tileIndex] ?? orients[tileIndex] ?? 0} isLit={isLit} isRotatable={canRotate} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
