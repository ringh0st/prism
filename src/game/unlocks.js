/*
 * The map's extras open one at a time, so a new player (often a child) meets one new thing, not seven.
 * Counted in solved levels. Others follow by their own rules and fit between these: the first Pal at 5 (then its
 * presents), weekend events after World 1 (20), Light Rush after World 3 (60).
 */
export const MAP_EXTRAS = [
  { id: 'gift', after: 3 },
  { id: 'daily', after: 6 },
  { id: 'missions', after: 10 },
  { id: 'install', after: 14 },
];

export const isExtraOpen = (id, solvedCount) => solvedCount >= (MAP_EXTRAS.find((extra) => extra.id === id)?.after ?? 0);

/** Extras that get a "New!" note on the map the first time they show (their button is there whenever they're open). */
const ANNOUNCED = ['gift', 'daily'];

/** The extras a player has open now: [ids]. */
export const openExtras = (solvedCount) => MAP_EXTRAS.filter((extra) => solvedCount >= extra.after).map((extra) => extra.id);

/**
 * The extra to announce now, or null: the first open one the player hasn't been told about.
 * @param seen ids already announced; null means this device never tracked them, so a player who is already past
 *   an extra isn't told it's new.
 */
export function extraToAnnounce(solvedCount, seen) {
  if (seen === null) return null;
  return ANNOUNCED.find((id) => isExtraOpen(id, solvedCount) && !seen.includes(id)) ?? null;
}
