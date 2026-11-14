import PalArt from './PalArt.jsx';
import GrowthPips from './GrowthPips.jsx';
import PalCardOrnament from './PalCardOrnament.jsx';
import { RARITY_NAMES, rarityOf } from '../../game/pals.js';
import styles from './PalCard.module.css';

const RARITY_MARKS = { legendary: '★', mythic: '✦' };
const MYTHIC_SPARKLES = 5;

/**
 * A collectible Pal card. The card's fill and corner decor show the Pal's age (fresh mint for a Baby up
 * to a dark golden Legend card), the row of icons shows its form, and the frame shows its rarity: a gold
 * frame with a ★ tab for Legendary, a sunset frame with twinkling ✦ for Mythic.
 * @param stage    the Pal's form (from palStage) if you have it, else null
 * @param onLook   opens the Pal's forms; without it the art isn't a button (locked Pals)
 * @param children the card's action (a button) or hint, under the name
 */
export default function PalCard({ pal, stage = null, isUnlocked = true, isPartner = false, wearing = [], onLook, children }) {
  const rarity = rarityOf(pal);
  const isSpecial = rarity !== 'common';
  const look = stage ? styles[stage.id] : styles.unowned;
  const art = <PalArt palId={pal.id} stage={stage?.index ?? 0} wearing={wearing} size={78} className={styles.art} />;

  return (
    <li className={`${styles.card} ${look} ${styles[rarity]} ${isUnlocked ? '' : styles.locked}`}>
      {stage && <PalCardOrnament stageId={stage.id} />}
      {rarity === 'mythic' &&
        Array.from({ length: MYTHIC_SPARKLES }, (_, i) => (
          <span key={i} className={styles.sparkle} aria-hidden="true">
            ✦
          </span>
        ))}
      {isSpecial && (
        <span className={styles.tab}>
          <span aria-hidden="true">{RARITY_MARKS[rarity]}</span>
          <span className="visually-hidden">{RARITY_NAMES[rarity]}</span>
        </span>
      )}
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
      <span className={`game-title ${styles.name}`}>{isUnlocked ? pal.name : '???'}</span>
      {isSpecial && (
        <span className={styles.rarityName} aria-hidden="true">
          {RARITY_NAMES[rarity]}
        </span>
      )}
      {stage && (
        <span className={styles.form}>
          <GrowthPips stageIndex={stage.index} />
          <span className={styles.formName}>{stage.name}</span>
        </span>
      )}
      {children}
    </li>
  );
}
