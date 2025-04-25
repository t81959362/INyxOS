self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

const CACHE_NAME = 'nyx-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/registry.json',
  // TODO: add other static assets here
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
<<<<<<< HEAD
    caches.match(event.request).then(res => res || fetch(event.request))
=======
    caches.match(event.request).then(res => {
      // If found in cache, return it
      if (res) return res;
      // If not found and it's a navigation request, fallback to index.html
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
      // Otherwise, try network
      return fetch(event.request);
    })
>>>>>>> 714e7c6c643fdd875b1686c8d85307fce5b9dd29
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'retry-queue') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'sync' });
        });
      })
    );
  }
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data.json(); } catch {}
  const title = data.title || 'Notification';
  const body = data.body || '';
  event.waitUntil(
    self.registration.showNotification(title, { body })
  );
});
