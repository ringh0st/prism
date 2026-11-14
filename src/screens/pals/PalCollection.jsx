import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import RarityBadge from '../../components/pals/RarityBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, PAL_ACCESSORIES, PAL_SLOTS, isPalUnlocked, palStage, stageOf, unlockText } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';

/** All Pals: yours (pick a partner), unlocked ones waiting to join, and locked ones with how to get them. */
function Collection({ onError }) {
  const { progress, choosePal } = usePlayer();
  const pick = async (palId) => {
    try {
      await choosePal(palId);
      sfx.sparkle();
    } catch (error) {
      onError(error.message);
    }
  };

  return (
    <ul className={styles.collection}>
      {PALS.map((pal) => {
        const owned = progress.pal.owned[pal.id];
        const isPartner = progress.pal.id === pal.id;
        const isUnlocked = isPalUnlocked(progress, pal);
        const stage = palStage(stageOf(owned));
        return (
          <li key={pal.id} className={`${styles.palCard} ${isPartner ? styles.partner : ''} ${isUnlocked ? '' : styles.locked}`}>
            <PalArt palId={pal.id} stage={stage.index} wearing={isPartner ? progress.pal.wearing : []} size={76} className={styles.palArt} />
            <span className={`game-title ${styles.palName}`}>{isUnlocked ? pal.name : '???'}</span>
            <RarityBadge pal={pal} className={styles.rarity} />
            {isPartner && <span className={styles.badge}>Partner</span>}
            {owned && !isPartner && (
              <button type="button" className={styles.pickButton} onClick={() => pick(pal.id)}>
                Make partner
              </button>
            )}
            {!owned && isUnlocked && (
              <button type="button" className={`${styles.pickButton} ${styles.newPal}`} onClick={() => pick(pal.id)}>
                {progress.pal.id ? 'New! Add to team' : 'Choose as starter'}
              </button>
            )}
            {!isUnlocked && (
              <span className={styles.lockHint}>
                <Icon name="lock" size={12} /> {unlockText(pal.unlock)}
              </span>
            )}
            {owned && <span className={styles.stage}>{stage.name}</span>}
          </li>
        );
      })}
    </ul>
  );
}

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
        No clothes yet. Find hats, capes and swords in the <a href="#/store">Shop</a>.
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

/** The team and wardrobe sections of the Pals screen. */
export default function PalCollection() {
  const { progress } = usePlayer();
  const [message, setMessage] = useState('');
  const partner = progress.pal.id;
  return (
    <section className={styles.section} aria-labelledby="pals-title">
      <h2 id="pals-title" className="game-title">
        Team
      </h2>
      <Collection onError={setMessage} />
      {partner && (
        <>
          <h3 className={`game-title ${styles.subheading}`}>Wardrobe</h3>
          <p className={styles.growth}>Dress up your partner: one hat, one neck item and one piece of gear at a time.</p>
          <Wardrobe onError={setMessage} />
        </>
      )}
      {message && (
        <p className={styles.error} role="alert">
          {message}
        </p>
      )}
    </section>
  );
}
