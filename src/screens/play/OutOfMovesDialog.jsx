import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import styles from './OutOfMovesDialog.module.css';

/**
 * Shown when the move limit runs out before every gem is lit. Kept light and quick:
 * the board stays visible, retrying is one tap, and a hint is offered as a gentle way forward.
 * In the early worlds `onKeepGoing` adds a few moves instead (for 1 star), so new players never hit a wall.
 */
export default function OutOfMovesDialog({
  gemsLeft,
  gemsLit = 0,
  lumiLine,
  hintsOwned = 0,
  backName = 'map',
  onRetry,
  onKeepGoing = null,
  onRetryWithHint = null,
  onMap,
}) {
  const isClose = gemsLit > 0 && gemsLeft === 1;
  return (
    <Dialog title={isClose ? 'So close!' : 'Out of moves'} tone="gentle" onClose={onMap} closesOnBackdrop={false}>
      <p className={styles.progress}>
        {gemsLit === 0 ? 'No gems lit yet. Try another way!' : gemsLeft === 1 ? 'Just 1 gem to go.' : `${gemsLeft} gems to go.`}{' '}
        <span className={styles.quip}>Lumi: “{lumiLine}”</span>
      </p>
      <div className={styles.actions}>
        {onKeepGoing && (
          <Button size="lg" icon="play" onClick={onKeepGoing} data-autofocus>
            Keep going (1 ★)
          </Button>
        )}
        <Button
          size={onKeepGoing ? 'md' : 'lg'}
          variant={onKeepGoing ? 'secondary' : 'primary'}
          icon="restart"
          onClick={onRetry}
          data-autofocus={!onKeepGoing || undefined}
        >
          Try again
        </Button>
        {onRetryWithHint && (
          <Button variant="secondary" icon="hint" onClick={onRetryWithHint}>
            Try again with a hint{hintsOwned > 0 ? ` (${hintsOwned} left)` : ''}
          </Button>
        )}
        <Button variant="ghost" icon="map" onClick={onMap}>
          Back to {backName}
        </Button>
      </div>
    </Dialog>
  );
}
