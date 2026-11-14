import { rarityOf } from '../../game/pals.js';
import { rarityName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './RarityBadge.module.css';

/** "✦ Mythic" or "★ Legendary" on special Pals (shape plus word, never color alone). Basic Pals get none. */
export default function RarityBadge({ pal, className = '' }) {
  const { lang } = useI18n();
  const rarity = rarityOf(pal);
  if (rarity === 'common') return null;
  return (
    <span className={`${styles.badge} ${styles[rarity]} ${className}`}>
      {rarity === 'mythic' ? '✦' : '★'} {rarityName(lang, rarity)}
    </span>
  );
}
