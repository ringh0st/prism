import styles from './GameBackground.module.css';

const SPARKLES = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 100}%`,
  delay: `${(i * 0.7) % 6}s`,
  size: 6 + ((i * 5) % 10),
}));

/** Full-screen animated sky: slow rotating sun rays and drifting sparkles. Purely decorative. */
export default function GameBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.rays} />
      <div className={styles.sun} />
      {SPARKLES.map((sparkle, i) => (
        <span
          key={i}
          className={styles.sparkle}
          style={{ left: sparkle.left, top: sparkle.top, animationDelay: sparkle.delay, width: sparkle.size, height: sparkle.size }}
        />
      ))}
      <div className={styles.hills} />
    </div>
  );
}
