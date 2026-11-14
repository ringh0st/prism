import { useState } from 'react';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import LumiSays from './LumiSays.jsx';
import GiftReveal from '../gifts/GiftReveal.jsx';
import GiftCalendar from '../gifts/GiftCalendar.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { calendarDay, calendarGift, isDailyGiftReady } from '../../game/gifts.js';
import { todayKey } from '../../game/daily.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './DailyGift.module.css';

/**
 * Today's free gift from the 7-day gift calendar (it grows through the week; a missed day just waits).
 * `look="button"` is the wiggling box in the map HUD; `look="note"` is the card at the top of the shop.
 */
export default function DailyGift({ look = 'button', className = '' }) {
  const { progress, isSignedIn, claimDailyGift } = usePlayer();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const isReady = isDailyGiftReady(progress, todayKey());
  const day = calendarDay(progress.giftDays) + 1;
  const { isBig } = calendarGift(progress.giftDays, isSignedIn);

  const dialog = isOpen && (
    <GiftReveal
      title={t(isBig ? 'gift.daily.bigTitle' : 'gift.daily.title', { n: day })}
      doneTitle={t('ui.gift.title')}
      wrapping={{ kind: 'box', tone: isBig ? 'peach' : 'honey', isBig }}
      open={claimDailyGift}
      onClose={() => setIsOpen(false)}
    >
      <GiftCalendar giftDays={progress.giftDays} isOpenedToday={!isReady} isSignedIn={isSignedIn} />
      <div className={styles.lumi}>
        <LumiSays mood="dance" size={86} line={t('ui.gift.lumi')} />
      </div>
    </GiftReveal>
  );

  if (look === 'note') {
    return (
      <div className={`${styles.note} ${className}`}>
        <span className={`${styles.noteIcon} ${isReady ? styles.ready : ''}`} aria-hidden="true">
          <Icon name="gift" size={26} />
        </span>
        <p className={styles.noteText}>
          <strong>{t('ui.gift.name')}</strong>
          <span>{isReady ? t('gift.note.ready', { n: day }) : t('ui.gift.collected')}</span>
        </p>
        {isReady && (
          <Button size="sm" variant="gold" onClick={() => setIsOpen(true)}>
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
          onClick={() => setIsOpen(true)}
          aria-label={t('gift.open', { n: day })}
        >
          <Icon name="gift" size={24} />
          <span className={styles.dot} aria-hidden="true" />
        </button>
      )}
      {dialog}
    </>
  );
}
