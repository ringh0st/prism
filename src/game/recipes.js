/*
 * Level flavors for the early worlds, so no two levels in a row feel the same: two or three lamps,
 * "one tap wonder" boards where a single mirror is wrong, a long winding road, a tiny crowded board,
 * a wall maze, a gem shower (splitters) and a rainbow (color glass). Each one has a short goal the
 * player sees when the level opens. Levels that introduce a new piece keep their simple setup.
 */
export const RECIPES = {
  twoLamps: { name: 'Two lamps', goal: 'Two lamps, two gems. Light them both!' },
  lightShow: { name: 'Light show', goal: 'Three lamps! Get every gem glowing.' },
  oneTap: { name: 'One tap wonder', goal: 'Only one mirror is wrong. Can you spot it?' },
  longRoad: { name: 'Long road', goal: 'The light has a long way to go. Guide it all the way!' },
  tiny: { name: 'Tiny but tricky', goal: 'A little board packed with mirrors.' },
  wallMaze: { name: 'Wall maze', goal: 'Walls everywhere! Find the way through.' },
  gemShower: { name: 'Gem shower', goal: 'Split the light to reach every gem.' },
  rainbow: { name: 'Rainbow', goal: 'Every gem wants its own color.' },
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
    'oneTap',
    'lightShow',
    'longRoad',
    'twoLamps',
    'wallMaze',
    'tiny',
    'oneTap',
    'longRoad',
    'lightShow',
    null,
  ],
  2: [
    null,
    'oneTap',
    'gemShower',
    'twoLamps',
    'longRoad',
    'tiny',
    'oneTap',
    'gemShower',
    'wallMaze',
    'lightShow',
    'oneTap',
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
    'oneTap',
    'rainbow',
    'twoLamps',
    'longRoad',
    'tiny',
    'rainbow',
    'oneTap',
    'wallMaze',
    'gemShower',
    'oneTap',
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

/** The flavor's name and goal for a level, or null. */
export const recipeOf = (level) => (level?.recipe ? (RECIPES[level.recipe] ?? null) : null);

/**
 * Generator settings for a flavor, on top of the world's own (which keep its pieces: walls, fixed
 * mirrors, splitters, color glass). `spike` is 1 on Hard levels.
 */
export function recipePreset(recipe, base, { world, spike }) {
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
        minPar: 2,
        maxPar: 4,
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
