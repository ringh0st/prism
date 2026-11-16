import { bonusGoalFor } from '../game/bonusGoals.js';

/** Goals already worked out, by level (the same level object comes back when it's played again). */
const found = new WeakMap();

/**
 * A level's bonus goal, worked out in a Web Worker: the search plays many orders of taps and can take a moment on
 * big boards with the darkness, so the level card and the board never wait for it. Falls back to working it out
 * here when workers aren't available (or the worker can't load, offline before it was ever fetched).
 * @returns { promise: Promise<goal | null>, cancel }
 */
export function findBonusGoal(level) {
  if (found.has(level)) return { promise: Promise.resolve(found.get(level)), cancel: () => {} };
  const remember = (goal) => {
    found.set(level, goal);
    return goal;
  };
  if (typeof Worker === 'undefined') {
    return { promise: Promise.resolve().then(() => remember(bonusGoalFor(level))), cancel: () => {} };
  }
  const worker = new Worker(new URL('./bonusGoalWorker.js', import.meta.url), { type: 'module' });
  const promise = new Promise((resolve) => {
    worker.onmessage = ({ data }) => {
      worker.terminate();
      resolve(remember(data));
    };
    worker.onerror = (event) => {
      event.preventDefault();
      worker.terminate();
      resolve(remember(bonusGoalFor(level)));
    };
  });
  worker.postMessage(level);
  return { promise, cancel: () => worker.terminate() };
}
