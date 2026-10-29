// Bounded observation of the published form, using disposable anonymous drafts.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdir, mkdtemp, readFile, writeFile, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {staticOrigin} from './static-origin.mjs';
import {inventory} from '../../scripts/build-pages-artifact.mjs';

assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Use only the authorized Actions runner');
const published = '181088556b9494e66a6188a8597f85917b41b580';
const git = (...args) => execFileSync('git', args);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT_PACKAGE);
const artifact = resolve(process.env.PAGES_ARTIFACT);
const reportDir = resolve(process.env.BROWSER_REPORT);
await mkdir(reportDir, {recursive: true});
const report = {
  head: process.env.TESTED_HEAD, base: process.env.TESTED_BASE, published,
  checkout: git('rev-parse', 'HEAD').toString().trim(), files: {}, rows: [], captures: [],
  external: [], mutations: [],
  limits: [
    'English only, Chromium at 320/1280: no new twenty-language, physical-device, native-speaker, screen-reader or offline certification.',
    'Frozen Date.now isolates the exact 24-hour boundary; this fixture clock is not the date of a real candidate draft.',
    'Anonymous disposable browser storage only. No candidate accounts, external requests, mail or application delivery.',
    'Invalid version/shape/JSON is ignored and retained by the existing published code; this observation does not propose a deletion policy.',
    'Initial full viewport and first-name-centered full viewport are captured; these are not complete-page screenshots.'
  ]
};
assert.equal(report.checkout, report.head);
assert.deepEqual(git('show', '-s', '--format=%P', report.head).toString().trim().split(' '), [report.base]);
git('merge-base', '--is-ancestor', published, report.head);
const oldPaths = git('ls-tree', '-r', '--name-only', published).toString().trim().split('\n');
assert.equal(oldPaths.length, 504);
for (const path of oldPaths) assert.deepEqual(git('show', `${report.head}:${path}`), git('show', `${published}:${path}`), path);
report.publishedTrackedFilesExact = oldPaths.length;
for (const {path} of inventory(artifact)) {
  const source = path.startsWith('tools/coordinator/') ? 'coordinator-demo/' + path.split('/').at(-1) : path;
  const bytes = await readFile(join(artifact, path));
  assert.deepEqual(bytes, git('show', `${published}:${source}`));
  report.files[path] = {source, bytes: bytes.length, sha256: sha(bytes), publishedExact: true};
}
assert.equal(Object.keys(report.files).length, 317);

const key = 'citronex_screening_application_v17';
const fixtureNow = 1800000000000, ttl = 24 * 60 * 60 * 1000;
const routeQuery = '?lang=en&recruiter=yana&location=siechnice&src=fixture&campaign=autumn&vacancy=anonymous';
const contextualKey = 'yana|siechnice|fixture|autumn|anonymous';
const cases = [
  {name: 'valid-fresh', accepted: true},
  {name: 'valid-exact-24h', accepted: true, age: ttl},
  {name: 'expired', remove: true, age: ttl + 1},
  {name: 'expired-remove-denied', remove: true, denied: true, age: ttl + 1},
  {name: 'route-match', accepted: true, contextual: true},
  {name: 'route-mismatch', remove: true, contextual: true, mismatch: true},
  {name: 'route-mismatch-remove-denied', remove: true, contextual: true, mismatch: true, denied: true},
  {name: 'incompatible-version', incompatible: true},
  {name: 'malformed-json', malformed: true},
  {name: 'missing-id', missing: 'id'},
  {name: 'missing-data', missing: 'data'},
  {name: 'missing-savedAt', missing: 'savedAt'}
];
const serveRoot = await mkdtemp(join(tmpdir(), 'primserv-lifetime-'));
await symlink(artifact, join(serveRoot, 'kiris-jobs'), 'dir');
const origin = staticOrigin(serveRoot), base = 'http://127.0.0.1:4173/kiris-jobs/';
let browser;

async function disposableContext(width, test) {
  const context = await browser.newContext({viewport: {width, height: 1000}, serviceWorkers: 'block', reducedMotion: 'reduce'});
  context.setDefaultTimeout(15000);
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      report.mutations.push({case: test.name, width, method: request.method(), path: url.pathname, blocked: true});
      return route.abort();
    }
    if (url.origin !== new URL(base).origin) {
      report.external.push({case: test.name, width, host: url.hostname, path: url.pathname, blocked: true});
      return route.abort();
    }
    return route.continue();
  });
  await context.addInitScript(({test, key, fixtureNow, contextualKey}) => {
    Date.now = () => fixtureNow;
    const store = window.localStorage;
    const get = store.getItem.bind(store), set = store.setItem.bind(store), remove = store.removeItem.bind(store);
    if (!sessionStorage.getItem('primserv-lifetime-seeded')) {
      const draft = {
        version: '17.0.0', id: 'KAND-OLD-ANONYMOUS-LIFETIME',
        routeKey: test.contextual && !test.mismatch ? contextualKey : '||||',
        language: 'en', recruiterId: 'yana', step: 1,
        data: {firstName: 'OLD_ANONYMOUS', lastName: 'FIXTURE', phone: '+99912345678', messenger: 'telegram',
          citizenship: 'FIXTURE', gender: 'undisclosed', age: '30', location: 'any', stayDuration: 'six',
          physicalWork: 'no', physicalDetails: '', performanceMetrics: 'no', fastPace: 'no', watchedVideos: 'no',
          understandsRole: 'no', longHours: 'no', consent: false},
        savedAt: fixtureNow - (test.age ?? 1000)
      };
      if (test.incompatible) draft.version = 'FIXTURE-INCOMPATIBLE';
      if (test.missing) delete draft[test.missing];
      const raw = test.malformed ? '{anonymous fixture invalid JSON' : JSON.stringify(draft);
      set(key, raw); set('primserv-lifetime-unrelated', 'KEEP');
      sessionStorage.setItem('primserv-lifetime-seeded', '1');
      sessionStorage.setItem('primserv-lifetime-original', raw);
    }
    window.__lifetimeCalls = {get: [], set: [], remove: []};
    window.__lifetimeRaw = () => get(key);
    window.__lifetimeOriginal = () => sessionStorage.getItem('primserv-lifetime-original');
    window.__lifetimeUnrelated = () => get('primserv-lifetime-unrelated');
    Object.defineProperty(window, 'localStorage', {configurable: true, get() {
      return {
        getItem(k) { window.__lifetimeCalls.get.push(k); return get(k); },
        setItem(k, v) { window.__lifetimeCalls.set.push(k); set(k, v); },
        removeItem(k) {
          window.__lifetimeCalls.remove.push(k);
          if (test.denied) throw new DOMException('Anonymous fixture stale-entry removal denied', 'SecurityError');
          remove(k);
        }
      };
    }});
  }, {test, key, fixtureNow, contextualKey});
  return context;
}
const raw = page => page.evaluate(() => window.__lifetimeRaw());
const calls = page => page.evaluate(() => window.__lifetimeCalls);
async function nativeResume(page) {
  const button = page.locator('[data-action="resume"]');
  await button.focus(); await page.keyboard.press('Enter');
  await page.locator('#firstName').waitFor();
}
async function capture(page, width, test, stage, center) {
  await page.evaluate(() => document.fonts.ready);
  if (center) await page.locator(center).evaluate(node => node.scrollIntoView({block: 'center', behavior: 'instant'}));
  await page.waitForTimeout(100);
  const dom = await page.evaluate(() => ({
    lang: document.documentElement.lang, title: document.title,
    fitsViewport: document.documentElement.scrollWidth <= innerWidth + 1,
    draftCards: document.querySelectorAll('.draft-box').length,
    status: document.getElementById('draftStatus').textContent,
    statusState: document.getElementById('draftStatus').dataset.state,
    firstName: document.getElementById('firstName')?.value ?? null,
    scrollY, width: innerWidth, height: innerHeight
  }));
  assert(dom.fitsViewport); assert.equal(dom.lang, 'en');
  const file = `lifetime-${width}-${test.name}-${stage}.png`;
  await page.screenshot({path: join(reportDir, file)});
  report.captures.push({file, width, case: test.name, stage, dom, fullViewport: true});
}
async function run(width, test) {
  const context = await disposableContext(width, test), page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const expectedKey = test.contextual ? contextualKey : '||||';
  try {
    await page.goto(base + 'apply/' + (test.contextual ? routeQuery : '?lang=en'));
    const original = await page.evaluate(() => window.__lifetimeOriginal());
    const expectedRaw = test.remove && !test.denied ? null : original;
    assert.equal(await raw(page), expectedRaw);
    assert.equal(await page.locator('.draft-box').count(), test.accepted ? 1 : 0);
    assert.equal(await page.locator('#draftStatus').getAttribute('data-state'), test.accepted ? 'saved' : 'idle');
    assert.deepEqual((await calls(page)).remove, test.remove ? [key] : []);
    assert.deepEqual((await calls(page)).set, []);
    assert(!await page.locator('body').innerText().then(text => text.includes('OLD_ANONYMOUS')));
    await capture(page, width, test, 'initial');
    if (test.accepted) {
      await nativeResume(page);
      assert.equal(await page.locator('#firstName').inputValue(), 'OLD_ANONYMOUS');
      assert.equal(await page.locator('#lastName').inputValue(), 'FIXTURE');
      assert.equal(await page.locator('#phone').inputValue(), '+99912345678');
      assert.equal(await raw(page), original, 'Resume alone must not change the saved entry');
      await capture(page, width, test, 'resumed', '#firstName');
      await page.reload(); await nativeResume(page);
      const restored = JSON.parse(await raw(page)), before = JSON.parse(original);
      assert.equal(restored.id, before.id); assert.equal(restored.routeKey, expectedKey);
      assert.deepEqual(restored.data, before.data); assert.equal(restored.step, before.step);
      assert.equal(restored.savedAt, fixtureNow);
      assert.equal(await page.locator('#firstName').inputValue(), 'OLD_ANONYMOUS');
    } else {
      // Idle reload must neither resume nor overwrite a rejected anonymous entry.
      await page.reload();
      assert.equal(await raw(page), expectedRaw); assert.deepEqual((await calls(page)).set, []);
      assert.equal(await page.locator('.draft-box').count(), 0);
      assert.equal(await page.locator('#draftStatus').innerText(), '');
      assert.equal(await page.locator('#draftStatus').getAttribute('data-state'), 'idle');
      assert.deepEqual((await calls(page)).remove, test.remove && test.denied ? [key] : []);
      await page.locator('#languageSearch').fill('en');
      await page.locator('[data-language="en"]').click();
      await page.locator('[data-recruiter="yana"]').click();
      assert.equal(await page.locator('#firstName').inputValue(), '');
      assert.equal(await page.locator('#lastName').inputValue(), '');
      assert.equal(await page.locator('#phone').inputValue(), '');
      await page.locator('#firstName').fill('NEW_ANONYMOUS');
      const fresh = JSON.parse(await raw(page));
      assert.notEqual(fresh.id, 'KAND-OLD-ANONYMOUS-LIFETIME');
      assert.equal(fresh.version, '17.0.0'); assert.equal(fresh.routeKey, expectedKey);
      assert.equal(fresh.savedAt, fixtureNow); assert.equal(fresh.data.firstName, 'NEW_ANONYMOUS');
      assert.equal(fresh.data.lastName, ''); assert.equal(fresh.data.phone, '');
      assert.equal(fresh.data.consent, false);
      assert.equal(fresh.data.location, test.contextual ? 'siechnice' : '');
      assert.equal(await page.locator('#draftStatus').getAttribute('data-state'), 'saved');
      await capture(page, width, test, 'fresh', '#firstName');
      await page.reload(); await nativeResume(page);
      const restored = JSON.parse(await raw(page));
      assert.equal(restored.id, fresh.id); assert.equal(restored.routeKey, expectedKey);
      assert.deepEqual(restored.data, fresh.data);
      assert.equal(await page.locator('#firstName').inputValue(), 'NEW_ANONYMOUS');
      assert.equal(await page.locator('#lastName').inputValue(), '');
      assert.equal(await page.locator('#phone').inputValue(), '');
    }
    assert.equal(await page.evaluate(() => window.__lifetimeUnrelated()), 'KEEP');
    assert.deepEqual(errors, []);
    report.rows.push({width, case: test.name, status: 'passed', acceptedDraft: !!test.accepted,
      initialRemovalAttempt: !!test.remove, removalDenied: !!test.denied,
      idleRawPreservedAsExpected: true, noOldAnswerLeak: !test.accepted, sameIdAndAnswersAfterResumeReload: true,
      contextualRoute: !!test.contextual, unrelatedPreserved: true, noDelivery: true});
  } catch (error) {
    await page.screenshot({path: join(reportDir, `failure-lifetime-${width}-${test.name}.png`)}).catch(() => {});
    report.failedCase = {width, case: test.name, errors, calls: await calls(page).catch(() => null)};
    throw error;
  } finally { await context.close(); }
}
try {
  await origin.start(); browser = await chromium.launch({headless: true});
  report.browser = browser.version(); report.fixtureNow = fixtureNow; report.ttlMs = ttl;
  const matrix = [320, 1280].flatMap(width => cases.map(test => ({width, test})));
  let next = 0;
  await Promise.all(Array.from({length: 2}, async () => {
    while (next < matrix.length) { const item = matrix[next++]; await run(item.width, item.test); }
  }));
  assert.equal(report.rows.length, 24); assert.equal(report.captures.length, 48);
  assert.deepEqual(report.external, []); assert.deepEqual(report.mutations, []);
  report.applicationDeliveryAttempts = 0;
  report.status = 'PASSED_24_ANONYMOUS_LIFETIME_ROUTE_FLOWS_48_VIEWPORTS_PUBLISHED_SOURCE_EXACT';
} catch (error) { report.status = 'FAILED'; report.failure = error.stack; throw error; }
finally {
  await browser?.close(); await origin.stop(); report.finished = new Date().toISOString();
  await writeFile(join(reportDir, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n');
}
