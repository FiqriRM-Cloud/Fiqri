const CACHE_NAME = 'warkas-cache-v1';
const ASSETS = [
  './',
  './kasir.html',
  './style.css',
  './kasir.js',
  './icons/Warkas.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching assets');
        return cache.addAll(ASSETS);
      })
  );
});
