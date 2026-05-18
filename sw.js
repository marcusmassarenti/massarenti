// Service Worker: SEMPRE rede primeiro, cache só como fallback offline
const CACHE_NAME = 'caua-album-v73';

self.addEventListener('install', () => {
  self.skipWaiting(); // Ativa imediatamente
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
          console.log('SW: removendo cache antigo', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim()).then(() => {
      // Avisa todos os clientes pra recarregar
      return self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: CACHE_NAME }));
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Só intercepta GET do MESMO origin (não mexe em Supabase, Google Fonts, etc)
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // SEMPRE rede primeiro pra HTML/JS/CSS
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((response) => {
        // Guarda no cache pra fallback offline
        if (response && response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned).catch(() => {}));
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
