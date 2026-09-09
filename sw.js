// Service Worker for Material 3 Student Homework Hub
const CACHE_NAME = 'homework-hub-v1.0.3';

const PRECACHE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './favicon.svg',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// Install: Cache critical static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('SW Precache error:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip Firebase Firestore API and non-GET requests
    if (request.method !== 'GET' || url.hostname.includes('firestore') || url.hostname.includes('googleapis') && url.pathname.includes('v1')) {
        return;
    }

    // HTML Navigation: Network-first, fallback to cached index.html
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => {
                return caches.match('./index.html').then((res) => {
                    return res || caches.match('./');
                });
            })
        );
        return;
    }

    // Static Assets & Fonts: Stale-While-Revalidate
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});