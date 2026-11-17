import test from 'node:test';
import assert from 'node:assert/strict';
import { isQuietWin, opensWithoutCard } from './quickWin.js';
import { DIFFICULTY } from './constants.js';

const plain = { stars: 3, moves: 4, sparksEarned: 12 };
const room = { difficulty: DIFFICULTY.NORMAL, hasNext: true, hasWaitingGift: false };

test('a plain win flows on; big moments, Hard levels and waiting gifts keep the full win screen', () => {
  assert.equal(isQuietWin(plain, room), true);
  assert.equal(isQuietWin(null, room), false);
  assert.equal(isQuietWin(plain, { ...room, hasNext: false }), false);
  assert.equal(isQuietWin(plain, { ...room, hasWaitingGift: true }), false);
  assert.equal(isQuietWin(plain, { ...room, difficulty: DIFFICULTY.HARD }), false);
  for (const news of [
    { milestone: 50 },
    { completesWorld: true },
    { palGrewTo: { id: 'junior' } },
    { levelUp: 3 },
    { newRecords: ['hard'] },
    { glowbug: {} },
    { diamondsEarned: 1 },
    { isSkipped: true },
  ])
    assert.equal(isQuietWin({ ...plain, ...news }, room), false, JSON.stringify(news));
});

test('only plain levels open without their card', () => {
  assert.equal(opensWithoutCard({ difficulty: DIFFICULTY.NORMAL, isFirstSteps: false, newPieceCount: 0 }), true);
  assert.equal(opensWithoutCard({ difficulty: DIFFICULTY.HARD, isFirstSteps: false, newPieceCount: 0 }), false);
  assert.equal(opensWithoutCard({ difficulty: DIFFICULTY.NORMAL, isFirstSteps: false, newPieceCount: 1 }), false);
});
