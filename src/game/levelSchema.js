import { BEAM_COLOR_NAMES, DIFFICULTY, DIRECTION_NAMES, LEVEL_SCHEMA_VERSION, TILE } from './constants.js';
import { phaseLevels } from './bossFight.js';
import { hasDarkness } from './darkness.js';

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
    if (tile.type === TILE.EMITTER && tile.turnable && tile.orient !== undefined && tile.orient !== 0 && tile.orient !== 1) {
      problems.push(`${where}: a turning lamp's orientation must be 0 or 1.`);
    }
    if (tile.oneSided !== undefined && (tile.type !== TILE.MIRROR || (tile.oneSided !== 0 && tile.oneSided !== 1))) {
      problems.push(`${where}: only mirrors can be one-sided (face 0 or 1).`);
    }
    if ([TILE.GATE, TILE.SWITCH].includes(tile.type)) {
      const other = tile.type === TILE.GATE ? TILE.SWITCH : TILE.GATE;
      if (!tiles.some((t) => t.type === other && t.pair === tile.pair))
        problems.push(`${where}: every light gate needs a switch with the same pair.`);
    }
    if ([TILE.MIRROR, TILE.SPLITTER].includes(tile.type) && tile.orient !== 0 && tile.orient !== 1) {
      problems.push(`${where}: orientation must be 0 or 1.`);
    }
    if (tile.fragile && tile.type !== TILE.MIRROR) problems.push(`${where}: only mirrors can crack.`);
    if (tile.fog && ![TILE.GEM, TILE.WALL, TILE.SHADE, TILE.FILTER].includes(tile.type))
      problems.push(`${where}: fog can only hide gems, walls, shadow crystals or glass.`);
    if (tile.type === TILE.PORTAL && tiles.filter((t) => t.type === TILE.PORTAL && t.pair === tile.pair).length !== 2) {
      problems.push(`${where}: every portal needs exactly one partner with the same pair.`);
    }
    // The darkness (darkness.js).
    if (tile.fade !== undefined && (tile.type !== TILE.GEM || !Number.isInteger(tile.fade) || tile.fade < 1))
      problems.push(`${where}: only gems can fade, after 1 or more moves.`);
    if (
      tile.power !== undefined &&
      (tile.type !== TILE.EMITTER || !Number.isInteger(tile.power) || !Number.isInteger(tile.reach) || tile.power < 0 || tile.reach < 1)
    )
      problems.push(`${where}: a dying lamp needs whole numbers for its power and reach.`);
  });
  const taken = new Set(tiles.map((t) => t.y * width + t.x));
  (level.glooms ?? []).forEach((gloom, g) => {
    const where = `Shadow ${g + 1}`;
    if (tiles[gloom.gem]?.type !== TILE.GEM) problems.push(`${where}: needs a gem to creep to.`);
    if (!Array.isArray(gloom.trail) || gloom.trail.length < 1) problems.push(`${where}: needs a trail.`);
    else if (gloom.trail.some((cell) => !Number.isInteger(cell) || cell < 0 || cell >= width * height || taken.has(cell)))
      problems.push(`${where}: its trail must run over empty cells.`);
  });
  if (level.eclipse !== undefined && (!Number.isInteger(level.eclipse) || level.eclipse < 2))
    problems.push('An eclipse comes every 2 or more moves.');
  if (level.phases !== undefined) problems.push(...phaseProblems(level));
  if (!tiles.some((t) => t.type === TILE.EMITTER)) problems.push('Add at least one light source.');
  if (!tiles.some((t) => t.type === TILE.GEM)) problems.push('Add at least one gem.');
  return problems;
}

const CHANGES = new Set(['remove', 'turn', 'add']);

/** A boss fight's rounds (bossFight.js): each one a valid board of its own, with Smudge on an empty cell. */
function phaseProblems(level) {
  const { phases, width, height } = level;
  if (!Array.isArray(phases) || phases.length < 2 || phases.length > 4) return ['A boss fight has 2–4 rounds.'];
  const problems = [];
  if (hasDarkness(level)) problems.push('A boss fight in rounds has no darkness pieces.');
  phases.forEach((phase, k) => {
    const where = `Round ${k + 1}`;
    if (!Number.isInteger(phase.par) || phase.par < 1) problems.push(`${where}: needs a par of 1 or more.`);
    if (!Number.isInteger(phase.smudge) || phase.smudge < 0 || phase.smudge >= width * height) problems.push(`${where}: Smudge needs a cell.`);
    if (k === 0 && phase.changes !== undefined) problems.push(`${where}: the first round is the board itself.`);
    if (k > 0 && (!Array.isArray(phase.changes) || phase.changes.some((change) => !CHANGES.has(change.do))))
      problems.push(`${where}: needs a list of changes (remove, turn, add).`);
  });
  if (problems.length) return problems;
  if (level.par !== phases.reduce((sum, phase) => sum + phase.par, 0)) problems.push('A boss fight’s par is the sum of its rounds.');
  phaseLevels(level).forEach((round, k) => {
    validateLevel(round).forEach((problem) => problems.push(`Round ${k + 1}: ${problem}`));
    if (round.tiles.some((tile) => tile.y * width + tile.x === round.smudge)) problems.push(`Round ${k + 1}: Smudge must stand on an empty cell.`);
  });
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
