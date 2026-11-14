import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import ShelfItem from './ShelfItem.jsx';
import PriceTag from './PriceTag.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { stageOf } from '../../game/pals.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { shopItemName } from '../../i18n/shopText.js';
import styles from './Stall.module.css';

/** Outfit pieces on your own Pal. Tap one to try it on (and buy it); the Wardrobe chip is where you put them on. */
export default function ClothesShelf({ items, onTry, intro = true }) {
  const { progress } = usePlayer();
  const { t, lang } = useI18n();
  const model = progress.pal.id ?? 'ember';
  const modelStage = stageOf(progress.pal.owned[model]);
  return (
    <>
      {intro && (
        <a href="#/pals/wardrobe" className={styles.goLink}>
          <Icon name="shirt" size={18} />
          {t('shop.clothes.link')}
        </a>
      )}
      <ul className={styles.shelf}>
        {items.map((item) => (
          <ShelfItem
            key={item.id}
            artNode={<PalArt palId={model} stage={modelStage} wearing={[item.id]} size={92} className={styles.goodsArt} />}
            title={shopItemName(lang, item)}
            onInfo={() => onTry(item)}
          >
            <PriceTag item={item} isOwned={progress.pal.accessories.includes(item.id)} onTry={() => onTry(item)} />
          </ShelfItem>
        ))}
      </ul>
    </>
  );
}
