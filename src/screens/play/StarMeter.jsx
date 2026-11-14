import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { sfx } from '../../audio/sfx.js';
import Icon from '../../components/Icon.jsx';
import TapIcon from './TapIcon.jsx';
import styles from './StarMeter.module.css';

/**
 * Moves left (a number over a tapping finger, no words), a bar that drains with every move, and the best stars still possible: a star drops off
 * the moment it can't be reached any more (moves so far plus the fewest taps left), never later. `isSimple`
 * (the first levels) leaves the stars out, so there's less to take in.
 */
export default function StarMeter({ moves, par, limit, starCap, tapsLeft = 0, isSimple = false, spent = 0 }) {
  const { t } = useI18n();
  const twoStarLimit = par + Math.ceil((limit - par) / 2);
  // `spent`: moves flying off as sparks in the win's light finale (the counter counts down with them).
  const left = Math.max(0, limit - moves - spent);
  const fill = (left / limit) * 100;
  const tone = left <= 1 ? styles.danger : left <= Math.ceil(limit * 0.34) ? styles.warn : styles.good;
  // The best you can still get: your moves so far plus the fewest taps that can finish it.
  const finish = moves + (tapsLeft ?? 0);
  const stars = Math.min(starCap, finish <= par ? 3 : finish <= twoStarLimit ? 2 : 1);
  // A star slipping out of reach is a moment too: a soft falling sound (not on a restart).
  const shown = useRef(stars);
  useEffect(() => {
    if (!isSimple && stars < shown.current && moves > 0) sfx.starLost();
    shown.current = stars;
  }, [stars, moves, isSimple]);

  return (
    <div
      className={styles.meter}
      role="group"
      aria-label={`${t('meter.left', { count: left, limit })}${isSimple ? '' : ` ${t('meter.best', { count: stars })}`}`}
    >
      <div className={`${styles.movesLeft} ${left === 1 && !spent ? styles.last : ''}`} data-moves-left>
        <span className={`game-title ${styles.count}`} key={left}>
          {left}
        </span>
        <TapIcon size={18} className={styles.caption} />
      </div>
      <div className={styles.track}>
        <div className={`${styles.fill} ${tone}`} style={{ width: `${fill}%` }} />
      </div>
      {!isSimple && (
        <span className={styles.stars} aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={`${styles.star} ${n > stars ? styles.lost : ''}`}>
              <Icon name="star" size={26} />
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
