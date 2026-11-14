import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { glowUpsAvailable, nextGlowUpProgress } from '../../game/pals.js';
import GlowUpDialog from './GlowUpDialog.jsx';
import styles from './Pals.module.css';

/** What the bar is filling toward, in words. */
function growthLine(partner, stage, { world, solved, needed }) {
  const left = needed - solved;
  const levels = `${left} more ${left === 1 ? 'level' : 'levels'} in World ${world}`;
  if (!stage.next) return `${partner.name} is a Legend! ${levels} earns a Glow-up for another Pal.`;
  return `${levels} to grow ${partner.name} into a ${stage.next.name}.`;
}

/**
 * The partner's growth bar: it fills as you solve levels in your current world, and a finished
 * world earns a Glow-up. When one is ready, the bar is full and opens the chooser.
 */
export default function GlowUpStatus({ partner, stage }) {
  const { progress } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);
  const available = glowUpsAvailable(progress);
  const toward = nextGlowUpProgress(progress.levels);
  const solved = available > 0 ? toward.needed : toward.solved;
  const percent = Math.round((solved / toward.needed) * 100);

  return (
    <div className={styles.growthBox}>
      <div className={styles.growthHead}>
        <span>{stage.next ? `Next: ${stage.next.name}` : 'Fully grown'}</span>
        <span className={styles.growthCount}>
          {solved}/{toward.needed}
        </span>
      </div>
      <div
        className={`${styles.growthTrack} ${available > 0 ? styles.growthTrackFull : ''}`}
        role="progressbar"
        aria-label={stage.next ? `${partner.name}'s growth to ${stage.next.name}` : 'Progress to the next Glow-up'}
        aria-valuemin={0}
        aria-valuemax={toward.needed}
        aria-valuenow={solved}
        aria-valuetext={`${solved} of ${toward.needed} levels`}
      >
        <span className={styles.growthFill} style={{ width: `${percent}%` }} />
      </div>
      {available > 0 ? (
        <button
          type="button"
          className={styles.glowReady}
          aria-label={available === 1 ? 'Glow-up ready: choose a Pal to grow' : `${available} Glow-ups ready: choose Pals to grow`}
          onClick={() => setIsOpen(true)}
        >
          <Icon name="spark" size={16} /> {available === 1 ? 'Grow a Pal!' : `Grow ${available} Pals!`}
        </button>
      ) : (
        <p className={styles.growth}>{growthLine(partner, stage, toward)}</p>
      )}
      {isOpen && <GlowUpDialog onClose={() => setIsOpen(false)} />}
    </div>
  );
}
