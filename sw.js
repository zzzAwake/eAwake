const CACHE_NAME = 'ephone-v7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './main.js',
  './style.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  'https://unpkg.com/dexie/dist/dexie.js'
];

// Install Event
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${CACHE_NAME} Service Worker...`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${CACHE_NAME} Service Worker...`);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
          return null;
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 非 GET 请求直接放行（POST API 调用等）
  if (event.request.method !== 'GET') return;

  // 非同源第三方请求直接放行
  if (url.origin !== self.location.origin && !ASSETS_TO_CACHE.includes(event.request.url)) {
    return;
  }

  // 1. 导航请求 → Network First, 回退到缓存, 再回退到离线页
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('./index.html'))
        .then(response => response || new Response(
          '<html><body><h1>EPhone 离线</h1><p>请连接网络后重试。</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        ))
    );
    return;
  }

  // 2. 检查是否为已知资源
  const isKnownAsset = ASSETS_TO_CACHE.some(asset => {
    if (asset.startsWith('http')) {
      return event.request.url === asset;
    }
    const assetPath = asset.replace(/^\.\//, '/');
    return url.pathname === assetPath || url.pathname.endsWith(assetPath);
  });

  // 3. 已知资源 → Cache First
  if (isKnownAsset) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          console.log(`[SW] Saving new fetch response into ${CACHE_NAME} cache`);
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      }).catch(() => new Response('Resource unavailable offline', { status: 503 }))
    );
    return;
  }

  // 4. 其他同源 GET 请求 → Network First
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
      .then(response => response || new Response('', { status: 504 }))
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/index.html';
  const chatId = event.notification.data?.chatId;

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of windowClients) {
        if (client.url.includes('index.html') && 'focus' in client) {
          if (chatId) client.postMessage({ type: 'OPEN_CHAT', chatId: chatId });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })(),
  );
});
