const CACHE_PREFIX = "kiris-jobs-";
const CACHE_VERSION = "kiris-jobs-v205-smart-filters-and-success-2026-09-10-1";
const CORE_SHELL = [
  "./",
  "./index.html",
  "./privacy.html",
  "./manifest.webmanifest",
  "./data/content.js?v=205",
  "./data/locales/ru.js?v=205",
  "./data/locales/en.js?v=205",
  "./assets/candidate-base.css?v=205",
  "./assets/clean.css?v=205",
  "./assets/homepage.css?v=205",
  "./assets/privacy.css?v=205",
  "./assets/i18n.js?v=205",
  "./assets/application-form.js?v=205",
  "./assets/candidate.js?v=205",
  "./assets/privacy.js?v=205",
  "./assets/icons.svg",
  "./assets/mobility-map.svg?v=10",
  "./assets/oleksandr-kiris-greenhouse.jpg",
  "./assets/oleksandr-kiris-citronex-logo.png",
  "./assets/fonts/manrope-latin.woff2",
  "./assets/fonts/manrope-latin-ext.woff2",
  "./assets/fonts/manrope-cyrillic.woff2",
  "./assets/fonts/manrope-cyrillic-ext.woff2",
  "./assets/fonts/noto-sans-georgian-variable.woff2",
  "./assets/fonts/noto-sans-armenian-variable.woff2",
  "./assets/fonts/noto-sans-devanagari-variable.woff2",
  "./assets/fonts/OFL-1.1.txt",
  "./assets/fonts/FONT-LICENSES.md",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/share-card.svg",
  "./assets/share-card.png?v=200"
];
const OPTIONAL_LOCALES = [
  "./data/locales/uk.js?v=205",
  "./data/locales/pl.js?v=205",
  "./data/locales/az.js?v=205",
  "./data/locales/ka.js?v=205",
  "./data/locales/id.js?v=205",
  "./data/locales/es.js?v=205",
  "./data/locales/fil.js?v=205",
  "./data/locales/ne.js?v=205",
  "./data/locales/hy.js?v=205"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await cache.addAll([...CORE_SHELL, ...OPTIONAL_LOCALES]);
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  const isRecruitmentPage = requestUrl.pathname.includes("/kiris-jobs/apply/");
  if (isRecruitmentPage) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(async () => (
          await caches.match(event.request)
          || await caches.match("./index.html")
          || Response.error()
        ))
    );
    return;
  }

  const networkUpdate = fetch(event.request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(event.request, response.clone());
      }
      return response;
    });

  event.waitUntil(networkUpdate.then(() => undefined).catch(() => undefined));
  event.respondWith(
    caches.match(event.request).then((cached) => cached || networkUpdate.catch(() => cached))
  );
});
