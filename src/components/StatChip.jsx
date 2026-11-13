import styles from './StatChip.module.css';
import Icon from './Icon.jsx';

/** Compact pill showing a counter, e.g. total stars or sparks. */
export default function StatChip({ icon, value, label, tone = 'sunshine' }) {
  return (
    <span className={`${styles.chip} ${styles[tone]}`}>
      <Icon name={icon} size={16} />
      <span className={styles.value} key={value}>
        {value}
      </span>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
