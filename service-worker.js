/* service-worker.js */
const CACHE = 'aus-trip-v2';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/responsive.css',
  './js/storage.js',
  './js/trip.js',
  './js/luggage.js',
  './js/expense.js',
  './js/ui.js',
  './js/app.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network-first for API (weather), cache-first for assets
  if (e.request.url.includes('open-meteo.com') || e.request.url.includes('unsplash.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
