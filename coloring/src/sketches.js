/**
 * Free drawings on a blank sheet: each is a list of crayon strokes on a 800×1000 sheet (so it can be redrawn at
 * any size, taken back stroke by stroke, and stays small to keep). Pure functions, no DOM.
 */
export const SKETCH_W = 800;
export const SKETCH_H = 1000;
export const LINE = 26; // crayon width on the sheet

export const newSketch = (id = `s${Date.now().toString(36)}`) => ({ id, strokes: [], updated: Date.now() });

export const addStroke = (sketch, stroke) => ({ ...sketch, strokes: [...sketch.strokes, stroke], updated: Date.now() });
export const undoStroke = (sketch) => ({ ...sketch, strokes: sketch.strokes.slice(0, -1), updated: Date.now() });
export const clearSketch = (sketch) => ({ ...sketch, strokes: [], updated: Date.now() });
export const isBlank = (sketch) => !sketch?.strokes.length;

/**
 * Draws strokes on a 2D canvas context scaled so the sheet fills `width` pixels. `paint(context, color)` gives
 * the fill for a color (the crayon texture in the app; the plain color by default).
 */
export function drawStrokes(context, strokes, width, paint = (_, color) => color) {
  const scale = width / SKETCH_W;
  for (const stroke of strokes) drawStroke(context, stroke, scale, 0, paint);
}

/** One stroke, or its newest bit when `from` (a point index) is given. */
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
