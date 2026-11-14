import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { traceBeams, reflect } from './beam.js';
import { analyzeLevel, findHint } from './solver.js';
import { generateLevel } from './generator.js';
import { moveLimitFor, starsForMoves, sparksForNewStars } from './scoring.js';
import { validateLevel } from './levelSchema.js';
import { generatorPresetFor, levelId, LEVELS_PER_WORLD, WORLD_COUNT } from './worlds.js';
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
  assert.equal(starsForMoves(4, 3), 2);
  assert.equal(starsForMoves(5, 3), 1);
  assert.equal(moveLimitFor(3), 5);
  assert.equal(moveLimitFor(8, 'hard'), 11);
  assert.equal(moveLimitFor(10, 'extra'), 13);
  assert.equal(sparksForNewStars(1, 3, 'hard'), 20);
  assert.equal(sparksForNewStars(3, 2), 0);
});

test('the 1000-level pack is valid, scrambled, and par is the true minimum', () => {
  const levels = [];
  for (let world = 1; world <= WORLD_COUNT; world++) {
    const file = new URL(`../data/worlds/world-${String(world).padStart(3, '0')}.json`, import.meta.url);
    levels.push(...JSON.parse(readFileSync(file, 'utf8')));
  }
  assert.equal(levels.length, WORLD_COUNT * LEVELS_PER_WORLD);
  assert.equal(new Set(levels.map((l) => l.id)).size, levels.length, 'level ids are unique');
  for (const level of levels) {
    assert.deepEqual(validateLevel(level), [], level.id);
    assert.equal(traceBeams(level).isSolved, false, `${level.id} starts solved`);
  }
  // Full solver check on one level per world (all 1000 take a few minutes; the generator checks each one).
  for (const level of levels.filter((l) => l.index === 1 + (l.world % LEVELS_PER_WORLD))) {
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
  const first = recordLevelResult(progress, level, { moves: 3 });
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
    assert.match(sql, new RegExp(`\\('${pack.id}', ${pack.diamonds + pack.bonus}[,)]`), `${pack.id} diamonds`);
  }
});

test('streak shields cover missed days and are earned every 7 days', async () => {
  const { nextDailyStreak, currentStreak, MAX_STREAK_SHIELDS } = await import('./progress.js');
  // Played yesterday: the streak grows; the 7th day earns a shield.
  assert.deepEqual(nextDailyStreak({ streak: 6, lastDate: '2026-03-06', shields: 0 }, '2026-03-07'), {
    streak: 7,
    shields: 1,
    shieldsUsed: 0,
    shieldEarned: true,
  });
  // One missed day with a shield: kept. Without one: back to 1.
  assert.equal(nextDailyStreak({ streak: 9, lastDate: '2026-03-05', shields: 1 }, '2026-03-07').streak, 10);
  assert.equal(nextDailyStreak({ streak: 9, lastDate: '2026-03-05', shields: 0 }, '2026-03-07').streak, 1);
  // Shields never exceed the cap.
  assert.equal(nextDailyStreak({ streak: 13, lastDate: '2026-03-06', shields: MAX_STREAK_SHIELDS }, '2026-03-07').shields, MAX_STREAK_SHIELDS);
  // The streak shown on screen stays alive while shields can still cover the gap.
  const progress = { daily: { streak: 5, lastDate: '2026-03-04', shields: 1 } };
  assert.equal(currentStreak(progress, '2026-03-06'), 5);
  assert.equal(currentStreak(progress, '2026-03-07'), 0);
});

test('daily share text is spoiler-free', async () => {
  const { dailyShareText } = await import('./share.js');
  const text = dailyShareText({ dateKey: '2026-01-05', stars: 2, moves: 6, par: 5, streak: 4, url: 'https://example.com/' });
  assert.equal(text, "Rinny's Lumipals Daily #5 ★★☆\n🟩🟩🟩🟩🟩🟨 6/5\n🔥 4-day streak\nhttps://example.com/");
});

test('weekly rewards in the database match the game catalog', async () => {
  const { WEEKLY_REWARDS } = await import('./catalog.js');
  const sql = readFileSync(new URL('../../supabase/social.sql', import.meta.url), 'utf8');
  const rewardInSql = (rank) => {
    for (const [, from, to, diamonds, sparks] of sql.matchAll(/when p_rank (?:= (\d+)|between (\d+) and (\d+)) then '\{"diamonds": (\d+), "sparks": (\d+)\}'/g).map((m) => [m[0], m[1] ?? m[2], m[1] ?? m[3], m[4], m[5]])) {
      if (rank >= Number(from) && rank <= Number(to)) return { diamonds: Number(diamonds), sparks: Number(sparks) };
    }
    return null;
  };
  for (const reward of WEEKLY_REWARDS) {
    assert.deepEqual(rewardInSql(reward.rank), { diamonds: reward.diamonds, sparks: reward.sparks }, `rank ${reward.rank}`);
  }
  assert.equal(rewardInSql(11), null);
});

test('player titles and finished worlds', async () => {
  const { titleFor, finishedWorldCount } = await import('./titles.js');
  assert.equal(titleFor(0).current.name, 'Spark Scout');
  assert.equal(titleFor(45).current.name, 'Beam Bender');
  assert.equal(titleFor(75).progress, 0.5);
  assert.equal(titleFor(3000).next, null);
  const levels = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`w1-${String(i + 1).padStart(2, '0')}`, { stars: 1 }]));
  assert.equal(finishedWorldCount({ ...levels, 'w2-01': { stars: 3 } }), 1);
});

test('daily gift: once a day, same amount as the database', async () => {
  const { DAILY_GIFT_SPARKS } = await import('./catalog.js');
  const { claimDailyGiftLocally, createEmptyProgress, isDailyGiftReady } = await import('./progress.js');
  const sql = readFileSync(new URL('../../supabase/social.sql', import.meta.url), 'utf8');
  assert.match(sql, new RegExp(`v_sparks constant integer := ${DAILY_GIFT_SPARKS};`));
  const start = createEmptyProgress();
  const after = claimDailyGiftLocally(start, '2026-03-01');
  assert.equal(after.sparks, start.sparks + DAILY_GIFT_SPARKS);
  assert.equal(isDailyGiftReady(after, '2026-03-01'), false);
  assert.throws(() => claimDailyGiftLocally(after, '2026-03-01'));
  assert.equal(isDailyGiftReady(after, '2026-03-02'), true);
});

test('pals: starter choice, unlocks, growth and accessories', async () => {
  const { createEmptyProgress } = await import('./progress.js');
  const pals = await import('./pals.js');
  let progress = createEmptyProgress();
  // Any starter can be the very first Pal; others are locked.
  assert.equal(pals.isPalUnlocked(progress, pals.palById('mossy')), true);
  assert.equal(pals.isPalUnlocked(progress, pals.palById('hoot')), false);
  assert.throws(() => pals.choosePalLocally(progress, 'hoot'));
  progress = pals.choosePalLocally(progress, 'mossy');
  // After the first pick, the other starters need their own milestone.
  assert.equal(pals.isPalUnlocked(progress, pals.palById('ember')), false);
  // Glow-ups: one per finished world, spent on any owned Pal; five forms in all.
  assert.equal(pals.glowUpsAvailable(progress), 0);
  assert.throws(() => pals.glowUpPalLocally(progress, 'mossy'));
  const world1 = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`w1-${String(i + 1).padStart(2, '0')}`, { stars: 1 }]));
  progress = { ...progress, levels: world1 };
  assert.equal(pals.glowUpsAvailable(progress), 1);
  progress = pals.glowUpPalLocally(progress, 'mossy');
  assert.equal(pals.palStage(pals.stageOf(progress.pal.owned.mossy)).name, 'Junior');
  assert.equal(pals.glowUpsAvailable(progress), 0);
  assert.equal(pals.palStage(4).name, 'Legend');
  assert.equal(pals.PALS.length, 30);
  // Accessories cost sparks and must be owned to wear.
  assert.throws(() => pals.wearAccessoryLocally(progress, 'scarf', true));
  const rich = { ...progress, sparks: 100 };
  const bought = pals.buyAccessoryLocally(rich, 'scarf');
  assert.equal(bought.sparks, 60);
  const scarfed = pals.wearAccessoryLocally(bought, 'scarf', true);
  assert.deepEqual(scarfed.pal.wearing, ['scarf']);
  // One item per slot: a new neck item replaces the scarf; a hat sits alongside it.
  const geared = { ...scarfed, pal: { ...scarfed.pal, accessories: ['scarf', 'bow', 'crown'] } };
  assert.deepEqual(pals.wearAccessoryLocally(geared, 'bow', true).pal.wearing, ['bow']);
  assert.deepEqual(pals.wearAccessoryLocally(geared, 'crown', true).pal.wearing, ['scarf', 'crown']);
  assert.deepEqual(pals.wearAccessoryLocally(scarfed, 'scarf', false).pal.wearing, []);
});

test('pal unlocks and accessory prices match the database', async () => {
  const { PALS, PAL_ACCESSORIES } = await import('./pals.js');
  const sql = readFileSync(new URL('../../supabase/pals.sql', import.meta.url), 'utf8');
  for (const pal of PALS) {
    const [kind, value] = Object.entries(pal.unlock)[0];
    const starter = pal.isStarter ? '"starter": true, ' : '';
    assert.ok(sql.includes(`when '${pal.id}' then '{${starter}"${kind}": ${value}}'::jsonb`), `${pal.id} unlock`);
    assert.ok(sql.includes(`'${pal.id}' then '${pal.animal}'`), `${pal.id} animal`);
  }
  for (const item of PAL_ACCESSORIES) {
    assert.ok(sql.includes(`when '${item.id}' then '{"price": ${item.price}, "slot": "${item.slot}"}'::jsonb`), `${item.id} price and slot`);
  }
  const { ADOPT_PAL_DIAMONDS } = await import('./pals.js');
  assert.ok(sql.includes(`v_price constant integer := ${ADOPT_PAL_DIAMONDS};`), 'adopt price');
});

test('nicknames: friendly rules, random names and the same blocked list as the database', async () => {
  const { BLOCKED_NICKNAME_PARTS, nicknameProblem, randomNickname } = await import('./nicknames.js');
  assert.equal(nicknameProblem('Rin the Great'), null);
  assert.equal(nicknameProblem('רינה'), null);
  assert.ok(nicknameProblem('ab'));
  assert.ok(nicknameProblem('call 0541234567'));
  assert.ok(nicknameProblem('www.site.com'));
  assert.ok(nicknameProblem('Sh1t Head'));
  assert.equal(nicknameProblem(randomNickname()), null);
  const sql = readFileSync(new URL('../../supabase/nicknames.sql', import.meta.url), 'utf8');
  assert.ok(sql.includes(`array[${BLOCKED_NICKNAME_PARTS.map((part) => `'${part}'`).join(', ')}]`), 'blocked list');
});

test('pals: the growth bar tracks the unfinished world nearest to done', async () => {
  const { nextGlowUpProgress } = await import('./pals.js');
  const solved = (world, count) => Object.fromEntries(Array.from({ length: count }, (_, i) => [`w${world}-${String(i + 1).padStart(2, '0')}`, { stars: 1 }]));
  assert.deepEqual(nextGlowUpProgress({}), { world: 1, solved: 0, needed: 20 });
  assert.deepEqual(nextGlowUpProgress({ ...solved(1, 20), ...solved(2, 7) }), { world: 2, solved: 7, needed: 20 });
  assert.deepEqual(nextGlowUpProgress(solved(1, 20)), { world: 2, solved: 0, needed: 20 });
  assert.deepEqual(nextGlowUpProgress({ ...solved(2, 3), ...solved(3, 9) }), { world: 3, solved: 9, needed: 20 });
});
