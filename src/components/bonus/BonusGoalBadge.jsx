import Icon from '../Icon.jsx';
import GemShape from '../GemShape.jsx';
import BonusGoalIcon from './BonusGoalIcon.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './BonusGoalBadge.module.css';

const STATE_MARKS = { done: 'check', missed: 'close' };

/**
 * A level's bonus goal as a pill: its picture (the gem's own shape for the gem goals), a few words unless `compact`,
 * and how it's going as a symbol, not only a color: a tick once done, a cross when this try missed it.
 * With `onClick` it's a button (in a level it asks Lumi to say the goal).
 * @param goal  from bonusGoals.js; `gemColor` is the marked gem's color for the gem goals
 */
export default function BonusGoalBadge({ goal, gemColor = null, state = 'open', compact = false, onClick = null, className = '' }) {
  const { t } = useI18n();
  const words = t(`bonus.goal.${goal.kind}`);
  const label = `${t('bonus.label', { goal: words })}${state === 'open' ? '' : `. ${t(`bonus.state.${state}`)}`}`;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`${styles.badge} ${styles[state] ?? ''} ${compact ? styles.compact : ''} ${className}`}
      onClick={onClick ?? undefined}
      aria-label={label}
      role={onClick ? undefined : 'img'}
    >
      <span className={styles.art} aria-hidden="true">
        {gemColor ? <GemShape color={gemColor} size={compact ? 18 : 20} /> : <BonusGoalIcon kind={goal.kind} size={compact ? 18 : 20} />}
        {gemColor && <BonusGoalIcon kind={`${goal.kind}Tag`} size={compact ? 12 : 14} className={styles.gemTag} />}
      </span>
      {!compact && (
        <span className={styles.words} aria-hidden="true">
          {words}
        </span>
      )}
      {STATE_MARKS[state] && (
        <span className={styles.mark} aria-hidden="true">
          <Icon name={STATE_MARKS[state]} size={compact ? 11 : 13} strokeWidth={3.4} />
        </span>
      )}
    </Tag>
  );
}
