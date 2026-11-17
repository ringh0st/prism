/*
 * Themed worlds: a world can be dressed as a place (its pieces, floor and light drawn to match) on the 3D board.
 * The Library comes first; more themes (pond, sea, space…) take more worlds. Pure data, no React.
 */
export const BOARD_THEMES = { library: [1] };

/** The board theme for a level, or null for the regular board. */
export function boardThemeFor(level) {
  for (const [theme, worlds] of Object.entries(BOARD_THEMES)) if (worlds.includes(level?.world)) return theme;
  return null;
}
