import { hashString } from '../lib/random.js';
import { DIFFICULTY } from './constants.js';
import { LEVELS_PER_WORLD } from './worlds.js';
import { HELPER_IDS } from './catalog.js';

/**
 * Some levels get a surprise look: a disco party, a night board, or a dramatic boss intro.
 * Purely visual, stable per level, so replays look the same.
 */
export function levelModifierFor(level) {
  if (level.difficulty === DIFFICULTY.EXTRA) return 'boss';
  if (level.isDaily || level.index <= 3) return 'normal';
  const roll = hashString(`mod-${level.id}`) % 100;
  if (roll < 9) return 'disco';
  if (roll < 17) return 'night';
  return 'normal';
}

/** Reward chests sit on the map halfway through and at the end of every world. */
export const CHEST_AFTER_LEVELS = [10, LEVELS_PER_WORLD];

export const chestId = (world, chestNumber) => `w${world}-c${chestNumber}`;

/**
 * What's inside a chest. Fixed per chest (no randomness, nothing for sale), and it grows
 * with the world. Must match public.chest_reward() in supabase/progression.sql.
 */
export function chestRewardFor(world, chestNumber) {
  const isWorldChest = chestNumber === 2;
  return {
    sparks: isWorldChest ? 40 + world * 4 : 20 + world * 2,
    helper: HELPER_IDS[(world + chestNumber) % 3], // hint, lens or autoturn
  };
}
