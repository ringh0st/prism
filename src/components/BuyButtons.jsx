import Button from './Button.jsx';
import Icon from './Icon.jsx';
import { sparkPurchasesLeft } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import styles from './BuyButtons.module.css';
import { useI18n } from '../i18n/I18nContext.jsx';

/**
 * One button per currency an item can be bought with. Disables (with a reason) when the
 * player can't afford it, hit the daily spark limit, or needs an account for diamonds.
 * look: "button" (default) or "tag" (little price tags hanging on a shop shelf).
 */
export default function BuyButtons({ item, itemName, progress, isSignedIn, isBusy, onBuy, look = 'button' }) {
  const { t } = useI18n();
  const { sparks: sparkPrice, diamonds: diamondPrice } = item.price;
  const isHelper = item.kind === 'helper';
  const dailyLimitReached = isHelper && sparkPurchasesLeft(progress, todayKey()) === 0;

  return (
    <div className={`${styles.row} ${look === 'tag' ? styles.tags : ''}`}>
      {sparkPrice && (
        <Button
          size="sm"
          variant="gold"
          className={styles.price}
          disabled={isBusy || progress.sparks < sparkPrice || dailyLimitReached}
          onClick={() => onBuy('sparks')}
          aria-label={t(dailyLimitReached ? 'buy.withSparksLimit' : 'buy.withSparks', { name: itemName, count: sparkPrice })}
        >
          <Icon name="spark" size={16} />
          <span>{sparkPrice}</span>
        </Button>
      )}
      {diamondPrice && (
        <Button
          size="sm"
          variant="go"
          className={styles.price}
          disabled={isBusy || !isSignedIn || progress.diamonds < diamondPrice}
          onClick={() => onBuy('diamonds')}
          aria-label={t(isSignedIn ? 'buy.withDiamonds' : 'buy.withDiamondsSignIn', { name: itemName, count: diamondPrice })}
        >
          <Icon name="diamond" size={16} />
          <span>{diamondPrice}</span>
        </Button>
      )}
    </div>
  );
}
