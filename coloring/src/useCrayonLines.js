import { useEffect, useRef } from 'react';
import { SIZES, SKETCH_W, drawStroke } from './sketches.js';
import { crayonRub } from './audio.js';
import { crayonPaint } from './crayonTexture.js';

/**
 * Drawing waxy crayon lines on a canvas that covers a sheet (the blank sheet, or the paint layer over a big-book
 * page). The canvas matches the sheet on screen and is redrawn with `redraw(context, width)` when it changes size;
 * a finger draws a line with the crayon sound following its speed, and the finished line goes to `onLine`.
 * `onTap(point)` sees every touch first: it can return true to ignore it, or { move(point), end(point) } to follow
 * the finger itself (a sticker being carried). Returns the pointer handlers and `paintNow()` to redraw at once.
 *
 * Marks are measured in `holder` (800 units wide); the canvas may cover a bigger `surface` around it (a big-book
 * page: the picture's square is the holder, the whole sheet of paper the surface), so the child can paint
 * anywhere on the paper while the marks still line up with the picture everywhere else.
 */
export function useCrayonLines({ holder, surface = holder, canvas, size, pickColor, redraw, onLine, onTap }) {
  const line = useRef(null);
  const geometry = useRef({ x: 0, y: 0, width: 1 }); // where the holder sits on the canvas, in canvas pixels
  const carry = useRef(null);
  const redrawRef = useRef(redraw);
  redrawRef.current = redraw;

  const paintNow = () => {
    const c = canvas.current;
    if (!c) return;
    const context = c.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, c.width, c.height);
    const { x, y, width } = geometry.current;
    context.translate(x, y);
    redrawRef.current(context, width);
    if (line.current) drawStroke(context, line.current.stroke, width / SKETCH_W, 0, crayonPaint);
  };

  useEffect(() => {
    const fit = () => {
      const area = surface.current.getBoundingClientRect();
      const box = holder.current.getBoundingClientRect();
      const ratio = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.current.width = Math.round(area.width * ratio);
      canvas.current.height = Math.round(area.height * ratio);
      geometry.current = { x: (box.left - area.left) * ratio, y: (box.top - area.top) * ratio, width: box.width * ratio };
      paintNow();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(surface.current);
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toSheet = (event) => {
    const box = holder.current.getBoundingClientRect();
    const scale = SKETCH_W / box.width;
    return [Math.round((event.clientX - box.left) * scale), Math.round((event.clientY - box.top) * scale)];
  };
  const onPointerDown = (event) => {
    if (event.button > 0 || line.current) return;
    const point = toSheet(event);
    const taken = onTap?.(point, event);
    if (taken) {
      if (typeof taken === 'object') {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        carry.current = { id: event.pointerId, ...taken };
      }
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    line.current = { id: event.pointerId, stroke: { c: pickColor(), w: SIZES[size], p: point }, at: performance.now() };
    crayonRub.start();
    crayonRub.speed(0.3);
    paintNow();
  };
  const onPointerMove = (event) => {
    if (carry.current?.id === event.pointerId) return carry.current.move(toSheet(event));
    const d = line.current;
    if (!d || d.id !== event.pointerId) return;
    const [x, y] = toSheet(event);
    const p = d.stroke.p;
    const far = Math.hypot(x - p.at(-2), y - p.at(-1));
    if (far < 3) return;
    p.push(x, y);
    const now = performance.now();
    crayonRub.speed(far / Math.max(8, now - d.at));
    d.at = now;
    drawStroke(canvas.current.getContext('2d'), d.stroke, geometry.current.width / SKETCH_W, p.length - 2, crayonPaint);
  };
  const onPointerEnd = (event) => {
    if (carry.current?.id === event.pointerId) {
      const { end } = carry.current;
      carry.current = null;
      return end(toSheet(event));
    }
    const d = line.current;
    if (!d || d.id !== event.pointerId) return;
    line.current = null;
    crayonRub.stop();
    onLine(d.stroke);
  };

  return { handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd }, paintNow };
}
