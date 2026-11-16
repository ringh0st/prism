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
  assert.equal(
    findHint(
      level,
      level.tiles.map((t) => t.orient ?? 0),
    ),
    1,
  );
});

test('stars and sparks', () => {
  assert.equal(starsForMoves(3, 3), 3);
  assert.equal(starsForMoves(4, 3), 2);
  assert.equal(starsForMoves(5, 3), 1);
  assert.equal(moveLimitFor(3), 4);
  assert.equal(moveLimitFor(8, 'hard'), 10);
  assert.equal(moveLimitFor(10, 'extra'), 12);
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
    for (const [, from, to, diamonds, sparks] of sql
      .matchAll(/when p_rank (?:= (\d+)|between (\d+) and (\d+)) then '\{"diamonds": (\d+), "sparks": (\d+)\}'/g)
      .map((m) => [m[0], m[1] ?? m[2], m[1] ?? m[3], m[4], m[5]])) {
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

test('player levels climb with stars, fast at first', async () => {
  const { playerLevelFor } = await import('./titles.js');
  assert.equal(playerLevelFor(0).level, 1);
  assert.equal(playerLevelFor(4).level, 1);
  assert.equal(playerLevelFor(5).level, 2);
  assert.deepEqual(playerLevelFor(20), { level: 3, from: 15, to: 30, progress: 1 / 3 });
  assert.equal(playerLevelFor(3000).level, 35);
});

test('a solve reports a level-up and a new title only when it crosses one', async () => {
  const { climbFor } = await import('./titles.js');
  const levels = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`w1-0${i + 1}`, { stars: 3 }])); // 27 stars, Lv 3
  assert.deepEqual(climbFor(levels, { ...levels, 'w1-10': { stars: 1 } }), { levelUp: null, newTitle: null });
  const climb = climbFor(levels, { ...levels, 'w1-10': { stars: 3 } }); // 30 stars
  assert.equal(climb.levelUp, 4);
  assert.equal(climb.newTitle.name, 'Beam Bender');
});

test('gift calendar: one a day, grows through the week, pauses when a day is missed, matches the database', async () => {
  const { GIFT_CALENDAR, calendarGift, claimCalendarGiftLocally, isDailyGiftReady } = await import('./gifts.js');
  const { createEmptyProgress } = await import('./progress.js');
  const sql = readFileSync(new URL('../../supabase/gifts.sql', import.meta.url), 'utf8');
  GIFT_CALENDAR.forEach((day, i) => {
    const { guestHelper, ...server } = day;
    const row = new RegExp(`when ${i} then '(\\{[^']*\\})'::jsonb`).exec(sql);
    assert.ok(row, `day ${i + 1} is in gifts.sql`);
    assert.deepEqual(JSON.parse(row[1]), server, `day ${i + 1} matches`);
    assert.ok(!guestHelper || day.diamonds, 'only the diamond day has a guest stand-in');
  });
  // Diamonds need an account: guests get the stand-in helper on day 7.
  assert.deepEqual(calendarGift(6, true), { sparks: 60, helper: null, diamonds: 1, isBig: true });
  assert.deepEqual(calendarGift(6, false), { sparks: 60, helper: 'skip', isBig: true });
  assert.equal(calendarGift(7, false).sparks, GIFT_CALENDAR[0].sparks, 'a new week starts');

  let progress = createEmptyProgress();
  ({ progress } = claimCalendarGiftLocally(progress, '2026-03-01'));
  assert.equal(isDailyGiftReady(progress, '2026-03-01'), false);
  assert.throws(() => claimCalendarGiftLocally(progress, '2026-03-01'));
  // Three days away: the calendar waits on day 2.
  const { progress: later, gift } = claimCalendarGiftLocally(progress, '2026-03-05');
  assert.deepEqual(gift, { sparks: 20, helper: 'hint', isBig: false });
  assert.equal(later.helpers.hint, progress.helpers.hint + 1);
  // A full helper becomes 10 sparks instead.
  const full = { ...progress, helpers: { ...progress.helpers, hint: 5 } };
  assert.deepEqual(claimCalendarGiftLocally(full, '2026-03-05').gift, { sparks: 30, helper: null, isBig: false });
});

test('pal presents: one per 10 stars, odds shown, glow up by rarity, never something you own, matches the database', async () => {
  const {
    PRESENT_BASE_SPARKS,
    PRESENT_HELPERS,
    PRESENT_EVERY_STARS,
    PRESENT_ITEMS,
    PRESENT_ODDS,
    PRESENT_RARITIES,
    LEGENDARY_GUEST_SPARKS,
    drawPresent,
    openPresentLocally,
    presentProgress,
    presentRarityFor,
    presentsWaiting,
  } = await import('./gifts.js');
  const { accessoryById } = await import('./pals.js');
  const { groveItemById } = await import('./grove.js');
  const { createEmptyProgress } = await import('./progress.js');
  const sql = readFileSync(new URL('../../supabase/gifts.sql', import.meta.url), 'utf8');
  assert.equal(
    PRESENT_ODDS.reduce((sum, odd) => sum + odd.chance, 0),
    100,
  );
  assert.equal(
    PRESENT_RARITIES.reduce((sum, rarity) => sum + rarity.chance, 0),
    100,
  );
  assert.match(sql, new RegExp(`v_stars / ${PRESENT_EVERY_STARS} <= v_profile.presents_opened`));
  assert.match(sql, new RegExp(`v_sparks integer := ${PRESENT_BASE_SPARKS};`));
  assert.ok(sql.includes(`unnest(array[${PRESENT_HELPERS.map((id) => `'${id}'`).join(', ')}]) as h`), 'present helpers match');
  assert.match(sql, new RegExp(`v_sparks := v_sparks \\+ ${PRESENT_ODDS[1].sparks};`));
  assert.match(sql, new RegExp(`v_roll >= ${PRESENT_ODDS[0].chance + PRESENT_ODDS[1].chance}\\b`));
  assert.match(sql, new RegExp(`v_roll < ${PRESENT_ODDS[0].chance}\\b`));
  // Each rarity's edge, bonus, sure item and diamond, in order.
  let edge = 0;
  PRESENT_RARITIES.forEach((rarity, i) => {
    edge += rarity.chance;
    const bonus = `v_rarity := '${rarity.id}'; v_bonus := ${rarity.bonusSparks}; v_sure_item := ${Boolean(rarity.sureItem)};${rarity.diamonds ? ` v_diamonds := ${rarity.diamonds};` : ''}`;
    assert.ok(sql.includes(bonus), `${rarity.id} matches`);
    if (i < PRESENT_RARITIES.length - 1) assert.ok(sql.includes(`v_rarity_roll < ${edge} then ${bonus}`), `${rarity.id} edge`);
  });
  assert.deepEqual(
    [...sql.match(/'(outfit|decor):(\w+)'/g)].map((entry) => entry.slice(1, -1)),
    PRESENT_ITEMS.map((item) => `${item.type}:${item.id}`),
  );
  PRESENT_ITEMS.forEach((item) => assert.ok(item.type === 'outfit' ? accessoryById(item.id) : groveItemById(item.id), item.id));
  assert.equal(presentRarityFor(0).id, 'plain');
  assert.equal(presentRarityFor(0.66).id, 'rare');
  assert.equal(presentRarityFor(0.9).id, 'epic');
  assert.equal(presentRarityFor(0.99).id, 'legendary');

  const levels = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`w1-0${i + 1}`, { stars: 3, bestMoves: 3 }]));
  let progress = { ...createEmptyProgress(), levels: { ...levels, 'event-x': { stars: 3 } } };
  assert.equal(presentsWaiting(progress), 2, "27 stars from built-in levels (events don't count)");
  assert.deepEqual(presentProgress(progress), { have: 10, need: 10 }, 'full while a present waits');

  const plain = { rarityRoll: 0 };
  assert.deepEqual(drawPresent(progress, { ...plain, roll: 0.1, pick: 0 }), { rarity: 'plain', sparks: PRESENT_BASE_SPARKS, helper: 'hint' });
  assert.deepEqual(drawPresent(progress, { ...plain, roll: 0.5, pick: 0 }), {
    rarity: 'plain',
    sparks: PRESENT_BASE_SPARKS + PRESENT_ODDS[1].sparks,
  });
  assert.deepEqual(drawPresent(progress, { rarityRoll: 0.7, roll: 0.5 }), {
    rarity: 'rare',
    sparks: PRESENT_BASE_SPARKS + 20 + PRESENT_ODDS[1].sparks,
  });
  // Epic and Legendary always hold an item; Legendary adds a diamond for accounts, sparks for guests.
  assert.equal(drawPresent(progress, { rarityRoll: 0.9, roll: 0.1, pick: 0 }).item.id, PRESENT_ITEMS[0].id);
  assert.deepEqual(drawPresent(progress, { rarityRoll: 0.995, roll: 0.1, pick: 0, isSignedIn: true }), {
    rarity: 'legendary',
    item: PRESENT_ITEMS[0],
    diamonds: 1,
    sparks: PRESENT_BASE_SPARKS + 80,
  });
  assert.equal(drawPresent(progress, { rarityRoll: 0.995, roll: 0.1, pick: 0 }).sparks, PRESENT_BASE_SPARKS + 80 + LEGENDARY_GUEST_SPARKS);

  const withItem = openPresentLocally(progress, { rarityRoll: 0, roll: 0.9, pick: 0 });
  assert.equal(withItem.gift.item.id, PRESENT_ITEMS[0].id);
  assert.ok(withItem.progress.pal.accessories.includes(PRESENT_ITEMS[0].id));
  assert.notEqual(drawPresent(withItem.progress, { rarityRoll: 0, roll: 0.9, pick: 0 }).item.id, PRESENT_ITEMS[0].id, 'never something you own');
  progress = withItem.progress;
  ({ progress } = openPresentLocally(progress, { rarityRoll: 0, roll: 0.5 }));
  assert.equal(presentsWaiting(progress), 0);
  assert.deepEqual(presentProgress(progress), { have: 7, need: 10 });
  assert.throws(() => openPresentLocally(progress));
  // Every helper full: the helper surprise becomes the sparks bag.
  const full = { ...progress, helpers: { skip: 0, ...Object.fromEntries(PRESENT_HELPERS.map((id) => [id, 5])) } };
  assert.equal(drawPresent(full, { rarityRoll: 0, roll: 0.1 }).sparks, PRESENT_BASE_SPARKS + PRESENT_ODDS[1].sparks);
});

test('daily win gifts: 1st, 3rd and 6th different level won today, matches the database', async () => {
  const { WIN_GIFTS, claimWinGiftLocally, readyWinGift, recordDailyWin, winsToday } = await import('./gifts.js');
  const { createEmptyProgress } = await import('./progress.js');
  const sql = readFileSync(new URL('../../supabase/gifts.sql', import.meta.url), 'utf8');
  WIN_GIFTS.forEach((tier, i) => {
    const row = new RegExp(`when ${i} then '(\\{"wins"[^']*\\})'::jsonb`).exec(sql);
    assert.ok(row, `win gift ${i} is in gifts.sql`);
    assert.deepEqual(JSON.parse(row[1]), tier);
  });
  const day = '2026-03-01';
  let progress = createEmptyProgress();
  assert.equal(readyWinGift(progress, day), null);
  progress = recordDailyWin(recordDailyWin(progress, 'w1-01', day), 'w1-01', day);
  assert.equal(winsToday(progress, day), 1, 'the same level counts once a day');
  let gift;
  ({ progress, gift } = claimWinGiftLocally(progress, day));
  assert.deepEqual(gift, { sparks: WIN_GIFTS[0].sparks, helper: null });
  assert.throws(() => claimWinGiftLocally(progress, day), 'the next one needs 3 wins');
  progress = recordDailyWin(recordDailyWin(progress, 'w1-02', day), 'w1-03', day);
  ({ progress, gift } = claimWinGiftLocally(progress, day));
  assert.deepEqual(gift, { sparks: WIN_GIFTS[1].sparks, helper: 'hint' });
  // A new day starts over.
  assert.equal(winsToday(progress, '2026-03-02'), 0);
  progress = recordDailyWin(progress, 'w1-04', '2026-03-02');
  assert.equal(readyWinGift(progress, '2026-03-02'), WIN_GIFTS[0]);
});

test('pal records: counted per partner, done once, never bought', async () => {
  const { PAL_RECORDS, palRecordsFor, recordPalFeats } = await import('./palRecords.js');
  const { createEmptyProgress } = await import('./progress.js');
  let progress = { ...createEmptyProgress(), pal: { id: 'ember', owned: { ember: { stage: 0, growth: 0 } }, accessories: [], wearing: [] } };
  let done = [];
  for (let i = 0; i < 5; i++) {
    const feats = recordPalFeats(progress, { difficulty: 'hard', stars: 2, combo: i === 0 ? 3 : 0 });
    progress = feats.progress;
    done = done.concat(feats.newRecords);
  }
  assert.deepEqual(done, ['combo', 'brave'], 'each record is announced once, when it is done');
  const boss = recordPalFeats(progress, { difficulty: 'extra', stars: 3 });
  assert.deepEqual(boss.newRecords, ['boss']);
  assert.equal(palRecordsFor(boss.progress, 'ember').length, PAL_RECORDS.length);
  assert.deepEqual(recordPalFeats({ ...createEmptyProgress() }, { difficulty: 'hard', stars: 3 }).newRecords, [], 'no partner, no records');
});

test('partner: a choice not yet saved on the account is kept over the old partner on the account', async () => {
  const { createEmptyProgress, withServerState } = await import('./progress.js');
  const server = {
    sparks: 0,
    diamonds: 0,
    helpers: {},
    pal: { id: 'ember', owned: { ember: { stage: 2 }, mossy: { stage: 0 } }, accessories: [], wearing: [] },
  };
  const local = { ...createEmptyProgress(), pal: { id: 'mossy', owned: { mossy: { stage: 0 } }, accessories: [], wearing: [], pendingId: 'mossy' } };
  assert.equal(withServerState(local, server, '2026-03-01').pal.id, 'mossy', 'pending choice wins until saved');
  assert.equal(
    withServerState({ ...local, pal: { ...local.pal, pendingId: null } }, server, '2026-03-01').pal.id,
    'ember',
    'saved: the account is the truth',
  );
  const saved = withServerState(local, { ...server, pal: { ...server.pal, id: 'mossy' } }, '2026-03-01').pal;
  assert.equal(saved.pendingId, undefined, 'once the account has it, nothing is pending');
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
  // Only the partner grows: one step per solved level, 20 steps per form; other Pals keep their own count.
  progress = { ...progress, pal: { ...progress.pal, owned: { ...progress.pal.owned, ember: { stage: 0, growth: 5 } } } };
  for (let i = 0; i < 19; i++) progress = pals.growPartnerLocally(progress).progress;
  assert.deepEqual(progress.pal.owned.mossy, { stage: 0, growth: 19 });
  const grown = pals.growPartnerLocally(progress);
  assert.equal(grown.grewTo.name, 'Junior');
  progress = grown.progress;
  assert.deepEqual(progress.pal.owned.mossy, { stage: 1, growth: 0 });
  assert.deepEqual(progress.pal.owned.ember, { stage: 0, growth: 5 });
  const legend = { ...progress, pal: { ...progress.pal, owned: { ...progress.pal.owned, mossy: { stage: 4, growth: 0 } } } };
  assert.equal(pals.growPartnerLocally(legend).progress, legend);
  assert.equal(pals.palStage(pals.stageOf(progress.pal.owned.mossy)).name, 'Junior');
  assert.equal(pals.palStage(4).name, 'Master');
  assert.equal(pals.PALS.length, 48);
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
  const { ADOPT_PRICES, rarityOf, LUCKY_PAL_EVERY, LUCKY_PAL_FALLBACK_SPARKS } = await import('./pals.js');
  assert.ok(
    sql.includes(`when 'mythic' then ${ADOPT_PRICES.mythic} when 'legendary' then ${ADOPT_PRICES.legendary} else ${ADOPT_PRICES.common} end`),
    'adopt prices',
  );
  // Same Pal order (daily picks depend on it) and the same rarities on both sides.
  const allPals = sql.slice(sql.indexOf('_all_pals()'), sql.indexOf('_pal_rarity(p_pal text)'));
  assert.deepEqual(
    [...allPals.matchAll(/'(\w+)'/g)].map((m) => m[1]),
    PALS.map((pal) => pal.id),
    'pal order',
  );
  for (const rarity of ['legendary', 'mythic']) {
    const ids = PALS.filter((pal) => rarityOf(pal) === rarity)
      .map((pal) => `'${pal.id}'`)
      .join(', ');
    assert.ok(sql.includes(`when p_pal in (${ids}) then '${rarity}'`), `${rarity} list`);
  }
  assert.ok(sql.includes(`v_solved / ${LUCKY_PAL_EVERY} <=`) && sql.includes(`sparks = sparks + ${LUCKY_PAL_FALLBACK_SPARKS}`), 'lucky gift rules');
  assert.ok(sql.includes('when v_roll < 0.1 then') && sql.includes('when v_roll < 0.3 then'), 'lucky odds');
  const { PAL_GROWTH_LEVELS } = await import('./pals.js');
  assert.ok(sql.includes(`if v_growth >= ${PAL_GROWTH_LEVELS} then`), 'levels per form');
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

test('grove: decor is bought with sparks and placed one per spot, with the same prices as the database', async () => {
  const { createEmptyProgress } = await import('./progress.js');
  const { GROVE_ITEMS, GROVE_SPOTS, buyGroveItemLocally, placeGroveItemLocally } = await import('./grove.js');
  const start = { ...createEmptyProgress(), sparks: 300 };
  assert.throws(() => placeGroveItemLocally(start, 'mushroomHouse', true));
  assert.throws(() => buyGroveItemLocally({ ...start, sparks: 10 }, 'mushroomHouse'));
  const one = buyGroveItemLocally(start, 'mushroomHouse');
  assert.equal(one.sparks, 180);
  assert.throws(() => buyGroveItemLocally(one, 'mushroomHouse'));
  const placed = placeGroveItemLocally(one, 'mushroomHouse', true);
  assert.deepEqual(placed.grove.placed, ['mushroomHouse']);
  // A second home replaces the first; a bench sits alongside it.
  const two = buyGroveItemLocally(buyGroveItemLocally({ ...placed, sparks: 300 }, 'acornCottage'), 'logBench');
  assert.deepEqual(placeGroveItemLocally(two, 'acornCottage', true).grove.placed, ['acornCottage']);
  assert.deepEqual(placeGroveItemLocally(two, 'logBench', true).grove.placed, ['mushroomHouse', 'logBench']);
  assert.deepEqual(placeGroveItemLocally(two, 'mushroomHouse', false).grove.placed, []);
  // Every spot has decor, and the server charges the same.
  for (const spot of GROVE_SPOTS)
    assert.ok(
      GROVE_ITEMS.some((item) => item.spot === spot.id),
      spot.id,
    );
  const sql = readFileSync(new URL('../../supabase/grove.sql', import.meta.url), 'utf8');
  for (const item of GROVE_ITEMS) {
    assert.ok(sql.includes(`when '${item.id}' then '{"price": ${item.price}, "spot": "${item.spot}"}'::jsonb`), `${item.id} price and spot`);
  }
});

test('pals: daily Shop picks and Lucky Pal gifts', async () => {
  const { createEmptyProgress } = await import('./progress.js');
  const pals = await import('./pals.js');
  const base = { ...createEmptyProgress(), pal: { id: 'ember', owned: { ember: { stage: 0 } }, accessories: [], wearing: [] } };
  // A daily pick is a Pal you don't have, the same all day, and usually different tomorrow.
  const day = new Date('2026-06-01T08:00:00Z');
  const pick = pals.dailyPalPick(base, 'mythic', 42, day);
  assert.equal(pals.rarityOf(pick), 'mythic');
  assert.equal(pals.dailyPalPick(base, 'mythic', 42, new Date('2026-06-01T23:00:00Z')).id, pick.id);
  assert.notEqual(pals.dailyPalPick(base, 'mythic', 42, new Date('2026-06-02T08:00:00Z')).id, pick.id);
  assert.equal(pals.canAdopt(base, pick, 42, day), true);
  const other = pals.PALS.find((pal) => pals.rarityOf(pal) === 'mythic' && pal.id !== pick.id);
  assert.equal(pals.canAdopt(base, other, 42, day), false);
  // Basic Pals: only this week's 6 (different ones each week); rare ones: at most 2 a week.
  const shelf = pals.weeklyAdoptShelf(42, day);
  assert.equal(new Set(shelf.map((pal) => pal.id)).size, pals.ADOPT_SHELF_SIZE);
  assert.ok(shelf.every((pal) => pals.rarityOf(pal) === 'common'));
  assert.equal(pals.canAdopt(base, shelf[0], 42, day), true);
  const offShelf = pals.PALS.find((pal) => pals.rarityOf(pal) === 'common' && !shelf.includes(pal));
  assert.equal(pals.canAdopt(base, offShelf, 42, day), false);
  assert.notDeepEqual(pals.weeklyAdoptShelf(42, new Date(day.getTime() + 7 * 86_400_000)), shelf, 'a new shelf next week');
  assert.equal(pals.canAdopt({ ...base, rareAdopts: 2 }, pick, 42, day), false, 'two rare adoptions a week');
  const sql = readFileSync(new URL('../../supabase/pals.sql', import.meta.url), 'utf8');
  assert.match(sql, /\(seed\.value \+ public\._adopt_week\(p_day\) \* 6 \+ i \* 7\) % pool\.size from generate_series\(0, 5\)/);
  assert.match(sql, new RegExp(`rare_adopts >= ${pals.RARE_ADOPTS_PER_WEEK} then`));
  // Lucky gifts: one per 200 solved levels, odds 10/20/70, always a Pal you don't have.
  assert.equal(pals.luckyRarityFor(0.05), 'mythic');
  assert.equal(pals.luckyRarityFor(0.2), 'legendary');
  assert.equal(pals.luckyRarityFor(0.5), 'common');
  assert.throws(() => pals.claimLuckyPalLocally(base));
  const levels = Object.fromEntries(
    Array.from({ length: 200 }, (_, i) => [`w${Math.floor(i / 20) + 1}-${String((i % 20) + 1).padStart(2, '0')}`, { stars: 1 }]),
  );
  const gift = pals.claimLuckyPalLocally({ ...base, levels }, 0.05, 0);
  assert.equal(pals.rarityOf(pals.palById(gift.palId)), 'mythic');
  assert.ok(gift.progress.pal.owned[gift.palId]);
  assert.equal(pals.luckyPalsWaiting(gift.progress), 0);
  // Legendary Pals can't be unlocked by stars; only gifts or the Shop.
  assert.equal(pals.isPalUnlocked({ ...base, levels }, pals.palById('leo')), false);
});

test('pieces: at most one new piece per level, and the built-in levels teach them one at a time', async () => {
  const { newPiecesIn, firstTileOf, piecesMetIn, PIECE_FIRST_LEVEL } = await import('./pieces.js');
  const level = {
    tiles: [
      { x: 0, y: 0, type: 'emitter', dir: 'right', color: 'sun' },
      { x: 1, y: 0, type: 'mirror', orient: 0 },
      { x: 2, y: 0, type: 'wall' },
      { x: 3, y: 0, type: 'gem', color: 'coral' },
      { x: 4, y: 0, type: 'filter', color: 'coral' },
    ],
  };
  assert.deepEqual(
    newPiecesIn(level, []).map((piece) => piece.id),
    ['basics'],
  );
  assert.deepEqual(
    newPiecesIn(level, ['basics']).map((piece) => piece.id),
    ['wall'],
  );
  assert.deepEqual(newPiecesIn(level, ['basics', 'wall', 'color']), []);
  assert.equal(firstTileOf(level, 'wall'), 2);
  assert.equal(firstTileOf(level, 'basics'), 1);
  assert.deepEqual(piecesMetIn({ 'w1-01': { stars: 3 }, 'w1-04': { stars: 1 } }), ['basics', 'wall']);
  // Playing the worlds in order, every level brings at most one new piece, exactly where planned.
  const { piecesIn } = await import('./pieces.js');
  const seen = [];
  let lastIntro = null;
  let previous = null;
  for (let world = 1; world <= 15; world++) {
    const levels = JSON.parse(readFileSync(new URL(`../data/worlds/world-${String(world).padStart(3, '0')}.json`, import.meta.url), 'utf8'));
    for (const built of levels) {
      const unseen = piecesIn(built).filter((id) => !seen.includes(id));
      assert.ok(unseen.length <= 1, `${built.id} brings ${unseen.join(', ')}`);
      if (unseen.length) {
        assert.equal(PIECE_FIRST_LEVEL[unseen[0]], built.id, `${unseen[0]} should first appear in ${PIECE_FIRST_LEVEL[unseen[0]]}`);
        seen.push(unseen[0]);
        // Never two introductions in a row: at least one level without a new piece in between.
        assert.ok(lastIntro === null || lastIntro !== previous, `${built.id} introduces a piece right after ${previous}`);
        lastIntro = built.id;
      }
      previous = built.id;
    }
  }
});

test('grove life: time of day, naps and what the Pal does next', async () => {
  const { timeOfDay, isNapTime, nextActivity, napSpot, SPOT_VISITS } = await import('./groveLife.js');
  const at = (hour) => new Date(2026, 5, 1, hour, 30);
  assert.equal(timeOfDay(at(7)), 'dawn');
  assert.equal(timeOfDay(at(12)), 'day');
  assert.equal(timeOfDay(at(19)), 'dusk');
  assert.equal(timeOfDay(at(23)), 'night');
  assert.equal(isNapTime(at(23)), true);
  assert.equal(isNapTime(at(14)), false);
  // A low roll visits a placed piece of decor; otherwise it wanders inside the clearing.
  assert.deepEqual(nextActivity(['seat', 'water'], [0.1, 0.9, 0, 0]), SPOT_VISITS.water);
  assert.equal(nextActivity([], [0.5, 0, 0, 0]).action, 'jump');
  assert.equal(nextActivity([], [0.5, 0, 0, 0]).left, undefined);
  const wander = nextActivity([], [0.7, 0, 0.5, 0.5]);
  assert.ok(wander.left >= 24 && wander.left <= 76 && wander.top >= 70 && wander.top <= 84);
  assert.deepEqual(napSpot(['home']), SPOT_VISITS.home);
});

test('grove life: seasons and friends who visit', async () => {
  const { seasonOf, visitingFriend } = await import('./groveLife.js');
  assert.equal(seasonOf(new Date(2026, 0, 10)), 'winter');
  assert.equal(seasonOf(new Date(2026, 3, 10)), 'spring');
  assert.equal(seasonOf(new Date(2026, 6, 10)), 'summer');
  assert.equal(seasonOf(new Date(2026, 9, 10)), 'autumn');
  const noon = new Date(2026, 5, 1, 13, 0);
  assert.equal(visitingFriend(['ember'], 'ember', noon), null);
  assert.ok(['mossy', 'coral'].includes(visitingFriend(['ember', 'mossy', 'coral'], 'ember', noon)));
  assert.equal(visitingFriend(['ember', 'mossy'], 'ember', new Date(2026, 5, 1, 12, 0)), null);
  assert.equal(visitingFriend(['ember', 'mossy'], 'ember', new Date(2026, 5, 1, 23, 30)), null);
});

test('the partner Pal cheers louder for bigger wins', async () => {
  const { cheerFor, cheerKindFor } = await import('./palCheers.js');
  assert.equal(cheerKindFor({ stars: 3, completesWorld: true }), 'world');
  assert.equal(cheerKindFor({ stars: 1, isFirstToday: true }), 'daily');
  assert.equal(cheerKindFor({ stars: 3 }, 4), 'streak');
  assert.equal(cheerKindFor({ stars: 3 }), 'perfect');
  assert.equal(cheerKindFor({ stars: 2 }), 'good');
  assert.equal(cheerKindFor({ stars: 1 }), 'solved');
  assert.equal(cheerFor({ stars: 3 }, 0, 0).isBig, true);
  assert.equal(cheerFor({ stars: 1 }, 0, 0.99).isBig, false);
  assert.ok(cheerFor({ stars: 1 }, 0, 0.99).line);
});

test('the Home Screen helper waits for a few levels and backs off after "Not now"', async () => {
  const { shouldSuggestInstall } = await import('./installNudge.js');
  const day = 86_400_000;
  assert.equal(shouldSuggestInstall({ solvedCount: 2 }), false);
  assert.equal(shouldSuggestInstall({ solvedCount: 3 }), true);
  assert.equal(shouldSuggestInstall({ solvedCount: 9, dismissedAt: 10 * day, timesDismissed: 1, now: 12 * day }), false);
  assert.equal(shouldSuggestInstall({ solvedCount: 9, dismissedAt: 10 * day, timesDismissed: 1, now: 17 * day }), true);
  assert.equal(shouldSuggestInstall({ solvedCount: 9, dismissedAt: 0, timesDismissed: 3, now: 99 * day }), false);
});

test('iPhones and iPads add apps through Share, other browsers through their menu', async () => {
  const { installMethod } = await import('../lib/installApp.js');
  assert.equal(installMethod('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios');
  assert.equal(installMethod('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5), 'ios');
  assert.equal(installMethod('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0), 'menu');
  assert.equal(installMethod('Mozilla/5.0 (Linux; Android 14)'), 'menu');
});

test('weekend events run Saturday and Sunday, take turns by theme and pay the prize once', async () => {
  const events = await import('./events.js');
  assert.equal(events.eventWeekendOf(new Date(2026, 10, 14, 10)), '2026-11-14');
  assert.equal(events.eventWeekendOf(new Date(2026, 10, 15, 23)), '2026-11-14');
  assert.equal(events.eventWeekendOf(new Date(2026, 10, 16, 9)), null);
  assert.equal(events.nextEventWeekend(new Date(2026, 10, 18)), '2026-11-21');
  assert.notEqual(events.eventThemeFor('2026-11-14').id, events.eventThemeFor('2026-11-21').id);
  assert.deepEqual(events.parseEventLevelId('event-2026-11-14-7'), { weekend: '2026-11-14', number: 7 });

  let progress = { sparks: 0, events: {} };
  for (let n = 1; n <= events.EVENT_LEVELS; n++) progress = events.recordEventLevelLocally(progress, '2026-11-14', n, 2);
  progress = events.recordEventLevelLocally(progress, '2026-11-14', 3, 1);
  assert.equal(progress.events['2026-11-14'].stars[3], 2, 'keeps the best stars');
  progress = events.claimEventPrizeLocally(progress, '2026-11-14');
  assert.equal(progress.sparks, events.EVENT_PRIZE_SPARKS);
  assert.throws(() => events.claimEventPrizeLocally(progress, '2026-11-14'));
  assert.equal(events.eventStamps(progress)[0].weekend, '2026-11-14');
});

test('event puzzles exist for upcoming weekends, climb in difficulty and match the server prize', async () => {
  const { EVENT_LEVELS, EVENT_PRIZE_SPARKS } = await import('./events.js');
  const { readdirSync } = await import('node:fs');
  const files = readdirSync(new URL('../data/events/', import.meta.url));
  assert.ok(files.length >= 50, 'about a year of weekends');
  for (const file of files) {
    const levels = JSON.parse(readFileSync(new URL(`../data/events/${file}`, import.meta.url), 'utf8'));
    assert.equal(levels.length, EVENT_LEVELS, file);
    levels.forEach((level, i) => i > 0 && assert.ok(level.par >= levels[i - 1].par, `${file} climbs`));
  }
  const sql = readFileSync(new URL('../../supabase/events.sql', import.meta.url), 'utf8');
  assert.match(sql, new RegExp(`sparks = sparks \\+ ${EVENT_PRIZE_SPARKS}\\b`));
  assert.match(sql, new RegExp(`p_number > ${EVENT_LEVELS}\\b`));
  assert.match(sql, new RegExp(`v_solved < ${EVENT_LEVELS}\\b`));
});

test('Pal of the day leads with news, otherwise says hello for the time of day', async () => {
  const { palGreetingFor } = await import('./palGreetings.js');
  const { createEmptyProgress } = await import('./progress.js');
  const base = createEmptyProgress();
  const almost = { ...base, pal: { ...base.pal, id: 'mossy', owned: { mossy: { stage: 1, growth: 18 } } } };
  assert.match(palGreetingFor(almost, new Date(2026, 10, 18, 9), 0), /2 more levels and I grow into a Buddy/);
  const fresh = { ...base, pal: { ...base.pal, id: 'mossy', owned: { mossy: { stage: 0, growth: 3 } } } };
  // No event talk before the player can join events (World 1 finished).
  assert.doesNotMatch(palGreetingFor(fresh, new Date(2026, 10, 14, 15), 0), /weekend/);
  const worldOne = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`w1-${String(i + 1).padStart(2, '0')}`, { stars: 1 }]));
  assert.match(palGreetingFor({ ...fresh, levels: worldOne }, new Date(2026, 10, 14, 15), 0), /weekend/);
  assert.match(palGreetingFor(fresh, new Date(2026, 10, 18, 8), 0), /morning/i);
});

test('every world theme has its own musical voice', async () => {
  const { WORLD_VOICES } = await import('../audio/worldVoices.js');
  const { WORLD_THEMES } = await import('./worlds.js');
  for (const theme of WORLD_THEMES) {
    const voice = WORLD_VOICES[theme];
    assert.ok(voice, theme);
    assert.equal(voice.notes.length, 11, `${theme} has 11 notes`);
    voice.notes.forEach((hz, i) => i > 0 && assert.ok(hz > voice.notes[i - 1], `${theme} rises`));
    voice.motif.forEach((step) => assert.ok(step < voice.notes.length));
  }
});

test('Pal quests: three a week, counted per level, paid once, and the same on the server', async () => {
  const quests = await import('./quests.js');
  assert.equal(quests.questWeekOf(new Date(Date.UTC(2026, 10, 14, 12))), '2026-11-09');
  assert.equal(quests.questWeekOf(new Date(Date.UTC(2026, 10, 16, 1))), '2026-11-16');
  assert.deepEqual(
    quests.questsForWeek('2026-11-09').map((q) => q.id),
    ['solve5', 'perfect6', 'hard1'],
  );

  const week = '2026-11-09';
  let progress = { sparks: 0, quests: null };
  for (const [id, stars] of [
    ['w1-05', 3],
    ['w1-05', 3],
    ['w1-06', 1],
    ['daily-x', 3],
    ['w2-10', 2],
  ])
    progress = quests.recordQuestProgress(progress, id, stars, week);
  const log = quests.questLogFor(progress, week);
  assert.deepEqual([log.solved.length, log.perfect.length, log.hard.length], [3, 1, 2], 'each level once, daily puzzles don’t count');
  progress = quests.claimQuestLocally(progress, 'hard1', week);
  assert.equal(progress.sparks, 30);
  assert.throws(() => quests.claimQuestLocally(progress, 'hard1', week));
  assert.throws(() => quests.claimQuestLocally(progress, 'solve5', week));
  assert.equal(quests.questLogFor(progress, '2026-11-16').solved.length, 0, 'a new week starts fresh');

  const sql = readFileSync(new URL('../../supabase/quests.sql', import.meta.url), 'utf8');
  for (const quest of quests.QUESTS) {
    assert.match(
      sql,
      new RegExp(`'${quest.id}' then '\\{"kind": "${quest.kind}", "target": ${quest.target}, "sparks": ${quest.sparks}\\}'`),
      quest.id,
    );
  }
});

test('the solve replay plays the winning taps back in order and ends solved', async () => {
  const { replayTimeline, replayStateAt, replayDuration, REPLAY_TIMING } = await import('./replay.js');
  const { nearestSolution } = await import('./solver.js');
  const level = JSON.parse(readFileSync(new URL('../data/worlds/world-002.json', import.meta.url), 'utf8'))[4];
  const start = level.tiles.map((t) => t.orient ?? 0);
  const target = nearestSolution(level, start);
  const history = target.map((orient, i) => (orient !== start[i] ? i : -1)).filter((i) => i >= 0);
  const timeline = replayTimeline(level, history);
  assert.equal(timeline.isSolved, true);
  assert.equal(timeline.steps.length, history.length);
  assert.equal(replayStateAt(timeline, 0).phase, 'intro');
  const mid = replayStateAt(timeline, REPLAY_TIMING.introMs + timeline.stepMs * 0.1);
  assert.deepEqual([mid.phase, mid.turning], ['play', timeline.steps[0].turning]);
  const end = replayStateAt(timeline, replayDuration(timeline) - 10);
  assert.equal(end.phase, 'outro');
  assert.deepEqual(end.orients, target);
  assert.ok(replayDuration(replayTimeline(level, Array(60).fill(history[0]))) < 15000, 'long solves are sped up');
});

test('player card stats: stars and levels from built-in levels only, worlds and Pals counted', async () => {
  const { playerStatsOf, TOTAL_PALS } = await import('./playerStats.js');
  const levels = { 'event-2026-11-14-1': { stars: 3 } };
  for (let i = 1; i <= 20; i++) levels[`w1-${String(i).padStart(2, '0')}`] = { stars: 2 };
  levels['w2-01'] = { stars: 3 };
  const stats = playerStatsOf({ levels, pal: { owned: { mossy: {}, ember: {} } } });
  assert.deepEqual(stats, { stars: 43, levelsSolved: 21, worldsFinished: 1, palsCount: 2 });
  assert.equal(TOTAL_PALS, 48);
  const sql = readFileSync(new URL('../../supabase/player_cards.sql', import.meta.url), 'utf8');
  for (const key of ['palsCount', 'stars', 'levelsSolved', 'worldsFinished']) assert.match(sql, new RegExp(`'${key}'`), key);
});

test('weekly theme collections: one theme a week, prices match the server, buying checks currency', async () => {
  const themes = await import('./themes.js');
  assert.equal(themes.themeOfWeek(new Date(Date.UTC(2026, 10, 14))).id, 'elvenWoods');
  assert.equal(themes.themeOfWeek(new Date(Date.UTC(2026, 10, 16, 1))).id, 'autumnHarvest');
  assert.equal(themes.nextTheme(new Date(Date.UTC(2026, 10, 14))).id, 'autumnHarvest');
  const sql = readFileSync(new URL('../../supabase/themed_shop.sql', import.meta.url), 'utf8');
  for (const theme of themes.THEMES) {
    assert.ok(sql.includes(`'${theme.id}'`), theme.id);
    for (const item of theme.items) {
      const where = item.kind === 'outfit' ? `"slot": "${item.slot}"` : `"spot": "${item.spot}"`;
      assert.ok(
        sql.includes(`when '${item.id}' then '{"kind": "${item.kind}", ${where}, "price": ${item.price}, "currency": "${item.currency}"}'`),
        item.id,
      );
      assert.ok(sql.includes(`when '${item.id}' then '${theme.id}'`), `${item.id} theme`);
    }
  }
  const week = new Date(Date.UTC(2026, 10, 14));
  const base = { sparks: 200, diamonds: 0, pal: { accessories: [], wearing: [] }, grove: { items: [], placed: [] } };
  const bought = themes.buyThemeItemLocally(base, 'leafCrown', week);
  assert.deepEqual([bought.sparks, bought.pal.accessories], [60, ['leafCrown']]);
  assert.throws(() => themes.buyThemeItemLocally(base, 'elvenCloak', week), /Sign in|diamonds/);
  assert.throws(() => themes.buyThemeItemLocally(base, 'snowman', week), /this week/);
  const pals = await import('./pals.js');
  assert.throws(() => pals.buyAccessoryLocally(base, 'leafCrown'), /not in the shop/, 'theme items never go through the regular sparks shop');
  assert.equal(pals.accessoryById('leafCrown').slot, 'head');
});

test('combos cheer when one tap lights several gems', async () => {
  const { comboFor } = await import('./combos.js');
  assert.equal(comboFor(1), null);
  assert.equal(comboFor(2).word, 'Double!');
  assert.equal(comboFor(3).word, 'Triple!');
  assert.equal(comboFor(5).word, 'MEGA!');
});

test('Glowbugs: 60 species, on about a quarter of levels and every boss, rescued with three stars', async () => {
  const bugs = await import('./glowbugs.js');
  assert.equal(bugs.GLOWBUGS.length, 60);
  assert.equal(new Set(bugs.GLOWBUGS.map((bug) => bug.name)).size, 60, 'every Glowbug has its own name');
  assert.ok(bugs.GLOWBUGS.every((bug) => /[.!?]$/.test(bug.bio) && !/[.!?]\.$/.test(bug.bio)));
  assert.equal(bugs.glowbugForLevel('w1-02'), null, 'not in the tutorial');
  assert.equal(bugs.glowbugForLevel('daily-2026-11-14'), null);
  for (let w = 1; w <= 50; w++) assert.ok(bugs.glowbugForLevel(`w${w}-20`)?.rare, `boss of world ${w} has a rare Glowbug`);
  const level = JSON.parse(readFileSync(new URL('../data/worlds/world-001.json', import.meta.url), 'utf8'))[6];
  const cell = bugs.glowbugCellOf(level);
  assert.ok(cell !== null && !level.tiles.some((t) => t.y * level.width + t.x === cell), 'sleeps on an empty cell');
  const rescued = bugs.rescuedGlowbugs({ 'w1-07': { stars: 3 }, 'w1-10': { stars: 2 }, 'w1-08': { stars: 3 } });
  assert.deepEqual([...rescued.keys()], [bugs.glowbugForLevel('w1-07').id]);
});

test('treats: one every three solved levels, fed one at a time', async () => {
  const treats = await import('./treats.js');
  const levels = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`w1-0${i + 1}`, { stars: 1 }]));
  assert.equal(treats.treatsFound(levels), 2);
  // The newest treat is fed first (the one the win screen just showed), then the older one.
  const fed = treats.feedTreat({ levels, treatsFed: 0 }, 0);
  assert.deepEqual([fed.treat.id, fed.progress.treatsFed, fed.trick], ['berry', 1, 'backflip']);
  assert.equal(treats.feedTreat({ levels, treatsFed: 1 }, 0).treat.id, 'cookie');
  assert.equal(treats.feedTreat({ levels, treatsFed: 2 }), null);
  const eight = { ...levels, 'w1-08': { stars: 2 } };
  const nine = { ...eight, 'w1-09': { stars: 2 } };
  assert.equal(treats.treatFoundBy(levels, eight), null);
  assert.equal(treats.treatFoundBy(eight, nine).id, 'starCandy');
});

test('stickers: six per world, earned from stars', async () => {
  const { stickersForWorld, newStickersFor, earnedStickers } = await import('./stickers.js');
  const allThree = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`w2-${String(i + 1).padStart(2, '0')}`, { stars: 3 }]));
  assert.ok(stickersForWorld(2, allThree).every((sticker) => sticker.isEarned));
  assert.equal(earnedStickers(allThree).size, 6);
  const almost = { ...allThree, 'w2-20': { stars: 2 } };
  assert.deepEqual(
    newStickersFor(2, almost, allThree).map(({ sticker }) => sticker.id),
    ['bossBeater', 'perfect']
      .concat(stickersForWorld(2, almost).find((s) => s.id === 'bugBuddy').isEarned ? [] : ['bugBuddy'])
      .sort((a, b) => ['bossBeater', 'bugBuddy', 'perfect'].indexOf(a) - ['bossBeater', 'bugBuddy', 'perfect'].indexOf(b)),
  );
});

test('play counts: walls are levels with enough attempts and a low win rate, hardest first', async () => {
  const { findWalls, winRateOf } = await import('./playCounts.js');
  const counts = new Map([
    ['w1-05', { starts: 40, wins: 36, outOfMoves: 4, quits: 0 }],
    ['w3-17', { starts: 30, wins: 9, outOfMoves: 15, quits: 6 }],
    ['w2-11', { starts: 20, wins: 8, outOfMoves: 10, quits: 2 }],
    ['w9-01', { starts: 4, wins: 0, outOfMoves: 4, quits: 0 }],
  ]);
  assert.equal(winRateOf({ starts: 0, wins: 0 }), null);
  assert.deepEqual(
    findWalls(counts).map((wall) => wall.levelId),
    ['w3-17', 'w2-11'],
  );
});

test('challenge links carry the level, moves and a safe nickname', async () => {
  const { challengePath, parseChallenge, challengeOutcome } = await import('./challenges.js');
  assert.equal(challengePath('w4-06', 5, 'Sunny Otter'), '#/challenge/w4-06/5/Sunny%20Otter');
  assert.equal(challengePath('w4-06', 5, 'x'), '#/challenge/w4-06/5');
  assert.deepEqual(parseChallenge(['w4-06', '5', 'Sunny Otter']), { levelId: 'w4-06', moves: 5, name: 'Sunny Otter' });
  assert.equal(parseChallenge(['w4-06', '5', '<script>']).name, null);
  assert.equal(parseChallenge(['daily', '5']), null);
  assert.equal(parseChallenge(['w4-06', '0']), null);
  assert.equal(parseChallenge(['w4-06', '2.5']), null);
  assert.deepEqual([challengeOutcome(4, 5), challengeOutcome(5, 5), challengeOutcome(6, 5)], ['win', 'tie', 'lose']);
});

test('Light Rush: the same 30 levels for everyone each week, climbing through the worlds', async () => {
  const { rushLevelIds, RUSH_LENGTH } = await import('./rush.js');
  const ids = rushLevelIds('2026-11-09');
  assert.equal(ids.length, RUSH_LENGTH);
  assert.deepEqual(ids, rushLevelIds('2026-11-09'));
  assert.notDeepEqual(ids, rushLevelIds('2026-11-16'));
  assert.equal(new Set(ids).size, RUSH_LENGTH);
  assert.equal(ids[0].startsWith('w1-'), true);
  assert.equal(ids[29].startsWith('w15-'), true);
  assert.equal(
    ids.slice(0, 20).every((id) => Number(id.split('-')[1]) % 5 !== 0),
    true,
  );
  assert.equal(
    ids.every((id) => Number(id.split('-')[1]) !== 20),
    true,
  );
});

test('Light Rush: spare moves, bonuses, restarts and milestone sparks', async () => {
  const { newRun, afterRushSolve, afterRushRestart, rushMoveLimit, recordRushRunLocally, RUSH_START_SPARE } = await import('./rush.js');
  let run = newRun('2026-11-09');
  assert.equal(rushMoveLimit(run, 5), 5 + RUSH_START_SPARE);
  run = afterRushSolve(run, 5, 5);
  assert.equal(run.spare, RUSH_START_SPARE);
  run = afterRushSolve(run, 5, 8);
  assert.equal(run.spare, RUSH_START_SPARE - 3);
  run = afterRushRestart(run, 4);
  assert.equal(run.spare, RUSH_START_SPARE - 7);
  run = { ...run, cleared: 4 };
  assert.equal(afterRushSolve(run, 4, 4).spare, RUSH_START_SPARE - 7 + 3);
  const start = { sparks: 10, rush: null };
  const first = recordRushRunLocally(start, '2026-11-09', 12);
  assert.equal(first.sparksWon, 60);
  assert.deepEqual(first.progress.rush, { week: '2026-11-09', best: 12, paid: [5, 10] });
  const again = recordRushRunLocally(first.progress, '2026-11-09', 7);
  assert.equal(again.sparksWon, 0);
  assert.equal(again.progress.rush.best, 12);
});

test('Light Rush milestones match the database', async () => {
  const { RUSH_MILESTONES, RUSH_LENGTH } = await import('./rush.js');
  const sql = readFileSync(new URL('../../supabase/rush.sql', import.meta.url), 'utf8');
  for (const { cleared, sparks } of RUSH_MILESTONES) assert.match(sql, new RegExp(`when ${cleared} then ${sparks}\\b`));
  assert.match(sql, new RegExp(`unnest\\(array\\[${RUSH_MILESTONES.map((m) => m.cleared).join(', ')}\\]\\)`));
  assert.match(sql, new RegExp(`p_cleared > ${RUSH_LENGTH}`));
});

test('worlds 1–3: every flavored level is built as its flavor, and no two in a row share one', async () => {
  const { recipeFor, REST_RECIPES } = await import('./recipes.js');
  for (const world of [1, 2, 3]) {
    const levels = JSON.parse(readFileSync(new URL(`../data/worlds/world-00${world}.json`, import.meta.url), 'utf8'));
    levels.forEach((level, i) => {
      assert.equal(level.recipe ?? null, recipeFor(world, level.index), level.id);
      if (i > 0 && level.recipe) assert.notEqual(level.recipe, levels[i - 1].recipe, `${level.id} repeats ${level.recipe}`);
      const lamps = level.tiles.filter((t) => t.type === 'emitter').length;
      if (level.recipe === 'oneTap') assert.equal(level.par, 1, level.id);
      if (level.recipe === 'twoLamps') assert.equal(lamps, 2, level.id);
      if (level.recipe === 'lightShow') assert.equal(lamps, 3, level.id);
      if (level.recipe === 'rainbow')
        assert.ok(
          level.tiles.some((t) => t.type === 'filter'),
          level.id,
        );
      if (level.recipe === 'oneTap') assert.notEqual(level.difficulty, 'hard', level.id);
      if ([6, 11, 16].includes(level.index) && level.recipe) assert.ok(REST_RECIPES.includes(level.recipe), `${level.id} should be a breather`);
    });
  }
});

test('taps left: the fewest taps that still solve a level', async () => {
  const { tapsLeftFinder, nearestSolution } = await import('./solver.js');
  const level = JSON.parse(readFileSync(new URL('../data/worlds/world-002.json', import.meta.url), 'utf8'))[4];
  const start = level.tiles.map((t) => t.orient ?? 0);
  const tapsLeft = tapsLeftFinder(level);
  assert.equal(tapsLeft(start), level.par);
  // After one tap on a piece of the best solution, one tap fewer is left; a solved board needs none.
  const solved = nearestSolution(level, start);
  const oneTurned = start.map((orient, i) => (i === solved.findIndex((o, j) => o !== start[j]) ? solved[i] : orient));
  assert.equal(tapsLeft(oneTurned), level.par - 1);
  assert.equal(tapsLeft(solved), 0);
});

test('level names never repeat within a built-in world', async () => {
  const { levelNameFor } = await import('./levelNames.js');
  for (const world of [1, 2, 3, 17]) {
    const file = new URL(`../data/worlds/world-${String(world).padStart(3, '0')}.json`, import.meta.url);
    const names = JSON.parse(readFileSync(file, 'utf8')).map(levelNameFor);
    assert.equal(new Set(names).size, names.length, `world ${world}: ${names.join(', ')}`);
  }
});

test('translations: every language uses the same keys and placeholders as English', async () => {
  const { en } = await import('../i18n/strings/en.js');
  const { es } = await import('../i18n/strings/es.js');
  const { he } = await import('../i18n/strings/he.js');
  // Keys for game content (pieces, flavors, helpers…) only exist in translations: English lives in the game modules.
  const CONTENT =
    /^(piece|recipe|helper|stage|title|treat|sticker|quips|combo|palName|palBio|outfit|decor|themeSet|bug|quest|eventTheme|beam|item)\./;
  const base = (key) => key.replace(/\.(zero|one|two|few|many|other)$/, '');
  const enBases = new Set(Object.keys(en).map(base));
  const placeholders = (text) =>
    typeof text === 'string'
      ? [...text.matchAll(/\{(\w+)\}/g)]
          .map((m) => m[1])
          .filter((n) => n !== 'count')
          .sort()
      : [];
  for (const [name, dict] of [
    ['es', es],
    ['he', he],
  ]) {
    for (const [key, value] of Object.entries(dict)) {
      if (CONTENT.test(key)) continue;
      assert.ok(enBases.has(base(key)), `${name}: "${key}" is not an English key`);
      const enValue = en[key] ?? en[`${base(key)}.other`] ?? en[base(key)];
      assert.deepEqual(placeholders(value), placeholders(enValue), `${name}: placeholders of "${key}"`);
    }
    for (const key of enBases) {
      const has = dict[key] !== undefined || Object.keys(dict).some((k) => base(k) === key);
      assert.ok(has, `${name} is missing "${key}"`);
    }
  }
});

test('translations: plurals, placeholders, English fallback and the device language', async () => {
  const { translate, detectLanguage } = await import('../i18n/translate.js');
  assert.equal(translate('en', 'win.solvedIn', { count: 1 }), 'Solved in 1 move');
  assert.equal(translate('es', 'win.solvedIn', { count: 3 }), 'Resuelto en 3 movimientos');
  assert.equal(translate('he', 'win.solvedIn', { count: 1 }), 'עברתם במהלך אחד');
  assert.equal(translate('he', 'win.solvedIn', { count: 2 }), 'עברתם ב-2 מהלכים');
  assert.equal(translate('he', 'no.such.key', {}, 'fallback'), 'fallback');
  assert.equal(detectLanguage(['he-IL']), 'he');
  assert.equal(detectLanguage(['iw']), 'he');
  assert.equal(detectLanguage(['es-MX', 'en']), 'es');
  assert.equal(detectLanguage(['fr-FR']), 'en');
});

test('translations: every key the screens ask for exists in English', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { en } = await import('../i18n/strings/en.js');
  const root = new URL('../', import.meta.url).pathname;
  const files = [];
  const walk = (dir) =>
    readdirSync(dir).forEach((name) =>
      statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : /\.jsx?$/.test(name) && files.push(join(dir, name)),
    );
  walk(root);
  const base = (key) => key.replace(/\.(one|other)$/, '');
  const known = new Set(Object.keys(en).map(base));
  for (const file of files) {
    for (const [, key, hasFallback] of readFileSync(file, 'utf8').matchAll(/\bt\('([a-zA-Z.]+)'(?:,\s*\{[^}]*\}(,\s*[^)]))?/g)) {
      if (hasFallback) continue;
      assert.ok(known.has(key), `${file.replace(root, '')}: "${key}" is missing from en.js`);
    }
  }
});

test('win streak and level milestones', async () => {
  const { nextWinStreak, streakBoosters, winsToNextBonus } = await import('./winStreak.js');
  const { milestoneReached, solvedLevelCount } = await import('./milestones.js');
  const { levelNumber } = await import('./worlds.js');
  let streak = 0;
  for (let i = 0; i < 3; i++) streak = nextWinStreak(streak, { isWin: true });
  assert.deepEqual(streakBoosters(streak), ['spareMoves']);
  assert.equal(winsToNextBonus(streak), 3);
  assert.deepEqual(streakBoosters(6), ['spareMoves', 'steadyHand']);
  assert.equal(nextWinStreak(7, { isWin: false }), 0, 'running out of moves ends it');
  assert.equal(milestoneReached(49, 50), 50);
  assert.equal(milestoneReached(50, 51), null);
  assert.equal(solvedLevelCount({ levels: { 'w1-01': { stars: 2 }, 'w1-02': { stars: 0 }, 'event-2026-01-03-1': { stars: 3 } } }), 1);
  assert.equal(levelNumber(1, 1), 1);
  assert.equal(levelNumber(8, 8), 148);
  assert.equal(levelNumber(50, 20), 1000);
});

test('glowbug rows: the database knows every Glowbug level, and a full row is all 5 colors', async () => {
  const { GLOWBUG_KINDS, completedGlowbugRows, glowbugForLevel, GLOWBUGS } = await import('./glowbugs.js');
  const sql = readFileSync(new URL('../../supabase/glowbugs.sql', import.meta.url), 'utf8');
  const inSql = new Map(
    [...sql.matchAll(/\('(w\d+-\d{2})', '([a-z]+-[a-z]+)', '([a-z]+)'\)/g)].map(([, level, bug, kind]) => [level, `${bug}|${kind}`]),
  );
  let count = 0;
  for (let world = 1; world <= 50; world++) {
    for (let index = 1; index <= 20; index++) {
      const levelId = `w${world}-${String(index).padStart(2, '0')}`;
      const bug = glowbugForLevel(levelId);
      if (!bug) continue;
      count++;
      assert.equal(inSql.get(levelId), `${bug.id}|${bug.kind}`, levelId);
    }
  }
  assert.equal(inSql.size, count, 'no extra rows');
  // Every color of every kind naps somewhere, so every row can be finished.
  assert.equal(new Set([...inSql.values()].map((value) => value.split('|')[0])).size, GLOWBUGS.length);
  const firefly = GLOWBUGS.filter((bug) => bug.kind === GLOWBUG_KINDS[0].id).map((bug) => bug.id);
  const levels = {};
  for (const [level, value] of inSql) if (firefly.includes(value.split('|')[0])) levels[level] = { stars: 3 };
  assert.deepEqual(completedGlowbugRows(levels), [GLOWBUG_KINDS[0].id]);
});
