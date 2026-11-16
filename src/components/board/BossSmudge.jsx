import { SmudgeArt } from './darkTileArt.jsx';
import styles from './BossSmudge.module.css';

/**
 * Smudge in a boss fight (bossFight.js), standing on his cell: he glides to a new cell each round, flinches when a
 * hit lands (`hitKey` changes), looks scared while light shines on him, and puffs away when he's beaten. The little
 * sun with "×2" shows his weakness: light on him hits twice. Drawn under the pieces' layer, so taps reach the cell.
 */
export default function BossSmudge({ width, height, cell, isLit, isDefeated, hitKey }) {
  const x = cell % width;
  const y = Math.floor(cell / width);
  return (
    <div className={styles.layer} aria-hidden="true">
      <span
        className={`${styles.smudge} ${isDefeated ? styles.defeated : ''}`}
        style={{ left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%`, width: `${100 / width}%`, height: `${100 / height}%` }}
      >
        <span key={hitKey} className={styles.body}>
          <svg viewBox="0 0 100 100" data-scenery>
            <SmudgeArt isScared={isLit || isDefeated} />
          </svg>
        </span>
        {!isDefeated && (
          <span className={styles.weakness}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5.5" fill="#f0c14e" />
              <path
                d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"
                stroke="#f0c14e"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            ×2
          </span>
        )}
      </span>
    </div>
  );
}
