import { useState } from 'react';
import { readJson, writeJson } from '../lib/storage.js';

/**
 * A "How it works" guide that opens by itself the first time (unless `canOpenNow` is false, then it waits for a
 * later visit) and on demand after that. Seen is remembered on this device under `storageKey`.
 * @returns { isOpen, open, close }
 */
export function useFirstTimeGuide(storageKey, canOpenNow = true) {
  const [isOpen, setIsOpen] = useState(() => canOpenNow && !readJson(storageKey, false));
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => {
      writeJson(storageKey, true);
      setIsOpen(false);
    },
  };
}
