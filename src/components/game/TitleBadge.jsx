import { playerLevelFor, titleFor } from '../../game/titles.js';
import styles from './TitleBadge.module.css';

/** A player's rank and title ("Rank 12 · Beam Bender") in the title's own color, from their total stars. */
export default function TitleBadge({ stars, size = 'sm', className = '' }) {
  const { current } = titleFor(stars);
  const { level } = playerLevelFor(stars);
  return (
    <span className={`game-title ${styles.badge} ${styles[size]} ${styles[current.tone]} ${className}`}>
      <span className={styles.level}>Rank {level}</span>
      {current.name}
    </span>
  );
}
