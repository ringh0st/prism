import PalArt from '../../components/pals/PalArt.jsx';
import GrowthPips from '../../components/pals/GrowthPips.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PAL_STAGES, playablePals, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './TeamSwitcher.module.css';
import { palWithSpecies, stageName } from '../../i18n/palText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import PalPowerBadge from '../../components/pals/PalPowerBadge.jsx';
import { palPower } from '../../game/palPowers.js';

/**
 * Your Pals in a row, youngest first (babies lead, so it's easy to pick one that still has growing to do), each
 * with its power and growth pips: tap one to make it your partner. Unlocked Pals you haven't played with yet are
 * here too (they join when picked). `compact` drops the heading and the card look (on the level card);
 * `onSwitched(palId)` follows a switch.
 */
export default function TeamSwitcher({ compact = false, onSwitched = null }) {
  const { progress, choosePal } = usePlayer();
  const { t, lang } = useI18n();
  const partner = progress.pal.id;
  const owned = (pal) => progress.pal.owned[pal.id];
  const team = playablePals(progress);
  if (team.length < 2) return null;

  const switchTo = async (palId) => {
    if (palId === partner) return;
    await choosePal(palId);
    sfx.sparkle();
    onSwitched?.(palId);
  };

  return (
    <section className={compact ? styles.compact : styles.team} aria-labelledby={compact ? undefined : 'team-switch-title'}>
      {!compact && (
        <h2 id="team-switch-title" className={`game-title ${styles.title}`}>
          {t('pals.switch.title')}
        </h2>
      )}
      <div
        className={styles.pals}
        role="radiogroup"
        aria-labelledby={compact ? undefined : 'team-switch-title'}
        aria-label={compact ? t('pals.switch.title') : undefined}
      >
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
