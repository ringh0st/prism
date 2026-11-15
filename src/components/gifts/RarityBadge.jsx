import { PRESENT_RARITIES } from '../../game/gifts.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './RarityBadge.module.css';

/** Each rarity's symbol (never color alone): plain ●, rare ◆, epic ★, legendary ✦. */
export const RARITY_SYMBOLS = { plain: '●', rare: '◆', epic: '★', legendary: '✦' };

/**
 * What a present turned out to be, said plainly once it's open: its color, its symbol and one word ("◆ Rare!").
 * With `count`, a small chip for the summary of several presents ("◆ ×2").
 */
export default function RarityBadge({ rarity, count = null }) {
  const { t } = useI18n();
  const step = Math.max(
    0,
    PRESENT_RARITIES.findIndex((entry) => entry.id === rarity),
  );
  const word = t(`present.rarity.${rarity}`);
  if (count !== null) {
    return (
      <span className={`game-title ${styles.chip} ${styles[`step${step}`]}`} aria-label={`${word} ×${count}`}>
        <span aria-hidden="true">
          {RARITY_SYMBOLS[rarity]} {word.replace('!', '')}
        </span>
        <span aria-hidden="true" dir="ltr">
          ×{count}
        </span>
      </span>
    );
  }
  return (
    <span className={`game-title ${styles.badge} ${styles[`step${step}`]}`} role="status">
      <span aria-hidden="true">{RARITY_SYMBOLS[rarity]}</span> {word}
    </span>
  );
}
