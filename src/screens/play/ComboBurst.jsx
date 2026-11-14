import styles from './ComboBurst.module.css';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** "Double!", "Triple!" or "MEGA!" bursting over the board when one tap lights several gems. */
export default function ComboBurst({ combo }) {
  const { t } = useI18n();
  return (
    <div key={combo.key} className={`${styles.burst} ${combo.size >= 4 ? styles.mega : ''}`} role="status">
      <span className={`game-title ${styles.word}`}>
        {t(`combo.${combo.size >= 4 ? 'mega' : combo.size === 3 ? 'triple' : 'double'}`, {}, combo.word)}
      </span>
      <span className={styles.detail}>{t('combo.detail', { count: combo.size })}</span>
    </div>
  );
}
