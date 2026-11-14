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

/** A Lucky Pal gift (every 200 levels): tap to open the box, then meet who came out. */
export default function LuckyPalDialog() {
  const { luckyGift, dismissLuckyGift, choosePal } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);
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
    <Dialog title={isOpen ? (pal ? `${pal.name} joined you!` : 'Lucky sparks!') : 'A Lucky Pal gift!'} tone="celebrate" onClose={close}>
      {!isOpen ? (
        <>
          <button type="button" className={styles.box} onClick={open} aria-label="Open the gift">
            <Icon name="gift" size={96} strokeWidth={1.6} />
          </button>
          <p className={styles.text}>You solved another {LUCKY_PAL_EVERY} levels! Something is wiggling inside…</p>
          <Button size="lg" onClick={open} data-autofocus>
            Open it!
          </Button>
        </>
      ) : pal ? (
        <>
          <div className={styles.reveal}>
            <PalArt palId={pal.id} size={140} alive />
          </div>
          <p className={styles.text}>
            <strong>
              {pal.name} the {pal.species}
            </strong>{' '}
            <RarityBadge pal={pal} />
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
              Play with {pal.name}
            </Button>
            <Button variant="ghost" onClick={close}>
              Later
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={`game-title ${styles.sparks}`}>
            <Icon name="spark" size={26} /> +{luckyGift.sparks} sparks
          </p>
          <p className={styles.text}>You already have every Pal. Amazing!</p>
          <Button size="lg" onClick={close} data-autofocus>
            Yay!
          </Button>
        </>
      )}
    </Dialog>
  );
}
