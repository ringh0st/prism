import { useState } from 'react';
import Icon from '../Icon.jsx';
import PresentDialog from './PresentDialog.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { presentProgress, presentsWaiting } from '../../game/gifts.js';
import { palById } from '../../game/pals.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PresentButton.module.css';

/**
 * On the map's top bar: the partner Pal's next present, with a little bar filling up with stars.
 * It wiggles when a present is waiting. Tap to open it, or to see how close the next one is.
 */
export default function PresentButton() {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  if (!palById(progress.pal.id)) return null;
  const waiting = presentsWaiting(progress);
  const { have, need } = presentProgress(progress);
  return (
    <>
      <button
        type="button"
        className={`${styles.button} ${waiting > 0 ? styles.ready : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label={waiting > 0 ? t('present.buttonReady') : t('present.progress', { have, need })}
      >
        <Icon name="paw" size={24} />
        {waiting > 0 ? (
          <span className={`game-title ${styles.dot}`} aria-hidden="true">
            {waiting > 1 ? waiting : ''}
          </span>
        ) : (
          <span className={styles.meter} aria-hidden="true">
            <span className={styles.fill} style={{ width: `${(have / need) * 100}%` }} />
          </span>
        )}
        <span className={styles.caption} aria-hidden="true">
          {t('map.extra.present')}
        </span>
      </button>
      {isOpen && <PresentDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
