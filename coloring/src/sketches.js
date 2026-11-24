/**
 * Free drawings on a blank sheet: each is a list of marks on a 800×1000 sheet (so it can be redrawn at any size,
 * replayed, taken back mark by mark, and stays small to keep). A mark is a crayon line { c, w, p } or a stamp
 * { t: 'stamp', s, c, x, y, size, turn }. Pure functions, no DOM.
 */
export const SKETCH_W = 800;
export const SKETCH_H = 1000;

/** Crayon widths: thin for details (a 7-year-old's eyes and windows), medium, and a fat one for little hands. */
export const SIZES = [12, 26, 48];
export const DEFAULT_SIZE = 1;

export const newSketch = (id = `s${Date.now().toString(36)}`) => ({ id, strokes: [], updated: Date.now(), created: Date.now() });

export const addStroke = (sketch, stroke) => ({ ...sketch, strokes: [...sketch.strokes, stroke], updated: Date.now() });
export const undoStroke = (sketch) => ({ ...sketch, strokes: sketch.strokes.slice(0, -1), updated: Date.now() });
export const clearSketch = (sketch) => ({ ...sketch, strokes: [], updated: Date.now() });
export const isBlank = (sketch) => !sketch?.strokes.length;

/** How many steps a replay has (a line's points or one stamp), so it can be drawn up to a point. */
export const stepsOf = (mark) => (mark.t === 'stamp' ? 1 : mark.p.length / 2);

/**
 * Draws marks on a 2D canvas context scaled so the sheet fills `width` pixels, up to `limit` steps (a replay).
 * `paint(context, color)` gives the fill for a color (the crayon texture in the app); `stamp(context, mark,
 * scale)` draws a stamp.
 */
export function drawStrokes(context, strokes, width, { paint = (_, color) => color, stamp = () => {}, limit = Infinity } = {}) {
  const scale = width / SKETCH_W;
  let left = limit;
  for (const mark of strokes) {
    if (left <= 0) return;
    const steps = stepsOf(mark);
    if (mark.t === 'stamp') stamp(context, mark, scale);
    else drawStroke(context, steps <= left ? mark : { ...mark, p: mark.p.slice(0, Math.max(2, Math.floor(left) * 2)) }, scale, 0, paint);
    left -= steps;
  }
}

/** One crayon line, or its newest bit when `from` (a point index) is given. */
export function drawStroke(context, { c, w, p }, scale, from = 0, paint = (_, color) => color) {
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = paint(context, c);
  context.fillStyle = context.strokeStyle;
  context.lineWidth = w * scale;
  if (p.length === 2) {
    context.beginPath();
    context.arc(p[0] * scale, p[1] * scale, (w * scale) / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }
  context.beginPath();
  const start = Math.max(0, from - 2);
  context.moveTo(p[start] * scale, p[start + 1] * scale);
  for (let i = start + 2; i < p.length; i += 2) context.lineTo(p[i] * scale, p[i + 1] * scale);
  context.stroke();
}
