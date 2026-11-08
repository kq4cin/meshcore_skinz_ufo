const CACHE = 'meshcore-client-ufo-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('meshcore-client-') && k !== CACHE && k !== TILE_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const TILE_CACHE = 'meshcore-tiles-v1';
const TILE_HOST = 'tile.openstreetmap.org';

// Map tiles: cache-first so places you've already viewed still render off-grid.
function tileResponse(event) {
  return caches.open(TILE_CACHE).then(async (cache) => {
    const hit = await cache.match(event.request);
    if (hit) return hit;
    const response = await fetch(event.request);
    if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
    return response;
  });
}

// Network-first so updates land quickly; fall back to cache when off-grid.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method === 'GET' && new URL(request.url).hostname === TILE_HOST) return event.respondWith(tileResponse(event));
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }
        return Response.error();
      }),
  );
});
