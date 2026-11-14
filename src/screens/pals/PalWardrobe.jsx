import { useState } from 'react';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PAL_ACCESSORIES, PAL_SLOTS, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';

/** Clothes and gear you own (bought in the Shop): one per slot on your partner. */
function Wardrobe({ onError }) {
  const { progress, wearAccessory } = usePlayer();
  const owned = PAL_ACCESSORIES.filter((item) => progress.pal.accessories.includes(item.id));
  const stage = stageOf(progress.pal.owned[progress.pal.id]);
  const toggle = async (itemId, isWearing) => {
    try {
      await wearAccessory(itemId, isWearing);
      sfx.sparkle();
    } catch (error) {
      onError(error.message);
    }
  };

  if (owned.length === 0) {
    return (
      <p className={styles.growth}>
        No clothes yet. Find hats, capes and gear in the <a href="#/store">Shop</a> (Pals section).
      </p>
    );
  }
  return PAL_SLOTS.map((slot) => {
    const items = owned.filter((item) => item.slot === slot.id);
    if (items.length === 0) return null;
    return (
      <div key={slot.id} className={styles.slotGroup}>
        <h4 className={styles.slotTitle}>{slot.name}</h4>
        <ul className={styles.wardrobe}>
          {items.map((item) => {
            const isWorn = progress.pal.wearing.includes(item.id);
            return (
              <li key={item.id} className={`${styles.accessory} ${isWorn ? styles.worn : ''}`}>
                <PalArt palId={progress.pal.id} stage={stage} wearing={[item.id]} size={58} />
                <span className={styles.accessoryName}>{item.name}</span>
                <Button size="sm" variant={isWorn ? 'secondary' : 'primary'} onClick={() => toggle(item.id, !isWorn)} aria-pressed={isWorn}>
                  {isWorn ? 'Take off' : 'Wear'}
                </Button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  });
}

/** The Pals tab's Wardrobe: dress your partner in the clothes and gear you own. */
export default function PalWardrobe() {
  const { progress } = usePlayer();
  const [message, setMessage] = useState('');
  if (!progress.pal.id) return null;
  return (
    <section className={styles.section} aria-label="Wardrobe">
      <p className={styles.growth}>Dress up your partner: one hat, one neck item and one piece of gear at a time.</p>
      <Wardrobe onError={setMessage} />
      {message && (
        <p className={styles.error} role="alert">
          {message}
        </p>
      )}
    </section>
  );
}
