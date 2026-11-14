import { useEffect, useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import LumiSays from '../../components/game/LumiSays.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { fetchWeeklyLeaderboard } from '../../lib/economyApi.js';
import { WEEKLY_POINTS, WEEKLY_REWARDS } from '../../game/catalog.js';
import Podium from './Podium.jsx';
import { stageOf } from '../../game/pals.js';
import PalArt from '../../components/pals/PalArt.jsx';
import { palById } from '../../game/pals.js';
import RankRow from './RankRow.jsx';
import PlayerCardDialog from './PlayerCardDialog.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { withParts } from '../../i18n/extrasText.js';
import styles from './LeaderboardScreen.module.css';

const SPARKS_FOR_TOP_TEN = WEEKLY_REWARDS.find((reward) => reward.rank === 4).sparks;
const BUNTING = ['var(--color-sage)', 'var(--color-honey)', 'var(--color-peach)', 'var(--color-mint)'];
const FLAGS = 12;

/** "in 3 days" / "in 5 hours": when the week resets. */
function timeUntil(endsAt, t) {
  const hours = Math.max(0, Math.round((new Date(endsAt) - Date.now()) / 3_600_000));
  if (hours >= 48) return t('top.inDays', { count: Math.round(hours / 24) });
  if (hours >= 1) return t('top.inHours', { count: hours });
  return t('top.soon');
}

function Bunting() {
  const width = 100 / FLAGS;
  return (
    <svg className={styles.bunting} viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 2Q50 8 100 2" className={styles.string} />
      {Array.from({ length: FLAGS }, (_, i) => {
        const x = i * width;
        const sag = 2 + Math.sin((i / (FLAGS - 1)) * Math.PI) * 3;
        return <path key={i} d={`M${x + 0.6} ${sag}h${width - 1.2}l${-(width - 1.2) / 2} 9z`} style={{ fill: BUNTING[i % BUNTING.length] }} />;
      })}
    </svg>
  );
}

/** This week's top players worldwide: a winners' podium, then the rest of the board. */
export default function LeaderboardScreen() {
  const { isSignedIn, progress } = usePlayer();
  const { t } = useI18n();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  // Reload when the player's progress changes, so their own score is fresh.
  const solvedCount = Object.keys(progress.levels).length;
  useEffect(() => {
    let isCurrent = true;
    fetchWeeklyLeaderboard()
      .then((data) => isCurrent && setBoard(data))
      .catch((loadError) => isCurrent && setError(loadError.message));
    return () => {
      isCurrent = false;
    };
  }, [isSignedIn, solvedCount, progress.pal.id]);

  // Your own rows always show the Pal you're playing with right now, even before the board reloads.
  const withMyPal = (row) =>
    row.isMe && progress.pal.id
      ? {
          ...row,
          pal: progress.pal.id,
          palStage: stageOf(progress.pal.owned[progress.pal.id]),
          wearing: progress.pal.wearing,
          nickname: progress.nickname ?? row.nickname,
        }
      : row.isMe && progress.nickname
        ? { ...row, nickname: progress.nickname }
        : row;
  const top = board?.top.map(withMyPal) ?? [];
  const [openRow, setOpenRow] = useState(null);
  const rest = top.filter((row) => row.rank > 3);
  const partner = palById(progress.pal.id);
  const isMeListed = top.some((row) => row.isMe);
  const lumiLine = board?.me ? t('top.lumiRank', { rank: board.me.rank }) : t('top.lumiAsk');

  return (
    <div className={styles.page}>
      <ScreenHeader title={t('top.title')} />
      <main className={styles.arena}>
        <Bunting />
        <div className={styles.host}>
          <LumiSays mood="excited" size={86} line={lumiLine} />
        </div>

        {partner && (
          <a href="#/pals" className={styles.playingWith}>
            <PalArt
              palId={partner.id}
              stage={stageOf(progress.pal.owned[partner.id])}
              wearing={progress.pal.wearing}
              size={42}
              portrait
              className={styles.playingArt}
            />
            <span>{withParts(t('top.playingWith'), { name: <strong>{t(`palName.${partner.id}`, {}, partner.name)}</strong> })}</span>
            <span className={styles.change}>{t('top.change')}</span>
          </a>
        )}
        {error && <p className={styles.empty}>{error}</p>}
        {!board && !error && <p className={styles.empty}>{t('top.loading')}</p>}
        {board && <Podium top={top} onOpen={setOpenRow} />}

        <div className={styles.below}>
          {rest.length > 0 && (
            <ol className={styles.list} aria-label={t('top.restLabel')}>
              {rest.map((row) => (
                <RankRow key={row.rank} row={row} onOpen={setOpenRow} />
              ))}
            </ol>
          )}
          {board?.me && !isMeListed && (
            <ol className={styles.list} aria-label={t('top.myPlaceLabel')}>
              <RankRow row={withMyPal({ ...board.me, isMe: true })} onOpen={setOpenRow} />
            </ol>
          )}
          {isSignedIn && board?.myNickname && !board.me && (
            <p className={styles.empty}>{withParts(t('top.youAre'), { name: <strong>{board.myNickname}</strong> })}</p>
          )}

          {!isSignedIn && (
            <div className={styles.note}>
              <p className={styles.noteRow}>
                <Icon name="user" size={20} />
                <span>{withParts(t('top.signIn'), { link: <a href="#/settings">{t('top.signInLink')}</a> })}</span>
              </p>
            </div>
          )}

          <div className={styles.note}>
            <h2 className="game-title">{t('top.how')}</h2>
            <ul className={styles.rules}>
              <li>
                <Icon name="star" size={16} /> {t('top.perStar', { n: WEEKLY_POINTS.perNewStar })}
              </li>
              <li>
                <Icon name="calendar" size={16} /> {t('top.perDaily', { n: WEEKLY_POINTS.perDaily })}
              </li>
              <li>
                <Icon name="spark" size={16} /> {t('top.topTen', { n: SPARKS_FOR_TOP_TEN })}
              </li>
              {board && (
                <li>
                  <Icon name="restart" size={16} /> {t('top.newWeek', { when: timeUntil(board.endsAt, t) })}
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
      <BottomNav active="top" />
      {openRow && <PlayerCardDialog row={openRow} myScore={board?.me?.score ?? 0} onClose={() => setOpenRow(null)} />}
    </div>
  );
}
