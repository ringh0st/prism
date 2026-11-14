import { useState } from 'react';
import Dialog from '../Dialog.jsx';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import LumiSays from './LumiSays.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { isDailyGiftReady } from '../../game/progress.js';
import { DAILY_GIFT_SPARKS } from '../../game/catalog.js';
import { todayKey } from '../../game/daily.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { errorText } from '../../i18n/meText.js';
import styles from './DailyGift.module.css';

/** The opened gift: what's inside, or why it couldn't be opened. */
function GiftDialog({ outcome, onClose }) {
  const { t } = useI18n();
  const isError = Boolean(outcome.error);
  return (
    <Dialog title={t(isError ? 'ui.hmm' : 'ui.gift.title')} tone="celebrate" onClose={onClose}>
      <div className={styles.box} aria-hidden="true">
        <Icon name="gift" size={88} strokeWidth={1.8} />
      </div>
      {isError ? (
        <p className={styles.text}>{errorText(t, outcome.error)}</p>
      ) : (
        <>
          <p className={`game-title ${styles.reward}`}>
            <Icon name="spark" size={24} /> {t('ui.plusSparks', { count: outcome.sparks })}
          </p>
          <div className={styles.lumi}>
            <LumiSays mood="dance" size={86} line={t('ui.gift.lumi')} />
          </div>
        </>
      )}
      <Button size="lg" onClick={onClose} data-autofocus>
        {t(isError ? 'ui.ok' : 'ui.gift.yay')}
      </Button>
    </Dialog>
  );
}

/**
 * A free gift of sparks once a day. `look="button"` is the wiggling box in the map HUD;
 * `look="note"` is the card at the top of the shop.
 */
export default function DailyGift({ look = 'button', className = '' }) {
  const { progress, claimDailyGift } = usePlayer();
  const { t } = useI18n();
  const [outcome, setOutcome] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const isReady = isDailyGiftReady(progress, todayKey());

  const open = async () => {
    if (!isReady || isOpening) return;
    setIsOpening(true);
    try {
      const sparks = await claimDailyGift();
      sfx.reward();
      setOutcome({ sparks });
    } catch (error) {
      setOutcome({ error: error.message });
    } finally {
      setIsOpening(false);
    }
  };

  const dialog = outcome && <GiftDialog outcome={outcome} onClose={() => setOutcome(null)} />;

  if (look === 'note') {
    return (
      <div className={`${styles.note} ${className}`}>
        <span className={`${styles.noteIcon} ${isReady ? styles.ready : ''}`} aria-hidden="true">
          <Icon name="gift" size={26} />
        </span>
        <p className={styles.noteText}>
          <strong>{t('ui.gift.name')}</strong>
          <span>{isReady ? t('ui.gift.ready', { n: DAILY_GIFT_SPARKS }) : t('ui.gift.collected')}</span>
        </p>
        {isReady && (
          <Button size="sm" variant="gold" onClick={open} disabled={isOpening}>
            {t('ui.gift.collect')}
          </Button>
        )}
        {dialog}
      </div>
    );
  }

  // On the map, the box leaves once today's gift is opened (its dialog stays until closed).
  return (
    <>
      {isReady && (
        <button
          type="button"
          className={`${styles.button} ${styles.ready} ${className}`}
          onClick={open}
          disabled={isOpening}
          aria-label={t('ui.gift.open', { n: DAILY_GIFT_SPARKS })}
        >
          <Icon name="gift" size={24} />
          <span className={styles.dot} aria-hidden="true" />
        </button>
      )}
      {dialog}
    </>
  );
}
