import Icon from '../Icon.jsx';
import GiftBoxArt from './GiftBoxArt.jsx';
import { PRESENT_BASE_SPARKS, PRESENT_ODDS, PRESENT_RARITIES } from '../../game/gifts.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PresentOdds.module.css';

const SURPRISE_ICONS = { helper: 'hint', sparks: 'spark', item: 'shirt' };
const RARITY_LOOKS = {
  plain: { tone: 'mint', symbol: '' },
  rare: { tone: 'peach', symbol: '◆' },
  epic: { tone: 'honey', symbol: '★' },
  legendary: { tone: 'gold', symbol: '✦' },
};

/**
 * What a present can hold, as pictures with their odds (shown before opening: no hidden chances).
 * The four presents in their colors, each with its chance and what it adds; then the surprise inside.
 */
export default function PresentOdds() {
  const { t } = useI18n();
  return (
    <section className={styles.odds} aria-label={t('present.odds.title')}>
      <ul className={styles.rarities}>
        {PRESENT_RARITIES.map((rarity) => {
          const look = RARITY_LOOKS[rarity.id];
          const adds = [
            rarity.bonusSparks > 0 && t('present.rarity.bonus', { n: rarity.bonusSparks }),
            rarity.sureItem && t('present.rarity.item'),
            rarity.diamonds && t('present.rarity.diamond'),
          ].filter(Boolean);
          return (
            <li
              key={rarity.id}
              className={styles.rarity}
              aria-label={`${t(`present.rarity.${rarity.id}`)} ${rarity.chance}%${adds.length ? `: ${adds.join(', ')}` : ''}`}
            >
              <span className={styles.box} aria-hidden="true">
                <GiftBoxArt tone={look.tone} phase="still" size={rarity.id === 'legendary' ? 58 : 50} />
                {look.symbol && <span className={styles.symbol}>{look.symbol}</span>}
              </span>
              <span className={`game-title ${styles.chance}`} aria-hidden="true">
                {rarity.chance}%
              </span>
              <span className={styles.adds} aria-hidden="true">
                {rarity.bonusSparks > 0 && (
                  <span className={styles.add}>
                    +{rarity.bonusSparks}
                    <Icon name="spark" size={12} />
                  </span>
                )}
                {rarity.sureItem && <Icon name="shirt" size={13} />}
                {rarity.diamonds && <Icon name="diamond" size={13} />}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={styles.inside} aria-label={t('present.odds.always', { n: PRESENT_BASE_SPARKS })}>
        <span aria-hidden="true">
          <Icon name="gift" size={16} /> = {PRESENT_BASE_SPARKS} <Icon name="spark" size={14} /> +
        </span>
      </p>
      <ul className={styles.surprises}>
        {PRESENT_ODDS.map((odd) => (
          <li key={odd.kind} className={styles.surprise} aria-label={`${t(`present.odds.${odd.kind}`, { n: odd.sparks ?? 0 })} ${odd.chance}%`}>
            <span className={styles.surpriseIcon} aria-hidden="true">
              <Icon name={SURPRISE_ICONS[odd.kind]} size={20} />
              {odd.sparks && <span className={styles.bag}>+{odd.sparks}</span>}
            </span>
            <span className="game-title" aria-hidden="true">
              {odd.chance}%
            </span>
          </li>
        ))}
      </ul>
      <p className={styles.note}>{t('present.odds.short')}</p>
    </section>
  );
}
