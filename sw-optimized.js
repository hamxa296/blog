/**
 * Optimized Service Worker for GIKI Chronicles
 * Enhanced caching strategies and offline support
 */

const CACHE_NAME = 'giki-chronicles-v2';
const STATIC_CACHE = 'giki-static-v2';
const DYNAMIC_CACHE = 'giki-dynamic-v2';
const IMAGE_CACHE = 'giki-images-v2';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/index-optimized.html',
  '/logo.png',
  '/background.jpeg',
  '/styles.css',
  '/performance-optimizer.js',
  '/app.js'
];

// Static resources that don't change often
const STATIC_RESOURCES = [
  '/about.html',
  '/contact.html',
  '/posts.html',
  '/gallery.html',
  '/calendar.html',
  '/guide.html',
  '/login.html',
  '/signup.html',
  '/write.html',
  '/profile.html',
  '/admin.html',
  '/favicon.ico',
  '/site.webmanifest'
];

// JavaScript files
const JS_RESOURCES = [
  '/performance-monitor.js',
  '/image-optimizer.js',
  '/theme-manager.js',
  '/tour-manager.js',
  '/comments.js',
  '/posts.js',
  '/gallery.js',
  '/calendar.js',
  '/auth.js',
  '/security.js',
  '/accessibility.js'
];

// CSS files
const CSS_RESOURCES = [
  '/calendar_styles.css'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources immediately
      caches.open(CACHE_NAME).then(cache => {
        console.log('Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Cache static resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      }),
      
      // Cache JavaScript files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching JavaScript resources');
        return cache.addAll(JS_RESOURCES);
      }),
      
      // Cache CSS files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching CSS resources');
        return cache.addAll(CSS_RESOURCES);
      })
    ]).then(() => {
      console.log('Service Worker installed successfully');
      return self.skipWaiting();
    }).catch(error => {
      console.error('Service Worker installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests with optimized strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(handleStaticRequest(request));
  } else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(handlePageRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle image requests with optimized caching
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached image immediately
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the image for future use
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try to return a placeholder or fallback
    console.log('Image fetch failed, returning placeholder:', error);
    return new Response('', { status: 404 });
  }
}

// Handle static resource requests
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached resource immediately
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the resource for future use
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Static resource fetch failed:', error);
    return new Response('', { status: 404 });
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first for pages
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the page for offline use
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    console.log('Page fetch failed, trying cache:', error);
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached version, return offline page
    return caches.match('/offline.html') || new Response('Offline - Please check your connection', { status: 503 });
  }
}

// Handle dynamic requests with stale-while-revalidate
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Start network request
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Network failed, ignore
    return null;
  });
  
  if (cachedResponse) {
    // Return cached response immediately, then update cache
    networkPromise.then(networkResponse => {
      if (networkResponse) {
        console.log('Updated cache for:', request.url);
      }
    });
    return cachedResponse;
  }
  
  // No cache, wait for network
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // Both cache and network failed
  return new Response('Resource not available', { status: 404 });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any pending offline actions
  // This could include saving drafts, syncing comments, etc.
  console.log('Processing background sync...');
}

// Push notification handling
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View Post',
          icon: '/logo.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/logo.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the post
    event.waitUntil(
      clients.openWindow('/posts.html')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    // Return cache information to main thread
    event.ports[0].postMessage({
      type: 'CACHE_INFO',
      caches: [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE]
    });
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker unhandled rejection:', event.reason);
});
