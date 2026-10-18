const CACHE_PREFIX = "kiris-jobs-";
const CACHE_VERSION = "kiris-jobs-v220-field-status-2026-10-18-2";
const CORE_SHELL = [
  "./",
  "./index.html",
  "./privacy.html",
  "./manifest.webmanifest",
  "./data/content.js?v=220",
  "./data/locales/pl.js?v=220",
  "./assets/bootstrap.js?v=220&shortcuts=1&coordinator=1&localeRecovery=1&earlySearch=1&formErrorLocale=1",
  "./assets/privacy-bootstrap.js?v=220&localeRecovery=1",
  "./assets/candidate-base.css?v=220",
  "./assets/clean.css?v=220&formErrorLocale=1&fieldStatus=2",
  "./assets/homepage.css?v=220&localeRecovery=1&cardContrast=1",
  "./assets/privacy.css?v=220",
  "./assets/i18n.js?v=220&localeRecovery=1",
  "./assets/application-form.js?v=220&formErrorLocale=1",
  "./assets/application-loader.js?v=220&formErrorLocale=1",
  "./assets/vacancy-overrides.js?v=220",
  "./assets/candidate.js?v=220&shortcuts=1&coordinator=1&earlySearch=1",
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
  "./assets/share-card.png?v=220",
  "./vacancies/greenhouse-tomatoes/",
  "./vacancies/greenhouse-renewal/",
  "./vacancies/tomato-sorting/",
  "./vacancies/banana-warehouse-poland/",
  "./vacancies/plant-protection/",
  "./vacancies/site-cleaning/",
  "./vacancies/forklift-udt/",
  "./vacancies/team-leader/",
  "./vacancies/greenhouse-agronomist/",
  "./vacancies/truck-mechanic/",
  "./vacancies/driver-ce-poland/",
  "./vacancies/driver-ce-relief/",
  "./vacancies/banana-warehouse-hungary/",
  "./vacancies/banana-warehouse-belgium/"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await cache.addAll(CORE_SHELL);
      // Installation failure leaves the previous worker active. Activation is
      // too late to make this required migration transactional with the upgrade.
      await preserveToolPack();
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    cachedToolPack().then(pack => cleanToolCaches(pack?.name)).then(() => caches.keys())
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
// This namespace survives shell updates. Only a complete immutable generation
// is published by the single atomic pointer write; staging is never served.
const TOOL_CACHE_PREFIX = 'primserv-coordinator-pack-v1-';
const TOOL_STATE_CACHE = 'primserv-coordinator-state-v1';
const TOOL_POINTER = new URL('./sw.js?coordinator-pack=v1', self.location.href).href;
let toolLoad;
let onlineToolPack;
async function readToolPack(name, exact = true) {
  const cache = await caches.open(name);
  if (exact) {
    const keys = await cache.keys();
    if (keys.length !== toolUrls.length || keys.some(key => !toolUrls.includes(key.url))) return null;
  }
  const responses = await Promise.all(toolUrls.map(url => cache.match(url)));
  return responses.every(response => response?.ok) ? { name, responses, stored: true } : null;
}
async function cachedToolPack() {
  try {
    const state = await caches.open(TOOL_STATE_CACHE);
    const name = await (await state.match(TOOL_POINTER))?.text();
    return name?.startsWith(TOOL_CACHE_PREFIX) && (await caches.keys()).includes(name)
      ? await readToolPack(name) : null;
  } catch { return null; }
}
async function cleanToolCaches(current) {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key.startsWith(TOOL_CACHE_PREFIX) && key !== current)
    .map(key => caches.delete(key)));
}
async function storeToolPack(responses) {
  const name = TOOL_CACHE_PREFIX + crypto.randomUUID();
  try {
    const cache = await caches.open(name);
    // Wait for every write to settle before removing a failed staging cache.
    const writes = await Promise.allSettled(responses.map((response, i) => cache.put(toolUrls[i], response.clone())));
    if (writes.some(result => result.status === 'rejected')) throw Error('Tool package write failed');
    const pack = await readToolPack(name);
    if (!pack) throw Error('Incomplete stored tool package');
    const state = await caches.open(TOOL_STATE_CACHE);
    await state.put(TOOL_POINTER, new Response(name));
    await cleanToolCaches(name).catch(() => {});
    return pack;
  } catch (error) {
    await caches.delete(name).catch(() => {});
    throw error;
  }
}
async function preserveToolPack() {
  let pack = await cachedToolPack();
  if (!pack) {
    // Upgrade from the legacy shared shell cache: copy only the five canonical
    // files from one complete cache. Never combine pieces from different caches.
    const names = (await caches.keys()).filter(name => name.startsWith(CACHE_PREFIX)).reverse();
    for (const name of names) {
      const legacy = await readToolPack(name, false);
      if (!legacy) continue;
      // A migration write failure aborts installation before skipWaiting.
      pack = await storeToolPack(legacy.responses);
      break;
    }
  }
}
async function prepareToolPack(refresh) {
  const cached = await cachedToolPack();
  if (cached && !refresh) return cached;
  if (onlineToolPack && !refresh) return onlineToolPack;
  try {
    const responses = await Promise.all(toolUrls.map(url => fetch(url, { cache: 'no-store', credentials: 'omit' })));
    if (responses.some(response => !response.ok)) throw Error('Incomplete tool package');
    // Headers can succeed before a truncated network body fails. Validate all
    // bodies before treating any later failure as unavailable cache storage.
    await Promise.all(responses.map(response => response.clone().arrayBuffer()));
    try {
      const pack = await storeToolPack(responses);
      onlineToolPack = null;
      return pack;
    } catch {
      // Keep the last complete runtime on storage failure. A first online visit
      // can still run from memory, but is never advertised as offline-ready.
      return cached || (onlineToolPack = { responses, stored: false });
    }
  } catch { return cached || onlineToolPack; }
}
function loadToolPack(refresh = false) {
  if (!toolLoad) toolLoad = prepareToolPack(refresh).finally(() => { toolLoad = null; });
  // Concurrent navigation/message requests share the transaction, not response bodies.
  return toolLoad.then(pack => pack && { ...pack, responses: pack.responses.map(response => response.clone()) });
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
  return new Response(`<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><main style="max-width:40rem;margin:3rem auto;padding:1.5rem;font:18px/1.6 system-ui;overflow-wrap:anywhere"><h1 style="font-size:clamp(1.5rem,6vw,2rem);line-height:1.2">${title}</h1><p id="tool-unavailable">${description}</p><a href="${returnUrl.href}">${back}</a></main></html>`, {
    status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'" }
  });
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === 'CACHE_LOCALE'
    && ['ru','uk','pl','en','az','ka','id','es','fil','ne','hy'].includes(event.data.locale)) {
    const url = new URL(`./data/locales/${event.data.locale}.js?v=220`, self.location.href).href;
    event.waitUntil(caches.open(CACHE_VERSION).then(async cache => {
      if (!await cache.match(url)) await cache.add(url);
    }).catch(() => {}));
  }
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
      event.respondWith(loadToolPack().then(pack => pack?.responses[TOOL_FILES.indexOf(name)]
        || fetch(canonical, { cache: 'no-store', credentials: 'omit' })));
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
          || await caches.match(requestUrl.origin + requestUrl.pathname)
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

