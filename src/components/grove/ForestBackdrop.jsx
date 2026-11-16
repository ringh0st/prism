import styles from './GroveScene.module.css';
import { BACKDROP_LANDS } from './groveBackdrops.jsx';

/** The sky through the day: soft pink mornings, warm days, peach evenings, quiet starry nights. */
export const SKIES = {
  dawn: { sky: '#F8E4D4', sun: '#F9C9A0', tint: null },
  day: { sky: '#F6EED9', sun: '#FBE3A6', tint: null },
  dusk: { sky: '#F3D2B5', sun: '#F2A67E', tint: 'rgba(223, 116, 88, 0.12)' },
  night: { sky: '#3A3530', sun: null, tint: 'rgba(28, 26, 22, 0.42)' },
};

/** The forest through the year: fresh blossoms, deep summer green, golden autumn, a snowy winter. */
const SEASONS = {
  spring: { far: '#BFDDB5', near: '#A3CFA6', ground: '#D3E8B6', path: '#EBDDB8', tufts: '#B7D69C', dots: '#F6C9BC' },
  summer: { far: '#B9D9B8', near: '#9CC9A3', ground: '#CFE5B5', path: '#EBDDB8', tufts: '#B7D69C', dots: null },
  autumn: { far: '#EDC98C', near: '#E3A574', ground: '#DCD9A4', path: '#ECD9B0', tufts: '#C9C07E', dots: '#DF7458' },
  winter: { far: '#D5E2D2', near: '#BCD2BF', ground: '#F5F1E8', path: '#E7E1D3', tufts: '#DCE6DA', dots: '#FFFDF6' },
};

const FAR_TREES = [
  [20, 120, 46],
  [90, 96, 40],
  [200, 104, 44],
  [300, 100, 42],
  [380, 118, 44],
];
const NEAR_TREES = [
  [54, 142, 40],
  [150, 134, 36],
  [250, 138, 38],
  [350, 142, 40],
];

/** Blossoms, autumn berries or snow caps dotted on the near treetops. */
function TreeDots({ color, season }) {
  if (!color) return null;
  if (season === 'winter') {
    return (
      <g fill={color}>
        {NEAR_TREES.map(([x, y, r]) => (
          <path
            key={x}
            d={`M${x - r * 0.8} ${y - r * 0.5}a${r * 0.8} ${r * 0.6} 0 0 1 ${r * 1.6} 0q-${r * 0.4} 8-${r * 0.8} 2q-${r * 0.4} 6-${r * 0.8}-2z`}
          />
        ))}
      </g>
    );
  }
  return (
    <g fill={color}>
      {NEAR_TREES.flatMap(([x, y, r]) => [
        <circle key={`${x}a`} cx={x - r * 0.4} cy={y - r * 0.4} r="3.2" />,
        <circle key={`${x}b`} cx={x + r * 0.35} cy={y - r * 0.15} r="2.6" />,
        <circle key={`${x}c`} cx={x - r * 0.05} cy={y - r * 0.7} r="2.4" />,
      ])}
    </g>
  );
}

/**
 * Hills and trees under the sky of the moment and in the colors of the season; at night the moon and stars come out.
 * A bought background (`backdrop`, see groveBackdrops.jsx) swaps the forest for its own land under the same sky.
 */
export default function ForestBackdrop({ time, season, hasMoon, backdrop = null }) {
  const Land = BACKDROP_LANDS[backdrop];
  const sky = SKIES[time];
  const land = SEASONS[season];
  const isNight = time === 'night';
  return (
    <>
      <rect width="400" height="280" fill={hasMoon && !isNight ? '#EDE6D6' : sky.sky} />
      {isNight && (
        <g fill="#FFF1C2">
          <path d="M338 30a18 18 0 1 0 14 30 15 15 0 1 1-14-30z" />
          {[
            [60, 30],
            [120, 18],
            [200, 36],
            [260, 14],
            [300, 60],
            [90, 64],
          ].map(([x, y]) => (
            <circle key={x} className={styles.star} cx={x} cy={y} r="1.6" style={{ animationDelay: `${-x / 40}s` }} />
          ))}
        </g>
      )}
      {sky.sun && !hasMoon && <circle cx="330" cy={time === 'day' ? 46 : 70} r="26" fill={sky.sun} />}
      <path
        className={styles.cloud}
        d="M30 60a10 10 0 0 1 3-19 15 15 0 0 1 28-4 12 12 0 0 1 22 3 11 11 0 0 1 18 10 8 8 0 0 1 5 10z"
        fill="#FFFDF6"
        opacity=".85"
      />
      {Land ? <Land /> : <ForestLand land={land} season={season} />}
    </>
  );
}

/** The enchanted forest: far and near treetops, the meadow and its path, in the season's colors. */
function ForestLand({ land, season }) {
  return (
    <>
      <g fill={land.far} className={styles.canopy}>
        {FAR_TREES.map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g className={`${styles.canopy} ${styles.canopyNear}`}>
        <g fill={land.near}>
          {NEAR_TREES.map(([x, y, r]) => (
            <circle key={x} cx={x} cy={y} r={r} />
          ))}
        </g>
        <TreeDots color={land.dots} season={season} />
      </g>
      <path d="M0 168C80 150 150 160 210 156s130-10 190 2V280H0z" fill={land.ground} />
      <path d="M120 280c20-40 70-70 90-112 8 40 40 80 70 112z" fill={land.path} />
      <g fill={land.tufts}>
        <path d="M40 212l4-10 4 10zM96 236l3-8 3 8zM318 160l4-9 4 9zM228 206l3-8 3 8zM360 228l4-10 4 10z" />
      </g>
    </>
  );
}
