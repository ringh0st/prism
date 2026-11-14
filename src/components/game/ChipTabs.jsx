import Icon from '../Icon.jsx';
import { sfx } from '../../audio/sfx.js';
import styles from './ChipTabs.module.css';

/**
 * A row of small pill tabs that stays pinned while the content below scrolls.
 * The panel they control must have id `${idPrefix}-panel` and aria-labelledby `${idPrefix}-${active}`.
 * @param tabs [{ id, label, icon, count? }] — count is shown as a little badge (e.g. "2/6")
 * @param fit  share the width evenly (for a few tabs) instead of scrolling sideways
 */
export default function ChipTabs({ label, tabs, active, onChange, idPrefix, fit = false, className = '' }) {
  return (
    <div className={`${styles.chips} ${fit ? styles.fit : ''} ${className}`} role="tablist" aria-label={label}>
      {tabs.map(({ id, label: text, icon, count, countLabel }) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`${idPrefix}-${id}`}
          aria-selected={active === id}
          aria-controls={`${idPrefix}-panel`}
          className={`${styles.chip} ${active === id ? styles.chipActive : ''}`}
          onClick={() => {
            sfx.tab();
            onChange(id);
          }}
        >
          <Icon name={icon} size={16} />
          <span>{text}</span>
          {count !== undefined && (
            <span className={styles.chipCount} aria-label={countLabel}>
              {count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
