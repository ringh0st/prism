import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import styles from './Stall.module.css';

/** An item's price (sparks or diamonds) as a button that opens "Try it on", or "Owned" once it's yours. */
export default function PriceTag({ item, isOwned, onTry }) {
  if (isOwned) {
    return (
      <button type="button" className={styles.ownedTag} onClick={onTry} aria-label={`${item.name}: owned. Try it on`}>
        <Icon name="check" size={16} /> Owned
      </button>
    );
  }
  const currency = item.currency ?? 'sparks';
  return (
    <Button size="sm" variant="gold" onClick={onTry} aria-label={`Try on ${item.name}: ${item.price} ${currency}`}>
      <Icon name={currency === 'diamonds' ? 'diamond' : 'spark'} size={16} />
      <span>{item.price}</span>
    </Button>
  );
}
