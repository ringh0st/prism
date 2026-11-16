import { sfx } from '../../audio/sfx.js';
import styles from './GuideButton.module.css';

/** The round "?" that opens a "How it works" picture guide. `label` names it for screen readers. */
export default function GuideButton({ label, onOpen, className = '' }) {
  return (
    <button
      type="button"
      className={`${styles.button} ${className}`}
      onClick={() => {
        sfx.tap();
        onOpen();
      }}
      aria-label={label}
    >
      ?
    </button>
  );
}
