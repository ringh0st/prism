import styles from './Stars.module.css';
import Icon from './Icon.jsx';
import { MAX_STARS } from '../game/scoring.js';
import { useI18n } from '../i18n/I18nContext.jsx';

/** A row of stars. `animate` reveals earned stars one by one. */
export default function Stars({ count, size = 16, animate = false, className = '' }) {
  const { t } = useI18n();
  return (
    <span
      className={`${styles.stars} ${animate ? styles.animate : ''} ${className}`}
      role="img"
      aria-label={t('map.node.stars', { count, max: MAX_STARS })}
    >
      {Array.from({ length: MAX_STARS }, (_, i) => (
        <span key={i} className={`${styles.star} ${i < count ? styles.earned : ''}`} style={{ '--i': i, '--size': `${size}px` }}>
          <Icon name="star" size={size} />
        </span>
      ))}
    </span>
  );
}
