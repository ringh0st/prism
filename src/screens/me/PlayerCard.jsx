import { useEffect, useState } from 'react';
import Lumi from '../../components/game/Lumi.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { palById, palStage } from '../../game/pals.js';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../state/AuthContext.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { currentStreak, totalStars } from '../../game/progress.js';
import { finishedWorldCount, titleFor } from '../../game/titles.js';
import { todayKey } from '../../game/daily.js';
import { fetchWeeklyLeaderboard } from '../../lib/economyApi.js';
import styles from './PlayerCard.module.css';

function Stat({ icon, tone, value, label, note = null }) {
  return (
    <li className={styles.stat}>
      <span className={`${styles.statIcon} ${styles[tone]}`} aria-hidden="true">
        <Icon name={icon} size={20} />
      </span>
      <span className={`game-title ${styles.statValue}`}>{value}</span>
      <span className={styles.statLabel}>
        {label}
        {note && (
          <span className={styles.statNote}>
            <Icon name="shield" size={13} /> {note}
          </span>
        )}
      </span>
    </li>
  );
}

/** "Me": who you are in the game, your title, and what you've achieved. */
export default function PlayerCard() {
  const { user, displayName, avatarUrl } = useAuth();
  const { progress } = usePlayer();
  const [nickname, setNickname] = useState(null);
  const stars = totalStars(progress);
  const { current, next, progress: toNext } = titleFor(stars);
  const solved = Object.values(progress.levels).filter((entry) => entry.stars > 0).length;
  const streak = currentStreak(progress, todayKey());
  const shields = progress.daily.shields ?? 0;
  const partner = palById(progress.pal.id);
  const partnerXp = partner ? progress.pal.owned[partner.id]?.xp ?? 0 : 0;

  // The public nickname shown on the Top board (signed-in players only).
  useEffect(() => {
    if (!user) return undefined;
    let isCurrent = true;
    fetchWeeklyLeaderboard()
      .then((board) => isCurrent && setNickname(board.myNickname))
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [user]);

  return (
    <section className={styles.card} aria-labelledby="player-name">
      <div className={styles.banner} aria-hidden="true" />
      <div className={styles.avatar}>
        {partner ? (
          <PalArt palId={partner.id} xp={partnerXp} accessory={progress.pal.accessory} size={84} />
        ) : avatarUrl ? (
          <img src={avatarUrl} alt="" width="84" height="84" referrerPolicy="no-referrer" />
        ) : (
          <Lumi mood="happy" size={80} />
        )}
      </div>
      <h2 id="player-name" className={`game-title ${styles.name}`}>
        {user ? displayName : 'Guest player'}
      </h2>
      {partner && (
        <p className={styles.nickname}>
          Partner: {partner.name} the {partner.species} · {palStage(partnerXp).name}
        </p>
      )}
      {nickname && <p className={styles.nickname}>On the Top board as {nickname}</p>}

      <div className={styles.title}>
        <span className={`game-title ${styles.titleChip}`}>{current.name}</span>
        {next ? (
          <>
            <div
              className={styles.track}
              role="progressbar"
              aria-label={`Progress to ${next.name}`}
              aria-valuemin={current.stars}
              aria-valuemax={next.stars}
              aria-valuenow={stars}
            >
              <span className={styles.fill} style={{ width: `${Math.round(toNext * 100)}%` }} />
            </div>
            <p className={styles.nextTitle}>
              {next.stars - stars} more ★ to become <strong>{next.name}</strong>
            </p>
          </>
        ) : (
          <p className={styles.nextTitle}>The highest title there is. Legendary!</p>
        )}
      </div>

      <ul className={styles.stats}>
        <Stat icon="star" tone="honey" value={stars} label="stars" />
        <Stat icon="check" tone="sage" value={solved} label="levels solved" />
        <Stat icon="map" tone="peach" value={finishedWorldCount(progress.levels)} label="worlds finished" />
        <Stat icon="flame" tone="terracotta" value={streak} label="day streak" note={shields > 0 ? `${shields} ${shields === 1 ? 'shield' : 'shields'}` : null} />
      </ul>
    </section>
  );
}
