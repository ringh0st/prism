import Icon from '../../../components/Icon.jsx';
import styles from './Scenery.module.css';

/** The wooden signpost at the start of each world: number, name, tagline and stars. */
export default function WorldSign({ world, headingId, earned = 0, total = 0, isLocked = false, className = '' }) {
  return (
    <div className={`${styles.signpost} ${className}`}>
      <div className={styles.board}>
        <p className={styles.number}>World {world.id}</p>
        <h2 id={headingId} className={`game-title ${styles.name}`}>
          {world.name}
        </h2>
        {!isLocked && (
          <p className={styles.tagline}>
            {world.tagline} ·{' '}
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
