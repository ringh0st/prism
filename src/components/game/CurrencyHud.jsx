import Icon from '../Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { totalStars } from '../../game/progress.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './CurrencyHud.module.css';

function Counter({ icon, value, label, tone }) {
  return (
    <span className={`${styles.counter} ${styles[tone]}`}>
      <span className={styles.badge} aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className={styles.value} key={value}>
        {value}
      </span>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

/** Game-style currency counters. The whole strip opens the store. */
export default function CurrencyHud({ showStars = true }) {
  const { progress } = usePlayer();
  const { t } = useI18n();
  return (
    <a href="#/store" className={styles.hud} aria-label={t('ui.hud.open')}>
      {showStars && <Counter icon="star" value={totalStars(progress)} label={t('ui.hud.stars')} tone="star" />}
      <Counter icon="spark" value={progress.sparks} label={t('ui.hud.sparks')} tone="spark" />
      <Counter icon="diamond" value={progress.diamonds} label={t('ui.hud.diamonds')} tone="diamond" />
      <span className={styles.plus} aria-hidden="true">
        <Icon name="plus" size={16} strokeWidth={3.4} />
      </span>
    </a>
  );
}
