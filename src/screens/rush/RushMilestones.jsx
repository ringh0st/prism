import Icon from '../../components/Icon.jsx';
import { RUSH_MILESTONES } from '../../game/rush.js';
import styles from './Rush.module.css';

/** The week's milestone rewards: sparks for reaching 5, 10, 20 and all 30 puzzles in one run. */
export default function RushMilestones({ record }) {
  return (
    <section className={styles.card} aria-labelledby="rush-milestones">
      <h3 id="rush-milestones">Milestone rewards</h3>
      <ol className={styles.milestones}>
        {RUSH_MILESTONES.map((milestone) => {
          const isReached = record.paid.includes(milestone.cleared);
          return (
            <li key={milestone.cleared} className={isReached ? styles.reached : ''}>
              <span className={`game-title ${styles.milestoneCount}`}>{milestone.cleared}</span>
              <span className={styles.milestoneLabel}>puzzles</span>
              <span className={styles.milestoneReward}>
                {isReached ? (
                  <>
                    <Icon name="check" size={14} /> Got it
                  </>
                ) : (
                  <>
                    <Icon name="spark" size={14} /> {milestone.sparks}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
