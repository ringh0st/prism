/** Levels solved on the whole road that throw a party (a big headline and celebration on the win screen). */
export const LEVEL_MILESTONES = [50, 100, 250, 500, 1000];

/** Built-in levels solved so far (at least one star). */
export const solvedLevelCount = (progress) =>
  Object.entries(progress.levels).filter(([id, entry]) => /^w\d+-\d{2}$/.test(id) && entry.stars > 0).length;

/** The milestone just reached going from `before` to `after` solved levels, or null. */
export const milestoneReached = (before, after) => LEVEL_MILESTONES.find((count) => before < count && after >= count) ?? null;
