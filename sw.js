const CACHE_NAME = 'steganovault-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './crypto-utils.js',
  './password-cracker.js',
  './stego-encoder.js',
  './stego-decoder.js',
  './metadata-extractor.js',
  './visual-analysis.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

// External assets that can be cached on the fly
const EXTERNAL_SCRIPTS = [
  'leaflet',
  'exif-js',
  'crypto-js',
  'chart.js',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for large dictionary file to prevent exceeding cache limits
  if (url.pathname.endsWith('rockyou.txt.gz')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle caching strategy: Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((response) => {
        // Validate response
        if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
          return response;
        }

        // Cache external scripts & fonts dynamically
        const shouldCache = ASSETS_TO_CACHE.some(asset => event.request.url.includes(asset.replace('./', ''))) ||
                            EXTERNAL_SCRIPTS.some(domain => event.request.url.includes(domain));

        if (shouldCache) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch((err) => {
        console.error('[Service Worker] Fetch failed; returning offline fallback if available', err);
        // If it's a page navigation request, return index.html as fallback
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
