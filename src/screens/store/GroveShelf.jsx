import GroveItemArt from '../../components/grove/GroveItemArt.jsx';
import ShelfItem from './ShelfItem.jsx';
import PriceTag from './PriceTag.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GROVE_ITEMS, GROVE_SPOTS } from '../../game/grove.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { shopItemName } from '../../i18n/shopText.js';
import { spotName } from '../../i18n/groveText.js';
import styles from './Stall.module.css';

/** One decoration on a shelf: tap it to see it in your Grove (and buy it). */
export function DecorItem({ item, onTry }) {
  const { progress } = usePlayer();
  const { lang } = useI18n();
  return (
    <ShelfItem
      artNode={<GroveItemArt id={item.id} size={88} className={styles.goodsArt} />}
      title={shopItemName(lang, item)}
      onInfo={() => onTry(item)}
    >
      <PriceTag item={item} isOwned={progress.grove.items.includes(item.id)} onTry={() => onTry(item)} />
    </ShelfItem>
  );
}

/** Decor for the Pals' Grove, grouped by spot. Tap one to see it in your Grove before buying. */
export default function GroveShelf({ onTry }) {
  const { t, lang } = useI18n();
  return (
    <>
      <p className={styles.shelfIntro}>
        {t('shop.grove.intro')} <a href="#/grove">{t('shop.grove.link')}</a>.
      </p>
      {GROVE_SPOTS.map((spot) => (
        <section key={spot.id} aria-labelledby={`grove-${spot.id}`}>
          <h3 id={`grove-${spot.id}`} className={`game-title ${styles.slotHeading}`}>
            {spotName(lang, spot)}
          </h3>
          <ul className={styles.shelf}>
            {GROVE_ITEMS.filter((item) => item.spot === spot.id).map((item) => (
              <DecorItem key={item.id} item={item} onTry={onTry} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
