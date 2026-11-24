import { useEffect, useRef } from 'react';
import Tape from './Tape.jsx';
import { drawStrokes, stepsOf } from '../sketches.js';
import { PAL_SIZE, PICTURE_STAMPS, STAMP_SIZE, drawStamp, loadStickerImages, palAt } from '../stamps.js';
import { drawFill } from '../fillMarks.js';
import { crayonRub, sfx } from '../audio.js';
import { crayonPaint } from '../crayonTexture.js';
import { useCrayonLines } from '../useCrayonLines.js';

const marks = { paint: crayonPaint, stamp: (context, mark, scale) => drawStamp(context, mark, scale, crayonPaint), fill: drawFill };

/** A sticker rides a little above the finger, so the child can see where it will land. */
const LIFT = 46;

/**
 * A blank sheet to draw on. With the crayon the finger draws a waxy line (thin, medium or thick), with the sound of
 * a crayon on paper that follows its speed. A shape or picture sticker is dragged out to the size wanted (a tap
 * puts down the usual size) and stays; a Pal follows the finger, lands where it's let go and can be moved again.
 * The bucket fills the area under the finger up to the lines: a closed shape, or the whole background.
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
      if (tool.kind === 'bucket') {
        sfx.pour(4);
        onStroke({ t: 'fill', c: pickColor(), x, y });
        return true;
      }
      if (tool.kind === 'shape') return dragOutShape(x, y);
      if (tool.kind !== 'pal') return false;
      // Pick up a Pal that's already there, or take a new one from the row.
      const index = palAt(strokesRef.current, x, y);
      const mark = index >= 0 ? { ...strokesRef.current[index] } : { t: 'stamp', s: tool.pal, c: '#000000', x, y: y - LIFT, w: PAL_SIZE, h: PAL_SIZE };
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

  /** A shape grows from where the finger went down to where it is (pictures keep their proportions). */
  function dragOutShape(x0, y0) {
    const isPicture = PICTURE_STAMPS.includes(tool.shape);
    const mark = { t: 'stamp', s: tool.shape, c: pickColor(), x: x0, y: y0, w: STAMP_SIZE, h: STAMP_SIZE };
    carried.current = { index: -1, mark };
    sfx.peel();
    paintNow();
    return {
      move: ([x, y]) => {
        let w = Math.abs(x - x0);
        let h = Math.abs(y - y0);
        if (Math.max(w, h) < 16) return;
        if (isPicture) w = h = Math.max(w, h);
        mark.w = Math.max(24, Math.round(w));
        mark.h = Math.max(24, Math.round(h));
        mark.x = Math.round(x0 + (Math.sign(x - x0) || 1) * (mark.w / 2));
        mark.y = Math.round(y0 + (Math.sign(y - y0) || 1) * (mark.h / 2));
        paintNow();
      },
      end: () => {
        carried.current = null;
        sfx.stamp();
        navigator.vibrate?.(12);
        onStroke(mark);
      },
    };
  }

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
    <div ref={holder} className={`sheet-paper lifted blank ${tool.kind === 'draw' ? '' : 'stamping'}`} {...handlers}>
      <Tape color="#9fd3c7" />
      <canvas ref={canvasRef} className="sketch-canvas" aria-label="A blank sheet to draw on" />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
