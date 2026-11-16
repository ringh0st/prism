import { DIFFICULTY } from './constants.js';
import { recipeFor, recipePreset } from './recipes.js';

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

/** A built-in level's place on the whole road, 1 to 1000 ("Level 148"), so players see how far they've come. */
export const levelNumber = (world, index) => (world - 1) * LEVELS_PER_WORLD + index;

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
 * One new piece every world through world 12 (see src/game/pieces.js): world 1 mirrors, walls and fixed
 * mirrors, 2 splitters, 3 color glass, 4 shadow crystals, then these twists, each introduced on the world's
 * first level and mixed into the worlds after it.
 */
const TWIST_WORLDS = { twins: 5, portal: 6, fragile: 7, fog: 8, prism: 9, gate: 10, lamp: 11, oneSided: 12 };
const TWIST_INTROS = Object.fromEntries(Object.entries(TWIST_WORLDS).map(([twist, world]) => [`${world}-1`, twist]));
/** How much of a twist its own world uses, and how often later worlds bring it back (every `every` levels). */
const TWIST_MIX = {
  twins: { own: 1, later: 1, every: 3, offset: 0 },
  portal: { own: 1, later: 1, every: 4, offset: 1 },
  fragile: { own: 2, later: 1, every: 3, offset: 2 },
  fog: { own: 2, later: 2, every: 4, offset: 2 },
  prism: { own: 1, later: 1, every: 5, offset: 3 },
  gate: { own: 1, later: 1, every: 4, offset: 3 },
  lamp: { own: 1, later: 1, every: 3, offset: 1 },
  oneSided: { own: 2, later: 2, every: 4, offset: 0 },
};
const twistAmount = (twist, world, index) => {
  const intro = TWIST_WORLDS[twist];
  const { own, later, every, offset } = TWIST_MIX[twist];
  if (world === intro) return own + (index > 10 ? 1 : 0);
  return world > intro && (world + index) % every === offset ? later : 0;
};

/**
 * Generator settings for a world/level. Difficulty follows the level number (1–1000), so it keeps rising
 * from world to world instead of starting over: longer solutions, bigger boards and more decoys, plus a
 * spike on Hard and boss levels and a quick breather after them. New pieces arrive one per world.
 */
export function generatorPresetFor(world, index) {
  const difficulty = difficultyFor(index);
  const number = (world - 1) * LEVELS_PER_WORLD + index;
  const progress = (number - 1) / (WORLD_COUNT * LEVELS_PER_WORLD - 1); // 0 at level 1, 1 at level 1000
  const spike = difficulty === DIFFICULTY.EXTRA ? 2 : difficulty === DIFFICULTY.HARD ? 1 : 0;
  const size = clamp(Math.round(5 + progress * 4.6) + (spike > 0 ? 1 : 0), 4, 10);
  // Moves needed rise steadily with the level number: about 4 at the start, 13 by level 650.
  const basePar = Math.min(13, 4 + Math.floor((number - 1) / 72));
  const minPar = Math.min(14, basePar + spike * (world <= 2 ? 1 : 2));
  const steps = Math.min(3, Math.floor(progress * 4));

  const preset = {
    width: size,
    height: size,
    emitters: spike === 2 ? (world >= 20 ? 3 : 2) : spike === 1 && world >= 10 ? 2 : 1,
    // Enough mirrors on the light's path and enough decoys to actually reach the moves needed: a sparse
    // board can't (playtesters found level 151 with four mirrors and three moves).
    turns: [2 + Math.min(2, steps), Math.max(3 + steps + spike, minPar)],
    segment: [1, 3],
    decoys: Math.min(9, 2 + Math.floor(minPar / 2) + spike),
    walls: 1 + steps + spike,
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

  // Worlds 1–3: each level has its own flavor (two lamps, one tap wonder, long road…; see recipes.js),
  // on top of the world's pieces. Levels that introduce a piece keep it simple.
  const recipe = recipeFor(world, index);
  const flavored = (base) => (recipe ? { ...recipePreset(recipe, base, { world, index, spike }), recipe } : base);

  // World 1 after the tutorial: walls (from 1-4), then fixed mirrors from level 10.
  if (world === 1) {
    return flavored({
      ...preset,
      walls: index < 4 ? 0 : preset.walls,
      lockedRatio: index < 10 ? 0 : index === 10 ? 0.5 : 0.1,
      mustHave: index === 10 ? 'locked' : null,
    });
  }

  // Which mechanics this level uses. Early worlds introduce one at a time.
  const variety = (world * 7 + index * 3) % 4;
  if (world === 2) return flavored({ ...preset, splits: 1 + (spike > 0 ? 1 : 0) });
  if (world === 3) return flavored({ ...preset, filters: 1 + (index > 10 ? 1 : 0), splits: index > 8 ? 1 : 0 });
  if (world === 4) return { ...preset, shades: 1 + Math.round((index / LEVELS_PER_WORLD) * 2) + spike, splits: index > 6 ? 1 : 0 };
  const twists = {
    twins: twistAmount('twins', world, index),
    portals: twistAmount('portal', world, index),
    fragile: twistAmount('fragile', world, index),
    fog: twistAmount('fog', world, index),
    prisms: twistAmount('prism', world, index),
    gates: twistAmount('gate', world, index),
    turningLamps: twistAmount('lamp', world, index),
    oneSided: twistAmount('oneSided', world, index),
    mustHave: TWIST_INTROS[`${world}-${index}`] ?? null,
  };
  // A light gate needs a second lamp to light its switch.
  if (twists.gates) twists.emitters = Math.max(2, preset.emitters);
  // The level that introduces a twist shows it on its own: no other tricks, a smaller board.
  if (twists.mustHave) {
    const only = twists.mustHave;
    return {
      ...preset,
      ...twists,
      twins: only === 'twins' ? 1 : 0,
      portals: only === 'portal' ? 1 : 0,
      fragile: only === 'fragile' ? 2 : 0,
      fog: only === 'fog' ? 2 : 0,
      prisms: only === 'prism' ? 1 : 0,
      gates: only === 'gate' ? 1 : 0,
      turningLamps: only === 'lamp' ? 1 : 0,
      oneSided: only === 'oneSided' ? 2 : 0,
      width: 6,
      height: 6,
      splits: 0,
      filters: 0,
      shades: 0,
      decoys: 1,
      walls: 1,
      emitters: only === 'gate' ? 2 : 1,
      minPar: 3,
      maxPar: 6,
    };
  }
  return {
    ...preset,
    ...twists,
    splits: variety === 0 || variety === 3 || spike > 0 ? 1 + (spike === 2 ? 1 : 0) : 0,
    filters: variety === 1 || variety === 3 ? 1 + (spike > 0 ? 1 : 0) : 0,
    shades: variety === 2 || variety === 3 || spike > 0 ? 1 + spike + Math.min(2, Math.floor(progress * 3)) : 0,
  };
}
