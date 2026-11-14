import PalArt from '../../components/pals/PalArt.jsx';
import { animalAvatar } from './animalAvatar.js';
import { titleFor } from '../../game/titles.js';
import styles from './LeaderboardScreen.module.css';

/** One place on the board below the podium. The player's own row is highlighted. */
export default function RankRow({ row }) {
  return (
    <li className={`${styles.row} ${row.isMe ? styles.me : ''}`} aria-current={row.isMe ? 'true' : undefined}>
      <span className={`game-title ${styles.rank}`}>{row.rank}</span>
      <span className={styles.rowAvatar} aria-hidden="true">
        {row.pal ? <PalArt palId={row.pal} xp={row.palXp} accessory={row.accessory} size={38} /> : animalAvatar(row.nickname)}
      </span>
      <span className={styles.who}>
        <span className={styles.name}>
          {row.nickname}
          {row.isMe && <span className={styles.youTag}>You</span>}
        </span>
        {row.stars != null && <span className={styles.title}>{titleFor(row.stars).current.name}</span>}
      </span>
      <span className={`game-title ${styles.score}`}>{row.score}</span>
    </li>
  );
}
