import Icon from '../../components/Icon.jsx';
import { RUSH_LENGTH, RUSH_MILESTONES } from '../../game/rush.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './RushMilestones.module.css';

/**
 * The week's best run as a road from 0 to 30, with a gift at 5, 10, 20 and 30 puzzles (sparks, once a
 * week). Gifts already won turn gold with a check.
 */
export default function RushMilestones({ record }) {
  const { t } = useI18n();
  const best = Math.min(record.best, RUSH_LENGTH);
  return (
    <div className={styles.road}>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={t('rush.yourBest', { best, total: RUSH_LENGTH })}
        aria-valuemin={0}
        aria-valuemax={RUSH_LENGTH}
        aria-valuenow={best}
      >
        <span className={styles.fill} style={{ width: `${(best / RUSH_LENGTH) * 100}%` }} />
      </div>
      <ol className={styles.gifts} aria-label={t('rush.milestones.title')}>
        {RUSH_MILESTONES.map((milestone) => {
          const isReached = record.paid.includes(milestone.cleared);
          return (
            <li
              key={milestone.cleared}
              className={`${styles.gift} ${isReached ? styles.reached : ''}`}
              style={{ insetInlineStart: `${(milestone.cleared / RUSH_LENGTH) * 100}%` }}
              aria-label={`${milestone.cleared} ${t('rush.milestones.puzzles')}: ${isReached ? t('rush.milestones.got') : t('ui.plusSparks', { count: milestone.sparks })}`}
            >
              <span className={styles.box} aria-hidden="true">
                <Icon name={isReached ? 'check' : 'gift'} size={18} strokeWidth={2.6} />
              </span>
              <span className={`game-title ${styles.at}`} aria-hidden="true">
                {milestone.cleared}
              </span>
              <span className={styles.sparks} aria-hidden="true">
                <Icon name="spark" size={11} />
                {milestone.sparks}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
