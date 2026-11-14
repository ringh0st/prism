import Icon from '../../components/Icon.jsx';
import { weeklyRewardFor } from '../../game/catalog.js';
import PalArt from '../../components/pals/PalArt.jsx';
import { animalAvatar } from './animalAvatar.js';
import TitleBadge from '../../components/game/TitleBadge.jsx';
import styles from './Podium.module.css';

const PLACE_ORDER = [2, 1, 3];
const PLACE_CLASS = { 1: 'first', 2: 'second', 3: 'third' };

/** The winners' podium for this week's top three (empty steps wait for a winner). */
export default function Podium({ top }) {
  return (
    <ol className={styles.podium} aria-label="This week's top three">
      {PLACE_ORDER.map((rank) => {
        const row = top.find((entry) => entry.rank === rank);
        const reward = weeklyRewardFor(rank);
        return (
          <li key={rank} className={`${styles.place} ${styles[PLACE_CLASS[rank]]} ${row?.isMe ? styles.me : ''}`} value={rank}>
            <span className={styles.avatar} aria-hidden="true">
              {row?.pal ? (
                <PalArt palId={row.pal} stage={row.palStage} accessory={row.accessory} size={rank === 1 ? 70 : 56} />
              ) : row ? (
                animalAvatar(row.nickname)
              ) : (
                '?'
              )}
              {rank === 1 && <Icon name="crown" size={26} className={styles.crown} />}
            </span>
            <span className={styles.name}>{row ? row.nickname : 'Up for grabs'}</span>
            {row?.stars != null && <TitleBadge stars={row.stars} />}
            {row && (
              <span className={`game-title ${styles.score}`}>
                {row.score} <span className={styles.points}>pts</span>
              </span>
            )}
            <span className={styles.step}>
              <span className={`game-title ${styles.rank}`}>{rank}</span>
              <span className={styles.prize} aria-label={`Prize: ${reward.diamonds} diamonds and ${reward.sparks} sparks`}>
                <Icon name="diamond" size={13} /> {reward.diamonds} <Icon name="spark" size={13} /> {reward.sparks}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
