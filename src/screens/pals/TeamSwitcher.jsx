import PalArt from '../../components/pals/PalArt.jsx';
import GrowthPips from '../../components/pals/GrowthPips.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, PAL_STAGES, growthOf, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './TeamSwitcher.module.css';
import { palWithSpecies, stageName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import PalPowerBadge from '../../components/pals/PalPowerBadge.jsx';
import { palPower } from '../../game/palPowers.js';

/**
 * Your Pals in a row, youngest first (babies lead, so it's easy to pick one that still has growing to do), each
 * with its growth pips: tap one to make it your partner.
 */
export default function TeamSwitcher() {
  const { progress, choosePal } = usePlayer();
  const { t, lang } = useI18n();
  const partner = progress.pal.id;
  const owned = (pal) => progress.pal.owned[pal.id];
  const team = PALS.filter(owned).sort((a, b) => stageOf(owned(a)) - stageOf(owned(b)) || growthOf(owned(a)) - growthOf(owned(b)));
  if (team.length < 2) return null;

  const switchTo = async (palId) => {
    if (palId === partner) return;
    await choosePal(palId);
    sfx.sparkle();
  };

  return (
    <section className={styles.team} aria-labelledby="team-switch-title">
      <h2 id="team-switch-title" className={`game-title ${styles.title}`}>
        {t('pals.switch.title')}
      </h2>
      <div className={styles.pals} role="radiogroup" aria-labelledby="team-switch-title">
        {team.map((pal) => (
          <button
            key={pal.id}
            type="button"
            role="radio"
            aria-checked={pal.id === partner}
            aria-label={`${palWithSpecies(lang, pal)}, ${stageName(lang, PAL_STAGES[stageOf(owned(pal))])}, ${t(`power.${pal.power}.line`, { count: palPower(pal, stageOf(owned(pal))).amount })}`}
            className={`${styles.teamPal} ${pal.id === partner ? styles.teamPalActive : ''}`}
            onClick={() => switchTo(pal.id)}
          >
            <PalArt palId={pal.id} stage={stageOf(owned(pal))} size={48} portrait />
            <PalPowerBadge power={palPower(pal, stageOf(owned(pal)))} size="sm" iconOnly className={styles.power} />
            <GrowthPips stageIndex={stageOf(owned(pal))} />
          </button>
        ))}
      </div>
    </section>
  );
}
