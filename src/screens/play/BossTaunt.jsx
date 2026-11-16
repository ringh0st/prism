import { SmudgeArt } from '../../components/board/darkTileArt.jsx';
import styles from './BossTaunt.module.css';

/**
 * Smudge's word between rounds of a boss fight: his face, the new round's number and a speech bubble over the
 * board, gone after a moment. `taunt` is { round, text, key }.
 */
export default function BossTaunt({ taunt }) {
  return (
    <div key={taunt.key} className={styles.taunt} role="status">
      <span className={styles.face} aria-hidden="true">
        <svg viewBox="0 0 100 100">
          <SmudgeArt />
        </svg>
      </span>
      <span className={styles.words}>
        <span className={`game-title ${styles.round}`}>{taunt.round}</span>
        <span className={styles.bubble}>{taunt.text}</span>
      </span>
    </div>
  );
}
