import { eventStamps } from '../../game/events.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { eventThemeText } from '../../i18n/extrasText.js';
import EventStampArt from './EventStampArt.jsx';
import styles from './Event.module.css';

const DATE_OPTIONS = { month: 'short', day: 'numeric', year: 'numeric' };

/** Every finished weekend event, as a collectible stamp (an empty one waits until the first). */
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
        <p className={styles.emptyStamps}>
          <EventStampArt ghost />
          <span>{t('event.stamps.empty')}</span>
        </p>
      ) : (
        <ul className={styles.stamps}>
          {stamps.map(({ weekend, theme }) => (
            <li key={weekend} className={styles.stamp}>
              <EventStampArt icon={theme.icon} />
              <span className={styles.stampName}>{eventThemeText(lang, theme).name}</span>
              <span className={styles.stampDate}>{dateFormat.format(new Date(`${weekend}T12:00:00`))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
