import { useState } from 'react';
import PalArt from '../pals/PalArt.jsx';
import GiftBoxArt from './GiftBoxArt.jsx';
import PresentDialog from './PresentDialog.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { useIsSplashShowing } from '../../state/SplashContext.jsx';
import { palById, stageOf } from '../../game/pals.js';
import { presentsWaiting } from '../../game/gifts.js';
import { palName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PalPresent.module.css';

/**
 * When a present is waiting, the partner Pal stands beside PLAY holding it ("I found something for you!").
 * Tapping either opens it. It stays until the present is opened, so it's never missed.
 */
export default function PalPresent() {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const isSplashShowing = useIsSplashShowing();
  const [isOpen, setIsOpen] = useState(false);
  const partner = palById(progress.pal.id);
  const waiting = presentsWaiting(progress);
  if (!partner || isSplashShowing || (waiting < 1 && !isOpen)) return null;

  const name = palName(lang, partner);
  return (
    <>
      {waiting > 0 && (
        <button type="button" className={styles.present} onClick={() => setIsOpen(true)} aria-label={t('present.bubbleLabel', { name })}>
          <span className={styles.pal} aria-hidden="true">
            <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={78} alive />
            <span className={styles.box}>
              <GiftBoxArt tone="mint" size={42} />
            </span>
          </span>
          <span className={styles.bubble} aria-hidden="true">
            <span className={styles.name}>{name}</span> {t('present.bubble')}
          </span>
        </button>
      )}
      {isOpen && <PresentDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
