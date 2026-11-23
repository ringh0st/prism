/**
 * What a shot did, in one short line, and which bag the point went to. The yard shows the line at the top and
 * flies the gain up from that bag, so a player can always see why a score changed (owner: "I don't understand
 * the logic … suddenly he wins").
 */
const otherSide = (side) => (side === "you" ? "foe" : "you");
const whose = (name) => (name === "You" ? "your" : `${name}’s`);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

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
  if (result.lost) {
    return {
      head: `${who} knocked out ${whose(who)} own marble, so it goes to ${names[them] === "You" ? "you" : names[them]}.`,
      gain: { side: them, text: `+${result.lost}` },
    };
  }
  if (result.foul === "out")
    return {
      head: `${who} rolled into the kerb without a hit: out! A marble for ${names[them] === "You" ? "you" : names[them]}.`,
      gain: { side: them, text: "+1" },
    };
  if (result.foul)
    return {
      head: `${who} fell into the Mor: one marble given back.`,
      gain: { side, text: "−1" },
    };
  if (result.won && mode === "chase") {
    return {
      head: `${who} hit ${whose(names[them])} shooter! It goes back to its line.`,
      gain: { side, text: "+1" },
    };
  }
  if (result.knocked)
    return {
      head: `${who} knocked ${whose(names[them])} shooter out of the ring!`,
      gain: { side, text: `+${result.won}` },
    };
  if (result.won) {
    const verb = mode === "hole" ? "sank" : "knocked out";
    return {
      head: `${who} ${verb} ${plural(result.won, "marble")}!`,
      gain: { side, text: `+${result.won}` },
    };
  }
  return { head: "Missed.", gain: null };
}

/**
 * The line under the bags while a game runs: whose turn it is, a bonus shot, or the last turn of a round when
 * the other side has already reached the target (it is only decided once both have had the same turns).
 */
export function turnStatus(game, names, toWin) {
  if (game.winner) return null;
  const side = game.turn;
  const them = otherSide(side);
  const name = names[side] === "You" ? "Your" : `${names[side]}’s`;
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
