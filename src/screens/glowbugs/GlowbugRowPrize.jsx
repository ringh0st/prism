import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import GiftBoxArt from '../../components/gifts/GiftBoxArt.jsx';
import GiftReveal from '../../components/gifts/GiftReveal.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { GLOWBUG_ROW_DIAMONDS } from '../../game/glowbugs.js';
import { sfx } from '../../audio/sfx.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './GlowbugRowPrize.module.css';

/**
 * The gift at the end of a Glowbug row, shown as a real present: a wrapped box with a diamond tag (what's inside),
 * and five dots under it that fill as the row's colors are rescued (the closer, the fuller). A full row's box
 * wiggles in a ring of light; tapping it opens it the same way as every gift. Once opened it stays open with a
 * tick. Guests see a small lock beside the tag (diamonds need an account) and a tap says so.
 */
export default function GlowbugRowPrize({ kind, found, total, onMessage }) {
  const { t } = useI18n();
  const { progress, isSignedIn, claimGlowbugRow } = usePlayer();
  const [isOpening, setIsOpening] = useState(false);
  const isClaimed = progress.glowbugRowsClaimed.includes(kind);
  const isReady = found >= total && !isClaimed;

  const dots = (
    <span className={styles.dots} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < found ? styles.dotOn : styles.dot} />
      ))}
    </span>
  );

  if (isClaimed) {
    return (
      <span className={`${styles.prize} ${styles.done}`} role="img" aria-label={t('garden.row.done')}>
        <span className={styles.box}>
          <GiftBoxArt tone="mint" phase="open" size={44} />
          <span className={`${styles.tag} ${styles.tick}`}>
            <Icon name="check" size={12} strokeWidth={3.4} />
          </span>
        </span>
        {dots}
      </span>
    );
  }

  const tag = (
    <>
      <span className={styles.tag}>
        <Icon name="diamond" size={12} />
      </span>
      {isReady && !isSignedIn && (
        <span className={styles.lock}>
          <Icon name="lock" size={10} />
        </span>
      )}
    </>
  );

  if (!isReady) {
    return (
      <span className={styles.prize} role="img" aria-label={t('garden.row.progress', { found, total, count: GLOWBUG_ROW_DIAMONDS })}>
        <span className={styles.box}>
          <GiftBoxArt tone="mint" phase="still" size={44} />
          {tag}
        </span>
        {dots}
      </span>
    );
  }

  const tapReady = () => {
    if (!isSignedIn) {
      sfx.locked();
      onMessage(t('ui.signInDiamonds'));
      return;
    }
    setIsOpening(true);
  };
  const open = async () => {
    await claimGlowbugRow(kind);
    return { sparks: 0, diamonds: GLOWBUG_ROW_DIAMONDS };
  };
  return (
    <>
      <button
        type="button"
        className={`${styles.prize} ${styles.ready}`}
        onClick={tapReady}
        aria-label={t('garden.row.collect', { count: GLOWBUG_ROW_DIAMONDS })}
      >
        <span className={styles.box}>
          <span className={styles.halo} aria-hidden="true" />
          <GiftBoxArt tone="mint" phase="shaking" size={44} />
          {tag}
        </span>
        {dots}
      </button>
      {isOpening && (
        <GiftReveal
          title={t('garden.row.giftTitle')}
          doneTitle={t('garden.row.giftDone')}
          wrapping={{ kind: 'box', tone: 'mint' }}
          open={open}
          onClose={() => setIsOpening(false)}
        />
      )}
    </>
  );
}
