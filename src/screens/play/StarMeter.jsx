import Icon from '../../components/Icon.jsx';
import styles from './StarMeter.module.css';

/**
 * Moves-left meter. The bar drains with every move; star markers show where the 3★ and 2★
 * thresholds are, and each star pops off when you pass it. `isSimple` (the first levels) leaves
 * the star markers out, so there's less to take in.
 */
export default function StarMeter({ moves, par, limit, starCap, isSimple = false }) {
  const twoStarLimit = par + Math.ceil((limit - par) / 2);
  const left = Math.max(0, limit - moves);
  const fill = (left / limit) * 100;
  const tone = left <= 1 ? styles.danger : left <= Math.ceil(limit * 0.34) ? styles.warn : styles.good;
  const markers = [
    { stars: 3, at: par, isKept: moves <= par && starCap >= 3 },
    { stars: 2, at: twoStarLimit, isKept: moves <= twoStarLimit && starCap >= 2 },
  ];

  return (
    <div className={styles.meter} role="group" aria-label={`${left} moves left of ${limit}`}>
      <div className={styles.movesLeft}>
        <span className={`game-title ${styles.count}`} key={left}>
          {left}
        </span>
        <span className={styles.caption}>moves left</span>
      </div>
      <div className={styles.track}>
        <div className={`${styles.fill} ${tone}`} style={{ width: `${fill}%` }} />
        {!isSimple &&
          markers.map((marker) => (
            <span
              key={marker.stars}
              className={`${styles.marker} ${marker.isKept ? '' : styles.lost}`}
              style={{ left: `${((limit - marker.at) / limit) * 100}%` }}
              aria-hidden="true"
            >
              {Array.from({ length: marker.stars }, (_, i) => (
                <Icon key={i} name="star" size={14} />
              ))}
            </span>
          ))}
      </div>
    </div>
  );
}
