// Offline support: serve from network when possible, fall back to the cache.
// Supabase requests are never cached.
const CACHE = 'prism-v2';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html', './manifest.webmanifest'])));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Pages and version checks always skip the browser cache, so a new release shows up straight away.
  const isFresh = event.request.mode === 'navigate' || url.pathname.endsWith('/version.json');
  event.respondWith(
    fetch(event.request, isFresh ? { cache: 'no-store' } : undefined)
      .then((response) => {
        if (url.pathname.endsWith('/version.json')) return response;
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html'))),
  );
});
