/* global __APP_VERSION__ */

/** Who makes the game and which version this is (shown on the splash screen and in Settings). */
export const GAME_NAME = 'Lumipals';
export const STORE_NAME = 'Rinny’s Lumipals: Light Puzzle';
export const STUDIO_NAME = 'Ringhost’s Games';
// Shown short: 1.2.0 reads "1.2", 1.2.1 stays "1.2.1".
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__.replace(/\.0$/, '') : 'dev';
export const COPYRIGHT_YEAR = 2026;
