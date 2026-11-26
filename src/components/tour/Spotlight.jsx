import { useEffect, useId, useLayoutEffect, useState } from 'react';
import Button from '../Button.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './Spotlight.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

const GAP = 10; // space around the highlighted element
const BUBBLE_ROOM = 230; // height the bubble needs below the element, or it goes above
const POINTER_ROOM = 34; // space between the element and the bubble for the bouncing pointer

function measure(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { top: rect.top - GAP, left: rect.left - GAP, width: rect.width + GAP * 2, height: rect.height + GAP * 2 };
}

/**
 * Dims the screen except one element (found by `target`, a CSS selector), points at it with a bouncing arrow
 * and names it in a few words (`text` is an optional short second line). Like a game's tutorial highlight.
 * "Got it!" (or Escape, or tapping the highlight) moves on. `art` is a small picture of the thing; `step`/`total` show dots.
 */
export default function Spotlight({ target, title, text = '', art = null, step = 0, total = 1, onNext }) {
  const titleId = useId();
  const [hole, setHole] = useState(null);
  const { t } = useI18n();

  useLayoutEffect(() => {
    const update = () => setHole(measure(target));
    document.querySelector(target)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    update();
    // Boards and bars can still be settling (fonts, animations), so measure again shortly after.
    const settle = setTimeout(update, 400);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      clearTimeout(settle);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [target]);

  useEffect(() => {
    sfx.newPal();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [target, onNext]);

  // Below the highlight if it fits, else above; a highlight as big as the screen (the eclipse chip's whole board)
  // leaves room on neither side, so the bubble sits over the bottom of the screen without a pointer.
  const roomBelow = hole ? window.innerHeight - (hole.top + hole.height) : 0;
  const isBubbleAbove = hole && roomBelow < BUBBLE_ROOM && hole.top >= BUBBLE_ROOM;
  const isBubbleInside = hole && roomBelow < BUBBLE_ROOM && !isBubbleAbove;
  const bubblePosition = !hole
    ? { top: '50%', transform: 'translateY(-50%)' }
    : isBubbleInside
      ? { bottom: 16 }
      : isBubbleAbove
        ? { bottom: window.innerHeight - hole.top + POINTER_ROOM }
        : { top: hole.top + hole.height + POINTER_ROOM };
  const pointerPosition = hole && !isBubbleInside && {
    left: hole.left + hole.width / 2,
    ...(isBubbleAbove ? { bottom: window.innerHeight - hole.top + 2 } : { top: hole.top + hole.height + 2 }),
  };

  return (
    <div className={styles.layer} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {hole ? (
        <button type="button" className={styles.hole} style={hole} onClick={onNext} aria-label={t('common.gotIt')} tabIndex={-1} />
      ) : (
        <div className={styles.dim} />
      )}
      {pointerPosition && (
        <span className={`${styles.pointer} ${isBubbleAbove ? styles.pointDown : ''}`} style={pointerPosition} aria-hidden="true">
          <svg viewBox="0 0 24 16" width="28" height="19">
            <path d="M12 2 22 14H2Z" fill="var(--color-honey)" stroke="var(--reward-ledge)" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <div className={`${styles.bubble} ${isBubbleAbove ? styles.above : styles.below}`} style={bubblePosition} key={target}>
        <div className={styles.content}>
          {art && (
            <span className={styles.art} aria-hidden="true">
              {art}
            </span>
          )}
          <div>
            <h2 id={titleId} className={`game-title ${styles.title}`}>
              {title}
            </h2>
            {text && <p className={styles.text}>{text}</p>}
          </div>
        </div>
        <div className={styles.footer}>
          {total > 1 && (
            <span className={styles.dots} aria-label={t('common.stepOf', { n: step + 1, total })}>
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={i === step ? styles.dotOn : styles.dot} />
              ))}
            </span>
          )}
          <Button size="lg" onClick={onNext} autoFocus data-autofocus>
            {t('common.gotIt')}
          </Button>
        </div>
      </div>
    </div>
  );
}
