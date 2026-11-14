import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import EventPuzzles from './EventPuzzles.jsx';
import EventPrize from './EventPrize.jsx';
import EventStamps from './EventStamps.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { EVENT_UNLOCK_WORLDS, eventProgressOf, eventThemeFor, eventWeekendOf, isEventPrizeReady, nextEventWeekend } from '../../game/events.js';
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
        <p className={styles.kicker}>{note}</p>
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
            <LumiSays mood="happy" size={72} line={t('event.locked')} />
          </section>
        ) : weekend ? (
          <>
            <section className={styles.card} aria-label={t('event.thisWeekendLabel')}>
              <ThemeBanner theme={eventThemeFor(weekend)} note={t('event.thisWeekend')} />
              <EventPuzzles stars={eventProgressOf(progress, weekend).stars} />
            </section>
            <EventPrize weekend={weekend} theme={eventThemeFor(weekend)} eventProgress={eventProgressOf(progress, weekend)} />
          </>
        ) : (
          <section className={styles.card} aria-label={t('event.nextLabel')}>
            <ThemeBanner theme={eventThemeFor(nextEventWeekend())} note={t('event.comingSaturday')} />
            <p className={styles.muted}>{t('event.about')}</p>
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
