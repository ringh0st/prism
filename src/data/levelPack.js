// Built-in levels live in one JSON file per world and are downloaded only when needed,
// so 1000+ levels don't slow down the first load.
const worldModules = import.meta.glob('./worlds/world-*.json');
const cache = new Map();

const fileFor = (worldId) => `./worlds/world-${String(worldId).padStart(3, '0')}.json`;

/** @returns Promise<level[]> (empty if the world has no built-in file) */
export function loadBuiltInWorld(worldId) {
  if (!cache.has(worldId)) {
    const load = worldModules[fileFor(worldId)];
    cache.set(worldId, load ? load().then((module) => module.default) : Promise.resolve([]));
  }
  return cache.get(worldId);
}

/** Every built-in level (used by the admin "Import built-in" action). */
export async function loadAllBuiltInLevels() {
  const worlds = await Promise.all(
    Object.keys(worldModules)
      .sort()
      .map((path) => worldModules[path]().then((module) => module.default)),
  );
  return worlds.flat();
}
