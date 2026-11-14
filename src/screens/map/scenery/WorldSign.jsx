import Icon from '../../../components/Icon.jsx';
import styles from './Scenery.module.css';
import { useI18n } from '../../../i18n/I18nContext.jsx';
import { worldName } from '../../../i18n/gameText.js';

/** The wooden signpost at the start of each world: number, name, tagline and stars. */
export default function WorldSign({ world, headingId, earned = 0, total = 0, isLocked = false, className = '' }) {
  const { lang } = useI18n();
  return (
    <div className={`${styles.signpost} ${className}`}>
      <div className={styles.board}>
        {lang === 'en' && <p className={styles.number}>World {world.id}</p>}
        <h2 id={headingId} className={`game-title ${styles.name}`}>
          {worldName(lang, world)}
        </h2>
        {!isLocked && (
          <p className={styles.tagline}>
            {lang === 'en' && `${world.tagline} · `}
            <span className={styles.stars}>
              <Icon name="star" size={14} /> {earned}/{total}
            </span>
          </p>
        )}
      </div>
      <span className={styles.posts} aria-hidden="true" />
    </div>
  );
}
