import test from 'node:test';
import assert from 'node:assert/strict';
import { tellShot, turnStatus } from './story.js';

const names = { you: 'You', foe: 'Computer' };

test('says who hit whom in the Chase, and gives the point to the shooter', () => {
  const told = tellShot({ won: 1 }, 'foe', names, 'chase');
  assert.equal(told.head, 'Computer hit your shooter! It goes back to its line.');
  assert.deepEqual(told.gain, { side: 'foe', text: '+1' });
});
test('gives an own marble knocked out to the other side', () => {
  assert.deepEqual(tellShot({ won: 0, lost: 1 }, 'you', names, 'ring').gain, {
    side: 'foe',
    text: '+1',
  });
});
test('explains a shot into the kerb', () => {
  const told = tellShot({ won: 0, foul: 'out' }, 'you', names, 'chase');
  assert.match(told.head, /kerb/);
  assert.equal(told.gain.side, 'foe');
});
test('a miss scores nothing', () => {
  assert.deepEqual(tellShot({ won: 0 }, 'you', names, 'ring'), {
    head: 'Missed.',
    gain: null,
  });
});

const game = (extra) => ({
  winner: null,
  turn: 'you',
  run: 0,
  bag: { you: 1, foe: 1 },
  turns: { you: 2, foe: 2 },
  ...extra,
});
test('names whose turn it is', () => {
  assert.equal(turnStatus(game(), names, 3).text, 'Your turn');
  assert.equal(turnStatus(game({ turn: 'foe' }), names, 3).text, 'Computer’s turn');
});
test('marks a bonus shot', () => {
  assert.equal(turnStatus(game({ run: 1 }), names, 3).text, 'Your bonus shot');
});
test('warns that it is the last turn when the other side already reached the target', () => {
  const status = turnStatus(game({ bag: { you: 1, foe: 3 }, turns: { you: 2, foe: 3 } }), names, 3);
  assert.equal(status.urgent, true);
  assert.equal(status.text, 'Your last turn: catch up to 3!');
});
