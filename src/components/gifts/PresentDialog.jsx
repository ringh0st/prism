import { useState } from 'react';
import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import PalArt from '../pals/PalArt.jsx';
import GiftReveal from './GiftReveal.jsx';
import PresentOdds from './PresentOdds.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { palById, stageOf } from '../../game/pals.js';
import { PRESENT_EVERY_STARS, presentProgress, presentsWaiting } from '../../game/gifts.js';
import { palName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PresentDialog.module.css';

/**
 * The partner Pal's present (one for every 10 stars, once the first Pal has been found). When one is waiting,
 * it opens with the gift moment; otherwise it shows how close the next one is and what a present can hold (with the odds).
 */
export default function PresentDialog({ onClose }) {
  const { progress, openPresent } = usePlayer();
  const { t, lang } = useI18n();
  // Decided once: opening the present must not switch this dialog to the progress view mid-reveal.
  const [hasPresent] = useState(() => presentsWaiting(progress) > 0);
  const partner = palById(progress.pal.id);
  if (!partner) return null;
  const giver = palName(lang, partner);
  const giverArt = <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={72} alive />;

  if (hasPresent) {
    return (
      <GiftReveal
        title={t('present.title', { name: giver })}
        doneTitle={t('present.doneTitle')}
        wrapping={{ kind: 'box', tone: 'mint' }}
        open={openPresent}
        partner={partner}
        onClose={onClose}
      >
        <p className={styles.thanks}>
          <span className={styles.giver} aria-hidden="true">
            {giverArt}
          </span>
          {t('present.thanks', { name: giver, n: PRESENT_EVERY_STARS })}
        </p>
      </GiftReveal>
    );
  }

  const { have, need } = presentProgress(progress);
  return (
    <Dialog title={t('present.infoTitle', { name: giver })} onClose={onClose}>
      <div className={styles.info}>
        <span className={styles.giver} aria-hidden="true">
          {giverArt}
        </span>
        <p className={styles.lead}>{t('present.infoText', { name: giver, n: PRESENT_EVERY_STARS })}</p>
      </div>
      <div className={styles.progress}>
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={need}
          aria-valuenow={have}
          aria-label={t('present.progress', { have, need })}
        >
          <span className={styles.fill} style={{ width: `${(have / need) * 100}%` }} />
        </div>
        <p className={`game-title ${styles.count}`}>{t('present.toGo', { count: need - have })}</p>
      </div>
      <PresentOdds />
      <Button size="lg" onClick={onClose} data-autofocus>
        {t('present.play')}
      </Button>
    </Dialog>
  );
}
