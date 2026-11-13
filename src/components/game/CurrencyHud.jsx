import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { totalStars } from '../../game/progress.js';
import styles from './CurrencyHud.module.css';

function Counter({ icon, value, label, tone }) {
  return (
    <span className={`${styles.counter} ${styles[tone]}`}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.value} key={value}>
        {value}
      </span>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

/** Game-style currency counters. The whole strip opens the store. */
export default function CurrencyHud({ showStars = true }) {
  const { progress } = usePlayer();
  return (
    <a href="#/store" className={styles.hud} aria-label="Open the store">
      {showStars && <Counter icon="star" value={totalStars(progress)} label="stars" tone="star" />}
      <Counter icon="spark" value={progress.sparks} label="sparks" tone="spark" />
      <Counter icon="diamond" value={progress.diamonds} label="diamonds" tone="diamond" />
      <span className={styles.plus} aria-hidden="true">
        <Icon name="plus" size={16} strokeWidth={3.4} />
      </span>
    </a>
  );
}
