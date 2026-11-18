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

test('the themes take turns: every one is used, never the same twice in a row, and every level has one', () => {
  const themes = themedLevels.map(boardThemeFor);
  THEMES_IN_PLAY.forEach((theme) => assert.ok(themes.filter((used) => used === theme).length >= 60 / THEMES_IN_PLAY.length - 6, theme));
  themes.forEach((theme, n) => assert.notEqual(theme, themes[n - 1]));
  // Every level has a theme: later worlds follow the road, other levels get one from their id.
  assert.ok(THEMES_IN_PLAY.includes(boardThemeFor({ id: 'w40-07', world: 40, index: 7, tiles: [] })));
  assert.equal(boardThemeFor({ id: 'daily-2026-11-18', tiles: [] }), boardThemeFor({ id: 'daily-2026-11-18', tiles: [] }));
  assert.ok(THEMES_IN_PLAY.includes(boardThemeFor({ id: 'daily-2026-11-18', tiles: [] })));
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
