import { BEAM_COLORS, FRAGILE_TURNS, TILE } from './constants.js';
import { translate } from '../i18n/translate.js';
import { lampDirection } from './beam.js';

const english = (key, params, fallback) => translate('en', key, params, fallback);

/**
 * Screen-reader description of one tile in its current state.
 * @param t the translate function (`t` from useI18n); English by default
 */
export function describeTile(
  tile,
  { orient, isLit = false, isOpen = false, isRotatable = false, isFogged = false, turnsLeft = FRAGILE_TURNS } = {},
  t = english,
) {
  if (!tile) return t('ui.tile.empty');
  if (isFogged) return t('ui.tile.fog');
  const color = t(`ui.color.${tile.color}`, {}, BEAM_COLORS[tile.color]?.label ?? tile.color);
  const shape = t(`ui.shape.${BEAM_COLORS[tile.color]?.shape}`, {}, '');
  switch (tile.type) {
    case TILE.EMITTER: {
      const dir = lampDirection(tile, orient ?? tile.orient ?? 0);
      return t(tile.turnable ? 'ui.tile.turningLamp' : 'ui.tile.emitter', { color, dir: t(`ui.dir.${dir}`, {}, dir) });
    }
    case TILE.MIRROR:
    case TILE.SPLITTER: {
      const crack = tile.fragile ? (turnsLeft > 0 ? t('ui.tile.cracking', { count: turnsLeft }) : t('ui.tile.cracked')) : '';
      return t('ui.tile.turner', {
        name: t(tile.type === TILE.MIRROR ? 'ui.tile.mirror' : 'ui.tile.splitter'),
        slant: t(orient === 0 ? 'ui.tile.slash' : 'ui.tile.backslash'),
        twin: tile.link ? t(tile.link === 'a' ? 'ui.tile.twinStar' : 'ui.tile.twinHeart') : '',
        crack: crack + (tile.oneSided !== undefined ? t('ui.tile.oneSided') : ''),
        state: t(isRotatable ? 'ui.tile.rotatable' : 'ui.tile.locked'),
      });
    }
    case TILE.FILTER:
      return t('ui.tile.filter', { color, shape });
    case TILE.WALL:
      return t('ui.tile.wall');
    case TILE.GEM:
      return t(isLit ? 'ui.tile.gemLit' : 'ui.tile.gemDark', { color, shape });
    case TILE.PORTAL:
      return t(tile.pair === 'a' ? 'ui.tile.portalStar' : 'ui.tile.portalHeart');
    case TILE.PRISM:
      return t('ui.tile.prism');
    case TILE.GATE:
      return t(isOpen ? 'ui.tile.gateOpen' : 'ui.tile.gateClosed');
    case TILE.SWITCH:
      return t(isLit ? 'ui.tile.switchLit' : 'ui.tile.switchDark');
    case TILE.SHADE:
      return t(isLit ? 'ui.tile.shadeLit' : 'ui.tile.shadeDark');
    case TILE.VOID:
      return t('ui.tile.void');
    default:
      return t('ui.tile.unknown');
  }
}
