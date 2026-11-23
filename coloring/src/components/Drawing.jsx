import { useLayoutEffect, useRef } from 'react';
import { applyColors, labelParts } from '../drawingDom.js';

/**
 * A page's drawing with its colors. The SVG is put in once per page and then colored in place, so a part that
 * is being painted keeps its spreading paint. `svgRef` receives the SVG element (for painting and saving).
 */
export default function Drawing({ page, colors, svgRef = null, isLabelled = false, className = '' }) {
  const holder = useRef(null);
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  useLayoutEffect(() => {
    holder.current.innerHTML = page.svg;
    const svg = holder.current.querySelector('svg');
    applyColors(svg, colorsRef.current);
    if (isLabelled) labelParts(svg, page.name, page.parts.length);
    else svg.setAttribute('aria-hidden', 'true');
    if (svgRef) svgRef.current = svg;
    return () => {
      if (svgRef?.current === svg) svgRef.current = null;
    };
  }, [page, isLabelled, svgRef]);
  useLayoutEffect(() => {
    applyColors(holder.current.querySelector('svg'), colors);
  }, [colors, page]);
  return <div ref={holder} className={`drawing-holder ${className}`} />;
}
