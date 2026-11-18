import test from 'node:test';
import assert from 'node:assert/strict';
import { coatsFor, lumiCoatFor, lumisOf } from './boardThemes.js';

const pondLevel = (id) => ({ id, world: 2, tiles: Array.from({ length: 6 }, (_, x) => ({ x, y: 0, type: 'gem' })) });

test('no Lumi wears the color of its theme’s tiles, and no two on a board share a coat', () => {
  assert.ok(!coatsFor('pond').includes('#b2e6b4'), 'no green Lumis on green lily pads');
  for (let n = 1; n <= 20; n++) {
    const coats = lumisOf(pondLevel(`w2-${String(n).padStart(2, '0')}`)).map((lumi) => lumi.coat);
    assert.equal(new Set(coats).size, coats.length);
    coats.forEach((coat) => assert.ok(coatsFor('pond').includes(coat)));
  }
});

test('a Lumi that needs a colored light keeps that light’s color', () => {
  assert.equal(lumiCoatFor(pondLevel('w2-01'), 0, 'coral'), null);
});
