const CACHE_NAME = 'novono-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim());
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    // Let the browser handle all requests normally
    // We're not implementing offline caching for now as the app needs internet
    // for the initial model download anyway
    return;
});
