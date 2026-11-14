import { nicknameProblem } from './nicknames.js';

/*
 * "Beat my score" challenges: a link to one built-in level with the sender's moves and (optionally)
 * their public nickname, e.g. #/challenge/w4-06/5/Sunny%20Otter. Everything is in the link, so there
 * is nothing to save: the friend plays the level and sees who won.
 */
const LEVEL_ID = /^w\d{1,2}-\d{2}$/;
const MAX_MOVES = 99;

/** The hash route for a challenge. Names that break the nickname rules are left out. */
export function challengePath(levelId, moves, name = null) {
  const safeName = name && !nicknameProblem(name) ? `/${encodeURIComponent(name.trim())}` : '';
  return `#/challenge/${levelId}/${moves}${safeName}`;
}

/** Reads a challenge from route params, or null if the link is broken. The name falls back to null. */
export function parseChallenge([levelId, rawMoves, rawName] = []) {
  const moves = Number(rawMoves);
  if (!LEVEL_ID.test(levelId ?? '') || !Number.isInteger(moves) || moves < 1 || moves > MAX_MOVES) return null;
  const name = rawName && !nicknameProblem(rawName) ? rawName.trim().replace(/\s+/g, ' ') : null;
  return { levelId, moves, name };
}

/** 'win' (fewer moves than the challenger), 'tie' or 'lose'. */
export const challengeOutcome = (myMoves, theirMoves) => (myMoves < theirMoves ? 'win' : myMoves === theirMoves ? 'tie' : 'lose');

/** The message sent with a challenge link. */
export const challengeMessage = (levelLabel, moves, url) => `I solved Lumipals level ${levelLabel} in ${moves} moves. Can you beat me? 💡 ${url}`;
