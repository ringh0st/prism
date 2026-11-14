import Icon from '../Icon.jsx';
import { playerLevelFor, titleFor } from '../../game/titles.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './TitleBadge.module.css';

/**
 * A player's Glow (their level from stars, shown as ★ and a number, so it's never mixed up with a place on
 * the Top board or a game level) and title ("★12 Beam Bender"), in the title's own color.
 */
export default function TitleBadge({ stars, size = 'sm', className = '' }) {
  const { t } = useI18n();
  const { current } = titleFor(stars);
  const { level } = playerLevelFor(stars);
  const title = t(`title.${current.tone}`, {}, current.name);
  return (
    <span
      className={`game-title ${styles.badge} ${styles[size]} ${styles[current.tone]} ${className}`}
      aria-label={t('glow.badge', { n: level, title })}
    >
      <span className={styles.level} aria-hidden="true">
        <Icon name="star" size={size === 'lg' ? 14 : 11} />
        {level}
      </span>
      <span aria-hidden="true">{title}</span>
    </span>
  );
}
