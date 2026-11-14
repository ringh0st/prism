import { memo, useMemo } from 'react';
import { SCENERY } from './sceneryArt.jsx';
import { placeScenery } from './placeScenery.js';
import styles from './Scenery.module.css';

/** Plants that sway in the breeze (houses, rocks and mountains stay put). */
const SWAYS = new Set(['treeRound', 'treePine', 'treeAutumn', 'blossomTree', 'palm', 'bush', 'flowers', 'tuft', 'reeds', 'fern']);

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
          <g className={SWAYS.has(piece.kind) ? styles.sway : undefined} style={{ animationDelay: `${-(i % 7) * 0.9}s` }}>
            {SCENERY[piece.kind].art}
          </g>
        </svg>
      ))}
    </div>
  );
}

export default memo(WorldScenery);
