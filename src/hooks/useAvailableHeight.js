import { useEffect, useState } from 'react';

/** The current height (px) of an element, kept up to date as the screen resizes. */
export function useAvailableHeight(ref) {
  const [height, setHeight] = useState(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setHeight(Math.round(entry.contentRect.height)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return height;
}
