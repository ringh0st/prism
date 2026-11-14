import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { shopItemName } from '../../i18n/shopText.js';
import styles from './Stall.module.css';

/** An item's price (sparks or diamonds) as a button that opens "Try it on", or "Owned" once it's yours. */
export default function PriceTag({ item, isOwned, onTry }) {
  const { t, lang } = useI18n();
  const name = shopItemName(lang, item);
  if (isOwned) {
    return (
      <button type="button" className={styles.ownedTag} onClick={onTry} aria-label={t('shop.ownedTryOn', { name })}>
        <Icon name="check" size={16} /> {t('shop.owned')}
      </button>
    );
  }
  const currency = item.currency ?? 'sparks';
  return (
    <Button
      size="sm"
      variant="gold"
      onClick={onTry}
      aria-label={t(currency === 'diamonds' ? 'shop.priceDiamonds' : 'shop.priceSparks', { name, count: item.price })}
    >
      <Icon name={currency === 'diamonds' ? 'diamond' : 'spark'} size={16} />
      <span>{item.price}</span>
    </Button>
  );
}
