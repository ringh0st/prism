import { useEffect, useRef } from 'react';
import Drawing from './Drawing.jsx';
import { SKETCH_W, drawStrokes } from '../sketches.js';
import { crayonPaint } from '../crayonTexture.js';

/** A colored page as a small picture (on the walls): its fills, and any crayon painted over it. */
export default function PageThumb({ page, colors, paint }) {
  const canvas = useRef(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const context = c.getContext('2d');
    context.clearRect(0, 0, c.width, c.height);
    drawStrokes(context, paint, c.width, { paint: crayonPaint });
  }, [paint]);
  return (
    <span className="thumb-art">
      <Drawing page={page} colors={colors} />
      {paint?.length > 0 && <canvas ref={canvas} width={SKETCH_W / 3} height={SKETCH_W / 3} className="thumb-paint" aria-hidden="true" />}
    </span>
  );
}
