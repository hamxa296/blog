/**
 * Service Worker for GIKI Chronicles React SPA
 * Provides offline caching for static assets
 */

const CACHE_NAME = 'giki-chronicles-v2.0';
const STATIC_CACHE = 'giki-static-v2.0';

// Files to cache immediately (local assets)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/logo.png',
  '/favicon.svg'
];

// Install event - cache static files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
        console.warn('Service Worker: Some files failed to cache:', error);
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return;
  
  // Skip external resources (except Cloudinary/Firebase if you want, but keep it local-only to avoid CORS issues)
  if (!request.url.startsWith(self.location.origin)) return;
  
  // Network-first for HTML documents to avoid stale UI
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request, { cache: 'no-store' });
        const respClone = fresh.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(request, respClone)).catch(()=>{});
        return fresh;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response('<html><body><h1>Offline</h1><p>Please check your internet connection.</p></body></html>', { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  // Cache-first for assets (js, css, images)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone)).catch(()=>{});
        }
        return response;
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
