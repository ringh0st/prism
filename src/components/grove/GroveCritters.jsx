import styles from './GroveScene.module.css';

const FIREFLIES = [
  [60, 70],
  [140, 40],
  [240, 64],
  [370, 84],
  [110, 150],
  [320, 140],
];

/**
 * The Grove's little neighbors: birds crossing the morning and day sky, a butterfly looping around the
 * clearing (not at night, or in winter), and fireflies that glow brightest at night.
 */
export default function GroveCritters({ time, season }) {
  const isNight = time === 'night';
  return (
    <>
      {(time === 'dawn' || time === 'day') && (
        <g className={styles.birds} aria-hidden="true" fill="none" stroke="#5E5047" strokeWidth="1.6" strokeLinecap="round">
          <path className={styles.bird} d="M0 0q4-4 8 0q4-4 8 0" />
          <path className={styles.bird} d="M14 10q3-3 6 0q3-3 6 0" style={{ animationDelay: '-0.2s' }} />
        </g>
      )}
      <g className={styles.fireflies} aria-hidden="true">
        {FIREFLIES.map(([x, y], i) => (
          <g key={x} style={{ animationDelay: `${i * -0.7}s` }}>
            <circle cx={x} cy={y} r="6" fill="#FFE38A" opacity=".35" />
            <circle cx={x} cy={y} r="2.2" fill="#F0C14E" />
          </g>
        ))}
      </g>
      {!isNight && season !== 'winter' && (
        <g className={styles.butterfly} aria-hidden="true">
          <animateMotion dur="16s" repeatCount="indefinite" path="M60 150C110 90 170 120 200 90S300 60 340 110 300 190 230 170 120 210 60 150z" />
          <g className={styles.wings}>
            <ellipse cx="-4" cy="-2" rx="5" ry="4" fill="#F2A67E" />
            <ellipse cx="4" cy="-2" rx="5" ry="4" fill="#F2A67E" />
            <ellipse cx="-3" cy="3" rx="3" ry="2.6" fill="#F0C14E" />
            <ellipse cx="3" cy="3" rx="3" ry="2.6" fill="#F0C14E" />
          </g>
          <rect x="-0.8" y="-4" width="1.6" height="9" rx="0.8" fill="#5E5047" />
        </g>
      )}
    </>
  );
}
