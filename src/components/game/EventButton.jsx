import { usePlayer } from '../../state/PlayerContext.jsx';
import { EVENT_UNLOCK_WORLDS, eventProgressOf, eventThemeFor, eventWeekendOf, solvedEventCount, EVENT_LEVELS } from '../../game/events.js';
import { finishedWorldCount } from '../../game/titles.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './EventButton.module.css';

/** On the map's top bar during weekends (once World 1 is done): this weekend's theme symbol, a one-word caption and how far you got. */
export default function EventButton() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const weekend = eventWeekendOf();
  if (!weekend || finishedWorldCount(progress.levels) < EVENT_UNLOCK_WORLDS) return null;
  const eventProgress = eventProgressOf(progress, weekend);
  const solved = solvedEventCount(eventProgress);
  const theme = eventThemeFor(weekend);
  return (
    <a
      href="#/event"
      className={styles.button}
      aria-label={t('ui.event.label', { name: t(`eventTheme.${theme.id}.name`, {}, theme.name), solved, total: EVENT_LEVELS })}
    >
      <span className={styles.symbol} aria-hidden="true">
        {theme.icon}
      </span>
      {!eventProgress.claimed && (
        <span className={`game-title ${styles.count}`} aria-hidden="true">
          {solved}/{EVENT_LEVELS}
        </span>
      )}
      <span className={styles.caption} aria-hidden="true">
        {t('map.extra.event')}
      </span>
    </a>
  );
}
