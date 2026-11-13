import Button from './Button.jsx';
import Icon from './Icon.jsx';
import { sparkPurchasesLeft } from '../game/progress.js';
import { todayKey } from '../game/daily.js';
import styles from './BuyButtons.module.css';

/**
 * One button per currency an item can be bought with. Disables (with a reason) when the
 * player can't afford it, hit the daily spark limit, or needs an account for diamonds.
 */
export default function BuyButtons({ item, itemName, progress, isSignedIn, isBusy, onBuy }) {
  const { sparks: sparkPrice, diamonds: diamondPrice } = item.price;
  const isHelper = item.kind === 'helper';
  const dailyLimitReached = isHelper && sparkPurchasesLeft(progress, todayKey()) === 0;

  return (
    <div className={styles.row}>
      {sparkPrice && (
        <Button
          size="sm"
          variant="secondary"
          className={styles.price}
          disabled={isBusy || progress.sparks < sparkPrice || dailyLimitReached}
          onClick={() => onBuy('sparks')}
          aria-label={`Buy ${itemName} for ${sparkPrice} sparks${dailyLimitReached ? ' (daily limit reached)' : ''}`}
        >
          <Icon name="spark" size={16} className={styles.spark} /> {sparkPrice}
        </Button>
      )}
      {diamondPrice && (
        <Button
          size="sm"
          className={styles.price}
          disabled={isBusy || !isSignedIn || progress.diamonds < diamondPrice}
          onClick={() => onBuy('diamonds')}
          aria-label={`Buy ${itemName} for ${diamondPrice} diamonds${isSignedIn ? '' : ' (sign in required)'}`}
        >
          <Icon name="diamond" size={16} /> {diamondPrice}
        </Button>
      )}
    </div>
  );
}
