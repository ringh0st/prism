import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Dialog from '../../components/Dialog.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { ADOPT_PAL_DIAMONDS, PALS, stageOf } from '../../game/pals.js';
import styles from './Stall.module.css';

/** Adopt a Pal you choose (never a random one) for diamonds. You always see exactly what you get. */
export default function AdoptShelf({ onAdopted, onError }) {
  const { progress, isSignedIn, adoptPal } = usePlayer();
  const [choice, setChoice] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const waiting = PALS.filter((pal) => !progress.pal.owned[pal.id]);
  // Pals you don't have come first; yours stay visible, marked Owned, and can't be bought again.
  const shelf = [...waiting, ...PALS.filter((pal) => progress.pal.owned[pal.id])];

  const confirm = async () => {
    setIsBusy(true);
    try {
      await adoptPal(choice.id);
      onAdopted(choice);
      setChoice(null);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  if (waiting.length === 0) return <p className={styles.shelfIntro}>You have every Pal. Amazing!</p>;
  return (
    <>
      <p className={styles.shelfIntro}>
        Pick any Pal you don’t have yet and bring it home for <strong>{ADOPT_PAL_DIAMONDS} diamonds</strong>. Or keep playing to unlock them for free!
        {!isSignedIn && <> Diamonds need an account: <a href="#/settings">sign in</a>.</>}
      </p>
      <ul className={styles.adoptGrid}>
        {shelf.map((pal) => (
          <li key={pal.id}>
            {progress.pal.owned[pal.id] ? (
              <div className={`${styles.adoptPal} ${styles.adoptOwned}`} aria-label={`${pal.name} the ${pal.species}: owned`}>
                <PalArt palId={pal.id} stage={stageOf(progress.pal.owned[pal.id])} size={64} />
                <span className="game-title">{pal.name}</span>
                <span className={styles.ownedChip}>
                  <Icon name="check" size={13} /> Owned
                </span>
              </div>
            ) : (
              <button type="button" className={styles.adoptPal} onClick={() => setChoice(pal)} aria-label={`Adopt ${pal.name} the ${pal.species}`}>
                <PalArt palId={pal.id} size={64} />
                <span className="game-title">{pal.name}</span>
                <span className={styles.adoptPrice}>
                  <Icon name="diamond" size={13} /> {ADOPT_PAL_DIAMONDS}
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>
      {choice && (
        <Dialog title={`Adopt ${choice.name}?`} onClose={() => setChoice(null)}>
          <PalArt palId={choice.id} size={120} className={styles.infoArt} />
          <p className={styles.infoText}>
            {choice.name} the {choice.species} joins your team as a Baby, ready to grow with Glow-ups.
          </p>
          <p className={styles.legal}>Diamonds can be bought with real money. Under 18? Ask a parent first.</p>
          <div className={styles.adoptActions}>
            <Button size="lg" disabled={!isSignedIn || isBusy || progress.diamonds < ADOPT_PAL_DIAMONDS} onClick={confirm} data-autofocus>
              <Icon name="diamond" size={18} />
              <span>{isBusy ? 'Adopting…' : `Adopt for ${ADOPT_PAL_DIAMONDS}`}</span>
            </Button>
            {isSignedIn && progress.diamonds < ADOPT_PAL_DIAMONDS && <p className={styles.legal}>You have {progress.diamonds} diamonds.</p>}
            <Button variant="ghost" onClick={() => setChoice(null)}>
              Not now
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
