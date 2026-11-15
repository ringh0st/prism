import Skeleton from '../../components/Skeleton.jsx';
import styles from './BoardSkeleton.module.css';

const PLACES = ['second', 'first', 'third'];
const ROWS = 4;

/** The Top board's shape while it loads: three podium places and a few rows, the same sizes as the real ones. */
export default function BoardSkeleton({ label }) {
  return (
    <div className={styles.board} role="status" aria-busy="true" aria-label={label}>
      <div className={styles.podium}>
        {PLACES.map((place) => (
          <div key={place} className={`${styles.place} ${styles[place]}`}>
            <Skeleton shape="circle" className={styles.avatar} />
            <Skeleton width="70%" height={12} />
            <Skeleton width="45%" height={16} />
            <Skeleton shape="line" className={styles.step} />
          </div>
        ))}
      </div>
      <div className={styles.rows}>
        {Array.from({ length: ROWS }, (_, index) => (
          <div key={index} className={styles.row}>
            <Skeleton width={18} height={16} />
            <Skeleton shape="circle" width={36} height={36} />
            <span className={styles.who}>
              <Skeleton width={`${70 - index * 8}%`} height={14} />
              <Skeleton width={64} height={16} shape="pill" />
            </span>
            <Skeleton width={44} height={18} />
          </div>
        ))}
      </div>
    </div>
  );
}
