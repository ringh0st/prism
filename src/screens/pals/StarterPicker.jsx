import { useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { STARTER_PALS } from '../../game/pals.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Pals.module.css';

/**
 * First game: pick your partner Pal from three starters (or let Lumi surprise you).
 * Required, so it has no close button; `onSkip` only appears if saving fails.
 */
export default function StarterPicker({ onSkip }) {
  const { choosePal } = usePlayer();
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const pal = STARTER_PALS.find((starter) => starter.id === selected);

  const confirm = async (palId) => {
    setIsSaving(true);
    setError('');
    try {
      await choosePal(palId);
      sfx.newPal();
    } catch (saveError) {
      setError(saveError.message);
      setIsSaving(false);
    }
  };

  const surprise = () => {
    const random = STARTER_PALS[Math.floor(Math.random() * STARTER_PALS.length)];
    setSelected(random.id);
    confirm(random.id);
  };

  return (
    <Dialog title="Pick your partner!">
      <div className={styles.pickerLumi}>
        <Lumi mood="excited" size={86} line="Your Pal grows as you solve levels. Choose wisely… or cutely!" bubbleSide="right" />
      </div>
      <div className={styles.starters} role="radiogroup" aria-label="Starter Pals">
        {STARTER_PALS.map((starter) => (
          <button
            key={starter.id}
            type="button"
            role="radio"
            aria-checked={selected === starter.id}
            className={`${styles.starter} ${selected === starter.id ? styles.starterSelected : ''}`}
            onClick={() => setSelected(starter.id)}
          >
            <PalArt palId={starter.id} size={84} />
            <span className={`game-title ${styles.starterName}`}>{starter.name}</span>
            <span className={styles.starterSpecies}>{starter.species}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.pickerActions}>
        <Button size="lg" disabled={!pal || isSaving} onClick={() => confirm(pal.id)} data-autofocus>
          {pal ? `Go with ${pal.name}!` : 'Tap a Pal'}
        </Button>
        <Button variant="ghost" disabled={isSaving} onClick={surprise}>
          Surprise me
        </Button>
        {error && onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Pick later
          </Button>
        )}
      </div>
    </Dialog>
  );
}
