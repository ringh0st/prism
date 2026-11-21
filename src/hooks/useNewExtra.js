import { useCallback, useState } from 'react';
import { extraToAnnounce, openExtras } from '../game/unlocks.js';
import { readJson, writeJson } from '../lib/storage.js';

const KEY = 'prism.extrasSeen.v1';

/**
 * The map extra to announce with a "New!" note, and a way to mark it as seen (on this device).
 * The first time this runs, everything already open counts as seen: only extras that open from now on are news.
 */
export function useNewExtra(solvedCount) {
  const [seen, setSeen] = useState(() => {
    const stored = readJson(KEY, null);
    if (stored) return stored;
    const already = openExtras(solvedCount);
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
  return { newExtra: extraToAnnounce(solvedCount, seen), markSeen };
}
