import { eventStamps } from '../../game/events.js';
import styles from './Event.module.css';

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** Every finished weekend event, as a collectible stamp. */
export default function EventStamps({ progress }) {
  const stamps = eventStamps(progress);
  return (
    <section className={styles.card} aria-labelledby="stamps-title">
      <h2 id="stamps-title" className="game-title">
        Stamp collection <span className={styles.count}>{stamps.length}</span>
      </h2>
      {stamps.length === 0 ? (
        <p className={styles.muted}>Finish all 10 puzzles of a weekend event to earn its stamp.</p>
      ) : (
        <ul className={styles.stamps}>
          {stamps.map(({ weekend, theme }) => (
            <li key={weekend} className={styles.stamp}>
              <span className={styles.stampIcon} aria-hidden="true">
                {theme.icon}
              </span>
              <span className={styles.stampName}>{theme.name}</span>
              <span className={styles.stampDate}>{dateFormat.format(new Date(`${weekend}T12:00:00`))}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
