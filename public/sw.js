// Veyqua service worker: makes the app shell work offline.
// User data lives in localStorage and is never touched here.
const CACHE = 'veyqua-v1';
const BASE_PATH = new URL(self.registration.scope).pathname;
const SHELL = BASE_PATH;
const EXTRAS = [
  `${BASE_PATH}manifest.webmanifest`,
  `${BASE_PATH}favicon.ico`,
  `${BASE_PATH}icons/icon-96.png`,
  `${BASE_PATH}icons/icon-192.png`,
];

const assetPaths = (html) =>
  [...html.matchAll(/(?:src|href)="([^"]+\/assets\/[^"]+)"/g)].map((match) => new URL(match[1], self.location.origin).pathname);

/** Stores a fresh index.html and keeps exactly the hashed assets it references. */
async function storeShell(response) {
  const cache = await caches.open(CACHE);
  const html = await response.clone().text();
  await cache.put(SHELL, response);
  const wanted = new Set(assetPaths(html));
  const cached = await cache.keys();
  const have = new Set();
  await Promise.all(
    cached.map((request) => {
      const path = new URL(request.url).pathname;
      if (!path.startsWith(`${BASE_PATH}assets/`)) return undefined;
      if (wanted.has(path)) return have.add(path);
      return cache.delete(request);
    }),
  );
  // Hashed assets are immutable, so these requests are usually answered by the HTTP cache.
  await Promise.all([...wanted].filter((path) => !have.has(path)).map((path) => cache.add(path).catch(() => {})));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch(SHELL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Could not fetch the app shell (${response.status})`);
      await storeShell(response);
      const cache = await caches.open(CACHE);
      await cache.addAll(EXTRAS).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith('veyqua-') && name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first so deploys show up immediately, cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok && (response.headers.get('content-type') || '').includes('text/html')) {
            event.waitUntil(storeShell(response.clone()));
          }
          return response;
        } catch {
          return (await caches.match(SHELL)) || Response.error();
        }
      })(),
    );
    return;
  }

  // Hashed build output never changes: cache first.
  if (url.pathname.startsWith(`${BASE_PATH}assets/`)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
        }
        return response;
      })(),
    );
    return;
  }

  // Everything else (icons, manifest): network first, cached copy when offline.
  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        return (await caches.match(request)) || Response.error();
      }
    })(),
  );
});
