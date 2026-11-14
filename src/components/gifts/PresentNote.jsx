import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { presentProgress, presentsWaiting } from '../../game/gifts.js';
import { palName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PresentNote.module.css';

/** On the win screen, under the partner Pal: how close its next present is, or that one is waiting on the map. */
export default function PresentNote({ partner }) {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const name = palName(lang, partner);
  const isReady = presentsWaiting(progress) > 0;
  const { have, need } = presentProgress(progress);
  return (
    <p className={`${styles.note} ${isReady ? styles.ready : ''}`}>
      <Icon name="gift" size={16} />
      <span>{isReady ? t('present.win.ready', { name }) : t('present.win.toGo', { count: need - have, name })}</span>
    </p>
  );
}
