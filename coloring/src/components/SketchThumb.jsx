import { useEffect, useRef } from 'react';
import { SKETCH_H, SKETCH_W, drawStrokes } from '../sketches.js';
import { crayonPaint } from '../crayonTexture.js';

/** A free drawing as a small picture (on the wall). */
export default function SketchThumb({ sketch }) {
  const canvas = useRef(null);
  useEffect(() => {
    const c = canvas.current;
    const context = c.getContext('2d');
    context.clearRect(0, 0, c.width, c.height);
    drawStrokes(context, sketch.strokes, c.width, crayonPaint);
  }, [sketch]);
  return <canvas ref={canvas} width={SKETCH_W / 3} height={SKETCH_H / 3} className="sketch-thumb" aria-hidden="true" />;
}
