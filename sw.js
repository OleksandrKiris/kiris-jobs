const CACHE_PREFIX = "kiris-jobs-";
const CACHE_VERSION = "kiris-jobs-v220-coordinator-2026-10-17-1";
const CORE_SHELL = [
  "./",
  "./index.html",
  "./privacy.html",
  "./manifest.webmanifest",
  "./data/content.js?v=220",
  "./data/locales/pl.js?v=220",
  "./assets/bootstrap.js?v=220&shortcuts=1&coordinator=1",
  "./assets/privacy-bootstrap.js?v=220",
  "./assets/candidate-base.css?v=220",
  "./assets/clean.css?v=220",
  "./assets/homepage.css?v=220",
  "./assets/privacy.css?v=220",
  "./assets/i18n.js?v=220",
  "./assets/application-form.js?v=220",
  "./assets/application-loader.js?v=220",
  "./assets/vacancy-overrides.js?v=220",
  "./assets/candidate.js?v=220&shortcuts=1&coordinator=1",
  "./assets/privacy.js?v=220",
  "./assets/icons.svg",
  "./assets/mobility-map.svg?v=10",
  "./assets/oleksandr-kiris-greenhouse-96.webp",
  "./assets/oleksandr-kiris-greenhouse-192.webp",
  "./assets/primserv-avatar.jpg",
  "./assets/primserv-logo.svg",
  "./assets/fonts/manrope-latin.woff2",
  "./assets/fonts/manrope-latin-ext.woff2",
  "./assets/fonts/manrope-cyrillic.woff2",
  "./assets/fonts/manrope-cyrillic-ext.woff2",
  "./assets/fonts/noto-sans-georgian-variable.woff2",
  "./assets/fonts/noto-sans-armenian-variable.woff2",
  "./assets/fonts/noto-sans-devanagari-variable.woff2",
  "./assets/fonts/OFL-1.1.txt",
  "./assets/fonts/FONT-LICENSES.md",
  "./assets/icon-192.png?v=220",
  "./assets/icon-512.png?v=220",
  "./assets/share-card.svg",
  "./assets/share-card.png?v=220"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await cache.addAll(CORE_SHELL);
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

const TOOL_ROOT = new URL('./tools/coordinator/', self.location.href);
const TOOL_FILES = ['index.html', 'model.js', 'app.js', 'style.css', 'primserv-logo.svg'];
const toolUrls = TOOL_FILES.map(name => new URL(name, TOOL_ROOT).href);
async function cachedToolPack() {
  try {
    const cache = await caches.open(CACHE_VERSION);
    const responses = await Promise.all(toolUrls.map(url => cache.match(url)));
    return responses.every(Boolean) ? { responses, stored: true } : null;
  } catch { return null; }
}
async function loadToolPack(refresh = false) {
  const cached = await cachedToolPack();
  if (cached && !refresh) return cached;
  try {
    const responses = await Promise.all(toolUrls.map(url => fetch(url, { cache: 'no-store', credentials: 'omit' })));
    if (responses.some(response => !response.ok)) throw Error('Incomplete tool package');
    let stored = false;
    try {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all(responses.map((response, i) => cache.put(toolUrls[i], response.clone())));
      stored = true;
    } catch { /* A cache failure must not prevent the online page from opening. */ }
    return { responses, stored };
  } catch { return cached; }
}
function unavailableTool(url) {
  const requested = url.searchParams.get('lang') || 'en';
  const messages = {
    en: ['Coordinator demo', 'This demo has not been downloaded yet. Connect to the internet and open it once, then it can work offline.', 'Back to vacancies'],
    pl: ['Panel koordynatora · demo', 'Demo nie zostało jeszcze pobrane. Połącz się z internetem i otwórz je raz, aby później korzystać bez sieci.', 'Wróć do ofert'],
    ru: ['Кабинет координатора · демо', 'Демо ещё не загружено. Подключитесь к интернету и откройте его один раз, чтобы затем работать без сети.', 'Вернуться к вакансиям'],
    uk: ['Кабінет координатора · демо', 'Демо ще не завантажено. Підключіться до інтернету й відкрийте його один раз, щоб потім працювати без мережі.', 'Повернутися до вакансій']
  };
  const lang = requested === 'ua' ? 'uk' : Object.hasOwn(messages, requested) ? requested : 'en';
  const [title, description, back] = messages[lang];
  const returnUrl = new URL('./', self.location.href);
  const from = url.searchParams.get('fromLang') || requested;
  if (/^[a-z]{2,3}$/.test(from)) returnUrl.searchParams.set('lang', from);
  return new Response(`<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><main style="max-width:40rem;margin:3rem auto;padding:1.5rem;font:18px/1.6 system-ui"><h1>${title}</h1><p id="tool-unavailable">${description}</p><a href="${returnUrl.href}">${back}</a></main></html>`, {
    status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" }
  });
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === 'CACHE_COORDINATOR') event.waitUntil(loadToolPack().then(pack => {
    event.ports?.[0]?.postMessage({ ready: Boolean(pack?.stored) });
  }));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (requestUrl.pathname.startsWith(TOOL_ROOT.pathname)) {
    const name = requestUrl.pathname.slice(TOOL_ROOT.pathname.length) || 'index.html';
    if (!TOOL_FILES.includes(name)) {
      event.respondWith(fetch(event.request).catch(() => new Response('Not available offline', { status: 404 })));
      return;
    }
    const canonical = toolUrls[TOOL_FILES.indexOf(name)];
    if (event.request.mode === 'navigate') {
      event.respondWith(loadToolPack(true).then(pack => pack ? pack.responses[TOOL_FILES.indexOf(name)] : unavailableTool(requestUrl)));
    } else {
      event.respondWith(caches.open(CACHE_VERSION).then(cache => cache.match(canonical)).catch(() => null)
        .then(cached => cached || fetch(canonical, { cache: 'no-store', credentials: 'omit' })));
    }
    return;
  }

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

