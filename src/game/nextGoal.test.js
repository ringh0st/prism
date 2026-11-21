import test from 'node:test';
import assert from 'node:assert/strict';
import { nextGoalFor } from './nextGoal.js';

const solved = (n, stars = 1) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`w1-${String(i + 1).padStart(2, '0')}`, { stars }]));

test('the next goal is the closest prize: the first friend, then a present or the end of the world', () => {
  assert.deepEqual(nextGoalFor({ levels: solved(2), pal: { id: null } }, 18), { kind: 'friend', left: 3, unit: 'levels' });
  const withPal = { levels: solved(6, 1), pal: { id: 'mossy' }, presents: { opened: 0 } };
  assert.deepEqual(nextGoalFor(withPal, 14), { kind: 'present', left: 4, unit: 'stars' });
  assert.deepEqual(nextGoalFor({ ...withPal, levels: solved(15, 1), presents: { opened: 1 } }, 1), { kind: 'world', left: 1, unit: 'levels' });
  // A present that's already waiting is shown by the Pal itself, not as a goal.
  assert.equal(nextGoalFor({ ...withPal, levels: solved(12, 1) }, 8), null);
});
