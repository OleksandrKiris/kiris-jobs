const CACHE = 'citronex-recruitment-v14.0.0';
const CORE = [
  './', './index.html', './offline-redirect.js',
  './offline.html', './offline-v12.css',
  './offline-shared.js', './offline-candidate.js',
  './offline-translations.js',
  './manifest.webmanifest', './offline-icon.svg',
  './excel/Recruitment_Master.xlsx', './excel/Recruitment_yana.xlsx',
  './excel/Recruitment_yuliia.xlsx', './excel/Recruitment_fariz.xlsx',
  './excel/Recruitment_oleksandr.xlsx', './excel/Recruitment_maksym.xlsx',
  './excel/Recruitment_anastasiia.xlsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./offline.html')));
    return;
  }
  event.respondWith(caches.match(event.request, {ignoreSearch:true}).then((cached) => {
    if (cached) return cached;
    return fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => new Response('Offline resource unavailable', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}}));
  }));
});
