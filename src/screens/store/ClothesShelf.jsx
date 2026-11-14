import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import ShelfItem from './ShelfItem.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PAL_ACCESSORIES, stageOf } from '../../game/pals.js';
import styles from './Stall.module.css';

/** One kind of Pal clothes (hats, capes or gear), bought once with sparks; put them on in Pals → Wardrobe. */
export default function ClothesShelf({ slotId, onBought, onError }) {
  const { progress, buyAccessory } = usePlayer();
  const [busyItem, setBusyItem] = useState(null);
  const model = progress.pal.id ?? 'ember';
  const modelStage = stageOf(progress.pal.owned[model]);

  const buy = async (item) => {
    setBusyItem(item.id);
    try {
      await buyAccessory(item.id);
      onBought(item);
    } catch (error) {
      onError(error.message);
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <>
      <p className={styles.shelfIntro}>
        Clothes and gear are yours forever. Put them on in <a href="#/pals/wardrobe">Pals → Wardrobe</a>.
      </p>
      <ul className={styles.shelf}>
        {PAL_ACCESSORIES.filter((item) => item.slot === slotId).map((item) => {
          const isOwned = progress.pal.accessories.includes(item.id);
          return (
            <ShelfItem
              key={item.id}
              artNode={<PalArt palId={model} stage={modelStage} wearing={[item.id]} size={92} className={styles.goodsArt} />}
              title={item.name}
            >
              {isOwned ? (
                <span className={styles.ownedTag}>
                  <Icon name="check" size={16} /> Owned
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="gold"
                  disabled={busyItem !== null || progress.sparks < item.price}
                  onClick={() => buy(item)}
                  aria-label={`Buy ${item.name} for ${item.price} sparks`}
                >
                  <Icon name="spark" size={16} />
                  <span>{item.price}</span>
                </Button>
              )}
            </ShelfItem>
          );
        })}
      </ul>
    </>
  );
}
