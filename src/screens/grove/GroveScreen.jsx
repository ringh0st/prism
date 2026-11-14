import { useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import GroveScene from '../../components/grove/GroveScene.jsx';
import GroveItemArt from '../../components/grove/GroveItemArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GROVE_ITEMS, GROVE_SPOTS } from '../../game/grove.js';
import { useGroveTeam } from './GroveHome.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './Grove.module.css';

/** One piece of decor: buy it, place it, or put it away. */
function DecorItem({ item, onDone, onError }) {
  const { progress, buyGroveItem, placeGroveItem } = usePlayer();
  const [isBusy, setIsBusy] = useState(false);
  const isOwned = progress.grove.items.includes(item.id);
  const isPlaced = progress.grove.placed.includes(item.id);

  const act = async (action, message) => {
    setIsBusy(true);
    try {
      await action();
      sfx.sparkle();
      onDone(message);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <li className={`${styles.item} ${isPlaced ? styles.placed : ''}`}>
      <GroveItemArt id={item.id} size={64} />
      <span className={styles.itemName}>{item.name}</span>
      {!isOwned ? (
        <Button
          size="sm"
          variant="gold"
          disabled={isBusy || progress.sparks < item.price}
          onClick={() => act(() => buyGroveItem(item.id), `${item.name}: yours! Now place it.`)}
          aria-label={`Buy ${item.name} for ${item.price} sparks`}
        >
          <Icon name="spark" size={16} />
          <span>{item.price}</span>
        </Button>
      ) : (
        <Button
          size="sm"
          variant={isPlaced ? 'secondary' : 'primary'}
          disabled={isBusy}
          aria-pressed={isPlaced}
          onClick={() => act(() => placeGroveItem(item.id, !isPlaced), isPlaced ? `${item.name} put away.` : `${item.name} placed!`)}
        >
          {isPlaced ? 'Put away' : 'Place'}
        </Button>
      )}
    </li>
  );
}

/** Decorate the Grove: a live preview on top, every piece of decor below, grouped by where it goes. */
export default function GroveScreen() {
  const { progress } = usePlayer();
  const team = useGroveTeam();
  const [message, setMessage] = useState({ text: '', isError: false });

  return (
    <div className={styles.page}>
      <ScreenHeader title="Decorate" backHref="#/pals" />
      <main className={styles.main}>
        <div className={styles.preview}>
          <GroveScene placed={progress.grove.placed} team={team} partnerId={progress.pal.id} wearing={progress.pal.wearing} />
        </div>
        <p className={message.isError ? styles.error : styles.status} role={message.isError ? 'alert' : 'status'}>
          {message.text || 'One piece per spot. Decor is yours forever, and you can swap any time.'}
        </p>
        {GROVE_SPOTS.map((spot) => (
          <section key={spot.id} className={styles.spot} aria-labelledby={`spot-${spot.id}`}>
            <h2 id={`spot-${spot.id}`} className={`game-title ${styles.spotTitle}`}>
              {spot.name}
            </h2>
            <ul className={styles.items}>
              {GROVE_ITEMS.filter((item) => item.spot === spot.id).map((item) => (
                <DecorItem
                  key={item.id}
                  item={item}
                  onDone={(text) => setMessage({ text, isError: false })}
                  onError={(text) => setMessage({ text, isError: true })}
                />
              ))}
            </ul>
          </section>
        ))}
      </main>
      <BottomNav active="pals" />
    </div>
  );
}
