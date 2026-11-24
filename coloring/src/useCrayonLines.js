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
    const c = canvas?.current;
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
    // No canvas (a little-book page has nothing to paint by hand): nothing to fit.
    if (!canvas?.current) return undefined;
    // Measured from the layout, not the screen, so the sheet's tilt and its sliding-in don't throw the paint off.
    const fit = () => {
      const c = canvas.current;
      const area = surface.current;
      const box = holder.current;
      if (!c || !area || !box || box.offsetWidth < 10) return;
      let x = 0;
      let y = 0;
      for (let el = box; el && el !== area; el = el.offsetParent) {
        x += el.offsetLeft;
        y += el.offsetTop;
      }
      const ratio = Math.min(2.5, window.devicePixelRatio || 1);
      const width = Math.round(area.offsetWidth * ratio);
      const height = Math.round(area.offsetHeight * ratio);
      if (c.width !== width || c.height !== height) {
        c.width = width;
        c.height = height;
      }
      geometry.current = { x: x * ratio, y: y * ratio, width: box.offsetWidth * ratio };
      paintNow();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(surface.current);
    observer.observe(holder.current);
    // Phones sometimes drop a canvas's picture while the page is hidden or after an animation: draw it again.
    const again = () => document.visibilityState === 'visible' && fit();
    document.addEventListener('visibilitychange', again);
    surface.current.addEventListener('animationend', fit);
    window.addEventListener('pageshow', fit);
    const area = surface.current;
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', again);
      area.removeEventListener('animationend', fit);
      window.removeEventListener('pageshow', fit);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toSheet = (event) => {
    // Where the finger is on the holder, undoing the sheet's small tilt.
    const box = holder.current.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const tilt = (getComputedStyle(surface.current).transform.match(/matrix\(([^,]+),\s*([^,]+)/) ?? []).slice(1).map(Number);
    const angle = tilt.length ? Math.atan2(tilt[1], tilt[0]) : 0;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    const ux = dx * Math.cos(-angle) - dy * Math.sin(-angle);
    const uy = dx * Math.sin(-angle) + dy * Math.cos(-angle);
    const scale = SKETCH_W / holder.current.offsetWidth;
    return [Math.round((ux + holder.current.offsetWidth / 2) * scale), Math.round((uy + holder.current.offsetHeight / 2) * scale)];
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
