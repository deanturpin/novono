const CACHE_NAME = 'novono-v2';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

// Activate event - clear old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => clients.claim())
    );
});

// Fetch event - handle share target and serve from cache when offline
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Handle share target POST requests
    if (event.request.method === 'POST' && url.pathname.endsWith('/')) {
        event.respondWith(
            (async () => {
                const formData = await event.request.formData();
                const audioFile = formData.get('audio');

                if (audioFile) {
                    // Store the file temporarily and redirect to main page
                    const cache = await caches.open(CACHE_NAME);
                    const response = new Response(audioFile, {
                        headers: { 'Content-Type': audioFile.type }
                    });
                    await cache.put('shared-audio', response);

                    // Redirect to main page with a flag
                    return Response.redirect(url.origin + url.pathname + '?shared=true', 303);
                }

                // If no file, just redirect to main page
                return Response.redirect(url.origin + url.pathname, 303);
            })()
        );
        return;
    }

    // Let the browser handle all other requests normally
    return;
});
