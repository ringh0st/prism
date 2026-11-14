import { useEffect, useState } from 'react';

/** Parse "#/play/w1-03" into { name: 'play', params: ['w1-03'] }. */
export function parseHash(hash) {
  const [name = '', ...params] = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { name: name || 'map', params: params.map(decodeURIComponent) };
}

export function navigate(path) {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
}

/** Minimal hash router: works on GitHub Pages without server rewrites. */
export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    // Each screen decides its own scroll position (the map centers the current level).
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const onChange = () => {
      // Reset first, so it can never override a screen that scrolls itself on mount.
      window.scrollTo(0, 0);
      setRoute(parseHash(window.location.hash));
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
