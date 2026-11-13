import Icon from './Icon.jsx';
import { usePlayer } from '../state/PlayerContext.jsx';
import { totalStars } from '../game/progress.js';
import styles from './WalletLink.module.css';

/** Stars, sparks and diamonds in one pill. Tapping it opens the store. */
export default function WalletLink() {
  const { progress } = usePlayer();
  const stars = totalStars(progress);
  return (
    <a
      href="#/store"
      className={styles.wallet}
      aria-label={`Store. You have ${stars} stars, ${progress.sparks} sparks and ${progress.diamonds} diamonds.`}
    >
      <span className={styles.item}>
        <Icon name="star" size={15} className={styles.star} />
        <span key={stars} className={styles.value}>
          {stars}
        </span>
      </span>
      <span className={styles.item}>
        <Icon name="spark" size={15} className={styles.spark} />
        <span key={progress.sparks} className={styles.value}>
          {progress.sparks}
        </span>
      </span>
      <span className={styles.item}>
        <Icon name="diamond" size={15} className={styles.diamond} />
        <span key={progress.diamonds} className={styles.value}>
          {progress.diamonds}
        </span>
      </span>
      <span className={styles.plus} aria-hidden="true">
        +
      </span>
    </a>
  );
}
