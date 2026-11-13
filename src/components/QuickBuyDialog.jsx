import { useState } from 'react';
import Dialog from './Dialog.jsx';
import Button from './Button.jsx';
import Icon from './Icon.jsx';
import BuyButtons from './BuyButtons.jsx';
import { HELPERS, storeItem } from '../game/catalog.js';
import { sparkPurchasesLeft } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { usePlayer } from '../state/PlayerContext.jsx';
import styles from './QuickBuyDialog.module.css';

/** Shown when a player taps a helper they don't have: buy one and use it right away. */
export default function QuickBuyDialog({ helperId, onBought, onClose }) {
  const { progress, isSignedIn, buyItem } = usePlayer();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const helper = HELPERS[helperId];
  const item = storeItem(helperId);
  const sparksLeftToday = sparkPurchasesLeft(progress, todayKey());

  const buy = async (currency) => {
    setIsBusy(true);
    setError('');
    try {
      await buyItem(helperId, currency);
      onBought();
    } catch (buyError) {
      setError(buyError.message);
      setIsBusy(false);
    }
  };

  return (
    <Dialog title={`Out of ${helper.name}s`} onClose={onClose}>
      <div className={styles.helper} aria-hidden="true">
        <Icon name={helper.icon} size={34} />
      </div>
      <p className={styles.description}>{helper.description}</p>
      <p className={styles.cap}>Using it limits this level to {helper.starCap} ★.</p>

      <div className={styles.buy}>
        <BuyButtons item={item} itemName={helper.name} progress={progress} isSignedIn={isSignedIn} isBusy={isBusy} onBuy={buy} />
      </div>
      {item.price.sparks && (
        <p className={styles.note}>
          {sparksLeftToday > 0
            ? `${sparksLeftToday} spark purchase${sparksLeftToday === 1 ? '' : 's'} left today.`
            : 'No spark purchases left today. Diamonds still work.'}
        </p>
      )}
      {!isSignedIn && item.price.diamonds && <p className={styles.note}>Sign in to use diamonds.</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose} data-autofocus>
          Keep trying
        </Button>
        <Button variant="secondary" icon="bag" as="a" href="#/store">
          Store
        </Button>
      </div>
    </Dialog>
  );
}
