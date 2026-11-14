import Dialog from '../../components/Dialog.jsx';
import Button from '../../components/Button.jsx';
import Stars from '../../components/Stars.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import { challengeOutcome } from '../../game/challenges.js';
import ChallengeShare from './ChallengeShare.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './ChallengeResultDialog.module.css';

const HEADLINES = { win: 'challenge.win', tie: 'challenge.tie', lose: 'challenge.lose' };
const LUMI_LINES = { win: 'challenge.lumiWin', tie: 'challenge.lumiTie', lose: 'challenge.lumiLose' };

/**
 * After solving a challenge level: your moves next to your friend's, who won, and a way to send it back.
 * @param challenge { levelId, moves, name } from the link; levelLabel like "4-6"
 */
export default function ChallengeResultDialog({ challenge, levelLabel, stars, moves, onRetry, onHome }) {
  const { t } = useI18n();
  const name = challenge.name ?? t('challenge.friend');
  const outcome = challengeOutcome(moves, challenge.moves);
  return (
    <Dialog title={t(HEADLINES[outcome])} tone="celebrate" onClose={onHome} closesOnBackdrop={false}>
      <Stars count={stars} size={40} animate className={styles.stars} />
      <ul className={styles.scores} aria-label={t('challenge.movesLabel')}>
        <li className={outcome !== 'lose' ? styles.winner : ''}>
          <span className={styles.who}>{t('challenge.you')}</span>
          <span className={`game-title ${styles.moves}`}>{moves}</span>
          <span className={styles.unit}>{t('challenge.moves')}</span>
        </li>
        <li className={outcome !== 'win' ? styles.winner : ''}>
          <span className={styles.who}>{name}</span>
          <span className={`game-title ${styles.moves}`}>{challenge.moves}</span>
          <span className={styles.unit}>{t('challenge.moves')}</span>
        </li>
      </ul>
      <div className={styles.lumi}>
        <Lumi mood={outcome === 'lose' ? 'happy' : 'excited'} size={64} />
        <p>{t(LUMI_LINES[outcome], { name, moves: challenge.moves })}</p>
      </div>
      <div className={styles.actions}>
        {outcome === 'lose' ? (
          <Button size="lg" icon="restart" onClick={onRetry} data-autofocus>
            {t('challenge.retry')}
          </Button>
        ) : (
          <>
            <ChallengeShare levelId={challenge.levelId} levelLabel={levelLabel} moves={moves} label={t('challenge.back')} variant="primary" />
            <Button variant="secondary" icon="restart" onClick={onRetry}>
              {t('challenge.fewer')}
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={onHome}>
          {t('challenge.home')}
        </Button>
      </div>
    </Dialog>
  );
}
