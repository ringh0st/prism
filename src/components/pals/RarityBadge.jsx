import { RARITY_NAMES, rarityOf } from '../../game/pals.js';
import styles from './RarityBadge.module.css';

/** "✦ Mythic" or "★ Legendary" on special Pals (shape plus word, never color alone). Regular Pals get none. */
export default function RarityBadge({ pal, className = '' }) {
  const rarity = rarityOf(pal);
  if (rarity === 'common') return null;
  return (
    <span className={`${styles.badge} ${styles[rarity]} ${className}`}>
      {rarity === 'mythic' ? '✦' : '★'} {RARITY_NAMES[rarity]}
    </span>
  );
}
