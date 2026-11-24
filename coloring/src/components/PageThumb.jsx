import { useEffect, useRef } from 'react';
import Drawing from './Drawing.jsx';
import { drawStrokes } from '../sketches.js';
import { crayonPaint } from '../crayonTexture.js';

/** How far the sheet of paper reaches around the picture's square (as parts of its width), where paint can go too. */
export const PAPER_AROUND = { left: 0.06, right: 0.06, top: 0.18, bottom: 0.21 };
const SIDE = 240; // the square's size on the little canvas

/** A colored page as a small picture (on the walls): its fills, and any crayon painted over the sheet. */
export default function PageThumb({ page, colors, paint }) {
  const canvas = useRef(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const context = c.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, c.width, c.height);
    context.translate(SIDE * PAPER_AROUND.left, SIDE * PAPER_AROUND.top);
    drawStrokes(context, paint, SIDE, { paint: crayonPaint });
  }, [paint]);
  const { left, right, top, bottom } = PAPER_AROUND;
  return (
    <span className="thumb-art">
      <Drawing page={page} colors={colors} />
      {paint?.length > 0 && (
        <canvas
          ref={canvas}
          width={Math.round(SIDE * (1 + left + right))}
          height={Math.round(SIDE * (1 + top + bottom))}
          className="thumb-paint"
          style={{ left: `${-left * 100}%`, top: `${-top * 100}%`, width: `${(1 + left + right) * 100}%`, height: `${(1 + top + bottom) * 100}%` }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
