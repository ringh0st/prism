import { useState } from 'react';
import Dialog from './Dialog.jsx';
import Button from './Button.jsx';
import ShopItemArt from '../screens/store/ShopItemArt.jsx';
import BuyButtons from './BuyButtons.jsx';
import Stars from './Stars.jsx';
import { storeItem, toolFor } from '../game/catalog.js';
import { sparkPurchasesLeft } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import { usePlayer } from '../state/PlayerContext.jsx';
import styles from './QuickBuyDialog.module.css';
import { useI18n } from '../i18n/I18nContext.jsx';
import { helperText } from '../i18n/gameText.js';
import { errorText } from '../i18n/meText.js';

/** Shown when a player taps a helper they don't have: buy one and use it right away. */
export default function QuickBuyDialog({ helperId, onBought, onClose }) {
  const { t, lang } = useI18n();
  const text = helperText(lang, helperId);
  const { progress, isSignedIn, buyItem } = usePlayer();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const helper = toolFor(helperId);
  const item = storeItem(helperId);
  const sparksLeftToday = sparkPurchasesLeft(progress, todayKey());

  const buy = async (currency) => {
    setIsBusy(true);
    setError('');
    try {
      await buyItem(helperId, currency);
      onBought();
    } catch (buyError) {
      setError(errorText(t, buyError.message));
      setIsBusy(false);
    }
  };

  return (
    <Dialog title={t('buy.title', { name: text.name })} onClose={onClose}>
      <div className={styles.helper} aria-hidden="true">
        <ShopItemArt art={helperId} size={84} />
      </div>
      <p className={styles.description}>{text.description}</p>
      {/* Using a helper caps the stars: shown as the stars still possible (the sentence is for screen readers). */}
      <p className={styles.cap}>
        <Stars count={helper.starCap} size={24} />
        <span className="visually-hidden">{t('buy.cap', { count: helper.starCap })}</span>
      </p>

      <div className={styles.buy}>
        <BuyButtons item={item} itemName={text.name} progress={progress} isSignedIn={isSignedIn} isBusy={isBusy} onBuy={buy} />
      </div>
      {item.price.sparks && (
        <p className={styles.note}>{sparksLeftToday > 0 ? t('buy.sparksLeftToday', { count: sparksLeftToday }) : t('buy.noSparksToday')}</p>
      )}
      {!isSignedIn && item.price.diamonds && <p className={styles.note}>{t('ui.signInDiamonds')}</p>}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose} data-autofocus>
          {t('pals.later')}
        </Button>
        <Button variant="secondary" icon="bag" as="a" href="#/store">
          {t('nav.shop')}
        </Button>
      </div>
    </Dialog>
  );
}
