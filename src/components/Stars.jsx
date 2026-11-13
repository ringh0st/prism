import styles from './Stars.module.css';
import Icon from './Icon.jsx';
import { MAX_STARS } from '../game/scoring.js';

/** A row of stars. `animate` reveals earned stars one by one. */
export default function Stars({ count, size = 16, animate = false, className = '' }) {
  return (
    <span
      className={`${styles.stars} ${animate ? styles.animate : ''} ${className}`}
      role="img"
      aria-label={`${count} of ${MAX_STARS} stars`}
    >
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span
          key={i}
          className={`${styles.star} ${i < count ? styles.earned : ''}`}
          style={{ '--i': i, '--size': `${size}px` }}
        >
          <Icon name="star" size={size} />
        </span>
      ))}
    </span>
  );
}
