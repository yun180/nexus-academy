const CACHE_NAME = 'nexus-academy-v1';
const urlsToCache = [
  '/',
  '/generator',
  '/quiz',
  '/ai',
  '/classroom',
  '/calendar',
  '/settings'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
