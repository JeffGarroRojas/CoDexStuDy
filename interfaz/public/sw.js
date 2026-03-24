const CACHE_VERSION = 'v2';
const CACHE_NAME = `codexstudy-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
];

const API_CACHE_NAME = `codexstudy-api-${CACHE_VERSION}`;
const API_CACHE_DURATION = 5 * 60 * 1000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('codexstudy-') && name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  if (url.origin === location.origin) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

async function handleApiRequest(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const responseClone = response.clone();
      caches.open(API_CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return response;
  });

  if (cachedResponse) {
    const cachedTime = cachedResponse.headers.get('sw-cache-time');
    if (cachedTime && Date.now() - parseInt(cachedTime) < API_CACHE_DURATION) {
      fetchPromise.catch(() => { });
      return cachedResponse;
    }
  }

  try {
    const response = await fetchPromise;
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cache-time', Date.now().toString());
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return response;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    return caches.match('/');
  }
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'CoDexStuDy';
  const options = {
    body: data.body || 'Es hora de estudiar tus tarjetas.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/study' },
    actions: [
      { action: 'study', title: 'Estudiar ahora' },
      { action: 'dismiss', title: 'Más tarde' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'study') {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
