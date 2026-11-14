import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Stars from '../../components/Stars.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import { challengeOutcome } from '../../game/challenges.js';
import ChallengeShare from './ChallengeShare.jsx';
import styles from './ChallengeResultDialog.module.css';

const HEADLINES = { win: 'You win!', tie: 'It’s a tie!', lose: 'So close!' };

function lumiLineFor(outcome, name, theirMoves) {
  if (outcome === 'win') return `Ooh, ${name} won’t like this! Send it back and make them sweat. 😄`;
  if (outcome === 'tie') return `Exactly ${theirMoves}, just like ${name}. Can anyone squeeze out one less?`;
  return `${name} did it in ${theirMoves}. You can totally beat that!`;
}

/**
 * After solving a challenge level: your moves next to your friend's, who won, and a way to send it back.
 * @param challenge { levelId, moves, name } from the link; levelLabel like "4-6"
 */
export default function ChallengeResultDialog({ challenge, levelLabel, stars, moves, onRetry, onHome }) {
  const name = challenge.name ?? 'Your friend';
  const outcome = challengeOutcome(moves, challenge.moves);
  return (
    <Dialog title={HEADLINES[outcome]} tone="celebrate" onClose={onHome} closesOnBackdrop={false}>
      <Stars count={stars} size={40} animate className={styles.stars} />
      <ul className={styles.scores} aria-label="Moves">
        <li className={outcome !== 'lose' ? styles.winner : ''}>
          <span className={styles.who}>You</span>
          <span className={`game-title ${styles.moves}`}>{moves}</span>
          <span className={styles.unit}>moves</span>
        </li>
        <li className={outcome !== 'win' ? styles.winner : ''}>
          <span className={styles.who}>{name}</span>
          <span className={`game-title ${styles.moves}`}>{challenge.moves}</span>
          <span className={styles.unit}>moves</span>
        </li>
      </ul>
      <div className={styles.lumi}>
        <Lumi mood={outcome === 'lose' ? 'happy' : 'excited'} size={64} />
        <p>{lumiLineFor(outcome, name, challenge.moves)}</p>
      </div>
      <div className={styles.actions}>
        {outcome === 'lose' ? (
          <Button size="lg" icon="restart" onClick={onRetry} data-autofocus>
            Try again
          </Button>
        ) : (
          <>
            <ChallengeShare levelId={challenge.levelId} levelLabel={levelLabel} moves={moves} label="Challenge back" variant="primary" />
            <Button variant="secondary" icon="restart" onClick={onRetry}>
              Try for fewer
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={onHome}>
          Play Lumipals
        </Button>
      </div>
    </Dialog>
  );
}
