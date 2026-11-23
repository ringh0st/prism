import test from 'node:test';
import assert from 'node:assert/strict';
import { GROUNDS, SWEPT_EARTH, cloneWorld, flick, isAtRest, makeMarble, settle, strayOf } from './physics.js';
import { MODES, YARD, newGame, shoot, tryShot } from './rules.js';
import { pickShot } from './ai.js';

const yard = (marbles, extra = {}) => ({ ...YARD, ground: SWEPT_EARTH, marbles, stones: [], sand: [], hole: null, ring: null, ...extra });
const roll = (ground, power = 0.6, angle = -Math.PI / 2) => {
  const world = yard([makeMarble('a', 'glass', 180, 500)], { ground: GROUNDS[ground] });
  flick(world.marbles[0], angle, power);
  settle(world);
  return world.marbles[0];
};

test('a flicked marble rolls, slows down and stops', () => {
  const world = yard([makeMarble('a', 'glass', 180, 500)]);
  flick(world.marbles[0], -Math.PI / 2, 0.4);
  settle(world);
  assert.ok(isAtRest(world));
  assert.ok(world.marbles[0].y < 420, 'it went up the yard');
});

test('a straight hit passes the speed on: the target goes, the same-weight shooter nearly stops', () => {
  const world = yard([makeMarble('a', 'glass', 180, 400), makeMarble('b', 'glass', 180, 300)]);
  flick(world.marbles[0], -Math.PI / 2, 0.5);
  const events = settle(world);
  assert.ok(events.some((e) => e.type === 'clack'));
  assert.ok(world.marbles[1].y < 200, 'the target was sent on');
  assert.ok(world.marbles[0].y > 290, 'the shooter stayed about where it hit');
});

test('the same shot always ends the same way', () => {
  const a = newGame('ring', { seed: 7 });
  const b = newGame('ring', { seed: 7 });
  assert.equal(a.turn, b.turn, 'the same seed draws the same side to start');
  shoot(a, -1.5, 0.8);
  shoot(b, -1.5, 0.8);
  assert.deepEqual(a.world.marbles, b.world.marbles);
});

test('ring: knocking out one of theirs wins it and gives another turn from the line; knocking out your own gives it to them', () => {
  const lay = (team) => {
    const game = newGame('ring', { seed: 3, stones: 0 });
    game.turn = 'you';
    game.world.marbles = game.world.marbles.filter((m) => m.owner || m.id === 't1' || m.id === 't2');
    Object.assign(game.world.marbles.find((m) => m.id === 't1'), { x: 180, y: 180, team });
    Object.assign(game.world.marbles.find((m) => m.id === 't2'), { x: 60, y: 280, team: 'foe' });
    Object.assign(game.world.marbles.find((m) => m.id === 'you'), { x: 180, y: 300 });
    return game;
  };
  const theirs = lay('foe');
  const hit = shoot(theirs, -Math.PI / 2, 1);
  assert.equal(hit.won, 1);
  assert.equal(theirs.bag.you, 1);
  assert.equal(theirs.turn, 'you', 'a good shot earns one bonus shot');
  assert.ok(hit.again);
  assert.ok(theirs.world.marbles.find((m) => m.id === 'you').y > 480, 'the shooter is back at its line for the next shot');
  const miss = shoot(theirs, 0, 0.1);
  assert.equal(miss.won, 0);
  assert.equal(theirs.turn, 'foe');
  assert.deepEqual(theirs.turns, { you: 1, foe: 0 });

  const mine = lay('you');
  const oops = shoot(mine, -Math.PI / 2, 1);
  assert.equal(oops.lost, 1);
  assert.equal(mine.bag.foe, 1);
  assert.equal(mine.turn, 'foe');
});

test('hole: a slow marble drops in, a fast one skips over, and the shooter in the hole is a foul', () => {
  const hole = { x: 180, y: 280, r: 28 };
  const slow = yard([makeMarble('a', 'glass', 180, 330)], { hole });
  flick(slow.marbles[0], -Math.PI / 2, 0.12);
  settle(slow);
  assert.ok(slow.marbles[0].sunk);
  const fast = yard([makeMarble('a', 'glass', 180, 330)], { hole });
  flick(fast.marbles[0], -Math.PI / 2, 1);
  settle(fast);
  assert.ok(!fast.marbles[0].sunk);

  const game = newGame('hole', { seed: 2, stones: 0 });
  game.turn = 'you';
  // Only one target is left, far from the hole, so the game isn't over.
  game.world.marbles = game.world.marbles.filter((m) => m.owner || m.id === 't1');
  Object.assign(game.world.marbles.find((m) => m.id === 't1'), { x: 40, y: 150 });
  game.bag.you = 2;
  Object.assign(game.world.marbles.find((m) => m.id === 'you'), { x: 180, y: 330 });
  const result = shoot(game, -Math.PI / 2, 0.12);
  assert.equal(result.foul, 'mor');
  assert.equal(game.bag.you, 1);
  assert.equal(game.turn, 'foe');
});

test('chase: hitting the other shooter wins a marble, and it is put down again far away', () => {
  const game = newGame('chase', { seed: 1, stones: 0 });
  game.turn = 'you';
  game.world.sand = [];
  const you = game.world.marbles.find((m) => m.id === 'you');
  const foe = game.world.marbles.find((m) => m.id === 'foe');
  Object.assign(you, { x: 180, y: 400 });
  Object.assign(foe, { x: 180, y: 250 });
  const result = shoot(game, -Math.PI / 2, 0.8);
  assert.equal(result.won, 1);
  assert.equal(game.bag.you, 1);
  assert.ok(Math.abs(foe.y - you.y) > 120, 'the hit shooter starts again on the other half');
});

test('a high shot flies over a pebble that stops a low one', () => {
  const stone = { x: 180, y: 430, r: 14 };
  const low = yard([makeMarble('a', 'glass', 180, 500)], { stones: [stone] });
  flick(low.marbles[0], -Math.PI / 2, 0.6);
  settle(low);
  const high = yard([makeMarble('a', 'glass', 180, 500)], { stones: [stone] });
  flick(high.marbles[0], -Math.PI / 2, 0.6, { high: true });
  settle(high);
  assert.ok(low.marbles[0].y > 430, 'the low shot bounced back');
  assert.ok(high.marbles[0].y < 400, 'the high shot went over');
});

test('the computer finds a winning shot in every mode and games can be played to the end', () => {
  for (const mode of Object.keys(MODES)) {
    const game = newGame(mode, { seed: 5 });
    let seed = 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 300 && !game.winner; i++) {
      const shot = pickShot(game, game.turn, 'hard', rnd);
      shoot(game, shot.angle, shot.power);
    }
    assert.ok(game.winner, `${mode} ends with a winner`);
  }
});

test('trying a shot leaves the game untouched', () => {
  const game = newGame('ring', { seed: 4 });
  const before = JSON.stringify(cloneWorld(game.world));
  tryShot(game, -1.4, 0.9);
  assert.equal(JSON.stringify(game.world), before);
  assert.equal(game.shots, 0);
});

test('every challenge can be won within its shots (the computer finds a way)', async () => {
  const { CHALLENGES, newChallenge } = await import('./challenges.js');
  const { callBakol } = await import('./rules.js');
  for (const challenge of CHALLENGES) {
    let won = false;
    for (let attempt = 0; attempt < 30 && !won; attempt++) {
      const game = newChallenge(challenge);
      let seed = 3 + attempt * 97;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      if (game.calls.you.bakol) callBakol(game, 'you');
      while (!game.winner) {
        // A high shot when a call for it is left and low shots find nothing.
        let shot = pickShot(game, 'you', 'sure', rnd);
        let high = false;
        if (game.calls.you.bagova > 0 && tryShot(game, shot.angle, shot.power).won === 0) {
          for (let i = 0; i < 40; i++) {
            const you = game.world.marbles.find((m) => m.id === 'you');
            const aim = game.world.marbles.find((m) => m.id === 'foe') ?? game.world.marbles.find((m) => !m.owner && !m.out && !m.sunk);
            const angle = Math.atan2(aim.y - you.y, aim.x - you.x) + (rnd() - 0.5) * 0.1;
            const power = 0.3 + rnd() * 0.7;
            if (tryShot(game, angle, power, { high: true }).won > 0) {
              shot = { angle, power };
              high = true;
              break;
            }
          }
        }
        shoot(game, shot.angle, shot.power, { high });
      }
      won = game.winner === 'you';
    }
    assert.ok(won, `${challenge.name} can be won`);
  }
});

test('every ground rolls its own way', () => {
  const far = (ground) => 500 - roll(ground).y;
  assert.ok(far('sand') < far('earth') * 0.7, 'sand stops a marble much sooner than earth');
  assert.ok(far('asphalt') > far('earth') * 1.2 || roll('asphalt').y > 60, 'asphalt lets it roll farther (or bounce back off the far kerb)');
  assert.ok(Math.abs(roll('grass').x - 180) > 4, 'grass bends a straight shot');
  assert.equal(Math.round(roll('earth').x), 180, 'earth keeps it straight');
  assert.ok(roll('hill', 0.35).y > roll('earth', 0.35).y, 'uphill on the slope it gets less far');
});

test('a harder flick may stray more', () => {
  assert.ok(strayOf(1) > strayOf(0.3) * 3);
});

test('ring: a shooter left in the ring can be knocked out, and that costs its side a marble', () => {
  const game = newGame('ring', { seed: 2, stones: 0 });
  game.turn = 'you';
  game.world.marbles = game.world.marbles.filter((m) => m.owner || m.id === 't1');
  Object.assign(game.world.marbles.find((m) => m.id === 't1'), { x: 60, y: 280 });
  const foe = game.world.marbles.find((m) => m.id === 'foe');
  Object.assign(foe, { x: 180, y: 190 });
  game.inRing.foe = true;
  game.bag.foe = 2;
  Object.assign(game.world.marbles.find((m) => m.id === 'you'), { x: 180, y: 330 });
  const result = shoot(game, -Math.PI / 2, 0.9);
  assert.ok(result.knocked);
  assert.equal(game.bag.foe, 1);
  assert.equal(game.bag.you, 1);
  assert.equal(game.turn, 'you');
});

test('chase: a wild shot into the kerb is out, and gives the other side a marble', () => {
  const game = newGame('chase', { seed: 1, stones: 0 });
  game.turn = 'you';
  game.world.sand = [];
  Object.assign(game.world.marbles.find((m) => m.id === 'you'), { x: 180, y: 400 });
  Object.assign(game.world.marbles.find((m) => m.id === 'foe'), { x: 60, y: 100 });
  const result = shoot(game, -Math.PI / 2, 1);
  assert.equal(result.foul, 'out');
  assert.equal(game.bag.foe, 1);
  assert.equal(game.turn, 'foe');
});

test('fair turns: one bonus shot at most, and the side that shot second always gets its turn to answer', () => {
  const hitGame = () => {
    const game = newGame('chase', { seed: 1, stones: 0 });
    game.world.sand = [];
    return game;
  };
  const line = (game, side) => {
    const me = game.world.marbles.find((m) => m.id === side);
    const them = game.world.marbles.find((m) => m.id !== side && m.owner);
    Object.assign(me, { x: 180, y: 380 });
    Object.assign(them, { x: 180, y: 260 });
    return shoot(game, -Math.PI / 2, 0.7);
  };
  // 'you' start, hit, take the bonus shot and hit again: the turn passes all the same.
  const game = hitGame();
  game.turn = 'you';
  assert.ok(line(game, 'you').again);
  assert.ok(!line(game, 'you').again, 'no third shot in one turn');
  assert.equal(game.turn, 'foe');
  // 'you' reach the target of three in the next turn; 'foe' have had one turn fewer, so the game goes on.
  game.bag.you = 2;
  game.turn = 'you';
  game.turns = { you: 1, foe: 0 };
  line(game, 'you');
  assert.equal(game.bag.you, 3);
  assert.equal(game.winner, null, 'the other side still answers');
  assert.equal(game.turn, 'foe');
  // 'foe' miss their answer: now the round is over and 'you' win.
  game.turns = { you: 2, foe: 1 };
  shoot(game, 0, 0.1);
  assert.equal(game.winner, 'you');
});
