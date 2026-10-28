const CACHE_NAME = 'pwa-note-v4';
const ASSETS = ['./index.html', './manifest.json', './icon.png', './icon-512.png', './app.js', './function.wasm'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('pwa-note-') && key !== CACHE_NAME)
      .map((key) => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE_NAME).then(async (cache) => {
    const url = new URL(event.request.url);
    const cached = await cache.match(url.pathname === new URL('./', self.location).pathname ? './index.html' : event.request);
    return cached || fetch(event.request);
  }));
});
