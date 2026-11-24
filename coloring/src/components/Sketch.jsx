import { useEffect, useRef } from 'react';
import Tape from './Tape.jsx';
import { drawStrokes, stepsOf } from '../sketches.js';
import { PAL_STAMPS, STAMP_SIZE, drawStamp, loadStickerImages, stampAt } from '../stamps.js';
import { crayonRub, sfx } from '../audio.js';
import { crayonPaint } from '../crayonTexture.js';
import { useCrayonLines } from '../useCrayonLines.js';

const marks = { paint: crayonPaint, stamp: (context, mark, scale) => drawStamp(context, mark, scale, crayonPaint) };

/** A sticker rides a little above the finger, so the child can see where it will land. */
const LIFT = 46;

/**
 * A blank sheet to draw on. With the crayon the finger draws a waxy line (thin, medium or thick), with the sound of
 * a crayon on paper that follows its speed. With stickers, the chosen one follows the finger and lands where it's
 * let go; one already on the sheet can be picked up and moved. The bucket pours a color over the whole background.
 * Every mark is kept, so Undo takes back the last one. Opened again from the wall, the drawing first replays
 * itself mark by mark (a tap skips).
 */
export default function Sketch({ sketch, tool, pickColor, canvasRef, isReplaying, onReplayed, onStroke, onMoveStamp }) {
  const holder = useRef(null);
  const replay = useRef(null);
  const carried = useRef(null); // { index (-1 for a new one), mark }
  const strokesRef = useRef(sketch.strokes);
  strokesRef.current = sketch.strokes;

  const endReplay = () => {
    if (!replay.current) return;
    cancelAnimationFrame(replay.current.frame);
    replay.current = null;
    crayonRub.stop();
    paintNow();
    onReplayed();
  };
  const { handlers, paintNow } = useCrayonLines({
    holder,
    canvas: canvasRef,
    size: tool.size,
    pickColor,
    redraw: (context, width) => {
      drawStrokes(context, strokesRef.current, width, { ...marks, limit: replay.current?.limit ?? Infinity, skip: carried.current?.index ?? -1 });
      if (carried.current) drawStamp(context, carried.current.mark, width / 800, crayonPaint, true);
    },
    onLine: onStroke,
    onTap: ([x, y]) => {
      if (replay.current) {
        endReplay();
        return true;
      }
      if (tool.kind === 'bg') {
        sfx.pour(4);
        onStroke({ t: 'bg', c: pickColor() });
        return true;
      }
      if (tool.kind !== 'stamp') return false;
      // Pick up a sticker that's already there, or take a new one from the row.
      const index = stampAt(strokesRef.current, x, y);
      const mark =
        index >= 0
          ? { ...strokesRef.current[index] }
          : { t: 'stamp', s: tool.stamp, c: pickColor(), x, y: y - LIFT, size: PAL_STAMPS.includes(tool.stamp) ? 170 : STAMP_SIZE, turn: 0 };
      const grip = { dx: mark.x - x, dy: mark.y - y };
      carried.current = { index, mark };
      sfx.peel();
      paintNow();
      return {
        move: ([mx, my]) => {
          mark.x = Math.round(mx + grip.dx);
          mark.y = Math.round(my + grip.dy);
          paintNow();
        },
        end: () => {
          carried.current = null;
          sfx.stamp();
          navigator.vibrate?.(12);
          if (index >= 0) onMoveStamp(index, mark.x, mark.y);
          else onStroke(mark);
        },
      };
    },
  });

  useEffect(() => {
    loadStickerImages().then(paintNow);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(paintNow, [sketch]); // eslint-disable-line react-hooks/exhaustive-deps

  // The replay: the marks appear in the order they were made, in a few seconds, with the crayon's sound.
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
      paintNow();
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

  return (
    <div ref={holder} className={`sheet-paper lifted blank ${tool.kind === 'stamp' ? 'stamping' : ''}`} {...handlers}>
      <Tape color="#9fd3c7" />
      <canvas ref={canvasRef} className="sketch-canvas" aria-label="A blank sheet to draw on" />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
