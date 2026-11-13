import ShopItemArt from './ShopItemArt.jsx';
import styles from './Stall.module.css';

/**
 * One item on a shelf: the illustrated goods (tap for details when `onInfo` is given), a count badge, the name and
 * price tags. `tag` is an optional ribbon like "Best value".
 */
export default function ShelfItem({ art, title, subtitle, badge, tag, onInfo = null, children }) {
  const goods = (
    <>
      <ShopItemArt art={art} size={88} className={styles.goodsArt} />
      {badge && <span className={`game-title ${styles.count}`}>{badge}</span>}
    </>
  );
  return (
    <li className={styles.item}>
      {tag && <span className={`game-title ${styles.ribbon}`}>{tag}</span>}
      {onInfo ? (
        <button type="button" className={styles.goods} onClick={onInfo} aria-label={`About ${title}`}>
          {goods}
        </button>
      ) : (
        <div className={styles.goods}>{goods}</div>
      )}
      <h2 className={`game-title ${styles.name}`}>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div className={styles.prices}>{children}</div>
    </li>
  );
}
