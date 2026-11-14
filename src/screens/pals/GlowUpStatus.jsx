import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { glowUpsAvailable } from '../../game/pals.js';
import GlowUpDialog from './GlowUpDialog.jsx';
import styles from './Pals.module.css';

/** "1 Glow-up ready!" (opens the chooser) or how many levels until the next one. */
export default function GlowUpStatus() {
  const { progress } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);
  const available = glowUpsAvailable(progress);

  return (
    <>
      {available > 0 ? (
        <button type="button" className={styles.glowReady} onClick={() => setIsOpen(true)}>
          <Icon name="spark" size={16} /> {available === 1 ? 'Glow-up ready! Choose a Pal' : `${available} Glow-ups ready! Choose Pals`}
        </button>
      ) : (
        <p className={styles.growth}>Finish your next world to earn a Glow-up and grow a Pal.</p>
      )}
      {isOpen && <GlowUpDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}
