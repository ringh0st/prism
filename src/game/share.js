import { dailyNumber } from './daily.js';
import { MAX_STARS } from './scoring.js';
import { translate } from '../i18n/translate.js';

const MOVE_AT_OR_UNDER_PAR = '🟩';
const MOVE_OVER_PAR = '🟨';
const english = (key, params) => translate('en', key, params);

/**
 * Spoiler-free daily result, in the spirit of Wordle's emoji grid:
 * stars, one square per move (green up to par, yellow beyond it) and the streak. `t` (from useI18n)
 * gives the words in the player's language; English by default.
 */
export function dailyShareText({ dateKey, stars, moves, par, streak, url, t = english }) {
  const starLine = '★'.repeat(stars) + '☆'.repeat(MAX_STARS - stars);
  const squares = Array.from({ length: moves }, (_, i) => (i < par ? MOVE_AT_OR_UNDER_PAR : MOVE_OVER_PAR)).join('');
  const lines = [t('challenge.daily.title', { number: dailyNumber(dateKey), stars: starLine }), `${squares} ${moves}/${par}`];
  if (streak > 1) lines.push(t('challenge.daily.streak', { n: streak }));
  lines.push(url);
  return lines.join('\n');
}
