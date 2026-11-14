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
import { useI18n } from '../../i18n/I18nContext.jsx';
import { palWithSpecies } from '../../i18n/palText.js';

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
  const { t, lang } = useI18n();
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
  const nextTitle = next && t(`title.${next.tone}`, {}, next.name);

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
        {user ? displayName : t('me.guest')}
      </h2>
      {partner && (
        <p className={styles.nickname}>
          {t('me.partner', {
            who: palWithSpecies(lang, partner),
            stage: t(`stage.${palStage(partnerStage).id}`, {}, palStage(partnerStage).name),
          })}
        </p>
      )}
      <button type="button" className={styles.nicknameButton} onClick={() => setIsEditingNickname(true)}>
        {shownNickname ? (
          <>
            {t(user ? 'me.nickname.onBoard' : 'me.nickname.label')} <strong>{shownNickname}</strong>
          </>
        ) : (
          t('me.nickname.choose')
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
          aria-label={t('me.glowProgress', { n: playerLevel.level + 1 })}
          aria-valuemin={playerLevel.from}
          aria-valuemax={playerLevel.to}
          aria-valuenow={stars}
        >
          <span className={styles.fill} style={{ width: `${Math.round(playerLevel.progress * 100)}%` }} />
        </div>
        <p className={styles.nextTitle}>
          {t('me.toGlow', { count: playerLevel.to - stars })} <strong>{t('me.glow', { n: playerLevel.level + 1 })}</strong>
          {next && (
            <>
              {' '}
              {t('me.toTitle', { n: next.stars - stars })} <strong>{nextTitle}</strong>
            </>
          )}
        </p>
      </div>
      <TitleRoad stars={stars} />

      <ul className={styles.stats}>
        <Stat icon="star" tone="honey" value={stars} label={t('me.stat.stars')} />
        <Stat icon="check" tone="sage" value={solved} label={t('me.stat.solved')} />
        <Stat icon="map" tone="peach" value={finishedWorldCount(progress.levels)} label={t('me.stat.worlds')} />
        <Stat icon="paw" tone="mint" value={`${Object.keys(progress.pal.owned).length}/${PALS.length}`} label={t('me.stat.pals')} />
        <Stat
          icon="flame"
          tone="terracotta"
          value={streak}
          label={t('me.stat.streak')}
          note={shields > 0 ? t('me.stat.shields', { count: shields }) : null}
        />
      </ul>
      <div className={styles.collections}>
        <a href="#/stickers" className={styles.collection}>
          <Icon name="star" size={18} /> {t('me.stickers')} <strong>{earnedStickers(progress.levels).size}</strong>
        </a>
        <a href="#/glowbugs" className={styles.collection}>
          <Icon name="heart" size={18} /> {t('me.glowbugs')} <strong>{rescuedGlowbugs(progress.levels).size}</strong>
        </a>
      </div>
    </section>
  );
}
