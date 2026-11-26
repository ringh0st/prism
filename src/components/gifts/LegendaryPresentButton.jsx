import { useState } from 'react';
import GiftReveal from './GiftReveal.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { LEGENDARY_EVERY_LEVELS, legendaryPresentsWaiting } from '../../game/gifts.js';
import { palById } from '../../game/pals.js';
import { todayKey } from '../../game/daily.js';
import { useFeature } from '../../hooks/useFeature.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './LegendaryPresentButton.module.css';

/**
 * On the map's top bar, only while one waits: a golden present that is always Legendary (every Sunday, and
 * every 100 solved levels, earlier ones too). It glows; a tap opens it with the usual gift moment, glowing all
 * the way up to ✦.
 */
export default function LegendaryPresentButton() {
  const { progress, openLegendaryPresent } = usePlayer();
  const { t } = useI18n();
  const [opening, setOpening] = useState(0);
  const [hasPalGift, setHasPalGift] = useState(false);
  const isOpen = useFeature('legendary');
  if (!palById(progress.pal.id) || !isOpen) return null;
  const { count, palGift } = legendaryPresentsWaiting(progress, todayKey());
  // The one-time Pal gift opens first and greets the player by their own name.
  const greeting = progress.nickname ? t('legendary.palGift', { name: progress.nickname }) : t('legendary.palGiftAnon');
  if (!count && !opening) return null;
  return (
    <>
      {count > 0 && (
        <button type="button" className={styles.button} onClick={() => {
            setHasPalGift(palGift);
            setOpening(count);
          }} aria-label={t('legendary.buttonLabel')}>
          <span className={styles.symbol} aria-hidden="true">
            ✦
          </span>
          {count > 1 && (
            <span className={`game-title ${styles.dot}`} aria-hidden="true">
              {count}
            </span>
          )}
          <span className={styles.caption} aria-hidden="true">
            {t('legendary.caption')}
          </span>
        </button>
      )}
      {opening > 0 && (
        <GiftReveal
          title={hasPalGift ? greeting : t('legendary.title', { count: opening })}
          count={opening}
          charges
          doneTitle={t('present.doneTitle')}
          wrapping={{ kind: 'box', tone: 'gold', isBig: true }}
          open={openLegendaryPresent}
          partner={palById(progress.pal.id)}
          onClose={() => setOpening(0)}
        >
          {hasPalGift && <p className={`game-title ${styles.greeting}`}>{greeting}</p>}
          <p className={styles.why}>{t('legendary.why', { n: LEGENDARY_EVERY_LEVELS })}</p>
        </GiftReveal>
      )}
    </>
  );
}
