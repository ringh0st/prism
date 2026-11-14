import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import GroveItemArt from '../../components/grove/GroveItemArt.jsx';
import ShelfItem from './ShelfItem.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GROVE_ITEMS, GROVE_SPOTS } from '../../game/grove.js';
import styles from './Stall.module.css';

/** Decor for the Pals' Grove, bought with sparks and placed in Pals → The Grove → Decorate. */
export default function GroveShelf({ onBought, onError }) {
  const { progress, buyGroveItem } = usePlayer();
  const [busyItem, setBusyItem] = useState(null);

  const buy = async (item) => {
    setBusyItem(item.id);
    try {
      await buyGroveItem(item.id);
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
        Make your Pals’ forest home cozy. Place decor in <a href="#/grove">The Grove</a>.
      </p>
      {GROVE_SPOTS.map((spot) => (
        <section key={spot.id} aria-labelledby={`grove-${spot.id}`}>
          <h3 id={`grove-${spot.id}`} className={`game-title ${styles.slotHeading}`}>
            {spot.name}
          </h3>
          <ul className={styles.shelf}>
            {GROVE_ITEMS.filter((item) => item.spot === spot.id).map((item) => (
              <ShelfItem key={item.id} artNode={<GroveItemArt id={item.id} size={88} className={styles.goodsArt} />} title={item.name}>
                {progress.grove.items.includes(item.id) ? (
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
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
