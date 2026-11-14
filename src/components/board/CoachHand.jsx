import styles from './Board.module.css';

/** A pointing hand under a tile in the first levels: "tap here". */
export default function CoachHand() {
  return (
    <span className={styles.coachHand} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <path
          d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10m0-1a1.5 1.5 0 0 1 3 0v2m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L4.6 15.6a1.6 1.6 0 0 1 2.4-2.1L9 15.5z"
          fill="#fffaf2"
          stroke="#2b2118"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
