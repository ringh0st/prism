import { useEffect, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import RewardShower from '../../components/RewardShower.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import { HELPERS } from '../../game/catalog.js';
import { sfx } from '../../audio/sfx.js';
import styles from './ChestDialog.module.css';

/**
 * Shake, pop, reveal: opening a reward chest.
 * @param opening the claim promise, started when the player tapped the chest (so it runs exactly once)
 */
export default function ChestDialog({ opening, onClose }) {
  const [phase, setPhase] = useState('shaking'); // shaking | open | error
  const [reward, setReward] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(async () => {
      try {
        const result = await opening;
        if (!isCurrent) return;
        setReward(result);
        setPhase('open');
        sfx.chest();
      } catch (claimError) {
        if (!isCurrent) return;
        setError(claimError.message);
        setPhase('error');
      }
    }, 1100);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [opening]);

  return (
    <Dialog
      title={phase === 'open' ? 'Treasure!' : phase === 'error' ? 'Hmm…' : 'Opening…'}
      tone="celebrate"
      onClose={phase === 'shaking' ? undefined : onClose}
    >
      <div className={`${styles.chest} ${styles[phase]}`} aria-hidden="true">
        <Icon name="chest" size={96} />
        <span className={styles.burst} />
      </div>
      {phase === 'open' && reward && (
        <>
          <ul className={styles.rewards}>
            <li className={styles.reward}>
              <Icon name="spark" size={26} /> +{reward.sparks} sparks
            </li>
            <li className={styles.reward}>
              <Icon name={HELPERS[reward.helper].icon} size={26} /> +1 {HELPERS[reward.helper].name}
            </li>
          </ul>
          <div className={styles.lumi}>
            <LumiSays mood="dance" size={92} line="Shiny loot! Spend it wisely… or don’t!" />
          </div>
          <Button size="lg" variant="go" onClick={onClose} data-autofocus>
            Awesome!
          </Button>
          <RewardShower />
        </>
      )}
      {phase === 'error' && (
        <>
          <p className={styles.error}>{error}</p>
          <Button onClick={onClose} data-autofocus>
            OK
          </Button>
        </>
      )}
    </Dialog>
  );
}
