import { useEffect } from 'react';
import Button from '../../components/Button.jsx';
import Icon from '../../components/Icon.jsx';
import Stars from '../../components/Stars.jsx';
import { sfx } from '../../audio/sfx.js';
import { celebrate } from '../../lib/effects.js';
import { QUICK_WIN_MS } from '../../game/quickWin.js';
import { useCountUp } from '../../hooks/useCountUp.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './QuickWin.module.css';

/**
 * A plain win, merge-game fast: the stars and sparks pop up over the board, and the next level starts by itself once
 * the bar has filled (or straight away with Next). "More" opens the full win screen (play again, share, the map).
 */
export default function QuickWin({ headline, stars, sparksEarned = 0, onNext, onMore }) {
  const { t } = useI18n();
  const shownSparks = useCountUp(sparksEarned, {
    delay: 350 + stars * 200,
    onTick: sfx.countTick,
  });

  useEffect(() => {
    const timers = Array.from({ length: stars }, (_, i) => setTimeout(() => sfx.star(i), 200 + i * 200));
    timers.push(setTimeout(() => celebrate({ stars }), 150));
    timers.push(setTimeout(onNext, QUICK_WIN_MS));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onMore();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onMore]);

  return (
    <section className={styles.card} role="status" aria-label={headline}>
      <p className={`game-title ${styles.headline}`}>{headline}</p>
      <div className={styles.result}>
        <Stars count={stars} size={34} animate />
        {sparksEarned > 0 && (
          <span className={styles.sparks}>
            <Icon name="spark" size={18} />
            <span dir="ltr" aria-hidden="true">
              +{shownSparks}
            </span>
            <span className="visually-hidden">{t('win.sparks', { count: sparksEarned })}</span>
          </span>
        )}
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" icon="dots" onClick={onMore} aria-label={t('win.more')} className={styles.more} />
        <Button icon="play" onClick={onNext} className={styles.next} data-autofocus autoFocus>
          {t('win.next')}
          {/* The bar fills while the next level gets ready; it starts by itself when full. */}
          <span className={styles.timer} style={{ '--quick-win-ms': `${QUICK_WIN_MS}ms` }} aria-hidden="true" />
        </Button>
      </div>
    </section>
  );
}
