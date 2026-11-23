import { startAutoUpdate } from '../../src/lib/autoUpdate.js';

/**
 * A copy opened from the Home Screen updates itself when it comes back on screen, but never in the middle of a
 * game: it waits until the player is back on the home page.
 */
let isBusy = false;
let reloadIfWaiting = () => {};
if (import.meta.env.PROD) reloadIfWaiting = startAutoUpdate({ isBusy: () => isBusy, reloadedKey: 'marbles.reloadedFor' });

export function setInGame(isInGame) {
  isBusy = isInGame;
  if (!isInGame) reloadIfWaiting();
}
