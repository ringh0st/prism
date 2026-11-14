import { useState } from 'react';
import Button from '../Button.jsx';
import Icon from '../Icon.jsx';
import LumiSays from './LumiSays.jsx';
import GiftReveal from '../gifts/GiftReveal.jsx';
import GiftCalendar from '../gifts/GiftCalendar.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GIFT_CALENDAR, calendarDay, calendarGift, isDailyGiftReady } from '../../game/gifts.js';
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
  const isReady = isDailyGiftReady(progress, todayKey());
  const day = calendarDay(progress.giftDays) + 1;
  const { isBig } = calendarGift(progress.giftDays, isSignedIn);
  // The day being opened, kept while it opens (the calendar moves on as soon as the gift is claimed).
  const [opening, setOpening] = useState(null);
  const open = () => setOpening({ day, isBig });

  const dialog = opening && (
    <GiftReveal
      title={t(opening.isBig ? 'gift.daily.bigTitle' : 'gift.daily.title', { n: opening.day })}
      doneTitle={t('ui.gift.title')}
      wrapping={{ kind: 'box', tone: opening.isBig ? 'peach' : 'honey', isBig: opening.isBig }}
      open={claimDailyGift}
      onClose={() => setOpening(null)}
    >
      <GiftCalendar giftDays={progress.giftDays} isOpenedToday={!isReady} isSignedIn={isSignedIn} />
      <div className={styles.lumi}>
        <LumiSays mood="dance" size={86} line={t('ui.gift.lumi')} />
      </div>
    </GiftReveal>
  );

  if (look === 'note') {
    // Days already opened this week (after day 7 is opened the calendar wraps to 0: show the full week).
    const opened = !isReady && calendarDay(progress.giftDays) === 0 ? GIFT_CALENDAR.length : calendarDay(progress.giftDays);
    return (
      <div className={`${styles.note} ${className}`}>
        <span className={`${styles.noteIcon} ${isReady ? styles.ready : ''}`} aria-hidden="true">
          <Icon name="gift" size={26} />
        </span>
        <div className={styles.noteText}>
          <strong>{t('ui.gift.name')}</strong>
          <span className="visually-hidden">{isReady ? t('gift.note.ready', { n: day }) : t('ui.gift.collected')}</span>
          <ol className={styles.pips} aria-hidden="true">
            {GIFT_CALENDAR.map((gift, i) => (
              <li
                key={i}
                className={`${styles.pip} ${i < opened ? styles.pipOpened : ''} ${isReady && i === opened ? styles.pipToday : ''} ${gift.isBig ? styles.pipBig : ''}`}
              >
                {i < opened ? <Icon name="check" size={12} /> : gift.isBig ? <Icon name="gift" size={12} /> : null}
              </li>
            ))}
          </ol>
        </div>
        {isReady ? (
          <Button size="sm" variant="gold" onClick={open}>
            {t('ui.gift.collect')}
          </Button>
        ) : (
          <span className={styles.doneMark} aria-hidden="true">
            <Icon name="check" size={20} />
          </span>
        )}
        {dialog}
      </div>
    );
  }

  // On the map, the box leaves once today's gift is opened (its dialog stays until closed).
  return (
    <>
      {isReady && (
        <button type="button" className={`${styles.button} ${styles.ready} ${className}`} onClick={open} aria-label={t('gift.open', { n: day })}>
          <Icon name="gift" size={24} />
          <span className={styles.dot} aria-hidden="true" />
        </button>
      )}
      {dialog}
    </>
  );
}
