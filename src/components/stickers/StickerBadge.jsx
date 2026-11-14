import Icon from '../Icon.jsx';
import styles from './StickerBadge.module.css';

/** A round sticker with its icon and world number (hidden for tiny ones); faded until earned. */
export default function StickerBadge({ sticker, world, isEarned = true, size = 72 }) {
  const showsWorld = size >= 48;
  return (
    <span
      className={`${styles.sticker} ${styles[sticker.id]} ${isEarned ? '' : styles.faded}`}
      style={{ '--size': `${size}px`, '--tilt': `${((world * 7 + sticker.id.length * 3) % 11) - 5}deg` }}
      aria-hidden="true"
    >
      <Icon name={sticker.icon} size={size * 0.38} strokeWidth={2.4} />
      {showsWorld && <span className={styles.world}>{world}</span>}
    </span>
  );
}
