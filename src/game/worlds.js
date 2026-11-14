import { DIFFICULTY } from './constants.js';

export const WORLD_COUNT = 50;
export const LEVELS_PER_WORLD = 20;
export const STARS_PER_WORLD_TO_UNLOCK = 30;

/** Warm color themes the map cycles through (no purple or blue). */
export const WORLD_THEMES = ['sunshine', 'tangerine', 'coral', 'mint', 'ember', 'lime', 'peach', 'gold'];

/** Fifty worlds, each with a (hopefully) funny name and tagline. */
const WORLD_NAMES = [
  ['Sunrise Sandbox', 'Bend the light'],
  ['Split Personality', 'One beam, two paths'],
  ['Paint Party', 'Light changes color'],
  ['Shadow Puppets', 'Keep the dark ones dark'],
  ['Mirror Mayhem', 'Everything at once'],
  ['Photon Bakery', 'Fresh light, hot from the oven'],
  ['Laser Lagoon', 'Splish, splash, flash'],
  ['Glimmer Gulch', 'A wild west of reflections'],
  ['Beam Me Up', 'Highly logical puzzles'],
  ['Sparkle Swamp', 'Damp but dazzling'],
  ['Dazzle Dunes', 'Hot sand, hotter beams'],
  ['Prism Peaks', 'Thin air, bright ideas'],
  ['Twinkle Town', 'Population: shiny'],
  ['Radiant Ruins', 'Ancient light, new tricks'],
  ['Lumen Lane', 'Mind the beams'],
  ['Kaleido Cove', 'Colors everywhere'],
  ['Flash Forest', 'The trees are mirrors now'],
  ['Glow Grotto', 'Bring sunglasses'],
  ['Shimmer Shores', 'Waves of light'],
  ['Halo Hills', 'Angelic, but tricky'],
  ['Spectrum City', 'Rush-hour photons'],
  ['Gleam Gardens', 'Light grows here'],
  ['Neon Noodle Bar', 'Light, slurped'],
  ['Candle Canyon', 'Deep, dark, glowing'],
  ['Refraction Ranch', 'Herding beams'],
  ['Aurora Arcade', 'Insert coin, bend light'],
  ['Crystal Carnival', 'Roll up, roll up'],
  ['Beacon Bay', 'Ships need you'],
  ['Shiny Summit', 'Halfway there!'],
  ['Lantern Lake', 'Quiet, glowy, sneaky'],
  ['Spotlight Studios', 'You are the star'],
  ['Glitter Galaxy', 'Space, but sparkly'],
  ['Photon Pharaoh', 'Pyramids of puzzles'],
  ['Mirror Moon', 'One small step'],
  ['Comet Corner', 'Fast and fiery'],
  ['Solar Saloon', 'This board ain’t big enough'],
  ['Rainbow Ravine', 'Mind the gap'],
  ['Disco Depths', 'Everybody dance now'],
  ['Brilliant Bazaar', 'Haggle with light'],
  ['Luminous Labyrinth', 'Don’t get lost'],
  ['Flicker Fortress', 'Guarded by shadows'],
  ['Sunbeam Speedway', 'Vroom, but light'],
  ['Opal Observatory', 'Watching the stars'],
  ['Gemstone Jungle', 'Wild and precious'],
  ['Starlight Stadium', 'The crowd goes wild'],
  ['Eclipse Express', 'Next stop: darkness'],
  ['Infinity Igloo', 'Cold logic, warm light'],
  ['Phoenix Forge', 'Rise from the dark'],
  ['Zenith Zone', 'Nearly the top'],
  ['Prism Palace', 'The final glow'],
];

export const WORLDS = WORLD_NAMES.map(([name, tagline], i) => ({
  id: i + 1,
  name,
  tagline,
  theme: WORLD_THEMES[i % WORLD_THEMES.length],
  starsToUnlock: i * STARS_PER_WORLD_TO_UNLOCK,
}));

/** Every 5th level is Hard; the last level of each world is the Extra Hard boss. */
export function difficultyFor(index) {
  if (index % LEVELS_PER_WORLD === 0) return DIFFICULTY.EXTRA;
  if (index % 5 === 0) return DIFFICULTY.HARD;
  return DIFFICULTY.NORMAL;
}

export const levelId = (world, index) => `w${world}-${String(index).padStart(2, '0')}`;

export function parseLevelId(id) {
  const match = /^w(\d+)-(\d+)$/.exec(id);
  return match ? { world: Number(match[1]), index: Number(match[2]) } : null;
}

/** Lightweight description of every built-in level, available without loading level data. */
export function builtInLevelRefs(worldId) {
  if (worldId < 1 || worldId > WORLD_COUNT) return [];
  return Array.from({ length: LEVELS_PER_WORLD }, (_, i) => ({
    id: levelId(worldId, i + 1),
    world: worldId,
    index: i + 1,
    difficulty: difficultyFor(i + 1),
  }));
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Generator settings for a world/level. The difficulty curve rises across all 50 worlds
 * (bigger boards, longer solutions, more decoys), ramps inside each world, and spikes on
 * Hard and boss levels. New pieces arrive one at a time (see src/game/pieces.js): world 1 teaches
 * mirrors, then walls (1-4), then fixed mirrors (1-10); world 2 splitters; world 3 color glass;
 * world 4 shadow crystals; then twists: world 6 twin mirrors, world 8 portals. Later worlds mix them.
 */
export function generatorPresetFor(world, index) {
  const difficulty = difficultyFor(index);
  const ramp = (index - 1) / (LEVELS_PER_WORLD - 1);
  const spike = difficulty === DIFFICULTY.EXTRA ? 2 : difficulty === DIFFICULTY.HARD ? 1 : 0;
  const tier = Math.floor((world - 1) / 4); // grows every 4 worlds
  const size = clamp(5 + Math.min(4, tier) + Math.round(ramp) + (spike > 0 ? 1 : 0), 4, 10);
  const parStart = Math.min(8, 2 + Math.floor((world - 1) / 3));
  // Early worlds spike more gently so new players aren't flattened by the first boss.
  const minPar = Math.min(13, parStart + Math.round(ramp * 2) + spike * (world <= 2 ? 1 : 2));

  const preset = {
    width: size,
    height: size,
    emitters: spike === 2 ? (world >= 20 ? 3 : 2) : spike === 1 && world >= 10 ? 2 : 1,
    turns: [2 + Math.round(ramp), 3 + Math.round(ramp) + spike + Math.min(2, tier)],
    segment: [1, 3],
    decoys: Math.min(5, 1 + Math.round(ramp * 2) + spike + Math.floor(tier / 2)),
    walls: 1 + Math.round(ramp * 2) + spike,
    minPar,
    maxPar: minPar + 4,
    lockedRatio: 0.1,
  };

  // Tutorial: one mirror, then two, then three.
  if (world === 1 && index <= 3) {
    const tutorialSize = index === 1 ? 4 : 5;
    return {
      ...preset,
      width: tutorialSize,
      height: tutorialSize,
      turns: [index, index],
      decoys: index - 1,
      walls: 0,
      minPar: index,
      maxPar: index,
      lockedRatio: 0,
    };
  }

  // World 1 after the tutorial: walls only, then fixed mirrors from level 10.
  if (world === 1) return { ...preset, lockedRatio: index < 10 ? 0 : index === 10 ? 0.5 : 0.1, mustHave: index === 10 ? 'locked' : null };

  // Which mechanics this level uses. Early worlds introduce one at a time.
  const variety = (world * 7 + index * 3) % 4;
  if (world === 2) return { ...preset, splits: 1 + (spike > 0 ? 1 : 0) };
  if (world === 3) return { ...preset, filters: 1 + (index > 10 ? 1 : 0), splits: index > 8 ? 1 : 0 };
  if (world === 4) return { ...preset, shades: 1 + Math.round(ramp * 2) + spike, splits: index > 6 ? 1 : 0 };
  // Twists: twin mirrors from world 6 (the whole of world 6 is about them), portals from world 8.
  const twists = {
    twins: world === 6 ? 1 + (index > 10 ? 1 : 0) : world >= 7 && (world + index) % 3 === 0 ? 1 : 0,
    portals: world === 8 ? 1 : world >= 9 && (world + index) % 4 === 1 ? 1 : 0,
    mustHave: world === 6 && index === 1 ? 'twins' : world === 8 && index === 1 ? 'portal' : null,
  };
  // The level that introduces a twist shows it on its own: no other tricks, a smaller board.
  if (twists.mustHave) {
    const twins = twists.mustHave === 'twins' ? 1 : 0;
    const portals = twists.mustHave === 'portal' ? 1 : 0;
    return {
      ...preset,
      ...twists,
      twins,
      portals,
      width: 6,
      height: 6,
      splits: 0,
      filters: 0,
      shades: 0,
      decoys: 1,
      walls: 1,
      emitters: 1,
      minPar: 3,
      maxPar: 6,
    };
  }
  return {
    ...preset,
    ...twists,
    splits: variety === 0 || variety === 3 || spike > 0 ? 1 + (spike === 2 ? 1 : 0) : 0,
    filters: variety === 1 || variety === 3 ? 1 + (spike > 0 ? 1 : 0) : 0,
    shades: variety === 2 || variety === 3 || spike > 0 ? 1 + spike + Math.min(2, Math.floor(tier / 3)) : 0,
  };
}
