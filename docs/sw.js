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
    caches.match(event.request).then(res => res || fetch(event.request))
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
