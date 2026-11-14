import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PalCard from '../../components/pals/PalCard.jsx';
import PalDetailDialog from './PalDetailDialog.jsx';
import LuckyPalProgress from './LuckyPalProgress.jsx';
import TeamSwitcher from './TeamSwitcher.jsx';
import GlowbugGardenLink from './GlowbugGardenLink.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, isPalUnlocked, palStage, stageOf, unlockText } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';

/** All Pals: yours (pick a partner), unlocked ones waiting to join, and locked ones with how to get them. */
function Collection({ onError }) {
  const { progress, choosePal } = usePlayer();
  const [lookingAt, setLookingAt] = useState(null);
  const pick = async (palId) => {
    try {
      await choosePal(palId);
      sfx.sparkle();
    } catch (error) {
      onError(error.message);
    }
  };

  return (
    <ul className={styles.collection}>
      {PALS.map((pal) => {
        const owned = progress.pal.owned[pal.id];
        const isPartner = progress.pal.id === pal.id;
        const isUnlocked = isPalUnlocked(progress, pal);
        const stage = palStage(stageOf(owned));
        return (
          <PalCard
            key={pal.id}
            pal={pal}
            stage={owned ? stage : null}
            isUnlocked={isUnlocked}
            isPartner={isPartner}
            wearing={isPartner ? progress.pal.wearing : []}
            onLook={isUnlocked ? () => setLookingAt(pal) : undefined}
          >
            {owned && !isPartner && (
              <button type="button" className={styles.pickButton} onClick={() => pick(pal.id)}>
                Partner up
              </button>
            )}
            {!owned && isUnlocked && (
              <button type="button" className={`${styles.pickButton} ${styles.newPal}`} onClick={() => pick(pal.id)}>
                {progress.pal.id ? 'Add to team' : 'Choose'}
              </button>
            )}
            {!isUnlocked && (
              <span className={styles.lockHint}>
                <Icon name="lock" size={12} /> {unlockText(pal.unlock)}
              </span>
            )}
          </PalCard>
        );
      })}
      {lookingAt && <PalDetailDialog pal={lookingAt} onClose={() => setLookingAt(null)} />}
    </ul>
  );
}

/** The Pals tab's Team: switch partner, the next Lucky Pal gift, and every Pal (pick one, see their forms). */
export default function PalTeam() {
  const [message, setMessage] = useState('');
  return (
    <>
      <TeamSwitcher />
      <GlowbugGardenLink />
      <LuckyPalProgress />
      <section className={styles.section} aria-label="Your team">
        <Collection onError={setMessage} />
        {message && (
          <p className={styles.error} role="alert">
            {message}
          </p>
        )}
      </section>
    </>
  );
}
