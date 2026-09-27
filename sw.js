// FitCoach 5K — service worker
// Build: 2026.09.26-1
//
// WHY THIS FILE LOOKS LIKE THIS
// A cache-first service worker is the standard PWA recipe and it is the wrong recipe for a
// single-file app that gets redeployed often: index.html is served from cache, so a new deploy
// is invisible until the service worker itself changes. The app pins itself to a stale build
// and no amount of pull-to-refresh fixes it.
//
// Strategy here:
//   • Navigations / HTML  → NETWORK FIRST, cache as offline fallback.
//     Online you always get the build that is actually on the server. Offline you get the last
//     one that worked.
//   • Everything else     → cache first, refreshed in the background (stale-while-revalidate).
//   • CACHE_VERSION bump  → every old cache is deleted on activate.
//
// After editing this file, bump CACHE_VERSION. That byte change is what tells the browser a new
// worker exists.

const CACHE_VERSION = 'fitcoach-v2026.09.26-1';
const SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(SHELL))
      // A missing optional file must not abort the install and leave the app uncached.
      .catch((err) => console.warn('[sw] shell precache incomplete:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
    // Take over open tabs immediately rather than waiting for every one to close.
    await self.clients.claim();
  })());
});

// The page asks for this when it detects a waiting worker, so an update does not sit idle
// until the user closes every tab.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const isHTMLRequest = (request) =>
  request.mode === 'navigate' ||
  (request.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET is cacheable, and cross-origin requests (weather API, fonts) pass straight through.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (isHTMLRequest(request)) {
    // NETWORK FIRST — this is the line that prevents a stale build.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        const cache = await caches.open(CACHE_VERSION);
        cache.put(request, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        const shell = await caches.match('./index.html');
        if (shell) return shell;
        throw err;
      }
    })());
    return;
  }

  // Static assets: serve from cache for speed, refresh in the background for next time.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request);
    const network = fetch(request)
      .then((response) => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
