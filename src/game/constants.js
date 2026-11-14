// Shared vocabulary for levels, beams and tiles. No React or DOM here.

export const TILE = Object.freeze({
  EMITTER: 'emitter',
  MIRROR: 'mirror',
  SPLITTER: 'splitter',
  FILTER: 'filter',
  WALL: 'wall',
  GEM: 'gem',
  SHADE: 'shade',
  PORTAL: 'portal',
});

/** Portal and twin-mirror pairs are named by these letters (each pair has its own look). */
export const PAIR_NAMES = Object.freeze(['a', 'b']);

/** Grid directions. y grows downwards. */
export const DIRECTIONS = Object.freeze({
  up: Object.freeze([0, -1]),
  right: Object.freeze([1, 0]),
  down: Object.freeze([0, 1]),
  left: Object.freeze([-1, 0]),
});

export const DIRECTION_NAMES = Object.freeze(Object.keys(DIRECTIONS));

/**
 * Mirror orientations. A mirror has two states:
 *  0 = "/" (bottom-left to top-right), 1 = "\" (top-left to bottom-right).
 */
export const ORIENT = Object.freeze({ SLASH: 0, BACKSLASH: 1 });

/**
 * Beam colors. Each has a distinct shape so color is never the only signal.
 * `sun` is the default light.
 */
export const BEAM_COLORS = Object.freeze({
  sun: { label: 'Sunlight', shape: 'diamond' },
  coral: { label: 'Coral', shape: 'circle' },
  lime: { label: 'Lime', shape: 'triangle' },
  sky: { label: 'Sky', shape: 'square' },
});

export const BEAM_COLOR_NAMES = Object.freeze(Object.keys(BEAM_COLORS));

export const DIFFICULTY = Object.freeze({
  NORMAL: 'normal',
  HARD: 'hard',
  EXTRA: 'extra',
});

/** Tiles the player can rotate (when not locked). */
export const ROTATABLE_TYPES = Object.freeze(new Set([TILE.MIRROR, TILE.SPLITTER]));

export const LEVEL_SCHEMA_VERSION = 1;
