/*
 * The game's extras open one at a time, so a new player (often a child) meets one new thing, not a dozen
 * (first testers: "I don't understand it", "what do the Glowbugs do?"). Counted in solved built-in levels.
 * Each one is explained in one line on the map the moment it opens (`says`), and nothing about it shows before.
 * Others follow their own rules and fit in between: the first Pal at 5 (then its presents), boosters and weekend
 * events after World 1 (20), Light Rush after World 3 (60).
 */
export const FEATURES = [
  { id: 'gift', after: 3, says: true },
  { id: 'daily', after: 6, says: true },
  { id: 'missions', after: 10, says: true },
  { id: 'install', after: 14 },
  { id: 'treats', after: 20, says: true },
  { id: 'quests', after: 25, says: true },
  { id: 'luckyPal', after: 30 },
  { id: 'glowbugs', after: 40, says: true },
  { id: 'stickers', after: 60, says: true },
  { id: 'medals', after: 70 },
];

export const isFeatureOpen = (id, solvedCount) => solvedCount >= (FEATURES.find((feature) => feature.id === id)?.after ?? 0);

/** The features a player has open now: [ids]. */
export const openFeatures = (solvedCount) => FEATURES.filter((feature) => solvedCount >= feature.after).map((feature) => feature.id);

/**
 * The feature to announce now, or null: the first open one with a line to say that the player hasn't been told.
 * @param seen ids already announced; null means this device never tracked them, so a player who is already past
 *   a feature isn't told it's new.
 */
export function featureToAnnounce(solvedCount, seen) {
  if (seen === null) return null;
  return FEATURES.find((feature) => feature.says && solvedCount >= feature.after && !seen.includes(feature.id))?.id ?? null;
}
