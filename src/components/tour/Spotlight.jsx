import { useEffect, useId, useLayoutEffect, useState } from 'react';
import Button from '../Button.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './Spotlight.module.css';

const GAP = 10; // space around the highlighted element
const BUBBLE_ROOM = 230; // height the bubble needs below the element, or it goes above

function measure(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { top: rect.top - GAP, left: rect.left - GAP, width: rect.width + GAP * 2, height: rect.height + GAP * 2 };
}

/**
 * Dims the screen except one element (found by `target`, a CSS selector) and explains it in a few
 * words: "this is new, here's what it does". Like a game's tutorial highlight. "Got it!" (or Escape,
 * or tapping the highlight) moves on. `art` is a small picture of the thing; `step`/`total` show dots.
 */
export default function Spotlight({ target, title, text, art = null, step = 0, total = 1, onNext }) {
  const titleId = useId();
  const [hole, setHole] = useState(null);

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

  const isBubbleAbove = hole && window.innerHeight - (hole.top + hole.height) < BUBBLE_ROOM;
  const bubblePosition = !hole
    ? { top: '50%', transform: 'translateY(-50%)' }
    : isBubbleAbove
      ? { bottom: window.innerHeight - hole.top + 14 }
      : { top: hole.top + hole.height + 14 };

  return (
    <div className={styles.layer} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {hole ? (
        <button type="button" className={styles.hole} style={hole} onClick={onNext} aria-label="Got it" tabIndex={-1} />
      ) : (
        <div className={styles.dim} />
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
            <p className={styles.text}>{text}</p>
          </div>
        </div>
        <div className={styles.footer}>
          {total > 1 && (
            <span className={styles.dots} aria-label={`${step + 1} of ${total}`}>
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={i === step ? styles.dotOn : styles.dot} />
              ))}
            </span>
          )}
          <Button size="lg" onClick={onNext} autoFocus data-autofocus>
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
}
