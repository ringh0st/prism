// Challenges for one player: a yard laid out by hand, a number of marbles to win and only so many shots.
// Stars: three for doing it in `par` shots, two for one more, one for any win.
import { makeMarble } from './physics.js';
import { YARD, newGame } from './rules.js';

const C = { x: YARD.w / 2, y: YARD.h / 2 };
const glass = (list) => list.map(([x, y], i) => makeMarble(`t${i + 1}`, 'glass', x, y));
const ring = { ...C, r: 112 };
const hole = { ...C, r: 28 };

export const CHALLENGES = [
  { id: 'first', name: 'First flick', mode: 'ring', need: 1, shots: 3, par: 1, ring, marbles: glass([[180, 280]]), tip: 'Pull back, aim, let go. Knock it out of the ring!' },
  { id: 'pair', name: 'Two in a row', mode: 'ring', need: 2, shots: 3, par: 1, ring, marbles: glass([[180, 305], [180, 245]]), tip: 'One marble can send the next one flying.' },
  { id: 'mor', name: 'Into the hole', mode: 'hole', need: 1, shots: 3, par: 1, hole, marbles: glass([[180, 350]]), tip: 'Not too hard: a fast marble skips over the hole.' },
  { id: 'pebbles', name: 'Pebble road', mode: 'ring', need: 2, shots: 3, par: 2, ring, marbles: glass([[160, 280], [205, 265]]), stones: [{ x: 180, y: 420, r: 13 }, { x: 140, y: 405, r: 10 }, { x: 222, y: 410, r: 11 }], calls: { bakol: 1, bagova: 0 }, tip: 'Pebbles in the way? Call “Sweep!” to clear them off.' },
  { id: 'over', name: 'Over the top', mode: 'chase', need: 1, shots: 2, par: 1, foe: [180, 250], stones: [{ x: 130, y: 330, r: 13 }, { x: 156, y: 334, r: 13 }, { x: 182, y: 336, r: 13 }, { x: 208, y: 334, r: 13 }, { x: 234, y: 330, r: 13 }], calls: { bakol: 0, bagova: 1 }, tip: 'Call “High shot!” to fly over the wall.' },
  { id: 'sand', name: 'Sand trap', mode: 'hole', need: 2, shots: 5, par: 2, hole, marbles: glass([[150, 318], [236, 252]]), sand: [{ x: 160, y: 420, r: 42 }], tip: 'Sand stops a marble fast. Hit a bit harder through it.' },
  { id: 'break', name: 'The break', mode: 'ring', need: 4, shots: 3, par: 2, ring, marbles: glass([[180, 280], [211, 280], [149, 280], [180, 311], [180, 249], [242, 280], [118, 280], [180, 342], [180, 218]]), tip: 'A hard shot into the pack scatters it.' },
  { id: 'gentle', name: 'Soft hands', mode: 'hole', need: 2, shots: 4, par: 2, hole, marbles: glass([[160, 330], [203, 330]]), tip: 'Close to the hole a gentle push is enough.' },
  { id: 'sniper', name: 'Sniper', mode: 'chase', need: 1, shots: 2, par: 1, foe: [60, 90], stones: [{ x: 110, y: 200, r: 14 }, { x: 40, y: 230, r: 12 }, { x: 170, y: 150, r: 12 }], tip: 'A long shot through the gap.' },
  { id: 'sweep', name: 'Clean sweep', mode: 'ring', need: 5, shots: 5, par: 3, ring, marbles: glass([[130, 240], [230, 240], [180, 280], [130, 320], [230, 320]]), tip: 'Use where your shooter stops for the next shot.' },
  { id: 'triple', name: 'Three in the hole', mode: 'hole', need: 3, shots: 7, par: 3, hole, marbles: glass([[158, 338], [206, 334], [112, 262]]), stones: [{ x: 150, y: 420, r: 12 }, { x: 262, y: 340, r: 11 }], calls: { bakol: 1, bagova: 1 }, tip: 'Plan each shot: the pebbles change the angles.' },
  { id: 'grand', name: 'The big yard', mode: 'ring', need: 6, shots: 5, par: 4, ring, marbles: glass([[180, 280], [211, 280], [149, 280], [180, 311], [180, 249], [242, 280], [118, 280], [180, 342], [180, 218]]), stones: [{ x: 90, y: 430, r: 12 }, { x: 270, y: 420, r: 13 }], sand: [{ x: 180, y: 150, r: 44 }], calls: { bakol: 1, bagova: 1 }, tip: 'Everything you know, in one yard.' },
];

export const starsFor = (challenge, shotsUsed) => (shotsUsed <= challenge.par ? 3 : shotsUsed <= challenge.par + 1 ? 2 : 1);

/** A game of a challenge: only you shoot. */
export function newChallenge(challenge, shooter = 'shooter') {
  const game = newGame(challenge.mode, { seed: 1, shooters: { you: shooter, foe: 'shooter' }, stones: 0 });
  const you = game.world.marbles.find((m) => m.id === 'you');
  const foe = game.world.marbles.find((m) => m.id === 'foe');
  // In a chase challenge the other shooter is the thing to hit; in the others it isn't there.
  if (challenge.foe) Object.assign(foe, { x: challenge.foe[0], y: challenge.foe[1] });
  game.world.marbles = [you, ...(challenge.foe ? [foe] : []), ...(challenge.marbles ?? []).map((m) => ({ ...m }))];
  game.world.ring = challenge.ring ?? null;
  game.world.hole = challenge.hole ?? null;
  game.world.stones = (challenge.stones ?? []).map((s) => ({ ...s }));
  game.world.sand = (challenge.sand ?? []).map((s) => ({ ...s }));
  game.calls.you = { bakol: 0, bagova: 0, ...challenge.calls };
  game.challenge = challenge;
  return game;
}
