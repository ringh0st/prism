import Icon from '../../components/Icon.jsx';
import { weeklyRewardFor } from '../../game/catalog.js';
import PalArt from '../../components/pals/PalArt.jsx';
import { animalAvatar } from './animalAvatar.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import styles from './Podium.module.css';

const PLACE_ORDER = [2, 1, 3];
const PLACE_CLASS = { 1: 'first', 2: 'second', 3: 'third' };

/** The winners' podium for this week's top three (empty steps wait for a winner). Tap a winner to see their card. */
export default function Podium({ top, onOpen }) {
  const { t } = useI18n();
  return (
    <ol className={styles.podium} aria-label={t('top.podiumLabel')}>
      {PLACE_ORDER.map((rank) => {
        const row = top.find((entry) => entry.rank === rank);
        const reward = weeklyRewardFor(rank);
        return (
          <li key={rank} className={`${styles.place} ${styles[PLACE_CLASS[rank]]} ${row?.isMe ? styles.me : ''}`} value={rank}>
            {row && (
              <button
                type="button"
                className={styles.open}
                onClick={() => onOpen(row)}
                aria-label={t('top.rowLabel', { name: row.nickname, rank, score: row.score })}
              />
            )}
            <span className={styles.avatar} aria-hidden="true">
              {row?.pal ? (
                <PalArt palId={row.pal} stage={row.palStage} wearing={row.wearing ?? []} size={rank === 1 ? 72 : 58} portrait />
              ) : row ? (
                animalAvatar(row.nickname)
              ) : (
                '?'
              )}
              {rank === 1 && <Icon name="crown" size={26} className={styles.crown} />}
            </span>
            {row ? <span className={styles.name}>{row.nickname}</span> : <span className="visually-hidden">{t('top.upForGrabs')}</span>}
            {row && (
              <span className={`game-title ${styles.score}`} aria-hidden="true">
                <Icon name="trophy" size={14} className={styles.points} />
                {row.score}
              </span>
            )}
            <span className={styles.step}>
              <span className={`game-title ${styles.rank}`}>{rank}</span>
              <span className={styles.prize} role="img" aria-label={t('top.prizeLabel', { diamonds: reward.diamonds, sparks: reward.sparks })}>
                <span className={styles.prizeItem}>
                  <Icon name="diamond" size={14} />
                  {reward.diamonds}
                </span>
                <span className={styles.prizeItem}>
                  <Icon name="spark" size={14} />
                  {reward.sparks}
                </span>
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
