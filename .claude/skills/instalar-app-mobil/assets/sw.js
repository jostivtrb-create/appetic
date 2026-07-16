/* Service Worker — auto-actualizable y seguro para apps con Firebase Auth.

   La app se ACTUALIZA SOLA al recargar o al cerrar y abrir, SIN reinstalar:
   - Navegación = NETWORK-FIRST → al recargar/reabrir trae el HTML fresco
     (y con él los assets nuevos, que llevan hash en el nombre).
   - Assets = stale-while-revalidate → rápidos desde caché y se refrescan solos.
   - Caché VERSIONADA → al activar una versión, borra las viejas.
   - SIN self.skipWaiting() y SIN clients.claim(): nunca secuestra una sesión
     abierta → NO causa el bucle de login de Firebase en iOS. La versión nueva
     del SW queda lista y entra al cerrar/reabrir la app.
   - No toca peticiones de otros orígenes (Firebase/Google): van directo a la red.

   Combínalo SIEMPRE con el registro que hace reg.update() al cargar y al
   volver la app a primer plano (ver Paso 6 del SKILL). */

const VERSION = 'v1';
const CACHE = `app-pwa-${VERSION}`;
const PRECACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  // NO self.skipWaiting()  ← a propósito (no romper sesiones de login)
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  // NO clients.claim()  ← a propósito
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // otros orígenes → directo a la red

  // HTML / navegación: red primero (fresco), respaldo a caché si está offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('/index.html')))
    );
    return;
  }

  // Assets propios (js/css/img/fuentes): stale-while-revalidate.
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

// Opcional: la página puede pedir activar la versión nueva de inmediato.
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
