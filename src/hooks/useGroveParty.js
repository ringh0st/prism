import { useState } from 'react';

const STORAGE_KEY = 'prism.groveParty.v1';

const readCelebrated = () => {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
};

/**
 * A party in the Grove the first time you visit after finishing a world. Returns the number of the world
 * to celebrate (or 0), and remembers it so each world is celebrated once.
 */
export function useGroveParty(worldsFinished) {
  const [world] = useState(() => {
    if (worldsFinished <= readCelebrated()) return 0;
    try {
      localStorage.setItem(STORAGE_KEY, String(worldsFinished));
    } catch {
      // Private mode: the party may show again next time, which is fine.
    }
    return worldsFinished;
  });
  return world;
}
