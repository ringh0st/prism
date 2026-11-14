import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { currentStreak } from '../../game/progress.js';
import { todayKey } from '../../game/daily.js';
import styles from './DailyButton.module.css';

/**
 * Today's daily puzzle, on the map's top bar, with the day streak. Like the gift, it's a once-a-day
 * mission: once solved it leaves the bar until tomorrow.
 */
export default function DailyButton() {
  const { progress } = usePlayer();
  const today = todayKey();
  if (progress.daily.lastDate === today) return null;
  const streak = currentStreak(progress, today);
  const label = `Daily puzzle: a new puzzle and reward are waiting${streak > 1 ? `, ${streak} day streak` : ''}`;
  return (
    <a href="#/daily" className={styles.button} aria-label={label}>
      <Icon name="calendar" size={24} strokeWidth={2.4} />
      <span className={styles.dot} aria-hidden="true" />
      {streak > 1 && (
        <span className={`game-title ${styles.streak}`} aria-hidden="true">
          <Icon name="flame" size={10} />
          {streak}
        </span>
      )}
    </a>
  );
}
