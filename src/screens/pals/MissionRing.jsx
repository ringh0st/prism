import styles from './DailyMissions.module.css';

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A ring that fills as a mission's count grows, with the mission's picture in the middle. */
export default function MissionRing({ count, target, label, children }) {
  const share = Math.min(count / target, 1);
  return (
    <div
      className={styles.ring}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.min(count, target)}
      aria-label={label}
    >
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true" focusable="false">
        <circle className={styles.ringTrack} cx="32" cy="32" r={RADIUS} />
        <circle
          className={styles.ringFill}
          cx="32"
          cy="32"
          r={RADIUS}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - share)}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className={styles.ringIcon} aria-hidden="true">
        {children}
      </span>
    </div>
  );
}
