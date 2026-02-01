const CACHE_NAME = 'ephone-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  'https://unpkg.com/dexie/dist/dexie.js'
];

// Install Event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2...');
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

// Fetch Event - 修复版
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. 导航请求 → Network First, 回退到缓存的 index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('./index.html'))
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
          // 缓存新获取的资源
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
    return;
  }
  
  // 4. 其他请求 → Network First
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
