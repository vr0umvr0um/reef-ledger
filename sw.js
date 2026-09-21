// Service worker: makes the app work offline.
// Bump VERSION whenever you change any file, so installed copies refresh.
const VERSION = 'reefledger-v4';
const SHELL = [
  './', 'index.html', 'styles.css', 'data.js', 'tips.js', 'features.js', 'app.js', 'manifest.webmanifest',
  'fonts/bricolage-latin.woff2', 'fonts/figtree-latin.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-64.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for same-origin files: instant from cache, refreshed in the background.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) return cached;
      const res = await network;
      return res || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    })
  );
});
