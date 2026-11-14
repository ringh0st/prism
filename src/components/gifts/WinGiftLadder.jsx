import { useState } from 'react';
import Icon from '../Icon.jsx';
import GiftReveal from './GiftReveal.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { WIN_GIFTS, readyWinGiftCount, winGiftsOpened, winsToday } from '../../game/gifts.js';
import { todayKey } from '../../game/daily.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './WinGiftLadder.module.css';

/**
 * On the win screen: today's wins (a trophy and a number) and the win gifts for the 1st, 3rd and 6th win.
 * Opened ones are ticked; ready ones wiggle and are tapped to open (all that are ready, together); the rest
 * show how many wins they need.
 */
export default function WinGiftLadder() {
  const { progress, claimWinGift } = usePlayer();
  const { t } = useI18n();
  const today = todayKey();
  const wins = winsToday(progress, today);
  const opened = winGiftsOpened(progress, today);
  const ready = readyWinGiftCount(progress, today);
  const [opening, setOpening] = useState(0);
  if (wins === 0) return null;

  return (
    <section className={styles.ladder} aria-label={t('winGift.label', { count: wins })}>
      <span className={`game-title ${styles.wins}`} aria-hidden="true">
        <Icon name="trophy" size={18} /> {wins}
      </span>
      <ol className={styles.steps}>
        {WIN_GIFTS.map((tier, i) => {
          const isDone = i < opened;
          const isReady = !isDone && i < opened + ready;
          const content = (
            <>
              <Icon name={isDone ? 'check' : 'gift'} size={isReady ? 24 : 20} strokeWidth={isDone ? 3 : 2} />
              <span className="game-title">{tier.wins}</span>
            </>
          );
          return (
            <li key={tier.wins}>
              {isReady ? (
                <button type="button" className={`${styles.step} ${styles.ready}`} onClick={() => setOpening(ready)} aria-label={t('winGift.open')}>
                  {content}
                </button>
              ) : (
                <span className={`${styles.step} ${isDone ? styles.done : ''}`}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
      {opening > 0 && (
        <GiftReveal
          title={t('winGift.giftTitle', { count: wins })}
          doneTitle={t('ui.gift.title')}
          wrapping={{ kind: 'box', tone: 'honey' }}
          open={claimWinGift}
          count={opening}
          onClose={() => setOpening(0)}
        />
      )}
    </section>
  );
}
