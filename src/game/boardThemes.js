/*
 * Themed boards: every level is dressed as a place (its pieces, floor and light drawn to match) on the 3D board, and
 * the finished themes take turns, so the scenery keeps changing as you play. Pure data, no React.
 */
/** The finished themes, which take turns. */
export const THEMES_IN_PLAY = ['library', 'pond', 'castle', 'beach', 'forest'];
/** Themes still being designed: seen only with the preview switch (`?theme=<name>` on the game's address). */
export const THEMES_IN_PREVIEW = [];
const LEVELS_PER_WORLD = 20;

let previewTheme = null;
/** The owner's preview switch: dress every themed level in one theme (null turns it off). */
export function setPreviewTheme(theme) {
  previewTheme = [...THEMES_IN_PLAY, ...THEMES_IN_PREVIEW].includes(theme) ? theme : null;
}

let flatScenesOn = false;
/** The owner's preview switch for the flat board's scenes (flatScenes.jsx), until they're shown to everyone. */
export function setFlatScenesPreview(isOn) {
  flatScenesOn = Boolean(isOn);
}
export const areFlatScenesOn = () => flatScenesOn;

const turns = [];
/** The theme of the n-th themed level (1-based): a seeded pick that never repeats the level before it. */
function themeInTurn(number) {
  for (let n = turns.length + 1; n <= number; n++) {
    let pick = (n * 2654435761) % 4294967296;
    pick = Math.floor((pick / 4294967296) * THEMES_IN_PLAY.length);
    if (n > 1 && THEMES_IN_PLAY[pick] === turns[n - 2]) pick = (pick + 1) % THEMES_IN_PLAY.length;
    turns.push(THEMES_IN_PLAY[pick]);
  }
  return turns[number - 1];
}

/**
 * The board theme for a level. Built-in levels follow the road (level 1, 2, 3… each a different look from the one
 * before); any other level (daily, events, challenges, the editor's) gets a theme from its id, always the same one.
 */
export function boardThemeFor(level) {
  if (previewTheme) return previewTheme;
  if (level?.world && level.index) return themeInTurn((level.world - 1) * LEVELS_PER_WORLD + level.index);
  let hash = 7;
  for (const char of String(level?.id ?? '')) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return THEMES_IN_PLAY[hash % THEMES_IN_PLAY.length];
}

/**
 * The coats of Lumi's family in themed worlds: soft pastels (owner's pick: pink, blue, red, green, purple… never
 * honey or brown). Each Lumi waiting for plain sunlight wears its own.
 */
export const LUMI_COATS = ['#ffb7d2', '#aecffa', '#ff9d9d', '#b2e6b4', '#d0b8f7', '#a5e6d8', '#f6add6', '#b9c0f9'];

/** Coats a theme leaves out because they'd vanish on its tiles (a green Lumi on a green lily pad). */
const HIDDEN_COATS = { pond: ['#b2e6b4', '#a5e6d8'], forest: ['#b2e6b4', '#a5e6d8'] };

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
    .map((lumi, order) => ({ ...lumi, coat: lumiCoatFor(level, order, lumi.tile.color ?? 'sun') }));
}
