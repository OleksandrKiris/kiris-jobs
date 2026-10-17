import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const base = 'https://example.test/kiris-jobs/';
const files = ['index.html', 'model.js', 'app.js', 'style.css', 'primserv-logo.svg'];
const urls = files.map(file => base + 'tools/coordinator/' + file);
const shell = source.match(/const CACHE_VERSION = "([^"]+)"/)[1];
const prefix = 'primserv-coordinator-pack-v1-';
const stateName = 'primserv-coordinator-state-v1';
const pointer = base + 'sw.js?coordinator-pack=v1';
const legacyName = 'kiris-jobs-v220-coordinator-2026-10-17-1';

function harness(storage = new Map()) {
  const listeners = {}, requests = [], claimed = [], skipped = [];
  const controls = { offline: true, revision: 'new', failPut: () => false, gate: null };
  const keyOf = request => new URL(typeof request === 'string' ? request : request.url, base).href;
  const caches = {
    async keys() { return [...storage.keys()]; },
    async delete(name) { return storage.delete(name); },
    async open(name) {
      if (!storage.has(name)) storage.set(name, new Map());
      const entries = storage.get(name);
      return {
        async match(request) { return entries.get(keyOf(request))?.clone(); },
        async keys() { return [...entries.keys()].map(url => new Request(url)); },
        async put(request, response) {
          const url = keyOf(request);
          if (controls.failPut(name, url)) throw Error('Quota fixture');
          entries.set(url, response.clone());
        },
        async addAll(paths) { for (const path of paths) await this.put(path, new Response('shell')); },
        async add(path) { await this.put(path, await fetcher(keyOf(path))); }
      };
    },
    async match(request) {
      for (const name of storage.keys()) {
        const response = await (await this.open(name)).match(request);
        if (response) return response;
      }
    }
  };
  async function fetcher(request, options) {
    const url = keyOf(request);
    requests.push({ url, options });
    if (controls.gate) await controls.gate;
    if (controls.offline || controls.failNetwork?.(url)) throw Error('Offline fixture');
    return new Response(`${controls.revision}:${url.split('/').at(-1)}`);
  }
  vm.runInNewContext(source, {
    URL, Request, Response, Promise, crypto: webcrypto, caches, fetch: fetcher,
    self: { location: new URL(base + 'sw.js'), clients: { claim: async () => claimed.push(true) },
      skipWaiting: async () => skipped.push(true), addEventListener: (type, fn) => { listeners[type] = fn; } }
  });
  async function dispatch(type, extra = {}) {
    const waits = []; let response;
    listeners[type]({ ...extra, waitUntil: p => waits.push(p), respondWith: p => { response = p; } });
    const result = response ? await response : undefined;
    await Promise.all(waits);
    return result;
  }
  return { storage, caches, controls, requests, claimed, skipped,
    install: () => dispatch('install'), activate: () => dispatch('activate'),
    get: (file = '', navigate = false) => dispatch('fetch', { request: {
      method: 'GET', mode: navigate ? 'navigate' : 'cors', url: base + 'tools/coordinator/' + file } }),
    async ready() {
      let reply;
      await dispatch('message', { data: { type: 'CACHE_COORDINATOR' }, ports: [{ postMessage: value => { reply = value; } }] });
      return reply.ready;
    },
    post: () => dispatch('fetch', { request: { method: 'POST', url: base + 'tools/coordinator/' } })
  };
}
async function seed(h, name = legacyName, revision = 'old', selected = files) {
  const cache = await h.caches.open(name);
  for (const file of selected) await cache.put(base + 'tools/coordinator/' + file, new Response(`${revision}:${file}`));
}
async function assertRuntime(h, revision) {
  for (const file of files) assert.equal(await (await h.get(file)).text(), `${revision}:${file}`);
}
async function committed(h) {
  const state = await h.caches.open(stateName);
  const name = await (await state.match(pointer)).text();
  assert.deepEqual((await (await h.caches.open(name)).keys()).map(r => r.url).sort(), [...urls].sort());
  return name;
}

test('real install/activate preserves exactly one complete legacy pack before deleting old shell caches', async () => {
  const h = harness(); await seed(h);
  await (await h.caches.open(legacyName)).put(base + 'private-looking-unused.txt', new Response('not copied'));
  await seed(h, 'kiris-jobs-newer-partial', 'partial', files.slice(0, 2));
  await h.caches.open('unrelated-cache'); await h.install(); await h.activate();
  assert.equal((await h.get('?lang=uk&fromLang=uk', true)).status, 200);
  await assertRuntime(h, 'old'); assert.equal(await h.ready(), true);
  const name = await committed(h);
  assert.deepEqual((await h.caches.keys()).sort(), [shell, name, stateName, 'unrelated-cache'].sort());
  assert.equal(h.claimed.length, 1); assert.equal(h.skipped.length, 1);
  assert.equal(h.requests.length, 5, 'only explicit navigation attempted a five-file refresh');
  const restarted = harness(h.storage); await restarted.install(); await restarted.activate(); await assertRuntime(restarted, 'old');
});

test('partial legacy caches are never combined and cold offline is not ready', async () => {
  const h = harness(); await seed(h, legacyName, 'a', files.slice(0, 3));
  await seed(h, 'kiris-jobs-other', 'b', files.slice(3)); await h.install(); await h.activate();
  assert.equal((await h.get('?lang=en', true)).status, 503); assert.equal(await h.ready(), false);
  assert.deepEqual((await h.caches.keys()).filter(name => name.startsWith('kiris-jobs-')), [shell]);
});

test('failed network refresh leaves all five old responses intact', async () => {
  const h = harness(); await seed(h); await h.install(); await h.activate(); const old = await committed(h);
  h.controls.offline = false; h.controls.failNetwork = url => url.endsWith('/app.js');
  assert.equal(await (await h.get('', true)).text(), 'old:index.html');
  await assertRuntime(h, 'old'); assert.equal(await committed(h), old); assert.equal(await h.ready(), true);
});

for (const failedFile of [...files, 'pointer']) test(`failed ${failedFile} write cannot publish or mix a refresh`, async () => {
  const h = harness(); await seed(h); await h.install(); await h.activate(); const old = await committed(h);
  h.controls.offline = false;
  h.controls.failPut = (name, url) => failedFile === 'pointer' ? name === stateName
    : name.startsWith(prefix) && url.endsWith('/' + failedFile);
  assert.equal(await (await h.get('', true)).text(), 'old:index.html');
  await assertRuntime(h, 'old'); assert.equal(await committed(h), old);
  assert.deepEqual((await h.caches.keys()).filter(name => name.startsWith(prefix)), [old]);
  assert.equal(await h.ready(), true, 'the retained complete old pack is still ready');
});

test('first-visit partial write stays online in memory but never reports offline-ready', async () => {
  const h = harness(); h.controls.offline = false;
  h.controls.failPut = (name, url) => name.startsWith(prefix) && url.endsWith('/app.js');
  assert.equal(await (await h.get('', true)).text(), 'new:index.html');
  await assertRuntime(h, 'new'); assert.equal(await h.ready(), false);
  assert.ok(!(await h.caches.keys()).some(name => name.startsWith(prefix)));
  const restarted = harness(h.storage);
  assert.equal((await restarted.get('', true)).status, 503); assert.equal(await restarted.ready(), false);
});

test('migration write failure rejects installation before skipWaiting and retains the active legacy copy', async () => {
  const h = harness(); await seed(h);
  h.controls.failPut = name => name.startsWith(prefix);
  await assert.rejects(h.install(), /write failed/);
  assert.equal(h.skipped.length, 0); assert.equal(h.claimed.length, 0);
  assert.ok(h.storage.has(legacyName));
  for (const file of files) assert.equal(await (await (await h.caches.open(legacyName))
    .match(base + 'tools/coordinator/' + file)).text(), 'old:' + file);
  // A failed installing worker never activates. Retry with a fresh worker,
  // sharing persistent storage, as a later browser update would do.
  const retry = harness(h.storage); await retry.install(); await retry.activate();
  assert.equal(await (await retry.get('', true)).text(), 'old:index.html');
  await assertRuntime(retry, 'old');
});

test('interrupted staging and an invalid pointer cannot make a partial package ready', async () => {
  const h = harness(); const name = prefix + 'interrupted';
  await seed(h, name, 'partial', files.slice(0, 4));
  await (await h.caches.open(stateName)).put(pointer, new Response(name));
  await h.install(); await h.activate(); assert.equal(await h.ready(), false);
  assert.equal((await h.get('', true)).status, 503); assert.ok(!h.storage.has(name));
});

test('concurrent navigation, resources, and prepare message share one complete transaction', async () => {
  const h = harness(); await seed(h); await h.install(); await h.activate(); h.controls.offline = false;
  let release; h.controls.gate = new Promise(resolve => { release = resolve; });
  const navigation = h.get('?lang=pl', true), ready = h.ready(), resource = h.get('app.js');
  // All callers have entered the real handler before the network is released.
  release();
  const [page, isReady, script] = await Promise.all([navigation, ready, resource]);
  assert.equal(await page.text(), 'new:index.html'); assert.equal(await script.text(), 'new:app.js');
  assert.equal(isReady, true); assert.equal(h.requests.length, 5); await committed(h);
  for (let i = 0; i < 3; i++) await h.get('', true);
  assert.equal((await h.caches.keys()).filter(name => name.startsWith(prefix)).length, 1);
  assert.ok(h.requests.every(r => urls.includes(r.url) && r.options.credentials === 'omit'));
});

test('install does not prefetch the tool; unknown paths and submissions are not cached', async () => {
  const h = harness(); await h.install(); assert.equal(h.requests.length, 0);
  assert.equal((await h.get('test.cjs')).status, 404);
  assert.equal(await h.post(), undefined);
  assert.equal(h.requests.length, 1);
  assert.ok(![...h.storage.values()].some(entries => [...entries.keys()].some(url => url.includes('/tools/coordinator/'))));
});
