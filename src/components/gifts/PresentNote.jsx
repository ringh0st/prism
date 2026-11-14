import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { presentProgress, presentsWaiting } from '../../game/gifts.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PresentNote.module.css';

/** On the win screen, under the partner Pal: a gift icon and how many ★ to its next present (or that one is waiting). */
export default function PresentNote() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const isReady = presentsWaiting(progress) > 0;
  const { have, need } = presentProgress(progress);
  return (
    <p className={`${styles.note} ${isReady ? styles.ready : ''}`}>
      <Icon name="gift" size={16} />
      <span>{isReady ? t('present.win.ready') : t('present.win.toGo', { count: need - have })}</span>
    </p>
  );
}
