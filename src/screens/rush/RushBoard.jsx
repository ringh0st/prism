import { useEffect, useState } from 'react';
import { usePlayer } from '../../state/PlayerContext.jsx';
import { fetchRushBoard } from '../../lib/economyApi.js';
import { RUSH_LENGTH } from '../../game/rush.js';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { withParts } from '../../i18n/extrasText.js';
import styles from './Rush.module.css';

/** This week's best Light Rush runs, under public nicknames. Signed-in players take part. */
export default function RushBoard() {
  const { isSignedIn, progress } = usePlayer();
  const { t } = useI18n();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const best = progress.rush?.best ?? 0;

  useEffect(() => {
    let isCurrent = true;
    fetchRushBoard()
      .then((data) => isCurrent && setBoard(data))
      .catch(() => isCurrent && setError('rush.board.error'));
    return () => {
      isCurrent = false;
    };
  }, [best]);

  return (
    <section className={styles.card} aria-labelledby="rush-board">
      <h3 id="rush-board">{t('rush.board.title')}</h3>
      {error && <p className={styles.muted}>{t(error)}</p>}
      {board && board.top.length === 0 && <p className={styles.muted}>{t('rush.board.empty')}</p>}
      {board && board.top.length > 0 && (
        <ol className={styles.board}>
          {board.top.map((row) => (
            <li key={`${row.rank}-${row.nickname}`} className={row.isMe ? styles.me : ''}>
              <span className={`game-title ${styles.rank}`}>{row.rank}</span>
              <span className={styles.nickname}>{row.isMe ? t('rush.board.you', { name: row.nickname }) : row.nickname}</span>
              <span className={styles.score}>
                <strong className="game-title">{row.best}</strong>/{RUSH_LENGTH}
              </span>
            </li>
          ))}
        </ol>
      )}
      {!isSignedIn && (
        <p className={styles.muted}>{withParts(t('rush.board.signIn'), { link: <a href="#/settings">{t('rush.board.signInLink')}</a> })}</p>
      )}
    </section>
  );
}
