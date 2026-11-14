import { useState } from 'react';
import Button from '../../components/Button.jsx';
import Dialog from '../../components/Dialog.jsx';
import Icon from '../../components/Icon.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import PalFormsStrip from '../../components/pals/PalFormsStrip.jsx';
import RarityBadge from '../../components/pals/RarityBadge.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { PALS, adoptPriceOf, dailyPalPick, rarityOf, stageOf } from '../../game/pals.js';
import styles from './Stall.module.css';

/** Today's Legendary and Mythic picks for this player: chosen at random, but shown before buying. */
function DailyPicks({ onChoose }) {
  const { progress, shopSeed } = usePlayer();
  const picks = ['legendary', 'mythic'].map((rarity) => ({ rarity, pal: dailyPalPick(progress, rarity, shopSeed) }));
  return (
    <>
      <p className={styles.shelfIntro}>A special Pal picked just for you, new every day. You always see who you get.</p>
      <ul className={styles.dailyPicks}>
        {picks.map(({ rarity, pal }) => (
          <li key={rarity}>
            {pal ? (
              <button
                type="button"
                className={`${styles.dailyPick} ${styles[rarity]}`}
                onClick={() => onChoose(pal)}
                aria-label={`Today's pick: ${pal.name} the ${pal.species}, ${adoptPriceOf(pal)} diamonds`}
              >
                <RarityBadge pal={pal} />
                <PalArt palId={pal.id} size={96} />
                <span className="game-title">{pal.name}</span>
                <span className={styles.pickSpecies}>{pal.species}</span>
                <span className={styles.adoptPrice}>
                  <Icon name="diamond" size={13} /> {adoptPriceOf(pal)}
                </span>
              </button>
            ) : (
              <div className={`${styles.dailyPick} ${styles.adoptOwned}`}>
                <span className="game-title">You have every {rarity === 'mythic' ? 'Mythic' : 'Legendary'} Pal!</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/** Adopt Pals for diamonds: any regular Pal you choose, plus today's Legendary and Mythic picks. Never a surprise. */
export default function AdoptShelf({ onAdopted, onError }) {
  const { progress, isSignedIn, adoptPal } = usePlayer();
  const [choice, setChoice] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const regulars = PALS.filter((pal) => rarityOf(pal) === 'common');
  // Pals you don't have come first; yours stay visible, marked Owned, and can't be bought again.
  const shelf = [...regulars.filter((pal) => !progress.pal.owned[pal.id]), ...regulars.filter((pal) => progress.pal.owned[pal.id])];
  const price = choice ? adoptPriceOf(choice) : 0;

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

  return (
    <>
      <h2 className={`game-title ${styles.sectionTitle}`}>Today’s picks</h2>
      <DailyPicks onChoose={setChoice} />
      <h2 className={`game-title ${styles.sectionTitle}`}>Adopt a Pal</h2>
      <p className={styles.shelfIntro}>
        Pick any Pal you don’t have yet and bring it home for <strong>{adoptPriceOf(regulars[0])} diamonds</strong>. Or keep playing to unlock them
        for free!
        {!isSignedIn && (
          <>
            {' '}
            Diamonds need an account: <a href="#/settings">sign in</a>.
          </>
        )}
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
                  <Icon name="diamond" size={13} /> {adoptPriceOf(pal)}
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
            {choice.name} the {choice.species} <RarityBadge pal={choice} /> joins your team as a Baby. Play with it as your partner and it grows into
            a Legend!
          </p>
          <PalFormsStrip palId={choice.id} />
          <p className={styles.legal}>Diamonds can be bought with real money. Under 18? Ask a parent first.</p>
          <div className={styles.adoptActions}>
            <Button size="lg" disabled={!isSignedIn || isBusy || progress.diamonds < price} onClick={confirm} data-autofocus>
              <Icon name="diamond" size={18} />
              <span>{isBusy ? 'Adopting…' : `Adopt for ${price}`}</span>
            </Button>
            {isSignedIn && progress.diamonds < price && <p className={styles.legal}>You have {progress.diamonds} diamonds.</p>}
            {!isSignedIn && <p className={styles.legal}>Sign in to use diamonds.</p>}
            <Button variant="ghost" onClick={() => setChoice(null)}>
              Not now
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
