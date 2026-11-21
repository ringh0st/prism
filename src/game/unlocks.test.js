import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP_EXTRAS, extraToAnnounce, isExtraOpen, openExtras } from './unlocks.js';

test('map extras open one at a time, never two on the same level', () => {
  const steps = MAP_EXTRAS.map((extra) => extra.after);
  assert.deepEqual(
    steps,
    [...steps].sort((a, b) => a - b),
  );
  assert.equal(new Set(steps).size, steps.length);
  assert.deepEqual(openExtras(2), []);
  assert.ok(isExtraOpen('gift', 3) && !isExtraOpen('daily', 3));
});

test('only an extra that opens from now on is announced as new', () => {
  assert.equal(extraToAnnounce(40, null), null);
  assert.equal(extraToAnnounce(3, []), 'gift');
  assert.equal(extraToAnnounce(6, ['gift']), 'daily');
  assert.equal(extraToAnnounce(40, ['gift', 'daily']), null);
});
