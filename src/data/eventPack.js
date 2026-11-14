// Weekend event puzzles: one JSON file per weekend (made by `npm run events`), downloaded when played.
const eventModules = import.meta.glob('./events/*.json');
const cache = new Map();

/** @returns Promise<level[]> (empty if that weekend has no puzzles yet) */
export function loadEventLevels(weekend) {
  if (!cache.has(weekend)) {
    const load = eventModules[`./events/${weekend}.json`];
    cache.set(weekend, load ? load().then((module) => module.default) : Promise.resolve([]));
  }
  return cache.get(weekend);
}
