import Icon from '../Icon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './PalPowerBadge.module.css';

/**
 * A Pal's power as a picture: its icon in a honey coin and the amount ("+2"), so what a Pal does reads at a
 * glance (the sentence is for screen readers, or shown beside it with `withLine`).
 * @param power  { id, icon, amount } from palPower
 * @param size     'sm' | 'md'
 * @param iconOnly just the coin (on small tiles)
 */
export default function PalPowerBadge({ power, size = 'md', iconOnly = false, withLine = false, className = '' }) {
  const { t } = useI18n();
  const line = t(`power.${power.id}.line`, { count: power.amount });
  return (
    <span className={`${styles.badge} ${styles[size]} ${className}`} role="img" aria-label={line} title={line}>
      <span className={styles.coin} aria-hidden="true">
        <Icon name={power.icon} size={size === 'sm' ? 12 : 18} />
      </span>
      {!iconOnly && !withLine && (
        <span className={`game-title ${styles.amount}`} aria-hidden="true" dir="ltr">
          {power.id === 'moves' ? `+${power.amount}` : `×${power.amount}`}
        </span>
      )}
      {withLine && (
        <span className={styles.line} aria-hidden="true">
          {line}
        </span>
      )}
    </span>
  );
}
