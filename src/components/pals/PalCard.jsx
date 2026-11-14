import PalArt from './PalArt.jsx';
import GrowthPips from './GrowthPips.jsx';
import { rarityOf } from '../../game/pals.js';
import styles from './PalCard.module.css';

/** What each rarity's ribbon says (a symbol plus a word, so color is never the only signal). */
const RIBBONS = { common: 'Regular', legendary: '★ Legendary', mythic: '✦ Mythic' };

/**
 * A Pal card. Every card has the same layout, so they're easy to compare at a glance:
 * the Pal, a rarity ribbon (Regular, ★ Legendary or ✦ Mythic, with a matching frame and a soft wash over
 * the card), the name, and its age as five growth icons (sprout → crown) with a tag in the age's color.
 * @param stage    the Pal's form (from palStage) if you have it, else null
 * @param onLook   opens the Pal's forms; without it the art isn't a button (locked Pals)
 * @param children the card's action (a button) or hint, at the bottom
 */
export default function PalCard({ pal, stage = null, isUnlocked = true, isPartner = false, wearing = [], onLook, children }) {
  const rarity = rarityOf(pal);
  const art = <PalArt palId={pal.id} stage={stage?.index ?? 0} wearing={wearing} size="100%" className={styles.art} />;

  return (
    <li className={`${styles.card} ${styles[rarity]} ${isUnlocked ? '' : styles.locked}`}>
      {rarity === 'mythic' && <span className={styles.sparkles} aria-hidden="true" />}
      {isPartner && <span className={styles.partner}>♥ Partner</span>}
      <span className={styles.stageArt}>
        {isUnlocked && onLook ? (
          <button type="button" className={styles.look} onClick={onLook} aria-label={`See ${pal.name}'s forms`}>
            {art}
          </button>
        ) : (
          art
        )}
      </span>
      <span className={styles.ribbon}>{RIBBONS[rarity]}</span>
      <span className={`game-title ${styles.name}`}>{isUnlocked ? pal.name : '???'}</span>
      {stage ? (
        <span className={styles.form}>
          <GrowthPips stageIndex={stage.index} />
          <span className={`${styles.formName} ${styles.ageTag} ${styles[stage.id]}`}>{stage.name}</span>
        </span>
      ) : (
        isUnlocked && <span className={styles.formName}>Not on your team yet</span>
      )}
      {children}
    </li>
  );
}
