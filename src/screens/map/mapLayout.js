import { CHEST_AFTER_LEVELS } from '../../game/surprises.js';

export const ROW_HEIGHT = 96;

/** Gentle left-right wiggle for the path, as % of the map width. */
const WIGGLE = [50, 70, 82, 70, 50, 30, 18, 30];

/**
 * Turn a world's levels into map stops: levels, with reward chests after levels 10 and 20.
 * @returns [{ kind: 'level' | 'chest', ref?, chestNumber?, levelsNeeded?, x, y }]
 */
export function buildWorldStops(levelRefs) {
  const stops = [];
  levelRefs.forEach((ref, position) => {
    stops.push({ kind: 'level', ref });
    const chestNumber = CHEST_AFTER_LEVELS.indexOf(position + 1) + 1;
    if (chestNumber > 0) stops.push({ kind: 'chest', chestNumber, levelsNeeded: position + 1 });
  });
  return stops.map((stop, i) => ({ ...stop, x: WIGGLE[i % WIGGLE.length], y: i * ROW_HEIGHT + ROW_HEIGHT / 2 }));
}

/** Smooth SVG path through the stops (coordinates: x in %, y in px). */
export function pathThrough(stops, width) {
  if (!stops.length) return '';
  const point = (stop) => [(stop.x / 100) * width, stop.y];
  const [x0, y0] = point(stops[0]);
  let d = `M ${x0} ${y0}`;
  for (let i = 1; i < stops.length; i++) {
    const [px, py] = point(stops[i - 1]);
    const [x, y] = point(stops[i]);
    const midY = (py + y) / 2;
    d += ` C ${px} ${midY}, ${x} ${midY}, ${x} ${y}`;
  }
  return d;
}
