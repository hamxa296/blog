/**
 * Service Worker for GIKI Chronicles
 * Provides offline functionality and advanced caching
 */

const CACHE_NAME = 'giki-chronicles-v1.1';
const STATIC_CACHE = 'giki-static-v1.1';
const DYNAMIC_CACHE = 'giki-dynamic-v1.1';

// Files to cache immediately (only local files)
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/logo.png',
    '/favicons/favicon.ico',
    '/offline.html'
];

// External resources to cache separately (with error handling)
const EXTERNAL_RESOURCES = [
    'https://cdn.tailwindcss.com',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'
];

// Install event - cache static files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                // Cache local files first
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Caching external resources');
                // Cache external resources with error handling
                return cacheExternalResources();
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.warn('Service Worker: Some resources failed to cache:', error);
                // Continue installation even if some resources fail
                return self.skipWaiting();
            })
    );
});

// Function to cache external resources with error handling
async function cacheExternalResources() {
    const cache = await caches.open(STATIC_CACHE);
    const promises = EXTERNAL_RESOURCES.map(async (url) => {
        try {
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });
            if (response.ok) {
                await cache.put(url, response);
                console.log('Service Worker: Cached external resource:', url);
            }
        } catch (error) {
            console.warn('Service Worker: Failed to cache external resource:', url, error);
            // Don't throw error, just log it
        }
    });
    
    await Promise.allSettled(promises);
}

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Handle different types of requests
    if (url.pathname.startsWith('/api/')) {
        // API requests - network first, cache fallback
        event.respondWith(networkFirst(request));
    } else if (isStaticAsset(request)) {
        // Static assets - cache first, network fallback
        event.respondWith(cacheFirst(request));
    } else {
        // HTML pages - network first, cache fallback
        event.respondWith(networkFirst(request));
    }
});

// Cache first strategy for static assets
async function cacheFirst(request) {
    // Skip unsupported schemes (chrome-extension, etc.)
    if (!request.url.startsWith('http')) {
        return fetch(request);
    }
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        throw error;
    }
}

// Network first strategy for dynamic content
async function networkFirst(request) {
    // Skip unsupported schemes (chrome-extension, etc.)
    if (!request.url.startsWith('http')) {
        return fetch(request);
    }
    
    try {
        const networkResponse = await fetch(request, { cache: 'reload' });
        if (networkResponse.ok) {
            const contentType = networkResponse.headers.get('content-type') || '';
            // Avoid caching HTML documents to prevent stale page duplication
            if (!contentType.includes('text/html') && request.destination !== 'document') {
                const cache = await caches.open(DYNAMIC_CACHE);
                cache.put(request, networkResponse.clone());
            }
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        throw error;
    }
}

// Check if request is for a static asset
function isStaticAsset(request) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
    const url = new URL(request.url);
    return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Sync offline data when connection is restored
    // Implement offline data sync logic here
}

// Push notifications (if needed)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New update available!',
        icon: '/logo.png',
        badge: '/favicons/favicon-16x16.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('GIKI Chronicles', options)
    );
});
