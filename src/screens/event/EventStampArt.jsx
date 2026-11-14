import styles from './EventStampArt.module.css';

/**
 * A postage stamp with the event's symbol: a perforated edge around a warm face. `ghost` draws an
 * empty dashed one (a stamp still to win).
 */
export default function EventStampArt({ icon, size = 'md', ghost = false, className = '' }) {
  return (
    <span className={`${styles.stamp} ${styles[size]} ${ghost ? styles.ghost : ''} ${className}`} aria-hidden="true">
      <span className={styles.icon}>{ghost ? '?' : icon}</span>
    </span>
  );
}
