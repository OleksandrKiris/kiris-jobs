// Public-package acceptance only. Module runtime and owner9 fixtures are untouched.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export const PUBLISHED_TOOL_BASE = 'ace6655eff143e674dc93e07a3a8709e45d5d14c';
export const TOOL_FILES = ['index.html', 'model.js', 'app.js', 'style.css', 'primserv-logo.svg'];
const SHELL_FILES = ['index.html', 'privacy.html', 'assets/bootstrap.js', 'assets/privacy-bootstrap.js',
  'assets/i18n.js', 'assets/homepage.css', 'assets/candidate.js', 'manifest.webmanifest', 'sw.js'];
const oldHashes = {
  'index.html': 'c4a0b566e37495c7a58a3394ede4bb99e8a1740a9b84a9a1c4eb22d63c16922d',
  'model.js': 'c245ccc24b67dcb23e31185a8bf445d3358e4db383aebf732d794ee6554ab7a8',
  'app.js': 'a6ac0d59ced55c8ccf0673561a764e6af4715e58238bf8f468be5f49be69f817',
  'style.css': 'ff0a673c7625c9dbc2d4cad0feddd8b2340bcec44be4413761a7767f36663481',
  'primserv-logo.svg': '1a29802a4a0065ad84e8f8dbdd5bc46dcb9b67bbecb2190de6a99464feaf5157'
};
export const JOINT_TOOL_TRANSITION = {
  id: 'pr68',
  published: { ref: '62cb57883e617d67e54d8ba5b280f616ca651848', hashes: {
    ...oldHashes, 'app.js': 'b0e6c859dabbe5f02a3776c15027f2539ef538909cfb0c35078bd05b614f0e0b'
  } },
  target: { ref: 'c896d09da3901be3b6bbec92c1aa1bcbfb0b8e15', hashes: {
    'index.html': 'b293dc2a3f88b1319ad8c13c4d196bc65e5bca760e14ae79a6df8730d09e18ab',
    'model.js': '133dc7a06b60d0d1a733985217abce4142e75cbf850dfdcf79459073fcce11ae',
    'app.js': 'a64b96a515dfbe4d63666ca1b5d6097fdc49616b5bd8a8313a9e8286304c9599',
    'style.css': '6433dce6e6a8ce3c5350d29d10f02f896dc4e3d5e6d4e03e538bf7fe776396cd',
    'primserv-logo.svg': oldHashes['primserv-logo.svg']
  } }
};
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const KEY = 'primserv:coordinator-demo:v1';
const stateCache = 'primserv-coordinator-state-v1';
const packPrefix = 'primserv-coordinator-pack-v1-';

export function assertToolManifest(files, expected) {
  assert.deepEqual([...files.keys()].sort(), [...TOOL_FILES].sort(), 'Exactly five source resources are required');
  assert.deepEqual(Object.keys(expected).sort(), [...TOOL_FILES].sort(), 'Exactly five pinned hashes are required');
  for (const name of TOOL_FILES) assert.equal(hash(files.get(name)), expected[name], 'Pinned source hash: ' + name);
}
export function publishedToolBytes(source = { ref: PUBLISHED_TOOL_BASE, hashes: oldHashes }, includeShell = true) {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Historical Git reads belong to the authorized CI runner');
  assert.match(source.ref, /^[0-9a-f]{40}$/, 'Only an exact commit is a source');
  const git = args => execFileSync('git', args, { timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
  let fetched = false;
  try { git(['cat-file', '-e', source.ref + '^{commit}']); }
  catch {
    // PR event-base preparation does not promise this separately pinned release.
    // At most one exact-object fetch; never replace it with current main.
    git(['fetch', '--no-tags', '--depth=1', '--filter=blob:none', 'origin', source.ref]);
    fetched = true;
  }
  const files = new Map(TOOL_FILES.map(name => {
    const bytes = git(['show', `${source.ref}:coordinator-demo/${name}`]);
    return [name, bytes];
  }));
  assertToolManifest(files, source.hashes);
  const shell = new Map(includeShell ? SHELL_FILES.map(name => [name, git(['show', `${source.ref}:${name}`])]) : []);
  return { files, shell, fetched };
}

async function packSnapshot(page, base) {
  return page.evaluate(async ({ base, stateCache, packPrefix }) => {
    const state = await caches.open(stateCache);
    const name = await (await state.match(new URL('sw.js?coordinator-pack=v1', base)))?.text();
    const generations = (await caches.keys()).filter(key => key.startsWith(packPrefix)).sort();
    if (!name) return { name: null, generations, files: [] };
    const cache = await caches.open(name);
    const files = await Promise.all((await cache.keys()).map(async request => {
      const bytes = await (await cache.match(request)).arrayBuffer();
      const sha256 = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
        byte => byte.toString(16).padStart(2, '0')).join('');
      return { url: request.url, sha256 };
    }));
    return { name, generations, files: files.sort((a, b) => a.url.localeCompare(b.url)) };
  }, { base, stateCache, packPrefix });
}
function expectedFiles(base, hashes) {
  return TOOL_FILES.map(name => ({ url: new URL('tools/coordinator/' + name, base).href, sha256: hashes[name] }))
    .sort((a, b) => a.url.localeCompare(b.url));
}
function complete(pack, expected) {
  assert.ok(pack.name?.startsWith(packPrefix), 'A committed complete generation is required');
  assert.deepEqual(pack.generations, [pack.name], 'No partial or obsolete generation may remain');
  assert.deepEqual(pack.files, expected, 'All five runtime hashes must match one expected generation');
}
async function taskState(page, expectedRaw) {
  assert.equal(await page.locator('#demo-01').inputValue(), 'doing');
  assert.equal(await page.locator('#demo-03').inputValue(), 'done');
  const raw = await page.evaluate(key => localStorage.getItem(key), KEY);
  assert.equal(raw, expectedRaw, 'Raw fictional progress must survive navigation/reload/reconnect');
}
function interruption(origin, pathname) {
  const proof = origin.cuts.map(event => ({ ...event }));
  assert.ok(proof.length > 0, 'Target resource must reach the real HTTP origin');
  assert.ok(proof.every(event => event.pathname === pathname && event.socketDestroyed
    && event.sentBytes > 0 && event.sentBytes < event.declaredBytes), 'Every targeted response body must be cut');
  return proof;
}

export async function verifyMaterialOffline(page, { id, fits, shot }) {
    assert.equal(await page.evaluate(() => navigator.onLine), false, 'Material proof runs with browser offline');
    await page.locator('#materialQuery').waitFor();
    assert.equal(await page.locator('#materials article').count(), 1);
    assert.equal(await page.locator('#materials h3').innerText(), 'Уборка территории');
    assert.equal(await page.locator('#materials h3').getAttribute('lang'), 'ru');
    assert.match(await page.locator('#materialsStatus').innerText(), /ru/);
    const notice = await page.locator('#materialsNotice').innerText();
    assert.match(notice, /2026-07-23/); assert.match(notice, /2026-10-17/);
    const source = await page.locator('#materials a').getAttribute('href');
    assert.equal(source, 'https://github.com/OleksandrKiris/kiris-jobs/blob/fc672d805fb884eb1d09bdc8ca342ba530ad83f4/data/content.js');
    const snapshot = await page.locator('#materials article').innerText();
    await page.locator('#materialsSource').selectOption('mock');
    assert.equal(await page.locator('#materials article').innerText(), snapshot);
    await page.locator('#materialQuery').focus();
    assert.equal(await page.locator('#materialQuery').evaluate(node => node === document.activeElement), true);
    await page.locator('#materialQuery').fill('joint-no-such-material');
    assert.equal(await page.locator('#materials article').count(), 0);
    assert.ok((await page.locator('#materialsStatus').innerText()).length > 0);
    await page.locator('#materialQuery').fill('территории');
    assert.equal(await page.locator('#materials article').count(), 1);
    await page.locator('#materialQuery').fill('');
    await page.locator('#materialsSource').selectOption('snapshot');
    await page.locator('#materialsTitle').scrollIntoViewIfNeeded();
    await fits(page); await shot(page, id + '-materials-offline');
    return { title: 'Уборка территории', language: 'ru', source, snapshotMockEqual: true,
      emptySearch: true, restoredSearch: true, sourceDate: '2026-07-23', verifiedDate: '2026-10-17' };
  }

export async function acceptCoordinatorRefresh({ artifact, reportDir, report, base, origin,
  context, ready, fits, shot, active, startServer, stopServer, transition = null, targetFiles = null }) {
  const legacy = publishedToolBytes(transition?.published);
  const originalFiles = new Map(await Promise.all(TOOL_FILES.map(async name =>
    [name, await readFile(join(artifact, 'tools/coordinator', name))])));
  if (targetFiles) {
    assert.ok(transition, 'Captured target requires an explicit source receipt');
    assertToolManifest(targetFiles, transition.target.hashes);
  }
  const pinnedTarget = targetFiles ? { files: targetFiles, fetched: false }
    : transition ? publishedToolBytes(transition.target, false) : null;
  const currentFiles = pinnedTarget?.files || originalFiles;
  const oldHashes = Object.fromEntries([...legacy.files].map(([name, bytes]) => [name, hash(bytes)]));
  const prefix = transition ? transition.id + '-' : '';
  const currentShell = new Map(await Promise.all(SHELL_FILES.map(async name => [name, await readFile(join(artifact, name))])));
  const headHashes = Object.fromEntries([...currentFiles].map(([name, bytes]) => [name, hash(bytes)]));
  assert.ok(TOOL_FILES.some(name => oldHashes[name] !== headHashes[name]), 'This must exercise a REAL tool-byte change');
  const oldExpected = expectedFiles(base, oldHashes), headExpected = expectedFiles(base, headHashes);
  const workerHash = hash(await readFile(join(artifact, 'sw.js')));
  const publishedCache = legacy.shell.get('sw.js').toString().match(/const CACHE_VERSION = "([^"]+)"/)[1];
  const headCache = currentShell.get('sw.js').toString().match(/const CACHE_VERSION = "([^"]+)"/)[1];
  report[transition ? 'jointToolRefresh' : 'toolRefresh'] = {
    publishedBase: transition?.published.ref || PUBLISHED_TOOL_BASE, publishedFiles: oldHashes,
    sourceTarget: transition?.target.ref || report.head,
    testedHead: report.head, headFiles: headHashes, workerSHA256: workerHash,
    publishedShell: Object.fromEntries([...legacy.shell].map(([name, bytes]) => [name, hash(bytes)])),
    publishedCache, headCache,
    historicalCommitFetched: legacy.fetched, targetCommitFetched: pinnedTarget?.fetched || false,
    limits: ['Same head worker remains active for each tool refresh; shell upgrade is a separate scenario.',
      'Cuts are real loopback HTTP socket interruptions after partial 200 bodies, not production network measurements.'] };
  const stage = async files => {
    for (const [name, bytes] of files) await writeFile(join(artifact, 'tools/coordinator', name), bytes);
  };
  const stageShell = async files => {
    for (const [name, bytes] of files) await writeFile(join(artifact, name), bytes);
  };
  const toolReady = page => page.locator('#offline[data-offline-state="ready"]').waitFor();
  const catalogue = async page => {
    await page.locator('#catalogue-return').click(); await ready(page);
    assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
    assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
  };

  const materialProof = (page, id) => transition ? verifyMaterialOffline(page, { id, fits, shot }) : null;

  try {
  for (const width of [1280, 320]) for (const failedFile of TOOL_FILES) {
    const id = `${prefix}tool-refresh-${failedFile.replaceAll('.', '-')}-${width}`;
    const ctx = await context({ width, height: 900 }), page = await ctx.newPage();
    active(page);
    let stopped = false;
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    report.currentScenario = id;
    await ctx.tracing.start({ screenshots: true, snapshots: true, sources: false });
    try {
      await stageShell(legacy.shell);
      await stage(legacy.files);
      await page.goto(base + '?lang=uk'); await ready(page);
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await page.locator('#job-search').fill('Siechnice');
      await page.locator('[data-primserv-service="coordinator"]').click(); await toolReady(page);
      if (transition) assert.equal(await page.locator('#materialQuery').count(), 0, 'Published old runtime has no material slice');
      await page.locator('#demo-01').selectOption('doing');
      await page.locator('#demo-03').selectOption('done');
      const raw = await page.evaluate(key => localStorage.getItem(key), KEY);
      assert.deepEqual(JSON.parse(raw).statuses, { 'demo-01': 'doing', 'demo-02': 'todo', 'demo-03': 'done' });
      const before = await packSnapshot(page, base); complete(before, oldExpected);
      assert.ok((await page.evaluate(() => caches.keys())).includes(publishedCache));
      await catalogue(page);

      const changesWorker = hash(legacy.shell.get('sw.js')) !== workerHash;
      // The catalogue really reloads on controllerchange. Cache deletion happens
      // earlier during activation, so cache names alone are not a navigation barrier.
      const automaticReload = changesWorker ? page.waitForEvent('load') : null;
      await stageShell(currentShell);
      await stage(currentFiles);
      const pathname = new URL('tools/coordinator/' + failedFile, base).pathname;
      origin.cut(pathname);
      if (changesWorker) {
        assert.notEqual(publishedCache, headCache, 'Changed worker needs a different cache version');
        await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
        await page.waitForFunction(async ({ publishedCache, headCache }) => {
          const names = await caches.keys();
          return names.includes(headCache) && !names.includes(publishedCache);
        }, { publishedCache, headCache });
        await automaticReload; await ready(page);
        await page.waitForFunction(async () => {
          const registration = await navigator.serviceWorker.ready;
          return registration.active?.state === 'activated'
            && navigator.serviceWorker.controller === registration.active;
        });
      }
      const shellTransition = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        return { activeState: registration.active?.state,
          controllerMatchesActive: navigator.serviceWorker.controller === registration.active,
          navigation: performance.getEntriesByType('navigation')[0]?.type, url: location.href };
      });
      assert.equal(shellTransition.activeState, 'activated');
      assert.equal(shellTransition.controllerMatchesActive, true);
      assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
      assert.deepEqual(await packSnapshot(page, base), before, 'Shell update alone preserves actual published tool bytes');
      assert.equal(origin.cuts.length, 0, 'A tool visit must not hide migration with an early refresh');
      await page.waitForFunction(async headCache => Boolean(await (await caches.open(headCache))
        .match(new URL('data/locales/uk.js?v=220', location.href))), headCache);
      await stopServer(); stopped = true; await ctx.setOffline(true);
      // First tool entry after shell activation is OFFLINE, before any online
      // refresh could hide incorrectly staged base bytes or broken migration.
      await page.locator('[data-primserv-service="coordinator"]').click(); await toolReady(page);
      await taskState(page, raw); assert.deepEqual(await packSnapshot(page, base), before);
      await page.reload(); await toolReady(page); await taskState(page, raw);
      await catalogue(page);
      await startServer(); stopped = false; await ctx.setOffline(false);
      // From this point through failure/recovery/offline, SW bytes never change.
      await page.locator('[data-primserv-service="coordinator"]').click(); await toolReady(page);
      await taskState(page, raw);
      assert.deepEqual(await packSnapshot(page, base), before, 'Interrupted refresh keeps the same entire old generation');
      await page.reload(); await toolReady(page); await taskState(page, raw);
      assert.deepEqual(await packSnapshot(page, base), before);
      const cutProof = interruption(origin, pathname);
      await stopServer(); stopped = true; await ctx.setOffline(true);
      await page.reload(); await toolReady(page); await taskState(page, raw);
      await catalogue(page);
      await page.goBack(); await page.reload(); await toolReady(page); await taskState(page, raw);
      assert.deepEqual(await packSnapshot(page, base), before);
      await fits(page); await shot(page, id + '-last-good');

      origin.clearCut(); await startServer(); stopped = false; await ctx.setOffline(false);
      await page.reload(); await toolReady(page); await taskState(page, raw);
      const recovered = await packSnapshot(page, base); complete(recovered, headExpected);
      assert.notEqual(recovered.name, before.name, 'Successful recovery publishes a different complete generation');
      await catalogue(page);
      await page.locator('[data-primserv-service="coordinator"]').click(); await toolReady(page); await taskState(page, raw);
      complete(await packSnapshot(page, base), headExpected);
      await stopServer(); stopped = true; await ctx.setOffline(true);
      await page.reload(); await toolReady(page); await taskState(page, raw);
      complete(await packSnapshot(page, base), headExpected);
      await fits(page); await shot(page, id + '-recovered-offline');
      const material = await materialProof(page, id);
      await taskState(page, raw);
      await catalogue(page);
      assert.equal(hash(await readFile(join(artifact, 'sw.js'))), workerHash, 'Worker bytes must remain unchanged throughout refresh');
      assert.deepEqual(errors, []);
      report.results.push({ scenario: 'published old five → new tool bytes with unchanged worker / each HTTP cut / last-good / reconnect / recovered offline',
        width, failedFile, status: 'passed', transition: transition?.id || null, material,
        before, recovered, cutProof, shellTransition, progress: JSON.parse(raw), workerSHA256: workerHash });
    } catch (error) {
      await page.screenshot({ path: join(reportDir, id + '-failure.png') }).catch(() => {});
      throw error;
    } finally {
      origin.clearCut(); await stage(currentFiles); await stageShell(currentShell);
      if (stopped) await startServer();
      await ctx.tracing.stop({ path: join(reportDir, id + '.zip') });
      await ctx.close(); active(null);
    }
  }

  // A cold interrupted package has no last-good fallback and must remain unavailable.
  for (const failedFile of TOOL_FILES) {
    const id = `${prefix}tool-cold-cut-${failedFile.replaceAll('.', '-')}-320`;
    const ctx = await context({ width: 320, height: 900 }), page = await ctx.newPage(); active(page);
    let stopped = false; report.currentScenario = id;
    await ctx.tracing.start({ screenshots: true, snapshots: true, sources: false });
    try {
      await page.goto(base + '?lang=uk'); await ready(page);
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await page.locator('#job-search').fill('Siechnice');
      const pathname = new URL('tools/coordinator/' + failedFile, base).pathname;
      origin.cut(pathname);
      const navigation = page.waitForResponse(response => response.request().isNavigationRequest()
        && response.url().startsWith(base + 'tools/coordinator/'));
      await page.locator('[data-primserv-service="coordinator"]').click();
      assert.equal((await navigation).status(), 503, 'Cold incomplete network package returns an honest unavailable response');
      await page.locator('#tool-unavailable').waitFor();
      const cutProof = interruption(origin, pathname);
      const unavailable = await packSnapshot(page, base);
      assert.deepEqual(unavailable, { name: null, generations: [], files: [] });
      await stopServer(); stopped = true; await ctx.setOffline(true);
      assert.equal((await page.reload()).status(), 503);
      await page.locator('#tool-unavailable').waitFor();
      assert.equal(await page.locator('#offline[data-offline-state="ready"]').count(), 0);
      await fits(page); await shot(page, id + '-unavailable');
      await page.locator('a').click(); await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      origin.clearCut(); await startServer(); stopped = false; await ctx.setOffline(false);
      await page.locator('[data-primserv-service="coordinator"]').click(); await toolReady(page);
      complete(await packSnapshot(page, base), headExpected);
      await page.locator('#demo-01').selectOption('doing');
      await stopServer(); stopped = true; await ctx.setOffline(true);
      await page.reload(); await toolReady(page);
      assert.equal(await page.locator('#demo-01').inputValue(), 'doing');
      complete(await packSnapshot(page, base), headExpected);
      const material = await materialProof(page, id);
      report.results.push({ scenario: 'cold partial HTTP body → unavailable offline → reconnect and complete download → offline reload',
        width: 320, failedFile, status: 'passed', transition: transition?.id || null, material,
        unavailableStatus: 503, offlineReady: false, cutProof });
    } catch (error) {
      await page.screenshot({ path: join(reportDir, id + '-failure.png') }).catch(() => {});
      throw error;
    } finally {
      origin.clearCut(); if (stopped) await startServer();
      await ctx.tracing.stop({ path: join(reportDir, id + '.zip') });
      await ctx.close(); active(null);
    }
  }
  delete report.currentScenario;
  } finally {
    await stage(originalFiles); await stageShell(currentShell);
  }
}
