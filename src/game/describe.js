import { BEAM_COLORS, FRAGILE_TURNS, TILE } from './constants.js';

const colorName = (color) => BEAM_COLORS[color]?.label ?? color;
const shapeName = (color) => BEAM_COLORS[color]?.shape ?? '';

/** Screen-reader description of one tile in its current state. */
export function describeTile(tile, { orient, isLit = false, isRotatable = false, isFogged = false, turnsLeft = FRAGILE_TURNS } = {}) {
  if (!tile) return 'Empty';
  if (isFogged) return 'Fog: something is hidden here until light reaches it';
  switch (tile.type) {
    case TILE.EMITTER:
      return `${colorName(tile.color)} light source, shining ${tile.dir}`;
    case TILE.MIRROR:
    case TILE.SPLITTER: {
      const name = tile.type === TILE.MIRROR ? 'Mirror' : 'Beam splitter';
      const slant = orient === 0 ? 'slanted like /' : 'slanted like \\';
      const twin = tile.link ? `, twin ${tile.link === 'a' ? 'star' : 'heart'}: turns with its twin` : '';
      const crack = tile.fragile ? (turnsLeft > 0 ? `, cracking: ${turnsLeft} ${turnsLeft === 1 ? 'turn' : 'turns'} left` : ', cracked') : '';
      return `${name}, ${slant}${twin}${crack}, ${isRotatable ? 'tap to rotate' : 'locked'}`;
    }
    case TILE.FILTER:
      return `${colorName(tile.color)} ${shapeName(tile.color)} color filter`;
    case TILE.WALL:
      return 'Wall';
    case TILE.GEM:
      return `${colorName(tile.color)} ${shapeName(tile.color)} gem, ${isLit ? 'lit' : 'dark'}`;
    case TILE.PORTAL:
      return `Portal with a ${tile.pair === 'a' ? 'star' : 'heart'}: light jumps to the other ${tile.pair === 'a' ? 'star' : 'heart'} portal`;
    case TILE.PRISM:
      return 'Prism crystal: splits the light in two, out to both sides';
    case TILE.SHADE:
      return `Shadow crystal, ${isLit ? 'lit, keep it dark!' : 'dark, keep it dark'}`;
    default:
      return 'Tile';
  }
}
