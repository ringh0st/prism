import PalArt from '../../components/pals/PalArt.jsx';
import { animalAvatar } from './animalAvatar.js';
import TitleBadge from '../../components/game/TitleBadge.jsx';
import styles from './LeaderboardScreen.module.css';

/** One place on the board below the podium. The player's own row is highlighted. */
export default function RankRow({ row }) {
  return (
    <li className={`${styles.row} ${row.isMe ? styles.me : ''}`} aria-current={row.isMe ? 'true' : undefined}>
      <span className={`game-title ${styles.rank}`}>{row.rank}</span>
      <span className={styles.rowAvatar} aria-hidden="true">
        {row.pal ? <PalArt palId={row.pal} stage={row.palStage} wearing={row.wearing ?? []} size={36} portrait /> : animalAvatar(row.nickname)}
      </span>
      <span className={styles.who}>
        <span className={styles.name}>
          {row.nickname}
          {row.isMe && <span className={styles.youTag}>You</span>}
        </span>
        {row.stars != null && <TitleBadge stars={row.stars} />}
      </span>
      <span className={`game-title ${styles.score}`}>{row.score}</span>
    </li>
  );
}
