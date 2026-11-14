import { useState } from 'react';
import Icon from '../Icon.jsx';
import Button from '../Button.jsx';
import GiftReveal from './GiftReveal.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { WIN_GIFTS, readyWinGift, winGiftsOpened, winsToday } from '../../game/gifts.js';
import { todayKey } from '../../game/daily.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './WinGiftLadder.module.css';

/**
 * On the win screen: today's win gifts (1st, 3rd and 6th level won). Opened ones are ticked, a ready one
 * wiggles and opens with the gift moment, and the next shows how many wins it needs.
 */
export default function WinGiftLadder() {
  const { progress, claimWinGift } = usePlayer();
  const { t } = useI18n();
  const today = todayKey();
  const wins = winsToday(progress, today);
  const opened = winGiftsOpened(progress, today);
  const ready = readyWinGift(progress, today);
  const [opening, setOpening] = useState(null);
  if (wins === 0) return null;

  return (
    <section className={styles.ladder} aria-label={t('winGift.label', { count: wins })}>
      <p className={styles.title}>{t('winGift.title', { count: wins })}</p>
      <ol className={styles.steps}>
        {WIN_GIFTS.map((tier, i) => {
          const state = i < opened ? 'done' : tier === ready ? 'ready' : 'later';
          return (
            <li key={tier.wins} className={`${styles.step} ${styles[state]}`}>
              <Icon name={state === 'done' ? 'check' : 'gift'} size={20} strokeWidth={state === 'done' ? 3 : 2} />
              <span className="game-title">{tier.wins}</span>
            </li>
          );
        })}
      </ol>
      {ready ? (
        <Button size="sm" variant="gold" icon="gift" onClick={() => setOpening(ready)}>
          {t('winGift.open')}
        </Button>
      ) : (
        WIN_GIFTS[opened] && <p className={styles.next}>{t('winGift.next', { count: WIN_GIFTS[opened].wins - wins })}</p>
      )}
      {opening && (
        <GiftReveal
          title={t('winGift.giftTitle', { count: opening.wins })}
          doneTitle={t('ui.gift.title')}
          wrapping={{ kind: 'box', tone: opening.wins >= 6 ? 'peach' : 'honey' }}
          open={claimWinGift}
          onClose={() => setOpening(null)}
        />
      )}
    </section>
  );
}
