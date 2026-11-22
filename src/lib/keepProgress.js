/**
 * Ask the browser to keep this site's saved data. A guest's progress lives only on the device, and browsers may
 * clear a site's storage when space runs low or (Safari) after a week without a visit. A granted request marks the
 * storage as "persistent", so it is only removed by the player. Browsers decide by themselves (Chrome grants it to
 * installed or often-used sites, Firefox asks, Safari decides from use), so this is a best effort, never a promise.
 */
export function keepProgress() {
  const storage = globalThis.navigator?.storage;
  if (!storage?.persist) return;
  storage
    .persisted()
    .then((isKept) => isKept || storage.persist())
    .catch(() => {});
}
