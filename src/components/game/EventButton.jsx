import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { EVENT_UNLOCK_WORLDS, eventProgressOf, eventThemeFor, eventWeekendOf, solvedEventCount, EVENT_LEVELS } from '../../game/events.js';
import { finishedWorldCount } from '../../game/titles.js';
import styles from './EventButton.module.css';

/** On the map's top bar during weekends (once World 1 is done): this weekend's event and how far you got. */
export default function EventButton() {
  const { progress } = usePlayer();
  const weekend = eventWeekendOf();
  if (!weekend || finishedWorldCount(progress.levels) < EVENT_UNLOCK_WORLDS) return null;
  const eventProgress = eventProgressOf(progress, weekend);
  const solved = solvedEventCount(eventProgress);
  const theme = eventThemeFor(weekend);
  return (
    <a href="#/event" className={styles.button} aria-label={`Weekend event: ${theme.name}, ${solved} of ${EVENT_LEVELS} puzzles solved`}>
      <Icon name="trophy" size={24} strokeWidth={2.4} />
      {!eventProgress.claimed && (
        <span className={`game-title ${styles.count}`} aria-hidden="true">
          {solved}/{EVENT_LEVELS}
        </span>
      )}
    </a>
  );
}
