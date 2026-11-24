import { useEffect, useRef } from 'react';
import Tape from './Tape.jsx';
import { SIZES, SKETCH_W, drawStroke, drawStrokes, stepsOf } from '../sketches.js';
import { STAMP_SIZE, drawStamp, loadPalStamps } from '../stamps.js';
import { crayonRub, sfx } from '../audio.js';
import { crayonPaint } from '../crayonTexture.js';

const marks = { paint: crayonPaint, stamp: (context, mark, scale) => drawStamp(context, mark, scale, crayonPaint) };

/**
 * A blank sheet to draw on. With the crayon the finger draws a waxy line (thin, medium or fat), with the sound of
 * a crayon on paper that follows its speed; with a stamp a tap puts it down. Every mark is kept, so Undo takes
 * back the last one. Opened again from the wall, the drawing first replays itself mark by mark (a tap skips).
 */
export default function Sketch({ sketch, tool, pickColor, canvasRef, isReplaying, onReplayed, onStroke }) {
  const holder = useRef(null);
  const drawing = useRef(null);
  const replay = useRef(null);
  const strokesRef = useRef(sketch.strokes);
  strokesRef.current = sketch.strokes;

  const redraw = (limit = replay.current?.limit ?? Infinity) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawStrokes(context, strokesRef.current, canvas.width, { ...marks, limit });
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
    loadPalStamps().then(() => redraw());
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => redraw(), [sketch]); // eslint-disable-line react-hooks/exhaustive-deps

  // The replay: the marks appear in the order they were made, in a few seconds, with the crayon's sound.
  const endReplay = () => {
    if (!replay.current) return;
    cancelAnimationFrame(replay.current.frame);
    replay.current = null;
    crayonRub.stop();
    redraw(Infinity);
    onReplayed();
  };
  useEffect(() => {
    if (!isReplaying) return undefined;
    const total = strokesRef.current.reduce((sum, mark) => sum + stepsOf(mark), 0);
    const seconds = Math.min(4, Math.max(1.4, total * 0.012));
    const began = performance.now();
    replay.current = { limit: 0, frame: 0 };
    crayonRub.start();
    crayonRub.speed(0.5);
    const step = (now) => {
      if (!replay.current) return;
      const t = Math.min(1, Math.max(0, (now - began) / (seconds * 1000)));
      replay.current.limit = t * total;
      redraw();
      if (t < 1) replay.current.frame = requestAnimationFrame(step);
      else endReplay();
    };
    replay.current.frame = requestAnimationFrame(step);
    return () => {
      if (replay.current) cancelAnimationFrame(replay.current.frame);
      replay.current = null;
      crayonRub.stop();
    };
  }, [isReplaying]); // eslint-disable-line react-hooks/exhaustive-deps

  const toSheet = (event) => {
    const box = holder.current.getBoundingClientRect();
    const scale = SKETCH_W / box.width;
    return [Math.round((event.clientX - box.left) * scale), Math.round((event.clientY - box.top) * scale)];
  };
  const onPointerDown = (event) => {
    if (event.button > 0 || drawing.current) return;
    if (replay.current) return endReplay();
    const [x, y] = toSheet(event);
    if (tool.kind === 'stamp') {
      sfx.stamp();
      navigator.vibrate?.(12);
      const turn = (Math.random() - 0.5) * 0.5;
      onStroke({ t: 'stamp', s: tool.stamp, c: pickColor(), x, y, size: Math.round(STAMP_SIZE * (0.85 + Math.random() * 0.3)), turn: +turn.toFixed(2) });
      return undefined;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawing.current = { id: event.pointerId, stroke: { c: pickColor(), w: SIZES[tool.size], p: [x, y] }, at: performance.now() };
    crayonRub.start();
    crayonRub.speed(0.3);
    redraw();
    return undefined;
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
      className={`sheet-paper lifted blank ${tool.kind === 'stamp' ? 'stamping' : ''}`}
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
