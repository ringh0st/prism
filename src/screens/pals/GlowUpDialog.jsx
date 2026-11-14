import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { MAX_PAL_STAGE, PALS, glowUpsAvailable, palStage, stageOf } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';

/** Spend a Glow-up: pick which of your Pals grows into its next form, then celebrate it. */
export default function GlowUpDialog({ onClose }) {
  const { progress, glowUpPal } = usePlayer();
  const [grown, setGrown] = useState(null);
  const [error, setError] = useState('');
  const team = PALS.filter((pal) => progress.pal.owned[pal.id]);
  const available = glowUpsAvailable(progress);

  const grow = async (pal) => {
    try {
      await glowUpPal(pal.id);
      sfx.win();
      setGrown(pal);
    } catch (growError) {
      setError(growError.message);
    }
  };

  if (grown) {
    const stage = palStage(stageOf(progress.pal.owned[grown.id]));
    return (
      <Dialog title={`${grown.name} grew!`} tone="celebrate" onClose={onClose}>
        <PalArt palId={grown.id} stage={stage.index} accessory={progress.pal.id === grown.id ? progress.pal.accessory : null} size={140} className={styles.unlockArt} />
        <p className={styles.unlockText}>
          {grown.name} is now a <strong>{stage.name}</strong>!
        </p>
        <Button size="lg" onClick={available > 0 ? () => setGrown(null) : onClose} data-autofocus>
          {available > 0 ? `Grow another (${available} left)` : 'Yay!'}
        </Button>
      </Dialog>
    );
  }

  return (
    <Dialog title="Glow-up time!" tone="celebrate" onClose={onClose}>
      <p className={styles.unlockText}>
        You finished a world! Pick a Pal to grow into its next form.
        {available > 1 && <strong> You have {available} Glow-ups.</strong>}
      </p>
      <ul className={styles.glowGrid}>
        {team.map((pal) => {
          const stage = palStage(stageOf(progress.pal.owned[pal.id]));
          const isMax = stage.index >= MAX_PAL_STAGE;
          return (
            <li key={pal.id}>
              <button type="button" className={styles.glowPal} disabled={isMax} onClick={() => grow(pal)}>
                <PalArt palId={pal.id} stage={stage.index} size={70} />
                <span className="game-title">{pal.name}</span>
                <span className={styles.glowStep}>{isMax ? 'Legend ★' : `${stage.name} → ${stage.next.name}`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button variant="ghost" onClick={onClose}>
        Later
      </Button>
    </Dialog>
  );
}
