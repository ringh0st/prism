import test from 'node:test';
import assert from 'node:assert/strict';
import { FEATURES, featureToAnnounce, isFeatureOpen, openFeatures } from './unlocks.js';

test('features open one at a time, never two on the same level', () => {
  const steps = FEATURES.map((feature) => feature.after);
  assert.deepEqual(
    steps,
    [...steps].sort((a, b) => a - b),
  );
  assert.equal(new Set(steps).size, steps.length);
  assert.deepEqual(openFeatures(2), []);
  assert.ok(isFeatureOpen('gift', 3) && !isFeatureOpen('daily', 3));
  assert.ok(!isFeatureOpen('glowbugs', 39) && isFeatureOpen('glowbugs', 40));
});

test('only a feature that opens from now on is announced as new', () => {
  assert.equal(featureToAnnounce(40, null), null);
  assert.equal(featureToAnnounce(3, []), 'gift');
  assert.equal(featureToAnnounce(6, ['gift']), 'daily');
  assert.equal(featureToAnnounce(45, openFeatures(39)), 'glowbugs');
  assert.equal(featureToAnnounce(45, openFeatures(45)), null);
});
