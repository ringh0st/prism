import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GLOWBUG_ROW_DIAMONDS } from '../../game/glowbugs.js';
import { rewardShower } from '../../lib/effects.js';
import { sfx } from '../../audio/sfx.js';
import { errorText } from '../../i18n/meText.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './GlowbugGarden.module.css';

/**
 * The diamond at the end of a Glowbug row: faded with "3/5" while colors are missing, glowing and tappable once all
 * five are rescued, a check once collected. Guests see a lock (diamonds need an account) and a tap says so.
 */
export default function GlowbugRowPrize({ kind, found, total, onMessage }) {
  const { t } = useI18n();
  const { progress, isSignedIn, claimGlowbugRow } = usePlayer();
  const [isBusy, setIsBusy] = useState(false);
  const isClaimed = progress.glowbugRowsClaimed.includes(kind);
  const isReady = found >= total && !isClaimed;

  if (isClaimed) {
    return (
      <span className={`${styles.prize} ${styles.prizeDone}`} role="img" aria-label={t('garden.row.done')}>
        <Icon name="diamond" size={18} />
        <Icon name="check" size={13} strokeWidth={3.4} />
      </span>
    );
  }
  if (!isReady) {
    return (
      <span className={styles.prize} role="img" aria-label={t('garden.row.progress', { found, total, count: GLOWBUG_ROW_DIAMONDS })}>
        <Icon name="diamond" size={18} />
        <span className="game-title" dir="ltr">
          {found}/{total}
        </span>
      </span>
    );
  }
  const collect = async (event) => {
    if (!isSignedIn) {
      sfx.locked();
      onMessage(t('ui.signInDiamonds'));
      return;
    }
    setIsBusy(true);
    try {
      await claimGlowbugRow(kind);
      sfx.reward();
      rewardShower(event.currentTarget);
      onMessage(t('garden.row.collected', { count: GLOWBUG_ROW_DIAMONDS }));
    } catch (error) {
      onMessage(errorText(t, error.message));
    } finally {
      setIsBusy(false);
    }
  };
  return (
    <button
      type="button"
      className={`${styles.prize} ${styles.prizeReady}`}
      onClick={collect}
      disabled={isBusy}
      aria-label={t('garden.row.collect', { count: GLOWBUG_ROW_DIAMONDS })}
    >
      {!isSignedIn && <Icon name="lock" size={12} />}
      <Icon name="diamond" size={20} />
      <span className="game-title" dir="ltr">
        +{GLOWBUG_ROW_DIAMONDS}
      </span>
    </button>
  );
}
