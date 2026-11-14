import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import EventPuzzles from './EventPuzzles.jsx';
import EventPrize from './EventPrize.jsx';
import EventStamps from './EventStamps.jsx';
import EventStampArt from './EventStampArt.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import {
  EVENT_LEVELS,
  EVENT_PRIZE_SPARKS,
  EVENT_UNLOCK_WORLDS,
  eventProgressOf,
  eventThemeFor,
  eventWeekendOf,
  isEventPrizeReady,
  nextEventWeekend,
} from '../../game/events.js';
import { finishedWorldCount } from '../../game/titles.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { eventThemeText } from '../../i18n/extrasText.js';
import styles from './Event.module.css';

/** The theme's banner: its symbol, name and tagline. */
function ThemeBanner({ theme, note }) {
  const { lang } = useI18n();
  const { name, tagline } = eventThemeText(lang, theme);
  return (
    <div className={styles.banner}>
      <span className={styles.bannerIcon} aria-hidden="true">
        {theme.icon}
      </span>
      <div>
        {note && <p className={styles.kicker}>{note}</p>}
        <h2 className={`game-title ${styles.themeName}`}>{name}</h2>
        <p className={styles.tagline}>{tagline}</p>
      </div>
    </div>
  );
}

/**
 * Weekend events: this weekend's themed puzzles, the prize and the stamp collection. On weekdays it
 * shows which theme comes next (no countdowns, just the day).
 */
export default function EventScreen() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const weekend = eventWeekendOf();
  const isUnlocked = finishedWorldCount(progress.levels) >= EVENT_UNLOCK_WORLDS;
  // A finished event whose prize is still waiting (say, from last weekend) can be opened any time.
  const waitingPrize = Object.keys(progress.events)
    .filter((key) => key !== weekend)
    .find((key) => isEventPrizeReady(eventProgressOf(progress, key)));

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('event.title')} />
      <main className={styles.main}>
        {!isUnlocked ? (
          <section className={styles.card}>
            <LumiSays mood="happy" size={64} line={t('event.locked')} />
          </section>
        ) : weekend ? (
          <>
            <section className={styles.card} aria-label={t('event.thisWeekendLabel')}>
              <ThemeBanner theme={eventThemeFor(weekend)} />
              <EventPuzzles stars={eventProgressOf(progress, weekend).stars} />
            </section>
            <EventPrize weekend={weekend} theme={eventThemeFor(weekend)} eventProgress={eventProgressOf(progress, weekend)} />
          </>
        ) : (
          <section className={styles.card} aria-label={t('event.nextLabel')}>
            <ThemeBanner theme={eventThemeFor(nextEventWeekend())} note={t('event.comingSaturday')} />
            <ul className={styles.aboutChips} aria-label={t('event.about')}>
              <li aria-hidden="true">
                <Icon name="calendar" size={18} />
                <span className="game-title">{EVENT_LEVELS}</span>
              </li>
              <li aria-hidden="true">
                <Icon name="chest" size={18} />
                <span className="game-title">+{EVENT_PRIZE_SPARKS}</span>
                <Icon name="spark" size={16} />
              </li>
              <li aria-hidden="true">
                <EventStampArt icon={eventThemeFor(nextEventWeekend()).icon} size="sm" />
              </li>
            </ul>
          </section>
        )}
        {waitingPrize && (
          <EventPrize weekend={waitingPrize} theme={eventThemeFor(waitingPrize)} eventProgress={eventProgressOf(progress, waitingPrize)} />
        )}
        <EventStamps progress={progress} />
      </main>
      <BottomNav active="map" />
    </div>
  );
}
