import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import styles from './OutOfMovesDialog.module.css';

/**
 * Shown when the move limit runs out before every gem is lit. Kept light and quick:
 * the board stays visible, retrying is one tap, and a hint is offered as a gentle way forward.
 */
export default function OutOfMovesDialog({ gemsLeft, lumiLine, hintsOwned = 0, onRetry, onRetryWithHint = null, onMap }) {
  const isClose = gemsLeft <= 1;
  return (
    <Dialog title={isClose ? 'So close!' : 'Out of moves'} tone="gentle" onClose={onMap}>
      <p className={styles.progress}>
        {gemsLeft === 1 ? 'Just 1 gem to go.' : `${gemsLeft} gems to go.`} <span className={styles.quip}>Lumi: “{lumiLine}”</span>
      </p>
      <div className={styles.actions}>
        <Button size="lg" icon="restart" onClick={onRetry} data-autofocus>
          Try again
        </Button>
        {onRetryWithHint && (
          <Button variant="secondary" icon="hint" onClick={onRetryWithHint}>
            Try again with a hint{hintsOwned > 0 ? ` (${hintsOwned} left)` : ''}
          </Button>
        )}
        <Button variant="ghost" icon="map" onClick={onMap}>
          Back to map
        </Button>
      </div>
    </Dialog>
  );
}
