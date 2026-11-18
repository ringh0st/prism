/*
 * Themed worlds: a world can be dressed as a place (its pieces, floor and light drawn to match) on the 3D board.
 * The Library comes first; more themes (pond, sea, space…) take more worlds. Pure data, no React.
 */
export const BOARD_THEMES = { library: [1], pond: [2] };

/** The board theme for a level, or null for the regular board. */
export function boardThemeFor(level) {
  for (const [theme, worlds] of Object.entries(BOARD_THEMES)) if (worlds.includes(level?.world)) return theme;
  return null;
}

/**
 * The coats of Lumi's family in themed worlds: soft pastels (owner's pick: pink, blue, red, green, purple… never
 * honey or brown). Each Lumi waiting for plain sunlight wears its own.
 */
export const LUMI_COATS = ['#ffb7d2', '#aecffa', '#ff9d9d', '#b2e6b4', '#d0b8f7', '#a5e6d8', '#f6add6', '#b9c0f9'];

/**
 * A Lumi's coat: different for every Lumi on a board (`order` is its place among the level's Lumis) and fixed for
 * the level. One that needs a colored light wears that light's color instead (null: the light's own tint).
 */
export function lumiCoatFor(levelId, order, color = 'sun') {
  if (color !== 'sun') return null;
  let hash = 7;
  for (const char of levelId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return LUMI_COATS[(hash + order) % LUMI_COATS.length];
}

/** The level's Lumis in board order, each with its coat: [{ tile, i, coat }]. */
export function lumisOf(level) {
  return level.tiles
    .map((tile, i) => ({ tile, i }))
    .filter(({ tile }) => tile.type === 'gem')
    .map((lumi, order) => ({ ...lumi, coat: boardThemeFor(level) ? lumiCoatFor(level.id, order, lumi.tile.color ?? 'sun') : null }));
}
