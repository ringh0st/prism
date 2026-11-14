import { useEffect, useState } from 'react';
import Lumi from '../../components/game/Lumi.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { PALS, palById, palStage, stageOf } from '../../game/pals.js';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../state/AuthContext.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { currentStreak, totalStars } from '../../game/progress.js';
import { finishedWorldCount, playerLevelFor, titleFor } from '../../game/titles.js';
import { todayKey } from '../../game/daily.js';
import { fetchWeeklyLeaderboard } from '../../lib/economyApi.js';
import NicknameDialog from './NicknameDialog.jsx';
import TitleBadge from '../../components/game/TitleBadge.jsx';
import TitleRoad from './TitleRoad.jsx';
import styles from './PlayerCard.module.css';
import { earnedStickers } from '../../game/stickers.js';
import { rescuedGlowbugs } from '../../game/glowbugs.js';

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
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const shownNickname = progress.nickname ?? nickname;
  const stars = totalStars(progress);
  const { next } = titleFor(stars);
  const playerLevel = playerLevelFor(stars);
  const solved = Object.values(progress.levels).filter((entry) => entry.stars > 0).length;
  const streak = currentStreak(progress, todayKey());
  const shields = progress.daily.shields ?? 0;
  const partner = palById(progress.pal.id);
  const partnerStage = partner ? stageOf(progress.pal.owned[partner.id]) : 0;

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
          <PalArt palId={partner.id} stage={partnerStage} wearing={progress.pal.wearing} size={84} alive />
        ) : avatarUrl ? (
          <img src={avatarUrl} alt="" width="84" height="84" referrerPolicy="no-referrer" />
        ) : (
          <Lumi mood="happy" size={96} />
        )}
      </div>
      <h2 id="player-name" className={`game-title ${styles.name}`}>
        {user ? displayName : 'Guest player'}
      </h2>
      {partner && (
        <p className={styles.nickname}>
          Partner: {partner.name} the {partner.species} · {palStage(partnerStage).name}
        </p>
      )}
      <button type="button" className={styles.nicknameButton} onClick={() => setIsEditingNickname(true)}>
        {shownNickname ? (
          <>
            {user ? 'On the Top board as' : 'Nickname:'} <strong>{shownNickname}</strong>
          </>
        ) : (
          'Choose your nickname'
        )}
        <Icon name="edit" size={14} />
      </button>
      {isEditingNickname && (
        <NicknameDialog current={shownNickname} onSaved={() => setIsEditingNickname(false)} onClose={() => setIsEditingNickname(false)} />
      )}

      <div className={styles.title}>
        <TitleBadge stars={stars} size="lg" className={styles.titleChip} />
        <div
          className={styles.track}
          role="progressbar"
          aria-label={`Progress to level ${playerLevel.level + 1}`}
          aria-valuemin={playerLevel.from}
          aria-valuemax={playerLevel.to}
          aria-valuenow={stars}
        >
          <span className={styles.fill} style={{ width: `${Math.round(playerLevel.progress * 100)}%` }} />
        </div>
        <p className={styles.nextTitle}>
          {playerLevel.to - stars} more ★ to reach <strong>Lv {playerLevel.level + 1}</strong>
          {next && (
            <>
              {' '}
              · {next.stars - stars} to become <strong>{next.name}</strong>
            </>
          )}
        </p>
      </div>
      <TitleRoad stars={stars} />

      <ul className={styles.stats}>
        <Stat icon="star" tone="honey" value={stars} label="stars" />
        <Stat icon="check" tone="sage" value={solved} label="levels solved" />
        <Stat icon="map" tone="peach" value={finishedWorldCount(progress.levels)} label="worlds finished" />
        <Stat icon="paw" tone="mint" value={`${Object.keys(progress.pal.owned).length}/${PALS.length}`} label="Pals collected" />
        <Stat
          icon="flame"
          tone="terracotta"
          value={streak}
          label="day streak"
          note={shields > 0 ? `${shields} ${shields === 1 ? 'shield' : 'shields'}` : null}
        />
      </ul>
      <div className={styles.collections}>
        <a href="#/stickers" className={styles.collection}>
          <Icon name="star" size={18} /> Sticker album <strong>{earnedStickers(progress.levels).size}</strong>
        </a>
        <a href="#/glowbugs" className={styles.collection}>
          <Icon name="heart" size={18} /> Glowbugs <strong>{rescuedGlowbugs(progress.levels).size}</strong>
        </a>
      </div>
    </section>
  );
}
