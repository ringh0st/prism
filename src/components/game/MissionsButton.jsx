import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { readyMissionCount } from '../../game/dailyMissions.js';
import { todayKey } from '../../game/daily.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './EventButton.module.css';

/** On the map's top bar only while a daily mission waits to be collected: a calendar with a tick and how many. */
export default function MissionsButton() {
  const { progress, isSignedIn } = usePlayer();
  const { t } = useI18n();
  const ready = readyMissionCount(progress, todayKey(), isSignedIn);
  if (ready === 0) return null;
  return (
    <a href="#/pals/quests" className={`${styles.button} ${styles.missions}`} aria-label={t('ui.missions.label', { count: ready })}>
      <Icon name="check" size={26} strokeWidth={3} />
      <span className={`game-title ${styles.count}`} aria-hidden="true">
        {ready}
      </span>
      <span className={styles.caption} aria-hidden="true">
        {t('map.extra.missions')}
      </span>
    </a>
  );
}
