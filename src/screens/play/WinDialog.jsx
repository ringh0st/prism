import { useEffect, useState } from 'react';
import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Stars from '../../components/Stars.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { sfx } from '../../audio/sfx.js';
import { DIFFICULTY } from '../../game/constants.js';
import { shareText } from '../../lib/shareText.js';
import PalArt from '../../components/pals/PalArt.jsx';
import { palById, stageOf } from '../../game/pals.js';
import styles from './WinDialog.module.css';

function headlineFor({ stars, isSkipped, completesWorld }, difficulty) {
  if (isSkipped) return 'Skipped';
  if (completesWorld) return 'World complete!';
  if (stars === 3 && difficulty === DIFFICULTY.EXTRA) return 'Legendary!';
  if (stars === 3) return 'Brilliant!';
  if (stars === 2) return 'Great job!';
  return 'Solved!';
}

const SHARE_FEEDBACK = { shared: 'Shared!', copied: 'Copied! Paste it anywhere.', failed: 'Sharing isn’t available here.' };

/** Share button for the daily result; says how it went. */
function ShareResult({ text }) {
  const [feedback, setFeedback] = useState('');
  return (
    <div className={styles.share}>
      <Button variant="secondary" icon="share" onClick={async () => setFeedback(SHARE_FEEDBACK[await shareText(text)] ?? '')}>
        Share result
      </Button>
      <p className={styles.shareFeedback} role="status">
        {feedback}
      </p>
    </div>
  );
}

export default function WinDialog({ result, par, difficulty, hotStreak = 0, hasNext, shareMessage = null, onNext, onReplay, onMap }) {
  const { isSignedIn, progress } = usePlayer();
  const partner = palById(progress.pal.id);
  const { stars, moves, sparksEarned = 0, diamondsEarned = 0, isNewBest, streak = 0, shieldsUsed = 0, shieldEarned = false, isSkipped, completesWorld } =
    result;

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 350 + i * 260));
    if (sparksEarned > 0 || diamondsEarned > 0) timers.push(setTimeout(() => sfx.sparkle(), 350 + stars * 260 + 150));
    return () => timers.forEach(clearTimeout);
  }, [stars, sparksEarned, diamondsEarned]);

  return (
    <Dialog title={headlineFor(result, difficulty)} tone="celebrate" onClose={onMap}>
      <Stars count={stars} size={46} animate className={styles.stars} />
      {isSkipped ? (
        <p className={styles.summary}>Come back any time to earn all three stars.</p>
      ) : (
        <p className={styles.summary}>
          Solved in <strong>{moves}</strong> {moves === 1 ? 'move' : 'moves'} · par {par}
        </p>
      )}
      {!isSkipped && stars < 3 && <p className={styles.tip}>Match par ({par} moves) without helpers for all three stars.</p>}

      <div className={styles.rewards}>
        {sparksEarned > 0 && (
          <span className={styles.reward}>
            <Icon name="spark" size={18} /> +{sparksEarned} sparks
          </span>
        )}
        {diamondsEarned > 0 && (
          <span className={`${styles.reward} ${styles.diamond}`}>
            <Icon name="diamond" size={18} /> +{diamondsEarned} {diamondsEarned === 1 ? 'diamond' : 'diamonds'}
          </span>
        )}
        {isNewBest && <span className={`${styles.reward} ${styles.best}`}>New best</span>}
        {hotStreak >= 2 && (
          <span className={`${styles.reward} ${styles.streak}`}>
            <Icon name="flame" size={18} /> {hotStreak} perfect in a row!
          </span>
        )}
        {streak > 0 && (
          <span className={`${styles.reward} ${styles.streak}`}>
            <Icon name="flame" size={18} /> {streak}-day streak
          </span>
        )}
        {shieldsUsed > 0 && (
          <span className={`${styles.reward} ${styles.shield}`}>
            <Icon name="shield" size={18} /> {shieldsUsed === 1 ? 'A shield saved your streak' : `${shieldsUsed} shields saved your streak`}
          </span>
        )}
        {shieldEarned && (
          <span className={`${styles.reward} ${styles.shield}`}>
            <Icon name="shield" size={18} /> +1 streak shield
          </span>
        )}
      </div>
      {result.glowUpEarned && partner && (
        <div className={styles.evolved}>
          <PalArt palId={partner.id} stage={stageOf(progress.pal.owned[partner.id])} wearing={progress.pal.wearing} size={72} />
          <p>
            <strong>World finished: you earned a Glow-up!</strong> Choose which Pal grows in Pals.
          </p>
        </div>
      )}
      {shareMessage && <ShareResult text={shareMessage} />}
      {completesWorld && !isSignedIn && (
        <p className={styles.nudge}>
          <Icon name="diamond" size={16} /> Finishing a world earns a diamond. <a href="#/settings">Sign in</a> to collect it.
        </p>
      )}

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
