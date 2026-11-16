import { memo } from 'react';
import { SmudgeArt } from './darkTileArt.jsx';
import { gloomsNow } from '../../game/darkness.js';
import { TILE } from '../../game/constants.js';
import styles from './Board.module.css';

/**
 * The darkness on the board, between the light and the pieces: each void's dark halo (where it swallows light),
 * each creeping shadow's trail to its gem as fading footprints, and Smudge himself, gliding a cell per move and
 * puffing away when the light burns him. An eclipse shows how many moves until it comes.
 * @param darkness the state from darkness.js (null: nothing to draw)
 * @param moves    moves that still stand (for the eclipse countdown)
 */
function DarknessLayer({ level, darkness, moves }) {
  const { width, height } = level;
  const glooms = gloomsNow(level, darkness);
  const voids = level.tiles.filter((tile) => tile.type === TILE.VOID);
  const at = (cell) => ({ x: (cell % width) + 0.5, y: Math.floor(cell / width) + 0.5 });
  const eclipseIn = level.eclipse ? level.eclipse - (moves % level.eclipse) : null;
  return (
    <>
      <svg className={styles.darkness} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <radialGradient id="void-halo">
            <stop offset="0%" stopColor="#2f2620" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2f2620" stopOpacity="0" />
          </radialGradient>
        </defs>
        {voids.map((tile) => (
          <circle key={`${tile.x},${tile.y}`} cx={tile.x + 0.5} cy={tile.y + 0.5} r="1.75" fill="url(#void-halo)" />
        ))}
        {glooms
          .filter((gloom) => !gloom.isBurned)
          .map((gloom) => (
            <g key={gloom.index} className={styles.trail}>
              {gloom.trail.slice(1).map((cell, step) => {
                const { x, y } = at(cell);
                return <circle key={cell} cx={x} cy={y} r={0.09 + 0.02 * Math.max(0, 3 - step)} fill="#4a3a30" opacity={0.55 - step * 0.06} />;
              })}
            </g>
          ))}
      </svg>
      <div className={styles.darknessPieces} aria-hidden="true">
        {glooms.map((gloom) => {
          const { x, y } = at(gloom.cell);
          return (
            <span
              key={gloom.index}
              className={`${styles.gloom} ${gloom.isBurned ? styles.gloomBurned : ''} ${gloom.stepsLeft <= 1 ? styles.gloomClose : ''}`}
              style={{
                left: `${((x - 0.5) / width) * 100}%`,
                top: `${((y - 0.5) / height) * 100}%`,
                width: `${100 / width}%`,
                height: `${100 / height}%`,
              }}
            >
              <svg viewBox="0 0 100 100">
                <SmudgeArt isScared={gloom.isBurned} />
              </svg>
            </span>
          );
        })}
        {eclipseIn !== null && (
          <span className={`${styles.eclipseChip} ${eclipseIn === 1 ? styles.eclipseSoon : ''}`}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <circle cx="12" cy="12" r="8" fill="#f0c14e" />
              <circle cx="15" cy="10" r="7" fill="#4a3a30" />
            </svg>
            {eclipseIn}
          </span>
        )}
      </div>
    </>
  );
}

export default memo(DarknessLayer);
