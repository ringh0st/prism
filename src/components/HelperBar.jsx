import Icon from './Icon.jsx';
import { helperText } from '../i18n/gameText.js';
import { HELPERS } from '../game/catalog.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import styles from './HelperBar.module.css';

/**
 * In-level helper buttons: an icon, a one-word name and a badge with how many the player owns (none left: no
 * badge and a faded icon; tapping offers more). Dots below show how many helpers this try still allows.
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
              className={`${styles.helper} ${owned === 0 && !isFree ? styles.empty : ''} ${nudgeId === id ? styles.nudge : ''}`}
              disabled={disabled || isAtLimit}
              onClick={() => onUse(id)}
              aria-label={`${helper.name}: ${helper.description} ${isFree ? t('helpers.freeHere') : owned > 0 ? t('helpers.left', { count: owned }) : t('helpers.none')}`}
            >
              <span className={styles.icon} aria-hidden="true">
                <Icon name={HELPERS[id].icon} size={22} />
              </span>
              <span className={styles.name} aria-hidden="true">
                {t(`helpers.short.${id}`)}
              </span>
              {(isFree || owned > 0) && (
                <span className={`${styles.count} ${isFree ? styles.free : ''}`} aria-hidden="true">
                  {isFree ? t('helpers.free') : owned}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {usedCount > 0 && (
        <span className={styles.limit} role="img" aria-label={t('helpers.used', { used: usedCount, count: allowed })}>
          {Array.from({ length: allowed }, (_, i) => (
            <span key={i} className={i < usedCount ? styles.pipUsed : styles.pip} />
          ))}
        </span>
      )}
    </div>
  );
}
