import { titleFor } from '../../game/titles.js';
import styles from './TitleBadge.module.css';

/** A player's title ("Beam Bender") in its own color, from their total stars. */
export default function TitleBadge({ stars, size = 'sm', className = '' }) {
  const { current } = titleFor(stars);
  return <span className={`game-title ${styles.badge} ${styles[size]} ${styles[current.tone]} ${className}`}>{current.name}</span>;
}
