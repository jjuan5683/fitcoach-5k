// FitCoach Táctico — service worker
// Build: 2026.11.08-6 (pairs with index.html APP_BUILD 2026.11.08-6)
//
// WHY THIS FILE LOOKS LIKE THIS
// A cache-first service worker is the standard PWA recipe and it is the wrong recipe for a
// single-file app that gets redeployed often: index.html is served from cache, so a new deploy
// is invisible until the service worker itself changes.
//
// Strategy:
//   • Navigations / HTML  → NETWORK FIRST, cache as offline fallback.
//   • Everything else     → cache first, refreshed in the background (stale-while-revalidate).
//   • CACHE_VERSION bump  → every old cache is deleted on activate.
//
// 2026.11.08-6:
//   • HTML is stored under ONE key ('./index.html'). The header ↻ button reloads with
//     '?fresh=<timestamp>'; before, every press saved another copy of the 1.2 MB page.
//   • Only OK (200) responses are cached, so a failed deploy (404/500) never replaces the
//     last good offline copy.
//   • manifest.json is precached for offline install.
//
// After editing this file, bump CACHE_VERSION. That byte change is what tells the browser a new
// worker exists.

const CACHE_VERSION = 'fitcoach-v2026.11.08-6';
const SHELL = ['./', './index.html', './manifest.json'];
const HTML_KEY = './index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // One at a time: a missing optional file must not abort the whole precache.
      .then((cache) => Promise.all(SHELL.map((u) => cache.add(u).catch((err) => console.warn('[sw] precache skipped:', u, err)))))
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

// The page asks for this when it detects a waiting worker.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const isHTMLRequest = (request) =>
  request.mode === 'navigate' ||
  (request.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET is cacheable; cross-origin requests (weather API, fonts) pass straight through.
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (isHTMLRequest(request)) {
    // NETWORK FIRST — this is the line that prevents a stale build.
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put(HTML_KEY, fresh.clone());
        }
        return fresh;
      } catch (err) {
        const cache = await caches.open(CACHE_VERSION);
        const cached = (await cache.match(HTML_KEY)) || (await cache.match(request, { ignoreSearch: true })) || (await cache.match('./'));
        if (cached) return cached;
        throw err;
      }
    })());
    return;
  }

  // Static assets: serve from cache for speed, refresh in the background for next time.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request, { ignoreSearch: true });
    const network = fetch(request)
      .then((response) => {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(() => null);
    if (cached) { event.waitUntil(network); return cached; }
    return (await network) || Response.error();
  })());
});
