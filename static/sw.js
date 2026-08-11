const CACHE_NAME = 'homebudget-v1';
const ASSETS = [
  '/',
  '/static/styles.css',
  '/static/app.js',
  '/static/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // We do not cache report downloads or POST/PUT/DELETE requests
  if (e.request.method !== 'GET' || e.request.url.includes('/api/reports/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Network-First with Cache Fallback strategy
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // If valid response, clone and update cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(e.request);
      })
  );
});
