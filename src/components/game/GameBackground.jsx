import styles from './GameBackground.module.css';

const SPARKLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  delay: `${(i * 0.9) % 7}s`,
  size: 5 + ((i * 5) % 8),
}));

/** Full-screen animated mesh gradient with soft drifting light blobs and a few sparkles. Decorative. */
export default function GameBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      <span className={`${styles.blob} ${styles.one}`} />
      <span className={`${styles.blob} ${styles.two}`} />
      <span className={`${styles.blob} ${styles.three}`} />
      <span className={`${styles.blob} ${styles.four}`} />
      {SPARKLES.map((sparkle, i) => (
        <span
          key={i}
          className={styles.sparkle}
          style={{ left: sparkle.left, top: sparkle.top, animationDelay: sparkle.delay, width: sparkle.size, height: sparkle.size }}
        />
      ))}
      <span className={styles.grain} />
    </div>
  );
}
