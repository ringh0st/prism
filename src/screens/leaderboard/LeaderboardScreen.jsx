import { useEffect, useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { fetchWeeklyLeaderboard } from '../../lib/economyApi.js';
import { WEEKLY_POINTS, WEEKLY_REWARDS } from '../../game/catalog.js';
import Podium from './Podium.jsx';
import { stageOf } from '../../game/pals.js';
import PartnerSwitcher from '../pals/PartnerSwitcher.jsx';
import RankRow from './RankRow.jsx';
import styles from './LeaderboardScreen.module.css';

const SPARKS_FOR_TOP_TEN = WEEKLY_REWARDS.find((reward) => reward.rank === 4).sparks;
const BUNTING = ['var(--color-sage)', 'var(--color-honey)', 'var(--color-peach)', 'var(--color-mint)'];
const FLAGS = 12;

/** "in 3 days" / "in 5 hours": when the week resets. */
function timeUntil(endsAt) {
  const hours = Math.max(0, Math.round((new Date(endsAt) - Date.now()) / 3_600_000));
  if (hours >= 48) return `in ${Math.round(hours / 24)} days`;
  if (hours >= 1) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return 'soon';
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
      ? { ...row, pal: progress.pal.id, palStage: stageOf(progress.pal.owned[progress.pal.id]), accessory: progress.pal.accessory, nickname: progress.nickname ?? row.nickname }
      : row.isMe && progress.nickname
        ? { ...row, nickname: progress.nickname }
        : row;
  const top = board?.top.map(withMyPal) ?? [];
  const rest = top.filter((row) => row.rank > 3);
  const isMeListed = top.some((row) => row.isMe);
  const lumiLine = board?.me ? `You’re #${board.me.rank} this week. Keep shining!` : 'Who will shine brightest this week?';

  return (
    <div className={styles.page}>
      <ScreenHeader title="Top players" />
      <main className={styles.arena}>
        <Bunting />
        <div className={styles.host}>
          <Lumi mood="excited" size={86} line={lumiLine} />
        </div>

        <PartnerSwitcher />
        {error && <p className={styles.empty}>{error}</p>}
        {!board && !error && <p className={styles.empty}>Loading the board…</p>}
        {board && <Podium top={top} />}

        <div className={styles.below}>
          {rest.length > 0 && (
            <ol className={styles.list} aria-label="Places 4 and below">
              {rest.map((row) => (
                <RankRow key={row.rank} row={row} />
              ))}
            </ol>
          )}
          {board?.me && !isMeListed && (
            <ol className={styles.list} aria-label="Your place">
              <RankRow row={withMyPal({ ...board.me, isMe: true })} />
            </ol>
          )}
          {isSignedIn && board?.myNickname && !board.me && (
            <p className={styles.empty}>
              You’re <strong>{board.myNickname}</strong>. Earn a star to get on the board!
            </p>
          )}

          {!isSignedIn && (
            <div className={styles.note}>
              <p className={styles.noteRow}>
                <Icon name="user" size={20} />
                <span>
                  <a href="#/settings">Sign in with Google</a> to join. You appear under a fun nickname, never your real name.
                </span>
              </p>
            </div>
          )}

          <div className={styles.note}>
            <h2 className="game-title">How points work</h2>
            <ul className={styles.rules}>
              <li>
                <Icon name="star" size={16} /> +{WEEKLY_POINTS.perNewStar} for every new star
              </li>
              <li>
                <Icon name="calendar" size={16} /> +{WEEKLY_POINTS.perDaily} for each daily puzzle
              </li>
              <li>
                <Icon name="spark" size={16} /> Places 4–10 win {SPARKS_FOR_TOP_TEN} sparks
              </li>
              {board && (
                <li>
                  <Icon name="restart" size={16} /> New week {timeUntil(board.endsAt)} (Monday, 00:00 UTC)
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
      <BottomNav active="top" />
    </div>
  );
}
