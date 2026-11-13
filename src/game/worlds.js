import { DIFFICULTY } from './constants.js';

/**
 * Worlds group levels and introduce one new idea each.
 * Inside every world: mostly normal levels, a Hard level every 4th,
 * and an Extra Hard finale.
 */
export const WORLDS = [
  { id: 1, name: 'Sunrise', tagline: 'Bend the light', theme: 'sunshine', starsToUnlock: 0 },
  { id: 2, name: 'Split', tagline: 'One beam, two paths', theme: 'tangerine', starsToUnlock: 20 },
  { id: 3, name: 'Hues', tagline: 'Paint the light', theme: 'coral', starsToUnlock: 50 },
  { id: 4, name: 'Shadows', tagline: 'Keep the dark ones dark', theme: 'mint', starsToUnlock: 85 },
  { id: 5, name: 'Prism Peak', tagline: 'Experts only', theme: 'ember', starsToUnlock: 120 },
];

export const LEVELS_PER_WORLD = 12;

export function difficultyFor(index) {
  if (index === LEVELS_PER_WORLD) return DIFFICULTY.EXTRA;
  if (index % 4 === 0) return DIFFICULTY.HARD;
  return DIFFICULTY.NORMAL;
}

export const levelId = (world, index) => `w${world}-${String(index).padStart(2, '0')}`;

/**
 * Generator settings for a world/level. Difficulty ramps inside each world,
 * with Hard and Extra Hard levels spiking above the curve.
 */
export function generatorPresetFor(world, index) {
  const difficulty = difficultyFor(index);
  const ramp = (index - 1) / (LEVELS_PER_WORLD - 1); // 0 → 1 through the world
  const spike = difficulty === DIFFICULTY.EXTRA ? 2 : difficulty === DIFFICULTY.HARD ? 1 : 0;
  const size = Math.min(8, 5 + Math.round(ramp * 2) + (spike > 0 ? 1 : 0) + (world > 2 ? 1 : 0));

  const base = {
    width: size,
    height: size,
    emitters: spike === 2 ? 2 : 1,
    turns: spike === 2 ? [2, 3] : [1 + Math.round(ramp) + spike, 2 + Math.round(ramp) + spike],
    segment: [1, 3],
    decoys: Math.round(ramp * 3) + spike * 2,
    walls: Math.round(ramp * 2) + spike,
    minPar: 1 + Math.round(ramp * 2) + (spike === 2 ? 3 : spike * 2),
    lockedRatio: spike > 0 ? 0.05 : 0.15,
  };

  if (world === 1 && index === 1) {
    return { ...base, width: 4, height: 4, turns: [1, 1], decoys: 0, walls: 0, minPar: 1, maxPar: 1, lockedRatio: 0 };
  }
  if (world === 1 && index <= 3) return { ...base, turns: [1, 2], decoys: index - 1, walls: 0, minPar: index - 1 || 1 };
  if (world === 2) return { ...base, splits: 1 + (spike > 0 ? 1 : 0), turns: [1, 2 + spike] };
  if (world === 3) return { ...base, filters: 1 + (index > 6 ? 1 : 0), splits: index > 4 ? 1 : 0 };
  if (world === 5) {
    // Expert world: big boards, several light sources, every mechanic at once.
    const expertSize = spike === 2 ? 10 : spike === 1 || index > 6 ? 9 : 8;
    return {
      width: expertSize,
      height: expertSize,
      emitters: spike === 2 ? 3 : index > 6 || spike === 1 ? 2 : 1,
      turns: spike === 2 ? [2, 3] : [3, 4],
      segment: [1, 3],
      splits: spike > 0 ? 2 : 1,
      filters: 1 + (index > 4 ? 1 : 0),
      shades: 2 + spike,
      decoys: 2 + spike,
      walls: 2 + spike,
      minPar: spike === 2 ? 10 : spike === 1 ? 8 : 5 + Math.round(ramp * 2),
      lockedRatio: 0.2,
    };
  }
  if (world === 4) return { ...base, shades: 1 + Math.round(ramp * 2) + spike, splits: index > 3 ? 1 : 0, filters: index > 6 ? 1 : 0 };
  return base;
}
