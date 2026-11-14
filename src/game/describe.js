import { BEAM_COLORS, TILE } from './constants.js';

const colorName = (color) => BEAM_COLORS[color]?.label ?? color;
const shapeName = (color) => BEAM_COLORS[color]?.shape ?? '';

/** Screen-reader description of one tile in its current state. */
export function describeTile(tile, { orient, isLit = false, isRotatable = false } = {}) {
  if (!tile) return 'Empty';
  switch (tile.type) {
    case TILE.EMITTER:
      return `${colorName(tile.color)} light source, shining ${tile.dir}`;
    case TILE.MIRROR:
    case TILE.SPLITTER: {
      const name = tile.type === TILE.MIRROR ? 'Mirror' : 'Beam splitter';
      const slant = orient === 0 ? 'slanted like /' : 'slanted like \\';
      const twin = tile.link ? `, twin ${tile.link === 'a' ? 'star' : 'heart'}: turns with its twin` : '';
      return `${name}, ${slant}${twin}, ${isRotatable ? 'tap to rotate' : 'locked'}`;
    }
    case TILE.FILTER:
      return `${colorName(tile.color)} ${shapeName(tile.color)} color filter`;
    case TILE.WALL:
      return 'Wall';
    case TILE.GEM:
      return `${colorName(tile.color)} ${shapeName(tile.color)} gem, ${isLit ? 'lit' : 'dark'}`;
    case TILE.PORTAL:
      return `Portal with a ${tile.pair === 'a' ? 'star' : 'heart'}: light jumps to the other ${tile.pair === 'a' ? 'star' : 'heart'} portal`;
    case TILE.SHADE:
      return `Shadow crystal, ${isLit ? 'lit, keep it dark!' : 'dark, keep it dark'}`;
    default:
      return 'Tile';
  }
}
