import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { RUSH_LENGTH, RUSH_UNLOCK_WORLDS, rushRecordFor, rushWeekOf } from '../../game/rush.js';
import { finishedWorldCount } from '../../game/titles.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './EventButton.module.css';

/** On the map's top bar once World 3 is done: this week's Light Rush, a one-word caption and the best run so far. */
export default function RushButton() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  if (finishedWorldCount(progress.levels) < RUSH_UNLOCK_WORLDS) return null;
  const { best } = rushRecordFor(progress, rushWeekOf());
  return (
    <a href="#/rush" className={`${styles.button} ${styles.rush}`} aria-label={t('ui.rush.label', { best, total: RUSH_LENGTH })}>
      <Icon name="bolt" size={24} strokeWidth={2.4} />
      {best > 0 && (
        <span className={`game-title ${styles.count}`} aria-hidden="true">
          {best}
        </span>
      )}
      <span className={styles.caption} aria-hidden="true">
        {t('map.extra.rush')}
      </span>
    </a>
  );
}
