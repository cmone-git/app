const CACHE_NAME = 'cm-taxapp-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/logo-app.png',
  './assets/logo.png',
  './assets/name.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch new
        return response || fetch(event.request);
      })
  );
});
