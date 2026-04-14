const CACHE_NAME = "modelage-cache-v3";
const ARQUIVOS_ESSENCIAIS = [
  "./",
  "index.html",
  "home.html",
  "formulario.html",
  "offline.html",
  "style.css",
  "config.js",
  "script.js",
  "manifest.json",
  "sw.js",
  "icons/icon-192.svg",
  "icons/icon-512.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ARQUIVOS_ESSENCIAIS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }

          return Promise.resolve();
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const respostaClonada = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, respostaClonada);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }

          if (event.request.mode === "navigate") {
            return caches.match("offline.html");
          }

          return new Response("Recurso indisponível offline.", {
            status: 503,
            statusText: "Offline"
          });
        });
      })
  );
});
