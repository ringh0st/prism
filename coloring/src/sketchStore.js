/**
 * Free drawings are kept in the browser's IndexedDB (they're bigger than settings). Never throws: in a private
 * window or with storage blocked, drawing still works for the visit.
 */
const DB = 'coloring';
const STORE = 'sketches';

let opening = null;
function database() {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return opening;
}

async function run(mode, work) {
  try {
    const db = await database();
    return await new Promise((resolve, reject) => {
      const request = work(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export const loadSketches = async () => (await run('readonly', (store) => store.getAll())) ?? [];
export const saveSketch = (sketch) => run('readwrite', (store) => store.put(sketch));
export const deleteSketch = (id) => run('readwrite', (store) => store.delete(id));
