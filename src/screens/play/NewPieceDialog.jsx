import { useEffect, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import TileArt from '../../components/board/TileArt.jsx';
import { isRotatable } from '../../game/beam.js';
import { sfx } from '../../audio/sfx.js';
import styles from './NewPieceDialog.module.css';

/** "New piece!": introduces each piece the player meets for the first time, one card at a time. */
export default function NewPieceDialog({ pieces, onDone }) {
  const [step, setStep] = useState(0);
  const piece = pieces[step];
  const isLast = step === pieces.length - 1;

  useEffect(() => {
    sfx.newPal();
  }, [step]);

  // Turnable pieces show how they turn: the sample rotates back and forth.
  const [turns, setTurns] = useState(piece.sample.orient ?? 0);
  const canTurn = isRotatable(piece.sample);
  useEffect(() => {
    setTurns(piece.sample.orient ?? 0);
    if (!canTurn) return undefined;
    const timer = setInterval(() => setTurns((count) => count + 1), 1400);
    return () => clearInterval(timer);
  }, [piece, canTurn]);

  return (
    <Dialog title={step === 0 && piece.id === 'basics' ? 'How to play' : 'New piece!'} tone="celebrate" onClose={onDone}>
      <div className={styles.showcase} aria-hidden="true">
        <div className={styles.plate} key={piece.id}>
          <TileArt tile={piece.sample} turns={turns} isLit={piece.sample.type === 'gem'} isRotatable={canTurn} isFogged={Boolean(piece.sample.fog)} />
        </div>
      </div>
      <h3 className={`game-title ${styles.name}`}>{piece.name}</h3>
      <p className={styles.text}>{piece.text}</p>
      <div className={styles.lumi}>
        <LumiSays mood="excited" size={72} line={piece.lumi} />
      </div>
      {pieces.length > 1 && (
        <p className={styles.dots} aria-label={`${step + 1} of ${pieces.length}`}>
          {pieces.map((other, i) => (
            <span key={other.id} className={i === step ? styles.dotOn : styles.dot} />
          ))}
        </p>
      )}
      <Button size="lg" onClick={isLast ? onDone : () => setStep(step + 1)} data-autofocus>
        {isLast ? 'Let’s try it!' : 'Next'}
      </Button>
    </Dialog>
  );
}
