import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { RUSH_LENGTH } from '../../game/rush.js';
import styles from './RushDialogs.module.css';

/**
 * A Light Rush puzzle solved: what it cost in spare moves (or the bonus it earned), milestone sparks,
 * and on to the next one. `outcome` comes from the route's onSolved.
 */
export default function RushClearedDialog({ number, par, moves, spareBefore, outcome, onNext, onBack }) {
  const { next, sparksWon, isComplete, isNewBest } = outcome;
  const used = Math.max(0, moves - par);
  const change = next.spare - spareBefore;
  return (
    <Dialog
      title={isComplete ? `All ${RUSH_LENGTH} cleared!` : `Puzzle ${number} cleared!`}
      tone="celebrate"
      onClose={onBack}
      closesOnBackdrop={false}
    >
      <p className={styles.summary}>
        {used === 0 ? `Solved in par (${par})! No spares used.` : `${moves} moves, par ${par}: ${used} spare ${used === 1 ? 'move' : 'moves'} used.`}
      </p>
      <div className={styles.spare}>
        <Icon name="bolt" size={26} />
        <span className={`game-title ${styles.spareCount}`}>{next.spare}</span>
        <span className={styles.spareLabel}>spare moves left</span>
        {change !== 0 && (
          <span className={`${styles.change} ${change > 0 ? styles.gain : styles.loss}`}>{change > 0 ? `+${change} bonus!` : `−${-change}`}</span>
        )}
      </div>
      <p className={styles.progress}>
        <strong>{next.cleared}</strong> / {RUSH_LENGTH} puzzles
      </p>
      {sparksWon > 0 && (
        <p className={`game-title ${styles.reward}`}>
          <Icon name="spark" size={20} /> +{sparksWon} sparks, milestone!
        </p>
      )}
      {isComplete && isNewBest && <p className={styles.best}>New best this week! You’re a true Light Legend.</p>}
      <div className={styles.actions}>
        {isComplete ? (
          <Button size="lg" onClick={onBack} data-autofocus>
            Back to Light Rush
          </Button>
        ) : (
          <Button size="lg" icon="play" onClick={onNext} data-autofocus>
            Next puzzle
          </Button>
        )}
      </div>
    </Dialog>
  );
}
