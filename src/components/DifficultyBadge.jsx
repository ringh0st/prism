import Icon from './Icon.jsx';
import styles from './DifficultyBadge.module.css';
import { DIFFICULTY } from '../game/constants.js';

const LABELS = {
  [DIFFICULTY.HARD]: { text: 'Hard', icon: 'flame' },
  [DIFFICULTY.EXTRA]: { text: 'Extra hard', icon: 'crown' },
};

/** Marks Hard / Extra Hard levels. Normal levels render nothing. */
export default function DifficultyBadge({ difficulty, compact = false }) {
  const info = LABELS[difficulty];
  if (!info) return null;
  return (
    <span className={`${styles.badge} ${styles[difficulty]} ${compact ? styles.compact : ''}`}>
      <Icon name={info.icon} size={compact ? 12 : 14} />
      <span className={compact ? 'visually-hidden' : undefined}>{info.text}</span>
    </span>
  );
}
