import { useEffect, useState } from 'react';
import { fetchWeeklyLeaderboard } from '../lib/economyApi.js';

// The last board loaded in this visit, and whose it was: shown at once when a page opens again, then refreshed.
let cached = { owner: null, board: null };

/**
 * This week's Top board, shared by the Top screen and the Me card. Shows the last board loaded for
 * the same player right away (stale-while-revalidate) and loads a fresh one whenever `refreshKey`
 * changes. `board` is null only before the first load finishes. `owner` is the account id (or
 * "guest"), so one player's board is never shown to another.
 */
export function useWeeklyBoard({ owner, refreshKey = '', isEnabled = true }) {
  const [state, setState] = useState(() => ({ owner, board: cached.owner === owner ? cached.board : null, error: null }));

  useEffect(() => {
    if (!isEnabled) return undefined;
    let isCurrent = true;
    fetchWeeklyLeaderboard()
      .then((board) => {
        cached = { owner, board };
        if (isCurrent) setState({ owner, board, error: null });
      })
      .catch((error) => isCurrent && setState((previous) => ({ ...previous, error })));
    return () => {
      isCurrent = false;
    };
  }, [owner, refreshKey, isEnabled]);

  const isMine = state.owner === owner;
  return { board: isEnabled && isMine ? state.board : null, error: isMine ? state.error : null };
}
