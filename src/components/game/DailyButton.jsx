import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { currentStreak } from '../../game/progress.js';
import { todayKey } from '../../game/daily.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './DailyButton.module.css';

/**
 * Today's daily puzzle, on the map's top bar: a calendar showing today's date, a one-word caption and the
 * day streak. Like the gift, it's a once-a-day mission: once solved it leaves the bar until tomorrow.
 */
export default function DailyButton() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const today = todayKey();
  if (progress.daily.lastDate === today) return null;
  const streak = currentStreak(progress, today);
  const label = streak > 1 ? t('ui.daily.labelStreak', { n: streak }) : t('ui.daily.label');
  return (
    <a href="#/daily" className={styles.button} aria-label={label}>
      <Icon name="calendar" size={30} strokeWidth={2.2} />
      <span className={`game-title ${styles.date}`} aria-hidden="true">
        {Number(today.slice(-2))}
      </span>
      <span className={styles.caption} aria-hidden="true">
        {t('map.extra.daily')}
      </span>
      {streak > 1 && (
        <span className={`game-title ${styles.streak}`} aria-hidden="true">
          <Icon name="flame" size={10} />
          {streak}
        </span>
      )}
    </a>
  );
}
