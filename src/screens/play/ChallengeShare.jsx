import { useState } from 'react';
import Button from '../../components/Button.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { challengeMessage, challengePath } from '../../game/challenges.js';
import { PUBLIC_GAME_URL } from '../../lib/config.js';
import { shareText } from '../../lib/shareText.js';
import styles from './ChallengeShare.module.css';

const FEEDBACK = { shared: 'Challenge sent! 🎯', copied: 'Link copied! Paste it to a friend.', failed: 'Sharing isn’t available here.' };

/** "Challenge a friend": shares a link to this level with your moves (and your nickname, if you have one). */
export default function ChallengeShare({ levelId, levelLabel, moves, label = 'Challenge a friend', variant = 'secondary' }) {
  const { progress } = usePlayer();
  const [feedback, setFeedback] = useState('');
  const send = async () => {
    const url = `${PUBLIC_GAME_URL}play/${challengePath(levelId, moves, progress.nickname)}`;
    setFeedback(FEEDBACK[await shareText(challengeMessage(levelLabel, moves, url))] ?? '');
  };
  return (
    <div className={styles.challenge}>
      <Button variant={variant} icon="trophy" onClick={send}>
        {label}
      </Button>
      <p className={styles.feedback} role="status">
        {feedback}
      </p>
    </div>
  );
}
