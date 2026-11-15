import Icon from '../Icon.jsx';
import { GIFT_CALENDAR, calendarDay } from '../../game/gifts.js';
import { toolFor } from '../../game/catalog.js';
import { helperText } from '../../i18n/gameText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './GiftCalendar.module.css';

/**
 * The week of daily gifts: days already opened are ticked, the next one glows, and the rest show what's
 * coming (so there's always something to look forward to). A missed day just waits, so nothing is lost.
 * @param giftDays  gifts opened so far
 * @param isOpenedToday  today's gift is already open (the next day glows as "tomorrow")
 */
export default function GiftCalendar({ giftDays, isOpenedToday, isSignedIn }) {
  const { t, lang } = useI18n();
  // After the 7th gift the week starts over; show the new week once today's 7th gift is done.
  const opened = isOpenedToday && calendarDay(giftDays) === 0 ? 7 : calendarDay(giftDays);
  const next = opened % 7;
  return (
    <section className={styles.calendar} aria-label={t('gift.calendar.label')}>
      <ol className={styles.days}>
        {GIFT_CALENDAR.map((day, i) => {
          const state = i < opened ? 'done' : i === next && opened < 7 ? 'next' : 'later';
          const helper = day.helper ?? (day.diamonds && !isSignedIn ? day.guestHelper : null);
          const what = [t('gift.sparks', { count: day.sparks }), day.diamonds && isSignedIn ? t('gift.diamonds', { count: day.diamonds }) : null]
            .concat(helper ? t('gift.helper', { name: helperText(lang, helper).name }) : null)
            .filter(Boolean)
            .join(', ');
          return (
            <li
              key={i}
              className={`${styles.day} ${styles[state]} ${day.isBig ? styles.big : ''}`}
              aria-label={`${t('gift.calendar.day', { n: i + 1 })}: ${what}. ${t(`gift.calendar.${state}`)}`}
            >
              <span className={styles.number} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.icon} aria-hidden="true">
                {state === 'done' ? (
                  <Icon name="check" size={18} strokeWidth={3} />
                ) : day.isBig ? (
                  <Icon name="gift" size={20} />
                ) : (
                  <Icon name={helper ? toolFor(helper).icon : 'spark'} size={18} />
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className={styles.note}>{t(isOpenedToday ? 'gift.calendar.tomorrow' : 'gift.calendar.waits')}</p>
    </section>
  );
}
