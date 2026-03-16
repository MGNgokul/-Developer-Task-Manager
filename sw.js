const SW_VERSION = "devtask-sw-v1";
const CACHE_NAME = `${SW_VERSION}-cache`;

const BASE_PATH = (() => {
  const pathname = self.location.pathname || "/";
  return pathname.endsWith("/sw.js")
    ? pathname.slice(0, pathname.length - "/sw.js".length)
    : "/";
})();

const APP_SHELL = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.webmanifest`,
  `${BASE_PATH}/favicon.svg`,
  `${BASE_PATH}/favicon.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cachedPage =
            (await caches.match(`${BASE_PATH}/index.html`)) ||
            (await caches.match(`${BASE_PATH}/`));
          return cachedPage || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  if (url.pathname.includes("/assets/") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
