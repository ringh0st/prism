import Icon from './Icon.jsx';
import { helperText } from '../i18n/gameText.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import styles from './HelperBar.module.css';

/**
 * In-level helper buttons with how many the player owns.
 * @param helperIds which helpers to offer (Skip is hidden on daily puzzles)
 * @param freeIds   helpers free right now (the first Hint in each early level): shown as "Free"
 */
export default function HelperBar({ helperIds, inventory, usedCount, allowed, disabled, onUse, nudgeId = null, freeIds = [] }) {
  const { t, lang } = useI18n();
  const isAtLimit = usedCount >= allowed;
  return (
    <div className={styles.bar}>
      <div className={styles.buttons} role="group" aria-label={t('helpers.label')} style={{ '--helper-count': helperIds.length }}>
        {helperIds.map((id) => {
          const helper = helperText(lang, id);
          const owned = inventory[id] ?? 0;
          const isFree = freeIds.includes(id);
          return (
            <button
              key={id}
              type="button"
              className={`${styles.helper} ${owned === 0 ? styles.empty : ''} ${nudgeId === id ? styles.nudge : ''}`}
              disabled={disabled || isAtLimit}
              onClick={() => onUse(id)}
              aria-label={`${helper.name}: ${helper.description} ${isFree ? t('helpers.freeHere') : owned > 0 ? t('helpers.left', { count: owned }) : t('helpers.none')}`}
            >
              <span className={styles.icon} aria-hidden="true">
                <Icon name={helper.icon} size={22} />
              </span>
              <span className={styles.name}>{helper.name}</span>
              <span className={`${styles.count} ${isFree ? styles.free : ''}`} aria-hidden="true">
                {isFree ? t('helpers.free') : owned > 0 ? owned : '+'}
              </span>
            </button>
          );
        })}
      </div>
      {usedCount > 0 && <p className={styles.limit}>{t('helpers.used', { used: usedCount, count: allowed })}</p>}
    </div>
  );
}
