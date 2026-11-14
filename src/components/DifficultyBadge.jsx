import Icon from './Icon.jsx';
import styles from './DifficultyBadge.module.css';
import { DIFFICULTY } from '../game/constants.js';
import { useI18n } from '../i18n/I18nContext.jsx';

const LABELS = {
  [DIFFICULTY.HARD]: { text: 'ui.hard', icon: 'flame' },
  [DIFFICULTY.EXTRA]: { text: 'ui.extraHard', icon: 'crown' },
};

/** Marks Hard / Extra Hard levels. Normal levels render nothing. */
export default function DifficultyBadge({ difficulty, compact = false }) {
  const { t } = useI18n();
  const info = LABELS[difficulty];
  if (!info) return null;
  return (
    <span className={`${styles.badge} ${styles[difficulty]} ${compact ? styles.compact : ''}`}>
      <Icon name={info.icon} size={compact ? 12 : 14} />
      <span className={compact ? 'visually-hidden' : undefined}>{t(info.text)}</span>
    </span>
  );
}
