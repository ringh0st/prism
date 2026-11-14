import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { challengeMessage, challengePath } from '../../game/challenges.js';
import { PUBLIC_GAME_URL } from '../../lib/config.js';
import { shareText } from '../../lib/shareText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './ChallengeShare.module.css';

const FEEDBACK = { shared: 'challenge.sent', copied: 'challenge.copied', failed: 'challenge.failed' };

/** "Challenge a friend": shares a link to this level with your moves (and your nickname, if you have one). */
export default function ChallengeShare({ levelId, levelLabel, moves, label, variant = 'secondary' }) {
  const { progress } = usePlayer();
  const { t } = useI18n();
  const [feedback, setFeedback] = useState('');
  const send = async () => {
    const url = `${PUBLIC_GAME_URL}play/${challengePath(levelId, moves, progress.nickname)}`;
    const result = await shareText(challengeMessage(levelLabel, moves, url, t));
    setFeedback(FEEDBACK[result] ? t(FEEDBACK[result]) : '');
  };
  return (
    <div className={styles.challenge}>
      <Button variant={variant} icon="trophy" onClick={send}>
        {label ?? t('challenge.send')}
      </Button>
      <p className={styles.feedback} role="status">
        {feedback}
      </p>
    </div>
  );
}
