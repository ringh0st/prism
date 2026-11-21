/*
 * Level flavors for the early worlds, so no two levels in a row feel the same: two or three lamps,
 * "one tap wonder" boards where a single mirror is wrong, a long winding road, a tiny crowded board,
 * a wall maze, a gem shower (splitters) and a rainbow (color glass). Each one has a short goal the
 * player sees when the level opens. Levels that introduce a new piece keep their simple setup.
 */
export const RECIPES = {
  twoLamps: {
    name: 'Two lamps',
    goals: ['Two lamps, two gems. Light them both!', 'Double trouble: two beams to steer!', 'Each lamp needs its own path.'],
  },
  lightShow: {
    name: 'Light show',
    goals: ['Three lamps! Get every gem glowing.', 'Three beams at once. Can you juggle them?', 'Light show time: every gem on!'],
  },
  oneTap: {
    name: 'One tap wonder',
    goals: ['Only one mirror is wrong. Can you spot it?', 'One tap fixes it all. Which one?', 'Spot the odd mirror out!'],
  },
  longRoad: {
    name: 'Long road',
    goals: ['The light has a long way to go. Guide it all the way!', 'A long, winding path. Follow the beam!', 'Bounce it across the whole board!'],
  },
  tiny: { name: 'Tiny but tricky', goals: ['A little board packed with mirrors.', 'Small board, big think!', 'Every mirror counts here.'] },
  wallMaze: {
    name: 'Wall maze',
    goals: ['Walls everywhere! Find the way through.', 'Sneak the light past the walls!', 'A maze of walls. Find the gap!'],
  },
  gemShower: { name: 'Gem shower', goals: ['Split the light to reach every gem.', 'One beam, many gems. Split it!', 'Share the light around!'] },
  rainbow: { name: 'Rainbow', goals: ['Every gem wants its own color.', 'Paint the light to match each gem!', 'Colors first, then aim!'] },
};

// Index 1–20 in each world; null keeps the world's usual level (tutorials, piece introductions, bosses).
// Each world runs in 5-level arcs: build up to a Hard level (5, 10, 15), then a breather (6, 11, 16:
// a quick one tap wonder or tiny board) before the next arc. One tap wonders never land on Hard levels.
const SEQUENCES = {
  1: [
    null,
    null,
    null,
    null,
    'wallMaze',
    'oneTap',
    'longRoad',
    'twoLamps',
    'tiny',
    null,
    'tiny',
    'lightShow',
    'longRoad',
    'twoLamps',
    'wallMaze',
    'tiny',
    'wallMaze',
    'longRoad',
    'lightShow',
    null,
  ],
  2: [
    null,
    'longRoad',
    'gemShower',
    'twoLamps',
    'longRoad',
    'tiny',
    'longRoad',
    'gemShower',
    'wallMaze',
    'lightShow',
    'tiny',
    'longRoad',
    'twoLamps',
    'gemShower',
    'wallMaze',
    'tiny',
    'lightShow',
    'gemShower',
    'longRoad',
    null,
  ],
  3: [
    null,
    'longRoad',
    'rainbow',
    'twoLamps',
    'longRoad',
    'tiny',
    'rainbow',
    'longRoad',
    'wallMaze',
    'gemShower',
    'tiny',
    'longRoad',
    'rainbow',
    'twoLamps',
    'wallMaze',
    'tiny',
    'rainbow',
    'lightShow',
    'longRoad',
    null,
  ],
};

/** Quick, easy flavors: the breather right after each Hard level (6, 11 and 16). */
export const REST_RECIPES = ['oneTap', 'tiny'];

/** The flavor of a built-in level (an id from RECIPES), or null for a plain one. */
export const recipeFor = (world, index) => SEQUENCES[world]?.[index - 1] ?? null;

/** The flavor's name and one of its goal lines (a different one level to level), or null. */
export function recipeOf(level) {
  const recipe = level?.recipe ? RECIPES[level.recipe] : null;
  if (!recipe) return null;
  return { name: recipe.name, goal: recipe.goals[(level.index ?? 0) % recipe.goals.length] };
}

/**
 * Generator settings for a flavor, on top of the world's own (which keep its pieces: walls, fixed
 * mirrors, splitters, color glass). `spike` is 1 on Hard levels.
 */
export function recipePreset(recipe, base, { world, spike }) {
  const preset = flavorPreset(recipe, base, { world, spike });
  if (REST_RECIPES.includes(recipe)) return preset;
  // Every regular flavor needs at least the level's place on the difficulty curve (base.minPar). Its difficulty
  // comes from being tricky (the level builder keeps the trickiest board), not from extra mirrors.
  const minPar = Math.max(preset.minPar, base.minPar);
  const emitters = preset.emitters ?? 1;
  return {
    ...preset,
    turns: [preset.turns[0], Math.max(preset.turns[1], Math.ceil(minPar / emitters) + 1)],
    minPar,
    maxPar: Math.max(preset.maxPar, minPar + 3),
  };
}

function flavorPreset(recipe, base, { world, spike }) {
  const bigger = (size) => Math.min(8, size + spike);
  switch (recipe) {
    case 'twoLamps':
      return {
        ...base,
        emitters: 2,
        width: bigger(world === 1 ? 5 : 6),
        height: bigger(world === 1 ? 5 : 6),
        turns: [1, 2],
        decoys: 1 + spike,
        minPar: 2 + spike,
        maxPar: 4 + spike,
      };
    case 'lightShow':
      return {
        ...base,
        emitters: 3,
        width: 6 + spike,
        height: 6 + spike,
        turns: [1, 2],
        segment: [1, 2],
        decoys: 1,
        walls: 1,
        splits: 0,
        minPar: 3 + spike,
        maxPar: 6 + spike,
      };
    case 'oneTap':
      return { ...base, emitters: 1 + spike, width: 7, height: 7, turns: [3, 5], decoys: 6, walls: 2, flips: 1, minPar: 1, maxPar: 1 };
    case 'longRoad':
      return {
        ...base,
        emitters: 1,
        width: bigger(7),
        height: bigger(7),
        turns: [5, 7],
        segment: [1, 2],
        decoys: 1,
        walls: 1,
        minPar: 3 + spike,
        maxPar: 6 + spike,
      };
    case 'tiny':
      return {
        ...base,
        emitters: 1,
        width: 4,
        height: 4,
        turns: [2, 3],
        segment: [1, 1],
        decoys: 6,
        walls: 0,
        splits: Math.min(1, base.splits ?? 0),
        filters: Math.min(1, base.filters ?? 0),
        minPar: 4,
        maxPar: 6,
      };
    case 'wallMaze':
      return {
        ...base,
        emitters: 1,
        width: bigger(6),
        height: bigger(6),
        turns: [3, 4],
        decoys: 1,
        walls: 7 + spike * 2,
        minPar: 3 + spike,
        maxPar: 5 + spike,
      };
    case 'gemShower':
      return { ...base, emitters: 1, width: bigger(6), height: bigger(6), splits: 2, turns: [1, 2], decoys: 1, minPar: 2 + spike, maxPar: 5 + spike };
    case 'rainbow':
      return {
        ...base,
        emitters: 2,
        width: bigger(6),
        height: bigger(6),
        filters: 2,
        splits: 0,
        turns: [1, 2],
        decoys: 1,
        mustHave: 'color',
        minPar: 2 + spike,
        maxPar: 5 + spike,
      };
    default:
      return base;
  }
}
