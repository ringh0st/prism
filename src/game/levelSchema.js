import { BEAM_COLOR_NAMES, DIFFICULTY, DIRECTION_NAMES, LEVEL_SCHEMA_VERSION, TILE } from './constants.js';

const TILE_TYPES = new Set(Object.values(TILE));
const DIFFICULTIES = new Set(Object.values(DIFFICULTY));

/**
 * Validate level data from the database or the editor.
 * @returns {string[]} problems (empty when valid)
 */
export function validateLevel(level) {
  const problems = [];
  if (!level || typeof level !== 'object') return ['Level is missing.'];
  const { width, height, tiles } = level;
  if (!Number.isInteger(width) || width < 3 || width > 10) problems.push('Width must be 3–10.');
  if (!Number.isInteger(height) || height < 3 || height > 10) problems.push('Height must be 3–10.');
  if (!Array.isArray(tiles)) return [...problems, 'Tiles must be a list.'];
  if (level.difficulty && !DIFFICULTIES.has(level.difficulty)) problems.push(`Unknown difficulty "${level.difficulty}".`);

  const seen = new Set();
  tiles.forEach((tile, i) => {
    const where = `Tile ${i + 1} (${tile.x}, ${tile.y})`;
    if (!TILE_TYPES.has(tile.type)) problems.push(`${where}: unknown type "${tile.type}".`);
    if (tile.x < 0 || tile.y < 0 || tile.x >= width || tile.y >= height) problems.push(`${where}: outside the board.`);
    const cell = `${tile.x},${tile.y}`;
    if (seen.has(cell)) problems.push(`${where}: two tiles on one cell.`);
    seen.add(cell);
    if (tile.type === TILE.EMITTER && !DIRECTION_NAMES.includes(tile.dir)) problems.push(`${where}: emitter needs a direction.`);
    if ([TILE.EMITTER, TILE.GEM, TILE.FILTER].includes(tile.type) && !BEAM_COLOR_NAMES.includes(tile.color)) {
      problems.push(`${where}: needs a color.`);
    }
    if ([TILE.MIRROR, TILE.SPLITTER].includes(tile.type) && tile.orient !== 0 && tile.orient !== 1) {
      problems.push(`${where}: orientation must be 0 or 1.`);
    }
  });
  if (!tiles.some((t) => t.type === TILE.EMITTER)) problems.push('Add at least one light source.');
  if (!tiles.some((t) => t.type === TILE.GEM)) problems.push('Add at least one gem.');
  return problems;
}

/** Fill in defaults so the rest of the app can rely on a complete shape. */
export function normalizeLevel(level) {
  return {
    version: LEVEL_SCHEMA_VERSION,
    name: '',
    difficulty: DIFFICULTY.NORMAL,
    ...level,
    tiles: level.tiles.map((tile) => ({ ...tile })),
  };
}
