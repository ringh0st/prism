import { useRef, useState } from 'react';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { EVENT_LEVELS, EVENT_PRIZE_SPARKS, isEventPrizeReady, solvedEventCount } from '../../game/events.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import styles from './Event.module.css';

/** The prize for finishing all 10: sparks plus the event's stamp. Opens with a shower of stars. */
export default function EventPrize({ weekend, theme, eventProgress }) {
  const { claimEventPrize } = usePlayer();
  const [message, setMessage] = useState('');
  const cardRef = useRef(null);
  const solved = solvedEventCount(eventProgress);
  const isReady = isEventPrizeReady(eventProgress);

  const open = async () => {
    try {
      await claimEventPrize(weekend);
      setMessage('');
      sfx.chest();
      rewardShower(cardRef.current);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section ref={cardRef} className={`${styles.prize} ${isReady ? styles.prizeReady : ''}`} aria-labelledby="prize-title">
      <span className={styles.chest} aria-hidden="true">
        <Icon name={eventProgress.claimed ? 'check' : 'chest'} size={34} />
      </span>
      <div>
        <h2 id="prize-title" className="game-title">
          {eventProgress.claimed ? 'Prize collected!' : 'Weekend prize'}
        </h2>
        <p>
          {eventProgress.claimed
            ? `The ${theme.name} stamp is in your collection.`
            : `Finish all ${EVENT_LEVELS} puzzles: +${EVENT_PRIZE_SPARKS} sparks and the ${theme.name} stamp.`}
        </p>
        {!eventProgress.claimed && (
          <div
            className={styles.meter}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={EVENT_LEVELS}
            aria-valuenow={solved}
            aria-label="Puzzles solved"
          >
            <span style={{ width: `${(solved / EVENT_LEVELS) * 100}%` }} />
          </div>
        )}
        {isReady && (
          <Button icon="gift" onClick={open}>
            Open the prize
          </Button>
        )}
        <p className={styles.prizeMessage} role="alert">
          {message}
        </p>
      </div>
    </section>
  );
}
