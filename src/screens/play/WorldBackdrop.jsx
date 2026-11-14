import { memo, useMemo } from 'react';
import { createRandom } from '../../lib/random.js';
import { BIOMES, SCENERY } from '../map/scenery/sceneryArt.jsx';
import styles from './WorldBackdrop.module.css';

/** Where the landscape pieces stand along the bottom (% across) and whether each is a big one. */
const SPOTS = [
  [4, true],
  [18, false],
  [30, false],
  [70, false],
  [83, false],
  [95, true],
];

/**
 * The world's own landscape along the bottom of a level (pines in one world, cacti or palms in another),
 * on rolling hills in the world's colors. Decorative; the same world always looks the same.
 */
function WorldBackdrop({ worldId, theme }) {
  const pieces = useMemo(() => {
    const biome = BIOMES[theme] ?? BIOMES.sunshine;
    const random = createRandom(`backdrop-${worldId}`);
    return SPOTS.map(([x, isBig]) => {
      const kind = random.pick(isBig ? biome.big : biome.small);
      return { kind, x, size: Math.round(SCENERY[kind].size * (isBig ? 1.5 : 1)), flip: random.chance(0.5) };
    });
  }, [worldId, theme]);

  return (
    <div className={styles.backdrop} aria-hidden="true">
      <svg className={styles.hills} viewBox="0 0 400 120" preserveAspectRatio="none">
        <path className={styles.far} d="M0 60C60 30 130 40 200 55S330 30 400 45V120H0z" />
        <path className={styles.near} d="M0 90C80 70 160 80 240 92S350 75 400 85V120H0z" />
      </svg>
      {pieces.map((piece, i) => (
        <svg
          key={i}
          className={styles.piece}
          width={piece.size}
          height={piece.size}
          viewBox="0 0 100 100"
          focusable="false"
          style={{ left: `${piece.x}%`, marginLeft: -piece.size / 2, transform: piece.flip ? 'scaleX(-1)' : undefined }}
        >
          <g className={styles.sway} style={{ animationDelay: `${-i * 1.1}s` }}>
            {SCENERY[piece.kind].art}
          </g>
        </svg>
      ))}
    </div>
  );
}

export default memo(WorldBackdrop);
