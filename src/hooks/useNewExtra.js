import { useCallback, useState } from 'react';
import { featureToAnnounce, openFeatures } from '../game/unlocks.js';
import { readJson, writeJson } from '../lib/storage.js';

const KEY = 'prism.extrasSeen.v1';

/**
 * The feature to announce on the map with a "New!" note, and a way to mark it as seen (on this device).
 * The first time this runs, everything already open counts as seen: only what opens from now on is news.
 */
export function useNewExtra(solvedCount) {
  const [seen, setSeen] = useState(() => {
    const stored = readJson(KEY, null);
    if (stored) return stored;
    const already = openFeatures(solvedCount);
    writeJson(KEY, already);
    return already;
  });
  const markSeen = useCallback((id) => {
    setSeen((current) => {
      const next = current.includes(id) ? current : [...current, id];
      writeJson(KEY, next);
      return next;
    });
  }, []);
  return { newExtra: featureToAnnounce(solvedCount, seen), markSeen };
}
