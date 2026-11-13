import { useEffect, useState } from 'react';
import ScreenHeader from '../../components/game/ScreenHeader.jsx';
import BottomNav from '../../components/game/BottomNav.jsx';
import Panel from '../../components/game/Panel.jsx';
import Lumi from '../../components/game/Lumi.jsx';
import Icon from '../../components/Icon.jsx';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { fetchWeeklyLeaderboard } from '../../lib/economyApi.js';
import { WEEKLY_POINTS, WEEKLY_REWARDS } from '../../game/catalog.js';
import RankRow from './RankRow.jsx';
import styles from './LeaderboardScreen.module.css';

const PODIUM = WEEKLY_REWARDS.filter((reward) => reward.diamonds > 0);
const SPARKS_FOR_TOP_TEN = WEEKLY_REWARDS.find((reward) => reward.rank === 4).sparks;

/** "in 3 days" / "in 5 hours": when the week resets. */
function timeUntil(endsAt) {
  const hours = Math.max(0, Math.round((new Date(endsAt) - Date.now()) / 3_600_000));
  if (hours >= 48) return `in ${Math.round(hours / 24)} days`;
  if (hours >= 1) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return 'soon';
}

/** This week's top players worldwide, with the rewards for the top 10. */
export default function LeaderboardScreen() {
  const { isSignedIn, progress } = usePlayer();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');

  // Reload when the player's stars change, so their own score is fresh.
  const starCount = Object.keys(progress.levels).length;
  useEffect(() => {
    let isCurrent = true;
    fetchWeeklyLeaderboard()
      .then((data) => isCurrent && setBoard(data))
      .catch((loadError) => isCurrent && setError(loadError.message));
    return () => {
      isCurrent = false;
    };
  }, [isSignedIn, starCount]);

  const isMeInTop = board?.top.some((row) => row.isMe);

  return (
    <div className={styles.page}>
      <ScreenHeader title="Top players" />
      <main className={styles.main}>
        <div className={styles.keeper}>
          <Lumi mood="excited" size={56} line="Who will shine brightest this week?" />
        </div>

        <Panel className={styles.rules}>
          <h2 className="game-title">This week</h2>
          <p>
            Earn <strong>+{WEEKLY_POINTS.perNewStar}</strong> for every new star and <strong>+{WEEKLY_POINTS.perDaily}</strong> for each daily puzzle.
            {board && <> The week resets {timeUntil(board.endsAt)} (Monday, 00:00 UTC).</>}
          </p>
          <ul className={styles.prizes} aria-label="Rewards">
            {PODIUM.map((reward) => (
              <li key={reward.rank} className={`${styles.prize} ${styles[`place${reward.rank}`]}`}>
                <span className={`game-title ${styles.prizeRank}`}>#{reward.rank}</span>
                <span>
                  <Icon name="diamond" size={14} /> {reward.diamonds}
                </span>
                <span>
                  <Icon name="spark" size={14} /> {reward.sparks}
                </span>
              </li>
            ))}
            <li className={styles.prize}>
              <span className={`game-title ${styles.prizeRank}`}>#4–10</span>
              <span>
                <Icon name="spark" size={14} /> {SPARKS_FOR_TOP_TEN}
              </span>
            </li>
          </ul>
        </Panel>

        {!isSignedIn && (
          <Panel className={styles.join}>
            <Icon name="user" size={20} />
            <p>
              <a href="#/settings">Sign in with Google</a> to join the board. You appear under a fun nickname, never your real name.
            </p>
          </Panel>
        )}

        {error && <p className={styles.empty}>{error}</p>}
        {!board && !error && <p className={styles.empty}>Loading the board…</p>}
        {board && board.top.length === 0 && <p className={styles.empty}>No one has scored yet this week. Be the first!</p>}
        {board && board.top.length > 0 && (
          <ol className={styles.list} aria-label="This week's top players">
            {board.top.map((row) => (
              <RankRow key={row.rank} row={row} />
            ))}
          </ol>
        )}
        {board?.me && !isMeInTop && (
          <ol className={styles.list} aria-label="Your place">
            <RankRow row={{ ...board.me, isMe: true }} />
          </ol>
        )}
        {isSignedIn && board?.myNickname && !board.me && (
          <p className={styles.empty}>
            You’re <strong>{board.myNickname}</strong>. Earn a star to get on the board!
          </p>
        )}
      </main>
      <BottomNav active="top" />
    </div>
  );
}
