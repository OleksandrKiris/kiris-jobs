const CACHE = 'citronex-recruitment-v12.7.0';
const CORE = [
  './', './index.html', './offline-redirect.js?v=12.0.0',
  './offline.html', './offline-v12.css?v=12.0.0',
  './offline-shared.js?v=12.7.0', './offline-candidate.js?v=12.7.0',
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
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./offline.html'))));
});
