/* ================================================================
   Bacaan — service worker
   Strategy: cache-first for the app shell (it's a static, self-
   contained file, so this is both fastest and fully offline).
   Anything cross-origin (Open Library covers, AI API calls) is
   never cached and never intercepted — those must hit the network
   and are allowed to fail gracefully inside the app.
   Bump CACHE_VERSION to ship an update.
   ================================================================ */

const CACHE_VERSION = 'bacaan-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png'
];

// Install: pre-cache the shell so the very first offline launch works.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(SHELL))
      // If one optional asset 404s we still want the SW to install.
      .catch(err => console.warn('[sw] precache partial:', err))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop caches from older versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET. POST (AI API calls) must always go to network.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cross-origin (openlibrary.org covers, api.anthropic.com, etc.):
  // let the browser handle it normally. Don't cache third-party data.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // Refresh in the background so the next launch gets updates,
        // without making the user wait now.
        fetch(req).then(res => {
          if (res && res.ok) {
            caches.open(CACHE_VERSION).then(c => c.put(req, res.clone()));
          }
        }).catch(() => { /* offline — cached copy is correct */ });
        return cached;
      }

      return fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline and uncached: for navigations, fall back to the shell
        // so the app still opens instead of showing a browser error.
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
