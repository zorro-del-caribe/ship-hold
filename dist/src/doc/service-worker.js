const CACHE = 'ship-hold-documentation';

// On install, cache some resources.
self.addEventListener('install', function (evt) {
    console.log('The service worker is being installed.');
    evt.waitUntil(precache());
});

self.addEventListener('fetch', async function (evt) {
    console.log('The service worker is serving the asset.');
    let response = (await fromCache(evt.request));
    if (!response) {
        response = await fetch(evt.request);
    }
    evt.respondWith(response);
});

async function precache() {
    const cache = await caches.open(CACHE);
    return cache.addAll([
        './resources/app.js',
        './resources/darkula.css',
        './resources/ship-hold-logo.svg',
        './resources/theme.css'
    ]);
}

async function fromCache(request) {
    const cache = await caches.open(CACHE);
    return await cache.match(request);
}

async function eventuallyUpdate(request) {
    const cache = await caches.open(CACHE);
    const response = await fetch(request);
    await cache.put(request, response);
    return response;
}
