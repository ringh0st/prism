import { useEffect, useState } from 'react';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { fetchRushBoard } from '../../lib/economyApi.js';
import { RUSH_LENGTH } from '../../game/rush.js';
import styles from './Rush.module.css';

/** This week's best Light Rush runs, under public nicknames. Signed-in players take part. */
export default function RushBoard() {
  const { isSignedIn, progress } = usePlayer();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const best = progress.rush?.best ?? 0;

  useEffect(() => {
    let isCurrent = true;
    fetchRushBoard()
      .then((data) => isCurrent && setBoard(data))
      .catch(() => isCurrent && setError('The board isn’t available right now.'));
    return () => {
      isCurrent = false;
    };
  }, [best]);

  return (
    <section className={styles.card} aria-labelledby="rush-board">
      <h3 id="rush-board">This week’s best runs</h3>
      {error && <p className={styles.muted}>{error}</p>}
      {board && board.top.length === 0 && <p className={styles.muted}>No runs yet this week. Be the first on the board!</p>}
      {board && board.top.length > 0 && (
        <ol className={styles.board}>
          {board.top.map((row) => (
            <li key={`${row.rank}-${row.nickname}`} className={row.isMe ? styles.me : ''}>
              <span className={`game-title ${styles.rank}`}>{row.rank}</span>
              <span className={styles.nickname}>{row.isMe ? `${row.nickname} (you)` : row.nickname}</span>
              <span className={styles.score}>
                <strong className="game-title">{row.best}</strong>/{RUSH_LENGTH}
              </span>
            </li>
          ))}
        </ol>
      )}
      {!isSignedIn && (
        <p className={styles.muted}>
          <a href="#/settings">Sign in</a> to put your best run on the board.
        </p>
      )}
    </section>
  );
}
