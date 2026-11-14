import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './TeamSwitcher.module.css';

/** Your Pals in a row: tap one to make it your partner. */
export default function TeamSwitcher() {
  const { progress, choosePal } = usePlayer();
  const partner = progress.pal.id;
  const team = PALS.filter((pal) => progress.pal.owned[pal.id]);
  if (team.length < 2) return null;

  const switchTo = async (palId) => {
    if (palId === partner) return;
    await choosePal(palId);
    sfx.sparkle();
  };

  return (
    <section className={styles.team} aria-labelledby="team-switch-title">
      <h2 id="team-switch-title" className={`game-title ${styles.title}`}>
        Play with
      </h2>
      <div className={styles.pals} role="radiogroup" aria-labelledby="team-switch-title">
        {team.map((pal) => (
          <button
            key={pal.id}
            type="button"
            role="radio"
            aria-checked={pal.id === partner}
            aria-label={`${pal.name} the ${pal.species}`}
            className={`${styles.teamPal} ${pal.id === partner ? styles.teamPalActive : ''}`}
            onClick={() => switchTo(pal.id)}
          >
            <PalArt palId={pal.id} stage={stageOf(progress.pal.owned[pal.id])} size={48} portrait />
          </button>
        ))}
      </div>
    </section>
  );
}
