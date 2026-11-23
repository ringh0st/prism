import { useEffect, useRef } from 'react';
import Tape from './Tape.jsx';
import { LINE, SKETCH_W, drawStroke, drawStrokes } from '../sketches.js';
import { crayonRub } from '../audio.js';
import { crayonPaint } from '../crayonTexture.js';

/**
 * A blank sheet to draw on with the crayons: the finger draws a waxy line, with the sound of a crayon on paper
 * that follows its speed. Each stroke is kept, so Undo takes back the last one.
 */
export default function Sketch({ sketch, pickColor, canvasRef, onStroke }) {
  const holder = useRef(null);
  const drawing = useRef(null);
  const strokesRef = useRef(sketch.strokes);
  strokesRef.current = sketch.strokes;

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokes(context, strokesRef.current, canvas.width, crayonPaint);
    if (drawing.current) drawStroke(context, drawing.current.stroke, canvas.width / SKETCH_W, 0, crayonPaint);
  };

  // The canvas matches the sheet's size on screen (sharp on every phone) and redraws when it changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const fit = () => {
      const box = holder.current.getBoundingClientRect();
      const ratio = Math.min(2.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(box.width * ratio);
      canvas.height = Math.round(box.height * ratio);
      redraw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(redraw, [sketch]); // eslint-disable-line react-hooks/exhaustive-deps

  const toSheet = (event) => {
    const box = holder.current.getBoundingClientRect();
    const scale = SKETCH_W / box.width;
    return [Math.round((event.clientX - box.left) * scale), Math.round((event.clientY - box.top) * scale)];
  };
  const onPointerDown = (event) => {
    if (event.button > 0 || drawing.current) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const [x, y] = toSheet(event);
    drawing.current = { id: event.pointerId, stroke: { c: pickColor(), w: LINE, p: [x, y] }, at: performance.now() };
    crayonRub.start();
    crayonRub.speed(0.3);
    redraw();
  };
  const onPointerMove = (event) => {
    const d = drawing.current;
    if (!d || d.id !== event.pointerId) return;
    const [x, y] = toSheet(event);
    const p = d.stroke.p;
    const far = Math.hypot(x - p.at(-2), y - p.at(-1));
    if (far < 3) return;
    p.push(x, y);
    const now = performance.now();
    crayonRub.speed(far / Math.max(8, now - d.at));
    d.at = now;
    const canvas = canvasRef.current;
    drawStroke(canvas.getContext('2d'), d.stroke, canvas.width / SKETCH_W, p.length - 2, crayonPaint);
  };
  const onPointerEnd = (event) => {
    const d = drawing.current;
    if (!d || d.id !== event.pointerId) return;
    drawing.current = null;
    crayonRub.stop();
    onStroke(d.stroke);
  };

  return (
    <div
      ref={holder}
      className="sheet-paper lifted blank"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <Tape color="#9fd3c7" />
      <canvas ref={canvasRef} className="sketch-canvas" aria-label="A blank sheet to draw on" />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
