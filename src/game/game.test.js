import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { traceBeams, reflect } from './beam.js';
import { analyzeLevel, findHint } from './solver.js';
import { generateLevel } from './generator.js';
import { starsForMoves, sparksForNewStars } from './scoring.js';
import { validateLevel } from './levelSchema.js';
import { generatorPresetFor, levelId, LEVELS_PER_WORLD, WORLDS } from './worlds.js';
import { createRandom } from '../lib/random.js';

// Emitter on the left shining right, a "\" mirror sends it down to a gem.
const simpleLevel = () => ({
  width: 4,
  height: 4,
  tiles: [
    { x: 0, y: 1, type: 'emitter', dir: 'right', color: 'sun' },
    { x: 2, y: 1, type: 'mirror', orient: 1 },
    { x: 2, y: 3, type: 'gem', color: 'sun' },
  ],
});

test('reflect turns beams 90 degrees', () => {
  assert.deepEqual(reflect([1, 0], 0), [-0, -1]);
  assert.deepEqual(reflect([1, 0], 1), [0, 1]);
});

test('beam reaches the gem when the mirror is turned correctly', () => {
  const level = simpleLevel();
  assert.equal(traceBeams(level).isSolved, true);
  level.tiles[1].orient = 0;
  assert.equal(traceBeams(level).isSolved, false);
});

test('filters recolor the beam and gems need the matching color', () => {
  const level = simpleLevel();
  level.tiles.push({ x: 1, y: 1, type: 'filter', color: 'coral' });
  assert.equal(traceBeams(level).isSolved, false);
  level.tiles[2].color = 'coral';
  assert.equal(traceBeams(level).isSolved, true);
});

test('a lit shade means the level is not solved', () => {
  const level = simpleLevel();
  level.tiles.push({ x: 3, y: 1, type: 'splitter', orient: 0 });
  level.tiles[1] = { x: 2, y: 1, type: 'splitter', orient: 1 };
  level.tiles.push({ x: 3, y: 0, type: 'shade' });
  // The splitter lets light continue right into another splitter that bounces it up into the shade.
  const result = traceBeams(level);
  assert.equal(result.litGems.size, 1);
  assert.equal(result.litShades.size, 1);
  assert.equal(result.isSolved, false);
});

test('loops do not hang the tracer', () => {
  const level = {
    width: 4,
    height: 4,
    tiles: [
      { x: 0, y: 0, type: 'emitter', dir: 'right', color: 'sun' },
      { x: 2, y: 0, type: 'splitter', orient: 1 },
      { x: 2, y: 2, type: 'mirror', orient: 0 },
      { x: 1, y: 2, type: 'mirror', orient: 1 },
      { x: 1, y: 3, type: 'gem', color: 'sun' },
    ],
  };
  assert.doesNotThrow(() => traceBeams(level));
});

test('solver finds par and hints point to a wrong piece', () => {
  const level = simpleLevel();
  level.tiles[1].orient = 0;
  const analysis = analyzeLevel(level);
  assert.equal(analysis.isSolvable, true);
  assert.equal(analysis.par, 1);
  assert.equal(findHint(level, level.tiles.map((t) => t.orient ?? 0)), 1);
});

test('stars and sparks', () => {
  assert.equal(starsForMoves(3, 3), 3);
  assert.equal(starsForMoves(5, 3), 2);
  assert.equal(starsForMoves(9, 3), 1);
  assert.equal(sparksForNewStars(1, 3, 'hard'), 20);
  assert.equal(sparksForNewStars(3, 2), 0);
});

test('the built-in level pack is valid, solvable and scrambled', () => {
  const levels = JSON.parse(readFileSync(new URL('../data/seedLevels.json', import.meta.url), 'utf8'));
  assert.equal(levels.length, WORLDS.length * LEVELS_PER_WORLD);
  for (const level of levels) {
    assert.deepEqual(validateLevel(level), [], level.id);
    assert.equal(traceBeams(level).isSolved, false, `${level.id} starts solved`);
    const analysis = analyzeLevel(level);
    assert.equal(analysis.isSolvable, true, `${level.id} unsolvable`);
    assert.equal(analysis.par, level.par, `${level.id} par mismatch`);
  }
});

test('the generator produces a valid level for an easy preset', () => {
  const level = generateLevel(generatorPresetFor(1, 2), createRandom('smoke'));
  assert.ok(level);
  assert.deepEqual(validateLevel(level), []);
  assert.equal(levelId(1, 2), 'w1-02');
});

test('progress: results, sparks, daily streak, helpers and guest store', async () => {
  const { createEmptyProgress, recordLevelResult, recordDailyResult, totalStars, buyStoreItemLocally, consumeHelperLocally, EconomyError } =
    await import('./progress.js');
  const level = { id: 'w1-01', par: 2, difficulty: 'normal' };
  let progress = createEmptyProgress();
  const first = recordLevelResult(progress, level, { moves: 4 });
  assert.equal(first.stars, 2);
  assert.equal(first.sparksEarned, 10);
  const second = recordLevelResult(first.progress, level, { moves: 2 });
  assert.equal(second.sparksEarned, 5);
  assert.equal(totalStars(second.progress), 3);
  progress = second.progress;

  const day1 = recordDailyResult(progress, '2026-11-12');
  const day2 = recordDailyResult(day1.progress, '2026-11-13');
  assert.equal(day2.streak, 2);
  assert.equal(recordDailyResult(day2.progress, '2026-11-13').sparksEarned, 0);
  assert.equal(recordDailyResult(day2.progress, '2026-11-15').streak, 1);

  // Helper star caps and Skip
  assert.equal(recordLevelResult(createEmptyProgress(), level, { moves: 2, starCap: 1 }).stars, 1);
  const skipped = recordLevelResult(createEmptyProgress(), level, { moves: null, forcedStars: 1 });
  assert.equal(skipped.stars, 1);
  assert.equal(skipped.progress.levels['w1-01'].bestMoves, null);

  // Guest store rules: daily limit, inventory cap, diamonds need an account
  let wallet = { ...createEmptyProgress(), sparks: 1000 };
  const today = '2026-11-13';
  for (let i = 0; i < 3; i++) wallet = buyStoreItemLocally(wallet, 'hint', 'sparks', today);
  assert.equal(wallet.helpers.hint, 4);
  assert.throws(() => buyStoreItemLocally(wallet, 'hint', 'sparks', today), EconomyError);
  wallet = buyStoreItemLocally(wallet, 'hint', 'sparks', '2026-11-14');
  assert.equal(wallet.helpers.hint, 5);
  assert.throws(() => buyStoreItemLocally(wallet, 'hint', 'sparks', '2026-11-15'), /maximum/);
  assert.throws(() => buyStoreItemLocally(wallet, 'skip', 'diamonds', today), /Sign in/);
  assert.equal(consumeHelperLocally(wallet, 'hint').helpers.hint, 4);
  assert.throws(() => consumeHelperLocally(createEmptyProgress(), 'skip'), EconomyError);
});

test('editor helpers place, cycle, lock, resize and scramble', async () => {
  const { createBlankLevel, makeTile, placeTile, cycleTileAt, toggleLockAt, resizeLevel, removeTileAt, scrambleLevel, applyNearestSolution } =
    await import('./editing.js');
  let level = createBlankLevel({ size: 4 });
  level = placeTile(level, makeTile('emitter', 0, 1, { dir: 'right' }));
  level = placeTile(level, makeTile('mirror', 2, 1));
  level = placeTile(level, makeTile('gem', 2, 3));
  level = cycleTileAt(level, 2, 1); // mirror "/" → "\" sends the beam down to the gem
  assert.equal(traceBeams(level).isSolved, true);
  level = toggleLockAt(level, 2, 1);
  assert.equal(level.tiles.find((t) => t.type === 'mirror').locked, true);
  level = toggleLockAt(level, 2, 1);
  const scrambled = scrambleLevel(level, createRandom('editor'), 1);
  assert.equal(traceBeams(scrambled).isSolved, false);
  assert.equal(scrambled.par, 1);
  assert.equal(traceBeams(applyNearestSolution(scrambled)).isSolved, true);
  assert.equal(resizeLevel(level, 3, 3).tiles.length, 2);
  assert.equal(removeTileAt(level, 2, 3).tiles.length, 2);
});

test('store prices in the database match the game catalog', async () => {
  const { STORE_ITEMS, DIAMOND_PACKS } = await import('./catalog.js');
  const sql = readFileSync(new URL('../../supabase/economy.sql', import.meta.url), 'utf8');
  for (const item of STORE_ITEMS) {
    const row = sql.match(new RegExp(`\\('${item.id}', '(\\w+)', (\\w+), (\\w+), (?:'(\\w+)'|null), (\\d+), (\\d+)\\)`));
    assert.ok(row, `${item.id} missing from economy.sql`);
    const [, kind, sparks, diamonds, helper, quantity, grantSparks] = row;
    assert.equal(kind, item.kind, item.id);
    assert.equal(sparks === 'null' ? undefined : Number(sparks), item.price.sparks, `${item.id} spark price`);
    assert.equal(diamonds === 'null' ? undefined : Number(diamonds), item.price.diamonds, `${item.id} diamond price`);
    assert.equal(helper, item.grants.helper, item.id);
    assert.equal(Number(quantity), item.grants.quantity ?? 0, item.id);
    assert.equal(Number(grantSparks), item.grants.sparks ?? 0, item.id);
  }
  for (const pack of DIAMOND_PACKS) {
    assert.match(sql, new RegExp(`\\('${pack.id}', ${pack.diamonds + pack.bonus}\\)`), `${pack.id} diamonds`);
  }
});
