import { useRef, useState } from 'react';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { EVENT_LEVELS, EVENT_PRIZE_SPARKS, isEventPrizeReady, solvedEventCount } from '../../game/events.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { eventThemeText } from '../../i18n/extrasText.js';
import EventStampArt from './EventStampArt.jsx';
import styles from './Event.module.css';
import { errorText } from '../../i18n/meText.js';

/**
 * The prize for finishing all 10, as pictures: the chest, a meter with the count, and what's inside (sparks
 * and the event's stamp). Opens with a shower of stars.
 */
export default function EventPrize({ weekend, theme, eventProgress }) {
  const { claimEventPrize } = usePlayer();
  const { t, lang } = useI18n();
  const themeName = eventThemeText(lang, theme).name;
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
      setMessage(errorText(t, error.message));
    }
  };

  const label = eventProgress.claimed
    ? t('event.prize.stampOwned', { theme: themeName })
    : t('event.prize.goal', { total: EVENT_LEVELS, sparks: EVENT_PRIZE_SPARKS, theme: themeName });
  return (
    <section ref={cardRef} className={`${styles.prize} ${isReady ? styles.prizeReady : ''}`} aria-label={label}>
      <span className={styles.chest} aria-hidden="true">
        <Icon name={eventProgress.claimed ? 'check' : 'chest'} size={34} />
      </span>
      <div className={styles.prizeBody}>
        {!eventProgress.claimed && (
          <div
            className={styles.meter}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={EVENT_LEVELS}
            aria-valuenow={solved}
            aria-label={t('event.prize.meter')}
          >
            <span className={styles.meterFill} style={{ width: `${(solved / EVENT_LEVELS) * 100}%` }} />
            <span className={styles.meterText} aria-hidden="true">
              {solved}/{EVENT_LEVELS}
            </span>
          </div>
        )}
        <div className={styles.loot} aria-hidden="true">
          <span className={`game-title ${styles.lootSparks}`}>
            +{EVENT_PRIZE_SPARKS}
            <Icon name="spark" size={18} />
          </span>
          <EventStampArt icon={theme.icon} size="sm" />
          {eventProgress.claimed && <span className={`game-title ${styles.collected}`}>{t('event.prize.collected')}</span>}
        </div>
        {isReady && (
          <Button icon="gift" onClick={open}>
            {t('event.prize.open')}
          </Button>
        )}
        <p className={styles.prizeMessage} role="alert">
          {message}
        </p>
      </div>
    </section>
  );
}
