import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, PAL_ACCESSORIES, isPalUnlocked, palStage, stageOf, unlockText } from '../../game/pals.js';
import GlowUpStatus from './GlowUpStatus.jsx';
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
            <PalArt palId={pal.id} stage={stage.index} accessory={isPartner ? progress.pal.accessory : null} size={76} className={styles.palArt} />
            <span className={`game-title ${styles.palName}`}>{isUnlocked ? pal.name : '???'}</span>
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

/** Clothes you own (bought in the Shop): put one on your partner, or take it off. */
function Wardrobe({ onError }) {
  const { progress, equipAccessory } = usePlayer();
  const owned = PAL_ACCESSORIES.filter((item) => progress.pal.accessories.includes(item.id));
  const wear = async (itemId) => {
    try {
      await equipAccessory(itemId);
      sfx.sparkle();
    } catch (error) {
      onError(error.message);
    }
  };

  if (owned.length === 0) {
    return (
      <p className={styles.growth}>
        No clothes yet. Find scarves, hats and crowns in the <a href="#/store">Shop</a>.
      </p>
    );
  }
  return (
    <ul className={styles.wardrobe}>
      {owned.map((item) => {
        const isWorn = progress.pal.accessory === item.id;
        return (
          <li key={item.id} className={`${styles.accessory} ${isWorn ? styles.worn : ''}`}>
            <PalArt palId={progress.pal.id} stage={stageOf(progress.pal.owned[progress.pal.id])} accessory={item.id} size={58} />
            <span className={styles.accessoryName}>{item.name}</span>
            {isWorn ? (
              <Button size="sm" variant="secondary" onClick={() => wear(null)}>
                Take off
              </Button>
            ) : (
              <Button size="sm" onClick={() => wear(item.id)}>
                Wear
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** The "My Pals" section on the Me screen. */
export default function PalCollection() {
  const { progress } = usePlayer();
  const [message, setMessage] = useState('');
  const partner = progress.pal.id;
  return (
    <section className={styles.section} aria-labelledby="pals-title">
      <h2 id="pals-title" className="game-title">
        My Pals
      </h2>
      {partner && <GlowUpStatus />}
      <Collection onError={setMessage} />
      {partner && (
        <>
          <h3 className={`game-title ${styles.subheading}`}>Wardrobe</h3>
          <p className={styles.growth}>Dress up your partner. Any Pal can wear your clothes.</p>
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
