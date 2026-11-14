import Icon from '../../components/Icon.jsx';
import Stars from '../../components/Stars.jsx';
import { EVENT_LEVELS } from '../../game/events.js';
import styles from './Event.module.css';

/** The weekend's 10 puzzles as tiles: solved ones show stars, the next one glows, later ones are locked. */
export default function EventPuzzles({ stars }) {
  return (
    <ol className={styles.puzzles}>
      {Array.from({ length: EVENT_LEVELS }, (_, i) => {
        const number = i + 1;
        const earned = stars[number] ?? 0;
        const isOpen = number === 1 || (stars[number - 1] ?? 0) > 0;
        const isNext = isOpen && earned === 0;
        const isHard = number % 5 === 0;
        const label = `Puzzle ${number}${isHard ? ', hard' : ''}: ${earned ? `${earned} stars` : isOpen ? 'ready to play' : 'locked'}`;
        return (
          <li key={number}>
            {isOpen ? (
              <a
                href={`#/event/${number}`}
                className={`${styles.puzzle} ${isNext ? styles.next : ''} ${earned ? styles.solved : ''}`}
                aria-label={label}
              >
                <span className={`game-title ${styles.puzzleNumber}`}>{number}</span>
                {earned > 0 ? <Stars count={earned} size={12} /> : isHard && <span className={styles.hard}>Hard</span>}
              </a>
            ) : (
              <span className={`${styles.puzzle} ${styles.lockedPuzzle}`} role="img" aria-label={label}>
                <Icon name="lock" size={18} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
