import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, palById, palStage } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';

/** Your partner Pal, how close it is to its next form, and your other Pals to switch to. */
export default function PartnerSwitcher() {
  const { progress, choosePal } = usePlayer();
  const partner = palById(progress.pal.id);
  if (!partner) return null;
  const xp = progress.pal.owned[partner.id]?.xp ?? 0;
  const stage = palStage(xp);
  const team = PALS.filter((pal) => progress.pal.owned[pal.id]);

  const switchTo = async (palId) => {
    if (palId === partner.id) return;
    await choosePal(palId);
    sfx.sparkle();
  };

  return (
    <section className={styles.partnerCard} aria-labelledby="partner-title">
      <PalArt palId={partner.id} xp={xp} accessory={progress.pal.accessory} size={96} className={styles.partnerArt} />
      <div className={styles.partnerInfo}>
        <h2 id="partner-title" className={`game-title ${styles.partnerName}`}>
          {partner.name} <span className={styles.stageChip}>{stage.name}</span>
        </h2>
        {stage.next ? (
          <>
            <div
              className={styles.growthTrack}
              role="progressbar"
              aria-label={`Growth to ${stage.next.name}`}
              aria-valuemin={stage.xp}
              aria-valuemax={stage.next.xp}
              aria-valuenow={xp}
            >
              <span className={styles.growthFill} style={{ width: `${Math.round(stage.progress * 100)}%` }} />
            </div>
            <p className={styles.growth}>
              {stage.next.xp - xp} new levels until {stage.next.name}
            </p>
          </>
        ) : (
          <p className={styles.growth}>Fully grown: a true Legend!</p>
        )}
      </div>
      {team.length > 1 && (
        <div className={styles.team} role="radiogroup" aria-label="Play with">
          {team.map((pal) => (
            <button
              key={pal.id}
              type="button"
              role="radio"
              aria-checked={pal.id === partner.id}
              aria-label={`${pal.name} the ${pal.species}`}
              className={`${styles.teamPal} ${pal.id === partner.id ? styles.teamPalActive : ''}`}
              onClick={() => switchTo(pal.id)}
            >
              <PalArt palId={pal.id} xp={progress.pal.owned[pal.id].xp} size={48} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
