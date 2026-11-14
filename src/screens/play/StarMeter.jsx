import Icon from '../../components/Icon.jsx';
import styles from './StarMeter.module.css';

/**
 * Moves left, a bar that drains with every move, and the stars you'd get if you solved it now:
 * ★★★ while you're within par, then a star drops off each time you pass a threshold. `isSimple`
 * (the first levels) leaves the stars out, so there's less to take in.
 */
export default function StarMeter({ moves, par, limit, starCap, isSimple = false }) {
  const twoStarLimit = par + Math.ceil((limit - par) / 2);
  const left = Math.max(0, limit - moves);
  const fill = (left / limit) * 100;
  const tone = left <= 1 ? styles.danger : left <= Math.ceil(limit * 0.34) ? styles.warn : styles.good;
  const stars = Math.min(starCap, moves <= par ? 3 : moves <= twoStarLimit ? 2 : 1);

  return (
    <div
      className={styles.meter}
      role="group"
      aria-label={`${left} moves left of ${limit}${isSimple ? '' : `. Solve it now for ${stars} ${stars === 1 ? 'star' : 'stars'}`}`}
    >
      <div className={styles.movesLeft}>
        <span className={`game-title ${styles.count}`} key={left}>
          {left}
        </span>
        <span className={styles.caption}>moves left</span>
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
