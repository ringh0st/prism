import { eventStamps } from '../../game/events.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { eventThemeText } from '../../i18n/extrasText.js';
import styles from './Event.module.css';

const DATE_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' };

/** Every finished weekend event, as a collectible stamp. */
export default function EventStamps({ progress }) {
  const { t, lang } = useI18n();
  const stamps = eventStamps(progress);
  const dateFormat = new Intl.DateTimeFormat(lang, DATE_OPTIONS);
  return (
    <section className={styles.card} aria-labelledby="stamps-title">
      <h2 id="stamps-title" className="game-title">
        {t('event.stamps.title')} <span className={styles.count}>{stamps.length}</span>
      </h2>
      {stamps.length === 0 ? (
        <p className={styles.muted}>{t('event.stamps.empty')}</p>
      ) : (
        <ul className={styles.stamps}>
          {stamps.map(({ weekend, theme }) => (
            <li key={weekend} className={styles.stamp}>
              <span className={styles.stampIcon} aria-hidden="true">
                {theme.icon}
              </span>
              <span className={styles.stampName}>{eventThemeText(lang, theme).name}</span>
              <span className={styles.stampDate}>{dateFormat.format(new Date(`${weekend}T12:00:00`))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
