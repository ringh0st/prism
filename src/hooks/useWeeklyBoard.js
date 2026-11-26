import { useEffect, useState } from 'react';
import { fetchWeeklyLeaderboard } from '../lib/economyApi.js';

// The last board loaded in this visit, and whose it was: shown at once when a page opens again, then refreshed.
let cached = { owner: null, board: null };

/**
 * This week's Top board, shared by the Top screen and the Me card. Shows the last board loaded for
 * the same player right away (stale-while-revalidate) and loads a fresh one whenever `refreshKey`
 * changes. `board` is null only before the first load finishes. `owner` is the account id (or
 * "guest"), so one player's board is never shown to another. `retry` loads it again after an error.
 */
export function useWeeklyBoard({ owner, refreshKey = '', isEnabled = true }) {
  const [state, setState] = useState(() => ({ owner, board: cached.owner === owner ? cached.board : null, error: null }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isEnabled) return undefined;
    let isCurrent = true;
    setState((previous) => ({ ...previous, error: null }));
    fetchWeeklyLeaderboard()
      .then((board) => {
        cached = { owner, board };
        if (isCurrent) setState({ owner, board, error: null });
      })
      .catch((error) => isCurrent && setState((previous) => ({ ...previous, error })));
    return () => {
      isCurrent = false;
    };
  }, [owner, refreshKey, isEnabled, attempt]);

  const isMine = state.owner === owner;
  const retry = () => setAttempt((count) => count + 1);
  return { board: isEnabled && isMine ? state.board : null, error: isMine ? state.error : null, retry };
}
