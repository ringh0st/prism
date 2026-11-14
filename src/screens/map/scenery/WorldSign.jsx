import Icon from '../../../components/Icon.jsx';
import styles from './Scenery.module.css';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { worldName } from '../../../i18n/gameText.js';

/** The wooden signpost at the start of each world: its name and the stars earned there. */
export default function WorldSign({ world, headingId, earned = 0, total = 0, isLocked = false, className = '' }) {
  const { t, lang } = useI18n();
  return (
    <div className={`${styles.signpost} ${className}`}>
      <div className={styles.board}>
        {lang === 'en' && <p className={styles.number}>World {world.id}</p>}
        <h2 id={headingId} className={`game-title ${styles.name}`}>
          {worldName(lang, world)}
        </h2>
        {!isLocked && (
          <p className={styles.tagline} role="img" aria-label={t('map.sign.stars', { count: earned, total })}>
            <span className={styles.stars}>
              <Icon name="star" size={16} />
              <span dir="ltr">
                {earned}/{total}
              </span>
            </span>
          </p>
        )}
      </div>
      <span className={styles.posts} aria-hidden="true" />
    </div>
  );
}
