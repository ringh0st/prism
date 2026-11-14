import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import EventPuzzles from './EventPuzzles.jsx';
import EventPrize from './EventPrize.jsx';
import EventStamps from './EventStamps.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { EVENT_UNLOCK_WORLDS, eventProgressOf, eventThemeFor, eventWeekendOf, isEventPrizeReady, nextEventWeekend } from '../../game/events.js';
import { finishedWorldCount } from '../../game/titles.js';
import styles from './Event.module.css';

/** The theme's banner: its symbol, name and tagline. */
function ThemeBanner({ theme, note }) {
  return (
    <div className={styles.banner}>
      <span className={styles.bannerIcon} aria-hidden="true">
        {theme.icon}
      </span>
      <div>
        <p className={styles.kicker}>{note}</p>
        <h2 className={`game-title ${styles.themeName}`}>{theme.name}</h2>
        <p className={styles.tagline}>{theme.tagline}</p>
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
  const weekend = eventWeekendOf();
  const isUnlocked = finishedWorldCount(progress.levels) >= EVENT_UNLOCK_WORLDS;
  // A finished event whose prize is still waiting (say, from last weekend) can be opened any time.
  const waitingPrize = Object.keys(progress.events)
    .filter((key) => key !== weekend)
    .find((key) => isEventPrizeReady(eventProgressOf(progress, key)));

  return (
    <div className={styles.page}>
      <ScreenHeader title="Weekend event" />
      <main className={styles.main}>
        {!isUnlocked ? (
          <section className={styles.card}>
            <LumiSays mood="happy" size={72} line="Finish World 1 and you can join the weekend events. They’re really fun!" />
          </section>
        ) : weekend ? (
          <>
            <section className={styles.card} aria-label="This weekend's event">
              <ThemeBanner theme={eventThemeFor(weekend)} note="This weekend" />
              <EventPuzzles stars={eventProgressOf(progress, weekend).stars} />
            </section>
            <EventPrize weekend={weekend} theme={eventThemeFor(weekend)} eventProgress={eventProgressOf(progress, weekend)} />
          </>
        ) : (
          <section className={styles.card} aria-label="Next weekend's event">
            <ThemeBanner theme={eventThemeFor(nextEventWeekend())} note="Coming this Saturday" />
            <p className={styles.muted}>Ten themed puzzles every Saturday and Sunday, with a prize and a stamp for finishing them all.</p>
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
