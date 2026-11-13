import { dailyNumber } from './daily.js';
import { MAX_STARS } from './scoring.js';

const MOVE_AT_OR_UNDER_PAR = '🟩';
const MOVE_OVER_PAR = '🟨';

/**
 * Spoiler-free daily result, in the spirit of Wordle's emoji grid:
 * stars, one square per move (green up to par, yellow beyond it) and the streak.
 */
export function dailyShareText({ dateKey, stars, moves, par, streak, url }) {
  const starLine = '★'.repeat(stars) + '☆'.repeat(MAX_STARS - stars);
  const squares = Array.from({ length: moves }, (_, i) => (i < par ? MOVE_AT_OR_UNDER_PAR : MOVE_OVER_PAR)).join('');
  const lines = [`Rinny's Prism Daily #${dailyNumber(dateKey)} ${starLine}`, `${squares} ${moves}/${par}`];
  if (streak > 1) lines.push(`🔥 ${streak}-day streak`);
  lines.push(url);
  return lines.join('\n');
}
