import { memo, useMemo } from 'react';
import { SCENERY } from './sceneryArt.jsx';
import { placeScenery } from './placeScenery.js';
import styles from './Scenery.module.css';

/** The landscape around a world's road: trees, houses, rocks… Decorative, hidden from screen readers. */
function WorldScenery({ stops, worldId, theme }) {
  const pieces = useMemo(() => placeScenery(stops, worldId, theme), [stops, worldId, theme]);
  return (
    <div className={styles.scenery} aria-hidden="true">
      {pieces.map((piece, i) => (
        <svg
          key={i}
          className={styles.piece}
          width={piece.size}
          height={piece.size}
          viewBox="0 0 100 100"
          focusable="false"
          style={{ left: `${piece.x}%`, top: piece.y - piece.size, marginLeft: -piece.size / 2, transform: piece.flip ? 'scaleX(-1)' : undefined }}
        >
          {SCENERY[piece.kind].art}
        </svg>
      ))}
    </div>
  );
}

export default memo(WorldScenery);
