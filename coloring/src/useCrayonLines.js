import { useEffect, useRef } from 'react';
import { SIZES, SKETCH_W, drawStroke } from './sketches.js';
import { crayonRub } from './audio.js';
import { crayonPaint } from './crayonTexture.js';

/**
 * Drawing waxy crayon lines on a canvas that covers a sheet (the blank sheet, or the paint layer over a big-book
 * page). The canvas matches the sheet on screen and is redrawn with `redraw(context, width)` when it changes size;
 * a finger draws a line with the crayon sound following its speed, and the finished line goes to `onLine`.
 * Returns the pointer handlers and `paintNow()` to redraw at once.
 */
export function useCrayonLines({ holder, canvas, size, pickColor, redraw, onLine, onTap }) {
  const line = useRef(null);
  const redrawRef = useRef(redraw);
  redrawRef.current = redraw;

  const paintNow = () => {
    const c = canvas.current;
    if (!c) return;
    const context = c.getContext('2d');
    context.clearRect(0, 0, c.width, c.height);
    redrawRef.current(context, c.width);
    if (line.current) drawStroke(context, line.current.stroke, c.width / SKETCH_W, 0, crayonPaint);
  };

  useEffect(() => {
    const fit = () => {
      const box = holder.current.getBoundingClientRect();
      const ratio = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.current.width = Math.round(box.width * ratio);
      canvas.current.height = Math.round(box.height * ratio);
      paintNow();
    };
    const observer = new ResizeObserver(fit);
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
    if (onTap?.(point, event)) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    line.current = { id: event.pointerId, stroke: { c: pickColor(), w: SIZES[size], p: point }, at: performance.now() };
    crayonRub.start();
    crayonRub.speed(0.3);
    paintNow();
  };
  const onPointerMove = (event) => {
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
    drawStroke(canvas.current.getContext('2d'), d.stroke, canvas.current.width / SKETCH_W, p.length - 2, crayonPaint);
  };
  const onPointerEnd = (event) => {
    const d = line.current;
    if (!d || d.id !== event.pointerId) return;
    line.current = null;
    crayonRub.stop();
    onLine(d.stroke);
  };

  return { handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd }, paintNow };
}
