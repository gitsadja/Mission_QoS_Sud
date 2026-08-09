const CACHE_NAME = 'terrain-notes-v1';
const APP_SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Les tuiles de carte (OSM/Esri) et toute ressource externe passent toujours par le réseau.
  if(url.origin !== location.origin){ return; }
  if(e.request.method !== 'GET'){ return; }

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        if(resp && resp.ok){
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy)).catch(()=>{});
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
