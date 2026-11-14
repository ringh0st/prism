import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import RarityBadge from '../../components/pals/RarityBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { LUCKY_PAL_EVERY, palById, rarityOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import { rewardShower } from '../../lib/effects.js';
import styles from './LuckyPal.module.css';
import { palName, palWithSpecies } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** A Lucky Pal gift (every 200 levels): tap to open the box, then meet who came out. */
export default function LuckyPalDialog() {
  const { luckyGift, dismissLuckyGift, choosePal } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);
  const { t, lang } = useI18n();
  if (!luckyGift) return null;
  const pal = palById(luckyGift.palId);

  const open = () => {
    setIsOpen(true);
    rewardShower();
    if (!pal) sfx.reward();
    else if (rarityOf(pal) === 'common') sfx.newPal();
    else sfx.palGrow();
  };
  const close = () => {
    setIsOpen(false);
    dismissLuckyGift();
  };

  return (
    <Dialog
      title={isOpen ? (pal ? t('pals.lucky.joined', { name: palName(lang, pal) }) : t('pals.lucky.sparksTitle')) : t('pals.lucky.giftTitle')}
      tone="celebrate"
      onClose={close}
    >
      {!isOpen ? (
        <>
          <button type="button" className={styles.box} onClick={open} aria-label={t('pals.lucky.openLabel')}>
            <Icon name="gift" size={96} strokeWidth={1.6} />
          </button>
          <p className={styles.text}>{t('pals.lucky.wiggling', { n: LUCKY_PAL_EVERY })}</p>
          <Button size="lg" onClick={open} data-autofocus>
            {t('pals.lucky.open')}
          </Button>
        </>
      ) : pal ? (
        <>
          <div className={styles.reveal}>
            <PalArt palId={pal.id} size={140} alive />
          </div>
          <p className={styles.text}>
            <strong>{palWithSpecies(lang, pal)}</strong> <RarityBadge pal={pal} />
          </p>
          <div className={styles.actions}>
            <Button
              size="lg"
              onClick={() => {
                choosePal(pal.id);
                close();
              }}
              data-autofocus
            >
              {t('pals.lucky.playWith', { name: palName(lang, pal) })}
            </Button>
            <Button variant="ghost" onClick={close}>
              {t('pals.later')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={`game-title ${styles.sparks}`}>
            <Icon name="spark" size={26} /> {t('pals.lucky.sparks', { n: luckyGift.sparks })}
          </p>
          <p className={styles.text}>{t('pals.lucky.haveAll')}</p>
          <Button size="lg" onClick={close} data-autofocus>
            {t('pals.lucky.yay')}
          </Button>
        </>
      )}
    </Dialog>
  );
}
