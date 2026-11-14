import styles from './SpeechBox.module.css';

/**
 * What Lumi says, in a steady box with a little "Lumi" tag (instead of a floating bubble), so long lines
 * wrap neatly. `tail` points the box at Lumi: left (Lumi beside it) or down-left (Lumi below it).
 */
export default function SpeechBox({ line, tail = 'left', className = '' }) {
  return (
    <div className={`${styles.box} ${styles[tail]} ${line ? '' : styles.quiet} ${className}`} role="status" aria-live="polite">
      {line && (
        <p key={line} className={styles.text}>
          <span className={`game-title ${styles.speaker}`}>Lumi</span>
          {line}
        </p>
      )}
    </div>
  );
}
