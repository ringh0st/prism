import styles from './GameBackground.module.css';

/** Where the drifting motes of light start (% across, % down) and how long each takes to float up. */
const MOTES = [
  [8, 92, 19],
  [22, 70, 23],
  [37, 98, 17],
  [51, 80, 25],
  [64, 95, 21],
  [78, 74, 18],
  [90, 88, 24],
  [30, 60, 27],
  [70, 55, 22],
];

/**
 * Full-screen sunlit paper scene: soft sun, slow clouds, rolling hills, matte grain and motes of light
 * drifting up (fireflies at night). Decorative; all motion stops for reduced-motion players.
 */
export default function GameBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <svg className={`${styles.cloud} ${styles.cloudA}`} viewBox="0 0 120 40">
        <path d="M14 34a12 12 0 0 1 4-23 18 18 0 0 1 33-5 15 15 0 0 1 27 4 13 13 0 0 1 22 12 10 10 0 0 1 6 12z" />
      </svg>
      <svg className={`${styles.cloud} ${styles.cloudB}`} viewBox="0 0 120 40">
        <path d="M14 34a12 12 0 0 1 4-23 18 18 0 0 1 33-5 15 15 0 0 1 27 4 13 13 0 0 1 22 12 10 10 0 0 1 6 12z" />
      </svg>
      <svg className={styles.hills} viewBox="0 0 400 200" preserveAspectRatio="none">
        <path className={styles.far} d="M0 90 C70 40 140 60 210 85 S340 50 400 70 V200 H0 Z" />
        <path className={styles.near} d="M0 140 C80 100 150 120 230 140 S350 110 400 125 V200 H0 Z" />
      </svg>
      {MOTES.map(([left, top, seconds], i) => (
        <span
          key={i}
          className={styles.mote}
          style={{ left: `${left}%`, top: `${top}%`, animationDuration: `${seconds}s`, animationDelay: `${-i * 2.7}s` }}
        />
      ))}
      <span className={styles.grain} />
    </div>
  );
}
