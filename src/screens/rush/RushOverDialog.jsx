import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import { RUSH_LENGTH } from '../../game/rush.js';
import styles from './RushDialogs.module.css';

const lineFor = (cleared) =>
  cleared === 0
    ? 'Out of spares already? That one was sneaky. Shake it off and go again!'
    : cleared < 10
      ? 'Nice run! Every puzzle in par saves a spare. You’ll get further next time.'
      : 'Wow, what a run! Your brain is basically a prism now.';

/** Out of moves in Light Rush: the run ends, with how far it got, and a new run is one tap away. */
export default function RushOverDialog({ cleared, isNewBest, onNewRun, onBack }) {
  return (
    <Dialog title="Run over!" onClose={onBack} closesOnBackdrop={false}>
      <p className={styles.final}>
        <span className={`game-title ${styles.finalCount}`}>{cleared}</span> / {RUSH_LENGTH} puzzles cleared
      </p>
      {isNewBest && cleared > 0 && <p className={styles.best}>New best this week!</p>}
      <LumiSays mood="happy" size={64} line={lineFor(cleared)} />
      <div className={styles.actions}>
        <Button size="lg" icon="bolt" onClick={onNewRun} data-autofocus>
          New run
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back to Light Rush
        </Button>
      </div>
    </Dialog>
  );
}
