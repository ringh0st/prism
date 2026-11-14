import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { currentStreak } from '../../game/progress.js';
import { todayKey } from '../../game/daily.js';
import styles from './DailyButton.module.css';

/** The daily puzzle, on the map's top bar: a dot when today's puzzle is waiting, and the day streak. */
export default function DailyButton() {
  const { progress } = usePlayer();
  const today = todayKey();
  const isWaiting = progress.daily.lastDate !== today;
  const streak = currentStreak(progress, today);
  const label = `Daily puzzle${isWaiting ? ', new puzzle waiting' : ', done today'}${streak > 1 ? `, ${streak} day streak` : ''}`;
  return (
    <a href="#/daily" className={`${styles.button} ${isWaiting ? styles.waiting : ''}`} aria-label={label}>
      <Icon name="calendar" size={24} strokeWidth={2.4} />
      {isWaiting && <span className={styles.dot} aria-hidden="true" />}
      {streak > 1 && (
        <span className={`game-title ${styles.streak}`} aria-hidden="true">
          <Icon name="flame" size={10} />
          {streak}
        </span>
      )}
    </a>
  );
}
