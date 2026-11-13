import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import styles from './OutOfMovesDialog.module.css';

/** Shown when the move limit runs out before every gem is lit. */
export default function OutOfMovesDialog({ lumiLine, onRetry, onMap }) {
  return (
    <Dialog title="Out of moves!" onClose={onMap}>
      <div className={styles.lumi}>
        <Lumi mood="sad" size={84} line={lumiLine} bubbleSide="top" />
      </div>
      <p className={styles.tip}>Tip: count the turns before you tap. Every move counts!</p>
      <div className={styles.actions}>
        <Button size="lg" variant="go" icon="restart" onClick={onRetry} data-autofocus>
          Try again
        </Button>
        <Button variant="secondary" icon="map" onClick={onMap}>
          Map
        </Button>
      </div>
    </Dialog>
  );
}
