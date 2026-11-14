import PalArt from '../../components/pals/PalArt.jsx';
import ShelfItem from './ShelfItem.jsx';
import PriceTag from './PriceTag.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { stageOf } from '../../game/pals.js';
import styles from './Stall.module.css';

/** Outfit pieces on your own Pal. Tap one to try it on (and buy it); put them on in Pals → Wardrobe. */
export default function ClothesShelf({ items, onTry, intro = true }) {
  const { progress } = usePlayer();
  const model = progress.pal.id ?? 'ember';
  const modelStage = stageOf(progress.pal.owned[model]);
  return (
    <>
      {intro && (
        <p className={styles.shelfIntro}>
          Tap anything to try it on your Pal. Clothes are yours forever: change them in <a href="#/pals/wardrobe">Pals → Wardrobe</a>.
        </p>
      )}
      <ul className={styles.shelf}>
        {items.map((item) => (
          <ShelfItem
            key={item.id}
            artNode={<PalArt palId={model} stage={modelStage} wearing={[item.id]} size={92} className={styles.goodsArt} />}
            title={item.name}
            onInfo={() => onTry(item)}
          >
            <PriceTag item={item} isOwned={progress.pal.accessories.includes(item.id)} onTry={() => onTry(item)} />
          </ShelfItem>
        ))}
      </ul>
    </>
  );
}
