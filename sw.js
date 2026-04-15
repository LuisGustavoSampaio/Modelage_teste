const CACHE_NAME = "modelage-cache-v4";
const ARQUIVOS_ESSENCIAIS = [
  "./",
  "/",
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

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isNavigation = event.request.mode === "navigate";

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    (async function() {
      if (isNavigation) {
        try {
          const response = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        } catch (error) {
          const cachedNavigation =
            await caches.match("index.html") ||
            await caches.match(event.request, { ignoreSearch: true }) ||
            await caches.match(requestUrl.pathname, { ignoreSearch: true }) ||
            await caches.match("/") ||
            await caches.match("./");

          if (cachedNavigation) {
            return cachedNavigation;
          }

          return caches.match("offline.html");
        }
      }

      const cachedResponse = await caches.match(event.request, { ignoreSearch: true });

      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
        return response;
      } catch (error) {
        return new Response("Recurso indisponível offline.", {
          status: 503,
          statusText: "Offline"
        });
      }
    })()
  );
});
