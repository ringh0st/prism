import Icon from '../../components/Icon.jsx';
import styles from './LeaderboardScreen.module.css';

const MEDALS = { 1: 'gold', 2: 'silver', 3: 'bronze' };

/** One place on the board. The top three get a medal; the player's own row is highlighted. */
export default function RankRow({ row }) {
  const medal = MEDALS[row.rank];
  return (
    <li className={`${styles.row} ${row.isMe ? styles.me : ''}`} aria-current={row.isMe ? 'true' : undefined}>
      <span className={`game-title ${styles.rank} ${medal ? styles[medal] : ''}`}>{medal ? <Icon name="trophy" size={18} label={`Place ${row.rank}`} /> : row.rank}</span>
      <span className={styles.name}>
        {row.nickname}
        {row.isMe && <span className={styles.youTag}>You</span>}
      </span>
      <span className={`game-title ${styles.score}`}>{row.score}</span>
    </li>
  );
}
