import { useState } from 'react';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, palById, palStage, stageOf } from '../../game/pals.js';
import PalDetailDialog from './PalDetailDialog.jsx';
import PalGrowthBar from '../../components/pals/PalGrowthBar.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';

/** Your partner Pal, how close it is to its next form, and your other Pals to switch to. */
export default function PartnerSwitcher() {
  const { progress, choosePal } = usePlayer();
  const [isLooking, setIsLooking] = useState(false);
  const partner = palById(progress.pal.id);
  if (!partner) return null;
  const stage = palStage(stageOf(progress.pal.owned[partner.id]));
  const team = PALS.filter((pal) => progress.pal.owned[pal.id]);

  const switchTo = async (palId) => {
    if (palId === partner.id) return;
    await choosePal(palId);
    sfx.sparkle();
  };

  return (
    <section className={styles.partnerCard} aria-labelledby="partner-title">
      <button type="button" className={styles.palLook} onClick={() => setIsLooking(true)} aria-label={`See ${partner.name}'s forms`}>
        <PalArt palId={partner.id} stage={stage.index} wearing={progress.pal.wearing} size={96} className={styles.partnerArt} />
      </button>
      {isLooking && <PalDetailDialog pal={partner} onClose={() => setIsLooking(false)} />}
      <div className={styles.partnerInfo}>
        <h2 id="partner-title" className={`game-title ${styles.partnerName}`}>
          {partner.name} <span className={styles.stageChip}>{stage.name}</span>
        </h2>
        <div className={styles.stageDots} role="img" aria-label={`Form ${stage.index + 1} of 5`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={i <= stage.index ? styles.stageDotOn : styles.stageDot} />
          ))}
        </div>
        <PalGrowthBar pal={partner} owned={progress.pal.owned[partner.id]} />
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
              <PalArt palId={pal.id} stage={stageOf(progress.pal.owned[pal.id])} size={48} portrait />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
