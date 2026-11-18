/*
 * Themed worlds: a world can be dressed as a place (its pieces, floor and light drawn to match) on the 3D board.
 * The Library comes first; more themes (pond, sea, space…) take more worlds. Pure data, no React.
 */
export const BOARD_THEMES = { library: [1], pond: [2], castle: [3] };

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

/** Coats a theme leaves out because they'd vanish on its tiles (a green Lumi on a green lily pad). */
const HIDDEN_COATS = { pond: ['#b2e6b4', '#a5e6d8'], castle: ['#d0b8f7', '#b9c0f9'] };

/** The coats Lumis can wear in a theme: every coat that stands out on its tiles. */
export const coatsFor = (theme) => LUMI_COATS.filter((coat) => !(HIDDEN_COATS[theme] ?? []).includes(coat));

/**
 * A Lumi's coat: different for every Lumi on a board (`order` is its place among the level's Lumis), fixed for the
 * level, and never the color of the theme's tiles. One that needs a colored light wears that light's color instead
 * (null: the light's own tint).
 */
export function lumiCoatFor(level, order, color = 'sun') {
  if (color !== 'sun') return null;
  const coats = coatsFor(boardThemeFor(level));
  let hash = 7;
  for (const char of level.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return coats[(hash + order) % coats.length];
}

/** The level's Lumis in board order, each with its coat: [{ tile, i, coat }]. */
export function lumisOf(level) {
  return level.tiles
    .map((tile, i) => ({ tile, i }))
    .filter(({ tile }) => tile.type === 'gem')
    .map((lumi, order) => ({ ...lumi, coat: boardThemeFor(level) ? lumiCoatFor(level, order, lumi.tile.color ?? 'sun') : null }));
}
