import { useEffect, useRef } from 'react';
import Drawing from './Drawing.jsx';
import Sticker from './Sticker.jsx';
import Confetti from './Confetti.jsx';
import Tape from './Tape.jsx';
import { partAt } from '../drawingDom.js';
import { drawStrokes } from '../sketches.js';
import { crayonPaint } from '../crayonTexture.js';
import { useCrayonLines } from '../useCrayonLines.js';

/**
 * A Pal's picture taken out of the book onto the desk as a big sheet of paper. Nothing moves or turns here.
 * Filling: a tap colors the part under the finger (or the nearest one), and a finger sliding over the picture
 * colors every part it passes, which is what a small child tries first. Painting (the big book): the finger lays
 * crayon by hand, thin, medium or thick, on a layer over the picture that blends like wax (the lines stay dark).
 * Paint covers the whole sheet but is measured from the drawing's square (800 units wide), so it lines up the same
 * on the wall and in a saved picture.
 */
export default function Sheet({ page, colors, isDone, celebrate, svgRef, onPaint, tool, paint = [], pickColor, paintRef, onPaintLine }) {
  const art = useRef(null);
  const paper = useRef(null);
  const stroke = useRef(null);
  const paintStrokes = useRef(paint);
  paintStrokes.current = paint;
  const isPainting = tool?.kind === 'draw';

  const { handlers: paintHandlers, paintNow } = useCrayonLines({
    holder: art,
    surface: paper,
    canvas: paintRef,
    size: tool?.size ?? 1,
    pickColor,
    redraw: (context, width) => drawStrokes(context, paintStrokes.current, width, { paint: crayonPaint }),
    onLine: (line) => onPaintLine?.(line),
  });
  useEffect(paintNow, [paint]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = (event) => {
    if (event.button > 0 || !svgRef.current) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const part = partAt(svgRef.current, event.clientX, event.clientY);
    stroke.current = { id: event.pointerId, parts: new Set(part == null ? [] : [part]) };
    onPaint(part, event.clientX, event.clientY);
  };
  const onPointerMove = (event) => {
    const s = stroke.current;
    if (!s || s.id !== event.pointerId || !svgRef.current) return;
    const part = partAt(svgRef.current, event.clientX, event.clientY, { isNear: false });
    if (part == null || s.parts.has(part)) return;
    s.parts.add(part);
    onPaint(part, event.clientX, event.clientY);
  };
  const onPointerEnd = () => {
    stroke.current = null;
  };
  const fillHandlers = { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd };

  return (
    <div
      ref={paper}
      className={`sheet-paper lifted ${page.book === 'big' ? 'detailed' : ''} ${isPainting ? 'painting' : ''}`}
      {...(isPainting ? paintHandlers : fillHandlers)}
    >
      <Tape />
      <h2 className="page-name">{page.name}</h2>
      <div ref={art} className={`art ${celebrate ? 'hop' : ''}`}>
        <Drawing page={page} colors={colors} svgRef={svgRef} isLabelled />
      </div>
      {paintRef && <canvas ref={paintRef} className="paint-layer" aria-hidden="true" />}
      <div className="grain" aria-hidden="true" />
      {isDone && <Sticker isNew={Boolean(celebrate)} />}
      {celebrate && <Confetti key={celebrate} />}
    </div>
  );
}
