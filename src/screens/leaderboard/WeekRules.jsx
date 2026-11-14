import Icon from '../../components/Icon.jsx';
import { WEEKLY_POINTS, WEEKLY_REWARDS } from '../../game/catalog.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './WeekRules.module.css';

const SPARKS_FOR_TOP_TEN = WEEKLY_REWARDS.find((reward) => reward.rank === 4).sparks;

/** Hours until the week resets (at least 1 while it's still running). */
const hoursUntil = (endsAt) => Math.max(1, Math.round((new Date(endsAt) - Date.now()) / 3_600_000));

/** "in 3 days" / "in 5 hours": when the week resets. */
function timeUntil(hours, t) {
  return hours >= 48 ? t('top.inDays', { count: Math.round(hours / 24) }) : t('top.inHours', { count: hours });
}

/**
 * How points work, on a little note pinned under the board (the owner likes it spelled out here): points per new
 * star and per daily puzzle, the prizes, and when the new week starts.
 */
export default function WeekRules({ endsAt }) {
  const { t } = useI18n();
  const hours = endsAt ? hoursUntil(endsAt) : null;
  return (
    <section className={styles.note} aria-labelledby="week-rules">
      <h2 id="week-rules" className="game-title">
        {t('top.how')}
      </h2>
      <ul className={styles.rules}>
        <li>
          <Icon name="star" size={18} /> {t('top.perStar', { n: WEEKLY_POINTS.perNewStar })}
        </li>
        <li>
          <Icon name="calendar" size={18} /> {t('top.perDaily', { n: WEEKLY_POINTS.perDaily })}
        </li>
        <li>
          <Icon name="diamond" size={18} /> {t('top.topThree')}
        </li>
        <li>
          <Icon name="spark" size={18} /> {t('top.topTen', { n: SPARKS_FOR_TOP_TEN })}
        </li>
        {hours && (
          <li>
            <Icon name="restart" size={18} /> {t('top.newWeek', { when: timeUntil(hours, t) })}
          </li>
        )}
        <li className={styles.small}>
          <Icon name="user" size={16} /> {t('top.nicknameNote')}
        </li>
      </ul>
    </section>
  );
}
