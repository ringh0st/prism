import { DIFFICULTY } from './constants.js';
import { WORLD_COUNT, builtInLevelRefs } from './worlds.js';
import { glowbugForLevel } from './glowbugs.js';

/*
 * The sticker album: six stickers per world for playing it well. All come from the player's stars, so
 * they need no saving.
 */
const starsOf = (levels, id) => levels[id]?.stars ?? 0;

export const STICKERS = [
  {
    id: 'explorer',
    name: 'Explorer',
    icon: 'map',
    how: 'Finish every level',
    test: (refs, levels) => refs.every((ref) => starsOf(levels, ref.id) > 0),
  },
  {
    id: 'starry',
    name: 'Starry',
    icon: 'star',
    how: '★★★ on 10 levels',
    test: (refs, levels) => refs.filter((ref) => starsOf(levels, ref.id) === 3).length >= 10,
  },
  {
    id: 'hardHero',
    name: 'Hard Hero',
    icon: 'flame',
    how: '★★★ on every Hard level',
    test: (refs, levels) => refs.filter((ref) => ref.difficulty === DIFFICULTY.HARD).every((ref) => starsOf(levels, ref.id) === 3),
  },
  {
    id: 'bossBeater',
    name: 'Boss Beater',
    icon: 'crown',
    how: '★★★ on the boss',
    test: (refs, levels) => refs.filter((ref) => ref.difficulty === DIFFICULTY.EXTRA).every((ref) => starsOf(levels, ref.id) === 3),
  },
  {
    id: 'bugBuddy',
    name: 'Bug Buddy',
    icon: 'heart',
    how: 'Rescue every Glowbug',
    test: (refs, levels) => refs.filter((ref) => glowbugForLevel(ref.id)).every((ref) => starsOf(levels, ref.id) === 3),
  },
  {
    id: 'perfect',
    name: 'Perfect!',
    icon: 'trophy',
    how: '★★★ on all 20 levels',
    test: (refs, levels) => refs.every((ref) => starsOf(levels, ref.id) === 3),
  },
];

/** A world's stickers: [{ ...sticker, isEarned }]. */
export const stickersForWorld = (world, levels) => {
  const refs = builtInLevelRefs(world);
  return STICKERS.map((sticker) => ({ ...sticker, isEarned: sticker.test(refs, levels) }));
};

/** Every earned sticker as "world-stickerId". */
export function earnedStickers(levels) {
  const earned = new Set();
  for (let world = 1; world <= WORLD_COUNT; world++) {
    if (!builtInLevelRefs(world).some((ref) => levels[ref.id])) continue;
    for (const sticker of stickersForWorld(world, levels)) if (sticker.isEarned) earned.add(`${world}-${sticker.id}`);
  }
  return earned;
}

/** Stickers a solve just earned: [{ world, sticker }]. Only looks at the solved level's world. */
export function newStickersFor(world, levelsBefore, levelsAfter) {
  const before = stickersForWorld(world, levelsBefore);
  return stickersForWorld(world, levelsAfter)
    .filter((sticker, i) => sticker.isEarned && !before[i].isEarned)
    .map((sticker) => ({ world, sticker }));
}
