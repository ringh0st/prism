import { useI18n } from '../../i18n/I18nContext.jsx';
import Icon from '../../components/Icon.jsx';
import styles from './StarMeter.module.css';

/**
 * Moves left, a bar that drains with every move, and the best stars still possible: a star drops off
 * the moment it can't be reached any more (moves so far plus the fewest taps left), never later. `isSimple`
 * (the first levels) leaves the stars out, so there's less to take in.
 */
export default function StarMeter({ moves, par, limit, starCap, tapsLeft = 0, isSimple = false }) {
  const { t } = useI18n();
  const twoStarLimit = par + Math.ceil((limit - par) / 2);
  const left = Math.max(0, limit - moves);
  const fill = (left / limit) * 100;
  const tone = left <= 1 ? styles.danger : left <= Math.ceil(limit * 0.34) ? styles.warn : styles.good;
  // The best you can still get: your moves so far plus the fewest taps that can finish it.
  const finish = moves + (tapsLeft ?? 0);
  const stars = Math.min(starCap, finish <= par ? 3 : finish <= twoStarLimit ? 2 : 1);

  return (
    <div
      className={styles.meter}
      role="group"
      aria-label={`${t('meter.left', { count: left, limit })}${isSimple ? '' : ` ${t('meter.best', { count: stars })}`}`}
    >
      <div className={styles.movesLeft}>
        <span className={`game-title ${styles.count}`} key={left}>
          {left}
        </span>
        <span className={styles.caption}>{t('meter.caption')}</span>
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
