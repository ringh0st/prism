import PalArt from './PalArt.jsx';
import GrowthPips from './GrowthPips.jsx';
import PalPowerBadge from './PalPowerBadge.jsx';
import { palPower } from '../../game/palPowers.js';
import { rarityOf } from '../../game/pals.js';
import styles from './PalCard.module.css';
import { palName, rarityName, stageName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** The symbol before each rarity's ribbon word (so color is never the only signal). */
const RIBBON_SYMBOLS = { common: '', legendary: '★ ', mythic: '✦ ' };

/**
 * A Pal card. Every card has the same layout, so they're easy to compare at a glance:
 * the Pal, a rarity ribbon (Basic, ★ Legendary or ✦ Mythic, with a matching frame and a soft wash over
 * the card), the name, its power in levels (shown even before it's unlocked), and its age as five growth icons (sprout → crown) with a tag in the age's color.
 * @param stage    the Pal's form (from palStage) if you have it, else null
 * @param onLook   opens the Pal's forms; without it the art isn't a button (locked Pals)
 * @param children the card's action (a button) or hint, at the bottom
 */
export default function PalCard({ pal, stage = null, isUnlocked = true, isPartner = false, wearing = [], onLook, children }) {
  const { t, lang } = useI18n();
  const rarity = rarityOf(pal);
  const name = palName(lang, pal);
  const art = <PalArt palId={pal.id} stage={stage?.index ?? 0} wearing={wearing} size="100%" className={styles.art} />;

  return (
    <li className={`${styles.card} ${styles[rarity]} ${isUnlocked ? '' : styles.locked}`}>
      {rarity === 'mythic' && <span className={styles.sparkles} aria-hidden="true" />}
      {isPartner && <span className={styles.partner}>{t('pals.card.partner')}</span>}
      <span className={styles.stageArt}>
        {isUnlocked && onLook ? (
          <button type="button" className={styles.look} onClick={onLook} aria-label={t('pals.card.see', { name })}>
            {art}
          </button>
        ) : (
          art
        )}
      </span>
      <span className={styles.ribbon}>
        {RIBBON_SYMBOLS[rarity]}
        {rarityName(lang, rarity)}
      </span>
      <span className={`game-title ${styles.name}`}>{isUnlocked ? name : '???'}</span>
      <PalPowerBadge power={palPower(pal, stage?.index ?? 0)} />
      {stage && (
        <span className={styles.form}>
          <GrowthPips stageIndex={stage.index} />
          <span className={`${styles.formName} ${styles.ageTag} ${styles[stage.id]}`}>{stageName(lang, stage)}</span>
        </span>
      )}
      {children}
    </li>
  );
}
