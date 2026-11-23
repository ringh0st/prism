import test from 'node:test';
import assert from 'node:assert/strict';
import { cloneWorld, flick, isAtRest, makeMarble, settle } from './physics.js';
import { MODES, YARD, newGame, shoot, tryShot } from './rules.js';
import { pickShot } from './ai.js';

const yard = (marbles, extra = {}) => ({ ...YARD, marbles, stones: [], sand: [], hole: null, ring: null, ...extra });

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
  shoot(a, -1.5, 0.8);
  shoot(b, -1.5, 0.8);
  assert.deepEqual(a.world.marbles, b.world.marbles);
});

test('ring: a marble knocked out of the circle is won and gives another turn; a miss passes the turn', () => {
  const game = newGame('ring', { seed: 3, stones: 0 });
  const hit = shoot(game, -Math.PI / 2, 0.95);
  assert.ok(hit.won >= 1, 'a hard straight shot knocks at least one out');
  assert.equal(game.turn, 'you');
  assert.equal(game.bag.you, hit.won);
  const miss = shoot(game, 0, 0.1);
  assert.equal(miss.won, 0);
  assert.equal(game.turn, 'foe');
});

test('hole: a slow marble drops in, a fast one skips over, and the shooter in the hole is a foul', () => {
  const hole = { x: 180, y: 280, r: 28 };
  const slow = yard([makeMarble('a', 'glass', 180, 380)], { hole });
  flick(slow.marbles[0], -Math.PI / 2, 0.12);
  settle(slow);
  assert.ok(slow.marbles[0].sunk);
  const fast = yard([makeMarble('a', 'glass', 180, 380)], { hole });
  flick(fast.marbles[0], -Math.PI / 2, 1);
  settle(fast);
  assert.ok(!fast.marbles[0].sunk);

  const game = newGame('hole', { seed: 2, stones: 0 });
  // Only one target is left, far from the hole, so the game isn't over.
  game.world.marbles = game.world.marbles.filter((m) => m.owner || m.id === 't1');
  Object.assign(game.world.marbles.find((m) => m.id === 't1'), { x: 40, y: 150 });
  game.bag.you = 2;
  const you = game.world.marbles.find((m) => m.id === 'you');
  Object.assign(you, { x: 180, y: 380 });
  const result = shoot(game, -Math.PI / 2, 0.12);
  assert.equal(result.foul, 'mor');
  assert.equal(game.bag.you, 1);
  assert.equal(game.turn, 'foe');
});

test('chase: hitting the other shooter wins a marble', () => {
  const game = newGame('chase', { seed: 1, stones: 0 });
  const result = shoot(game, -Math.PI / 2, 0.9);
  assert.equal(result.won, 1);
  assert.equal(game.bag.you, 1);
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
    for (let attempt = 0; attempt < 12 && !won; attempt++) {
      const game = newChallenge(challenge);
      let seed = 3 + attempt * 97;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      if (game.calls.you.bakol) callBakol(game, 'you');
      while (!game.winner) {
        // A high shot when a call for it is left and low shots find nothing.
        let shot = pickShot(game, 'you', 'hard', rnd);
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
