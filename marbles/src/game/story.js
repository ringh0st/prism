/**
 * What a shot did, in one short line, and which bag the point went to. The yard shows the line at the top and
 * flies the gain up from that bag, so a player can always see why a score changed (owner: "I don't understand
 * the logic … suddenly he wins").
 */
const otherSide = (side) => (side === 'you' ? 'foe' : 'you');
const whose = (name) => (name === 'You' ? 'your' : `${name}’s`);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * @param {object} result what `judge` returned
 * @param {'you'|'foe'} side who shot
 * @param {{you: string, foe: string}} names how each side is called ('You', 'Computer', 'Player 1'…)
 * @param {'ring'|'hole'|'chase'} mode
 * @returns {{head: string, gain: {side: string, text: string} | null}}
 */
export function tellShot(result, side, names, mode) {
  const who = names[side];
  const them = otherSide(side);
  const themName = names[them] === 'You' ? 'you' : names[them];
  const own = side === 'you' ? 'your' : 'its';
  const verb = mode === 'hole' ? 'sank' : 'knocked out';
  // Every marble that changed bags this shot is told, and each bag shows its own +/− (owner: "I don't understand
  // the logic … suddenly he wins"; a shot that won two and lost one used to tell only the loss).
  const gains = [];
  const parts = [];
  if (result.won && mode === 'chase') {
    parts.push(`${who} hit ${whose(names[them])} shooter! It goes back to its line.`);
  } else if (result.knocked) {
    parts.push(`${who} knocked ${whose(names[them])} shooter out of the ring!`);
  } else if (result.gold && result.won) {
    const more = result.won - 2;
    parts.push(`${who} ${verb} the golden marble! It's worth two${more > 0 ? `, and ${plural(more, 'marble')} more` : ''}.`);
  } else if (result.won) {
    parts.push(`${who} ${verb} ${plural(result.won, 'marble')}!`);
  }
  if (result.won) gains.push({ side, text: `+${result.won}` });
  if (result.lost) {
    const lostWhat = result.lost === 1 ? `${own} own marble, so it goes` : `${result.lost} of ${own} own marbles, so they go`;
    parts.push(result.won ? `But it also hit out ${lostWhat} to ${themName}.` : `${who} knocked out ${lostWhat} to ${themName}.`);
    gains.push({ side: them, text: `+${result.lost}` });
  }
  if (result.foul === 'out') {
    parts.push(`${who} rolled into the kerb without a hit: out! A marble for ${themName}.`);
    gains.push({ side: them, text: '+1' });
  } else if (result.foul) {
    parts.push(result.gaveBack ? `${who} fell into the Mor: one marble given back.` : `${who} fell into the Mor and comes back to the line.`);
    if (result.gaveBack) gains.push({ side, text: '−1' });
  }
  if (!parts.length) return { head: 'Missed.', gain: null, gains: [] };
  return { head: parts.join(' '), gain: gains[0] ?? null, gains };
}

/**
 * The line under the bags while a game runs: whose turn it is, a bonus shot, or the last turn of a round when
 * the other side has already reached the target (it is only decided once both have had the same turns).
 */
export function turnStatus(game, names, toWin) {
  if (game.winner) return null;
  const side = game.turn;
  const them = otherSide(side);
  const name = names[side] === 'You' ? 'Your' : `${names[side]}’s`;
  if (game.bag[them] >= toWin && game.turns[side] < game.turns[them]) {
    return {
      side,
      text: `${name} last turn: catch up to ${game.bag[them]}!`,
      urgent: true,
    };
  }
  if (game.run > 0) return { side, text: `${name} bonus shot` };
  return { side, text: `${name} turn` };
}
