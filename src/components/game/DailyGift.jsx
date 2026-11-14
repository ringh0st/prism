import { useState } from 'react';
import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import Lumi from './Lumi.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { isDailyGiftReady } from '../../game/progress.js';
import { DAILY_GIFT_SPARKS } from '../../game/catalog.js';
import { todayKey } from '../../game/daily.js';
import { sfx } from '../../audio/sfx.js';
import styles from './DailyGift.module.css';

/** The opened gift: what's inside, or why it couldn't be opened. */
function GiftDialog({ outcome, onClose }) {
  const isError = Boolean(outcome.error);
  return (
    <Dialog title={isError ? 'Hmm…' : 'Your daily gift!'} tone="celebrate" onClose={onClose}>
      <div className={styles.box} aria-hidden="true">
        <Icon name="gift" size={88} strokeWidth={1.8} />
      </div>
      {isError ? (
        <p className={styles.text}>{outcome.error}</p>
      ) : (
        <>
          <p className={`game-title ${styles.reward}`}>
            <Icon name="spark" size={24} /> +{outcome.sparks} sparks
          </p>
          <div className={styles.lumi}>
            <Lumi mood="dance" size={72} line="See you tomorrow for another one!" bubbleSide="right" />
          </div>
        </>
      )}
      <Button size="lg" onClick={onClose} data-autofocus>
        {isError ? 'OK' : 'Yay!'}
      </Button>
    </Dialog>
  );
}

/**
 * A free gift of sparks once a day. `look="button"` is the wiggling box in the map HUD;
 * `look="note"` is the card at the top of the shop.
 */
export default function DailyGift({ look = 'button', className = '' }) {
  const { progress, claimDailyGift } = usePlayer();
  const [outcome, setOutcome] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const isReady = isDailyGiftReady(progress, todayKey());

  const open = async () => {
    if (!isReady || isOpening) return;
    setIsOpening(true);
    try {
      const sparks = await claimDailyGift();
      sfx.sparkle();
      setOutcome({ sparks });
    } catch (error) {
      setOutcome({ error: error.message });
    } finally {
      setIsOpening(false);
    }
  };

  const dialog = outcome && <GiftDialog outcome={outcome} onClose={() => setOutcome(null)} />;

  if (look === 'note') {
    return (
      <div className={`${styles.note} ${className}`}>
        <span className={`${styles.noteIcon} ${isReady ? styles.ready : ''}`} aria-hidden="true">
          <Icon name="gift" size={26} />
        </span>
        <p className={styles.noteText}>
          <strong>Daily gift</strong>
          <span>{isReady ? `${DAILY_GIFT_SPARKS} free sparks, every day` : 'Collected today. New gift tomorrow!'}</span>
        </p>
        {isReady && (
          <Button size="sm" variant="gold" onClick={open} disabled={isOpening}>
            Collect
          </Button>
        )}
        {dialog}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`${styles.button} ${isReady ? styles.ready : ''} ${className}`}
        onClick={open}
        disabled={!isReady || isOpening}
        aria-label={isReady ? `Open your daily gift: ${DAILY_GIFT_SPARKS} sparks` : 'Daily gift collected. Come back tomorrow'}
      >
        <Icon name="gift" size={24} />
        {isReady && <span className={styles.dot} aria-hidden="true" />}
      </button>
      {dialog}
    </>
  );
}
