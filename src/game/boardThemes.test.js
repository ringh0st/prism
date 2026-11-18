import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES_IN_PLAY, boardThemeFor, coatsFor, lumiCoatFor, lumisOf } from './boardThemes.js';

const themedLevels = [1, 2, 3].flatMap((world) =>
  Array.from({ length: 20 }, (_, i) => ({
    id: `w${world}-${String(i + 1).padStart(2, '0')}`,
    world,
    index: i + 1,
    tiles: Array.from({ length: 6 }, (_, x) => ({ x, y: 0, type: 'gem' })),
  })),
);
const pondLevels = themedLevels.filter((level) => boardThemeFor(level) === 'pond');

test('the themes take turns: every one is used, never the same twice in a row, and only in the themed worlds', () => {
  const themes = themedLevels.map(boardThemeFor);
  THEMES_IN_PLAY.forEach((theme) => assert.ok(themes.filter((used) => used === theme).length >= 12, theme));
  themes.forEach((theme, n) => assert.notEqual(theme, themes[n - 1]));
  assert.equal(boardThemeFor({ id: 'w4-01', world: 4, index: 1, tiles: [] }), null);
  assert.equal(boardThemeFor({ id: 'daily', tiles: [] }), null);
});

test('no Lumi wears the color of its theme’s tiles, and no two on a board share a coat', () => {
  assert.ok(!coatsFor('pond').includes('#b2e6b4'), 'no green Lumis on green lily pads');
  assert.ok(pondLevels.length > 0);
  for (const level of pondLevels) {
    const coats = lumisOf(level).map((lumi) => lumi.coat);
    assert.equal(new Set(coats).size, coats.length);
    coats.forEach((coat) => assert.ok(coatsFor('pond').includes(coat)));
  }
});

test('a Lumi that needs a colored light keeps that light’s color', () => {
  assert.equal(lumiCoatFor(pondLevels[0], 0, 'coral'), null);
});
