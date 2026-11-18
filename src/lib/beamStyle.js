/*
 * The player's chosen beam style (Me → Beam style) is kept as the CSS variable --beam-sun (set in App.jsx). The 3D
 * boards read it here, so plain sunlight wears the chosen color on every board, not only the flat one.
 */
const DEFAULT_SUN = '#ffd23f';

/** The chosen color of plain sunlight, as a hex string. */
export function chosenSunColor() {
  if (typeof document === 'undefined') return DEFAULT_SUN;
  return getComputedStyle(document.documentElement).getPropertyValue('--beam-sun').trim() || DEFAULT_SUN;
}

/** True while the player keeps the default Sunbeam style. */
export const isDefaultSun = (color) => color.toLowerCase() === DEFAULT_SUN;
