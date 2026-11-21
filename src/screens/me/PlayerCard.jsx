import { useState } from 'react';
import Lumi from '../../components/game/Lumi.jsx';
import PalArt from '../../components/pals/PalArt.jsx';
import { PALS, palById, stageOf } from '../../game/pals.js';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../state/AuthContext.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { currentStreak, totalStars } from '../../game/progress.js';
import { finishedWorldCount, playerLevelFor } from '../../game/titles.js';
import { todayKey } from '../../game/daily.js';
import { useWeeklyBoard } from '../../hooks/useWeeklyBoard.js';
import Skeleton from '../../components/Skeleton.jsx';
import NicknameDialog from './NicknameDialog.jsx';
import TitleBadge from '../../components/game/TitleBadge.jsx';
import TitleRoad from './TitleRoad.jsx';
import { useFeature } from '../../hooks/useFeature.js';
import styles from './PlayerCard.module.css';
import { earnedStickers } from '../../game/stickers.js';
import { rescuedGlowbugs } from '../../game/glowbugs.js';
import { useI18n } from '../../i18n/I18nContext.jsx';

/** One stat as a picture: a colored icon, a big number and one word under it. `extra` is a small badge (streak shields). */
function Stat({ icon, tone, value, label, extra = null }) {
  return (
    <li className={styles.stat}>
      <span className={`${styles.statIcon} ${styles[tone]}`}>
        <Icon name={icon} size={20} />
        {extra}
      </span>
      <span className={`game-title ${styles.statValue}`}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </li>
  );
}

/** "Me": who you are in the game, your Glow and title, and what you've achieved, as pictures and numbers. */
export default function PlayerCard() {
  const { user, displayName, avatarUrl } = useAuth();
  const { progress } = usePlayer();
  const { t } = useI18n();
  const hasStickers = useFeature('stickers');
  const hasGlowbugs = useFeature('glowbugs');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  // The public nickname shown on the Top board (signed-in players only); the last one loaded shows at once.
  const { board, error: boardError } = useWeeklyBoard({ owner: user?.id ?? 'guest', isEnabled: Boolean(user) && !progress.nickname });
  const shownNickname = progress.nickname ?? board?.myNickname ?? null;
  const isNicknameLoading = Boolean(user) && !shownNickname && !board && !boardError;
  const stars = totalStars(progress);
  const playerLevel = playerLevelFor(stars);
  const solved = Object.values(progress.levels).filter((entry) => entry.stars > 0).length;
  const streak = currentStreak(progress, todayKey());
  const shields = progress.daily.shields ?? 0;
  const partner = palById(progress.pal.id);
  const partnerStage = partner ? stageOf(progress.pal.owned[partner.id]) : 0;

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
      {isNicknameLoading ? (
        <span className={styles.nicknameButton} role="status" aria-busy="true" aria-label={t('ui.loading')}>
          <Skeleton shape="pill" width={120} height={14} />
        </span>
      ) : (
        <button
          type="button"
          className={styles.nicknameButton}
          onClick={() => setIsEditingNickname(true)}
          aria-label={shownNickname ? `${t(user ? 'me.nickname.onBoard' : 'me.nickname.label')} ${shownNickname}` : t('me.nickname.choose')}
        >
          <Icon name="trophy" size={16} />
          {shownNickname ? <strong>{shownNickname}</strong> : t('me.nickname.choose')}
          <Icon name="edit" size={14} />
        </button>
      )}
      {isEditingNickname && (
        <NicknameDialog current={shownNickname} onSaved={() => setIsEditingNickname(false)} onClose={() => setIsEditingNickname(false)} />
      )}

      <div className={styles.title}>
        <TitleBadge stars={stars} size="lg" className={styles.titleChip} />
        <div className={styles.glowRow}>
          <div
            className={styles.track}
            role="progressbar"
            aria-label={t('me.glowProgress', { n: playerLevel.level + 1 })}
            aria-valuemin={playerLevel.from}
            aria-valuemax={playerLevel.to}
            aria-valuenow={stars}
          >
            <span className={styles.fill} style={{ width: `${Math.round(playerLevel.progress * 100)}%` }} />
            <span className={styles.trackText} aria-hidden="true">
              {stars - playerLevel.from}/{playerLevel.to - playerLevel.from}
            </span>
          </div>
          <span className={`game-title ${styles.nextGlow}`} aria-hidden="true">
            <Icon name="star" size={13} />
            {playerLevel.level + 1}
          </span>
        </div>
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
          extra={
            shields > 0 && (
              <span className={styles.shields} role="img" aria-label={t('me.stat.shields', { count: shields })}>
                <Icon name="shield" size={11} />
                {shields}
              </span>
            )
          }
        />
      </ul>
      {(hasStickers || hasGlowbugs) && (
        <div className={styles.collections}>
          {hasStickers && (
            <a href="#/stickers" className={styles.collection}>
              <Icon name="star" size={18} /> {t('me.stickers')} <strong>{earnedStickers(progress.levels).size}</strong>
            </a>
          )}
          {hasGlowbugs && (
            <a href="#/glowbugs" className={styles.collection}>
              <Icon name="heart" size={18} /> {t('me.glowbugs')} <strong>{rescuedGlowbugs(progress.levels).size}</strong>
            </a>
          )}
        </div>
      )}
    </section>
  );
}
