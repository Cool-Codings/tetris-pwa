/**
 * TETRIS PWA - Service Worker
 * Ermöglicht Offline-Funktionalität
 */

const CACHE_NAME = 'tetris-pwa-v10';

// Dateien zum Cachen
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/auth.js',
    './js/sounds.js',
    './js/particles.js',
    './js/game.js',
    './js/controls.js',
    './js/app.js',
    './icons/icon-72.png',
    './icons/icon-96.png',
    './icons/icon-128.png',
    './icons/icon-144.png',
    './icons/icon-152.png',
    './icons/icon-192.png',
    './icons/icon-384.png',
    './icons/icon-512.png'
];

// Installation - Cache alle Assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                // Sofort aktivieren
                return self.skipWaiting();
            })
    );
});

// Aktivierung - Alte Caches löschen
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Aktivierung');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Lösche alten Cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Sofort für alle Clients übernehmen
            return self.clients.claim();
        })
    );
});

// Fetch - Cache-First Strategie
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Aus Cache zurückgeben wenn vorhanden
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Sonst aus Netzwerk laden
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Nur erfolgreiche Responses cachen
                        if (!networkResponse || networkResponse.status !== 200) {
                            return networkResponse;
                        }

                        // Response klonen (kann nur einmal gelesen werden)
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Offline-Fallback für HTML-Seiten
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Background Sync (für zukünftige Features)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background Sync:', event.tag);
});

// Push-Benachrichtigungen (für zukünftige Features)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push erhalten:', event);
});
