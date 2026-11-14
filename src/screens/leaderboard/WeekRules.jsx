import Icon from '../../components/Icon.jsx';
import HelpTip from '../../components/game/HelpTip.jsx';
import { WEEKLY_POINTS, WEEKLY_REWARDS } from '../../game/catalog.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './WeekRules.module.css';

const SPARKS_FOR_TOP_TEN = WEEKLY_REWARDS.find((reward) => reward.rank === 4).sparks;

/** Hours until the week resets (at least 1 while it's still running). */
const hoursUntil = (endsAt) => Math.max(1, Math.round((new Date(endsAt) - Date.now()) / 3_600_000));

/** "in 3 days" / "in 5 hours": when the week resets, for the full explanation. */
function timeUntil(hours, t) {
  return hours >= 48 ? t('top.inDays', { count: Math.round(hours / 24) }) : t('top.inHours', { count: hours });
}

/** A small clock for the countdown chip. */
function Clock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/**
 * How points work, at a glance: ★ +1, daily +3 and a countdown to the new week as chips. The sentences
 * (and the prizes for places 4–10) wait behind the "?".
 */
export default function WeekRules({ endsAt }) {
  const { t } = useI18n();
  const hours = endsAt ? hoursUntil(endsAt) : null;
  return (
    <div className={styles.rules}>
      <ul className={styles.chips} aria-label={t('top.how')}>
        <li className={styles.chip} aria-label={t('top.perStar', { n: WEEKLY_POINTS.perNewStar })}>
          <Icon name="star" size={16} />
          <span aria-hidden="true">+{WEEKLY_POINTS.perNewStar}</span>
        </li>
        <li className={styles.chip} aria-label={t('top.perDaily', { n: WEEKLY_POINTS.perDaily })}>
          <Icon name="calendar" size={16} />
          <span aria-hidden="true">+{WEEKLY_POINTS.perDaily}</span>
        </li>
        {hours && (
          <li className={`${styles.chip} ${styles.clock}`} aria-label={t('top.newWeek', { when: timeUntil(hours, t) })}>
            <Clock />
            <span aria-hidden="true">{hours >= 48 ? t('top.short.days', { n: Math.round(hours / 24) }) : t('top.short.hours', { n: hours })}</span>
          </li>
        )}
      </ul>
      <HelpTip title={t('top.how')}>
        <ul>
          <li>
            <Icon name="star" size={16} /> {t('top.perStar', { n: WEEKLY_POINTS.perNewStar })}
          </li>
          <li>
            <Icon name="calendar" size={16} /> {t('top.perDaily', { n: WEEKLY_POINTS.perDaily })}
          </li>
          <li>
            <Icon name="diamond" size={16} /> {t('top.topThree')}
          </li>
          <li>
            <Icon name="spark" size={16} /> {t('top.topTen', { n: SPARKS_FOR_TOP_TEN })}
          </li>
          {hours && (
            <li>
              <Icon name="restart" size={16} /> {t('top.newWeek', { when: timeUntil(hours, t) })}
            </li>
          )}
          <li>
            <Icon name="user" size={16} /> {t('top.nicknameNote')}
          </li>
        </ul>
      </HelpTip>
    </div>
  );
}
