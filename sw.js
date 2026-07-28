const CACHE = 'fitcoach5k-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (e) => {
  const url = e.request.url;
  // Never cache the weather/geo APIs — always go to network.
  if (url.includes('open-meteo.com') || url.includes('nominatim')) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);
      const network = fetch(e.request).then((resp) => {
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          cache.put(e.request, resp.clone());
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
