import Icon from '../../components/Icon.jsx';
import BonusGoalBadge from '../../components/bonus/BonusGoalBadge.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './BonusGoalResult.module.css';

/**
 * On the win screen: the level's bonus goal with a tick (met) or a cross (missed this time, try it on a replay),
 * and the sparks it paid the first time it was met.
 * @param bonus { goal, gemColor, isMet, sparks }
 */
export default function BonusGoalResult({ bonus }) {
  const { t } = useI18n();
  return (
    <p className={`${styles.result} ${bonus.isMet ? styles.met : ''}`} role="status">
      <BonusGoalBadge goal={bonus.goal} gemColor={bonus.gemColor} state={bonus.isMet ? 'done' : 'missed'} />
      {bonus.sparks > 0 && (
        <span className={styles.sparks}>
          <Icon name="spark" size={16} />
          <span dir="ltr" aria-hidden="true">
            +{bonus.sparks}
          </span>
          <span className="visually-hidden">{t('win.sparks', { count: bonus.sparks })}</span>
        </span>
      )}
    </p>
  );
}
