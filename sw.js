<<<<<<< HEAD
const CACHE_NAME = 'ephone-v2';
=======
const CACHE_NAME = 'ephone-v1';
>>>>>>> c11d83084f9d182e483f4cf62b832c5dcbfc8866
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
<<<<<<< HEAD
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  'https://unpkg.com/dexie/dist/dexie.js'
];

// Install Event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2...');
=======
  'https://unpkg.com/dexie/dist/dexie.js'
];

// Install Event: Cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
>>>>>>> c11d83084f9d182e483f4cf62b832c5dcbfc8866
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
<<<<<<< HEAD
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2...');
=======
  self.skipWaiting(); // Activate worker immediately
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
>>>>>>> c11d83084f9d182e483f4cf62b832c5dcbfc8866
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache', key);
            return caches.delete(key);
          }
<<<<<<< HEAD
          return null;
=======
>>>>>>> c11d83084f9d182e483f4cf62b832c5dcbfc8866
        })
      );
    })
  );
<<<<<<< HEAD
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
=======
  self.clients.claim(); // Claim control of all clients immediately
});

// Fetch Event: Network First, falling back to Cache (or Cache First for assets)
self.addEventListener('fetch', (event) => {
  // Use Cache First for static assets we know
  if (ASSETS_TO_CACHE.includes(event.request.url) || event.request.url.endsWith('dexie.js')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
>>>>>>> c11d83084f9d182e483f4cf62b832c5dcbfc8866
      })
    );
    return;
  }
<<<<<<< HEAD
  
  // 4. 其他请求 → Network First
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
=======

  // Network First for everything else (to ensure fresh data/API calls), fallback to cache if offline
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
>>>>>>> c11d83084f9d182e483f4cf62b832c5dcbfc8866
