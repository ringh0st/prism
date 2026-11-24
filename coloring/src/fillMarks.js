import { fillMask } from './floodFill.js';
import { crayonPaint } from './crayonTexture.js';

/**
 * Draws a bucket fill mark: the area around its point, up to what was drawn before it, in the crayon's color and
 * wax. Working out the area takes a moment, so it's kept per mark until the marks before it or the canvas size
 * change (a replay or a redraw then costs nothing).
 */
const kept = new WeakMap();
const ids = new WeakMap();
let nextId = 1;
const idOf = (mark) => {
  if (!ids.has(mark)) ids.set(mark, nextId++);
  return ids.get(mark);
};

export function drawFill(context, mark, scale, before) {
  const { canvas } = context;
  const sig = `${canvas.width}x${canvas.height}:${before.map(idOf).join(',')}`;
  let entry = kept.get(mark);
  if (!entry || entry.sig !== sig) {
    const t = context.getTransform();
    const mask = fillMask(canvas, t.a * mark.x * scale + t.e, t.d * mark.y * scale + t.f);
    let layer = null;
    if (mask) {
      layer = document.createElement('canvas');
      layer.width = canvas.width;
      layer.height = canvas.height;
      const l = layer.getContext('2d');
      l.fillStyle = crayonPaint(l, mark.c);
      l.fillRect(0, 0, layer.width, layer.height);
      l.globalCompositeOperation = 'destination-in';
      l.drawImage(mask, 0, 0);
    }
    entry = { sig, layer };
    kept.set(mark, entry);
  }
  if (!entry.layer) return;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.drawImage(entry.layer, 0, 0);
  context.restore();
}
