import styles from './GameBackground.module.css';

/** Full-screen sunlit paper scene: soft sun, rolling hills and matte grain. Decorative. */
export default function GameBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <svg className={styles.hills} viewBox="0 0 400 200" preserveAspectRatio="none">
        <path className={styles.far} d="M0 90 C70 40 140 60 210 85 S340 50 400 70 V200 H0 Z" />
        <path className={styles.near} d="M0 140 C80 100 150 120 230 140 S350 110 400 125 V200 H0 Z" />
      </svg>
      <span className={styles.grain} />
    </div>
  );
}
