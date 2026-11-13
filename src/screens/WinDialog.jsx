import { useEffect } from 'react';
import Dialog from '../components/Dialog.jsx';
import Button from '../components/Button.jsx';
import Stars from '../components/Stars.jsx';
import Icon from '../components/Icon.jsx';
import { sfx } from '../audio/sfx.js';
import { DIFFICULTY } from '../game/constants.js';
import styles from './WinDialog.module.css';

function headlineFor(stars, difficulty) {
  if (stars === 3 && difficulty === DIFFICULTY.EXTRA) return 'Legendary!';
  if (stars === 3) return 'Brilliant!';
  if (stars === 2) return 'Great job!';
  return 'Solved!';
}

export default function WinDialog({ result, par, difficulty, streak, hasNext, onNext, onReplay, onMap }) {
  const { stars, moves, sparksEarned, isNewBest } = result;

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 350 + i * 260));
    if (sparksEarned > 0) timers.push(setTimeout(() => sfx.sparkle(), 350 + stars * 260 + 150));
    return () => timers.forEach(clearTimeout);
  }, [stars, sparksEarned]);

  return (
    <Dialog title={headlineFor(stars, difficulty)} tone="celebrate" onClose={onMap}>
      <Stars count={stars} size={46} animate className={styles.stars} />
      <p className={styles.summary}>
        Solved in <strong>{moves}</strong> {moves === 1 ? 'move' : 'moves'} · par {par}
      </p>
      {stars < 3 && <p className={styles.tip}>Match par ({par} moves) without hints for all three stars.</p>}

      <div className={styles.rewards}>
        {sparksEarned > 0 && (
          <span className={styles.reward}>
            <Icon name="spark" size={18} /> +{sparksEarned} sparks
          </span>
        )}
        {isNewBest && moves > 0 && <span className={`${styles.reward} ${styles.best}`}>New best</span>}
        {streak > 0 && (
          <span className={`${styles.reward} ${styles.streak}`}>
            <Icon name="flame" size={18} /> {streak}-day streak
          </span>
        )}
      </div>

      <div className={styles.actions}>
        {hasNext ? (
          <Button size="lg" icon="play" onClick={onNext} data-autofocus>
            Next level
          </Button>
        ) : (
          <Button size="lg" onClick={onMap} data-autofocus>
            Back to map
          </Button>
        )}
        <div className={styles.secondary}>
          <Button variant="secondary" icon="restart" onClick={onReplay}>
            Replay
          </Button>
          {hasNext && (
            <Button variant="secondary" onClick={onMap}>
              Map
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
