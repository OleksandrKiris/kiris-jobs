// CI-only acceptance. Never starts a local preview, server or browser in the agent workspace.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (process.env.GITHUB_ACTIONS !== 'true') throw Error('Run only in the approved GitHub Actions acceptance job. No local browser launch.');
const { PLAYWRIGHT_PACKAGE, BROWSER_REPORT, TESTED_HEAD, TESTED_BASE } = process.env;
assert.ok(PLAYWRIGHT_PACKAGE && BROWSER_REPORT, 'Explicit Playwright package and report directory required');
for (const sha of [TESTED_HEAD, TESTED_BASE]) assert.match(sha || '', /^[0-9a-f]{40}$/);
const dir = dirname(fileURLToPath(import.meta.url)), root = dirname(dir);
const reportDir = resolve(BROWSER_REPORT);
const git = (...args) => execFileSync('git', ['-C', root, ...args]);
git('merge-base', '--is-ancestor', TESTED_HEAD, 'HEAD');
git('merge-base', '--is-ancestor', TESTED_BASE, 'HEAD');
const report = { status: 'running', head: TESTED_HEAD, base: TESTED_BASE,
  checkout: git('rev-parse', 'HEAD').toString().trim(), started: new Date().toISOString(),
  launch: 'downloaded folder via file://; no HTTP server, SW, PWA or public deployment',
  resources: [], scenarios: [], networkRequests: [], pageErrors: [],
  limitations: ['Chromium emulated viewport, not a physical phone',
    'External links inspected, not opened; no forms or messages sent',
    'v1 fixture compatibility, not an upgrade from a previously released coordinator',
    'Other browsers and optional localhost HTTP launch remain untested'] };
const files = ['index.html', 'model.js', 'app.js', 'style.css', 'primserv-logo.svg'];
for (const name of files) {
  const bytes = await readFile(join(dir, name));
  assert.deepEqual(bytes, git('show', `${TESTED_HEAD}:coordinator-demo/${name}`), `Exact-head bytes: ${name}`);
  report.resources.push({ path: `coordinator-demo/${name}`, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex') });
}
report.runtimeBytes = report.resources.reduce((sum, file) => sum + file.bytes, 0);
await mkdir(reportDir, { recursive: true });
const { chromium } = createRequire(import.meta.url)(PLAYWRIGHT_PACKAGE);
const { seedFixture } = createRequire(import.meta.url)('./browser-fixtures.cjs');
const KEY = 'primserv:coordinator-demo:v1', OTHER = 'primserv:acceptance:unrelated';
const initial = { version: 1, statuses: { 'demo-01': 'todo', 'demo-02': 'todo', 'demo-03': 'todo' } };
const previous = JSON.stringify({ version: 1, statuses: { ...initial.statuses, 'demo-02': 'done' } });
const fileURL = pathToFileURL(join(dir, 'index.html')).href;
const focus = async (page, id) => assert.equal(await page.evaluate(() => document.activeElement.id), id);
const fits = async page => assert.ok(await page.evaluate(() =>
  document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
const ready = async page => {
  await page.locator('#language').waitFor();
  await page.waitForFunction(() => document.querySelector('#filter').options.length === 4);
};
const keyClick = async (page, id) => { await page.locator(`#${id}`).focus(); await page.keyboard.press('Enter'); };
let browser;
try {
  browser = await chromium.launch({ headless: true });
  report.browser = `Chromium ${browser.version()}`;
  for (const scenario of [
    { name: 'board-wide', width: 1280, mode: 'empty' },
    { name: 'board-narrow', width: 320, mode: 'empty' },
    ...['v1', 'corrupt', 'future', 'denied-read', 'denied-write', 'denied-remove'].map(mode => ({ name: mode, width: 320, mode }))
  ]) {
    const viewport = { width: scenario.width, height: 900 };
    const context = await browser.newContext({ viewport });
    context.setDefaultTimeout(10000);
    const requests = [], errors = [];
    context.on('request', request => { if (!request.url().startsWith('file:')) requests.push({ method: request.method(), url: request.url() }); });
    // Any attempted network request is blocked and fails the run, including GET.
    await context.route(/^https?:/, route => route.abort());
    await context.addInitScript(seedFixture, { key: KEY, other: OTHER, mode: scenario.mode, previous });
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    try {
      // Start already offline: all five runtime files must already be on disk.
      await context.setOffline(true);
      await page.goto(`${fileURL}?lang=en&from=acceptance#board`); await ready(page);
      assert.equal(await page.evaluate(() => navigator.onLine), false);
      assert.equal(await page.locator('.task').count(), 3);
      assert.equal(await page.locator('#materials article').count(),1);
      assert.match(await page.locator('#materialsStatus').innerText(),/en.*ru/);
      assert.equal(await page.locator('#materials h3').getAttribute('lang'),'ru');
      const snapshotText=await page.locator('#materials').innerText();
      await page.locator('#materialsSource').selectOption('mock');
      assert.equal(await page.locator('#materials').innerText(),snapshotText);
      await page.locator('#materialsSource').selectOption('snapshot');
      await page.locator('#materialQuery').fill('bogatynia');
      assert.equal(await page.locator('#materials article').count(),0);
      assert.match(await page.locator('#materialsStatus').innerText(),/No confirmed material/);
      await page.locator('#materialQuery').fill('отходов');
      assert.equal(await page.locator('#materials article').count(),1);
      await page.locator('#materialQuery').fill('');
      await fits(page);
      if (scenario.mode === 'empty') {
        await page.locator('#language').focus(); await page.keyboard.press('Tab'); await focus(page, 'filter');
        await page.keyboard.press('Shift+Tab'); await focus(page, 'language');
        for (const lang of ['ru', 'uk', 'pl', 'en']) {
          await page.locator('#language').selectOption(lang);
          assert.equal(await page.locator('html').getAttribute('lang'), lang); await fits(page);
        }
        await page.locator('#demo-01').focus();
        await page.keyboard.press('End'); await page.keyboard.press('Enter');
        assert.equal(await page.locator('#demo-01').inputValue(), 'done'); await focus(page, 'demo-01');
        await page.locator('#filter').selectOption('done');
        await page.locator('#language').selectOption('uk');
        report.storageDiagnostics??=[];
        report.storageDiagnostics.push({scenario:scenario.name,phase:'before-reload',state:await page.evaluate(key=>({url:location.href,raw:localStorage.getItem(key),initial:window.__coordinatorInitialStorage}),KEY)});
        assert.equal(JSON.parse(await page.evaluate(key=>localStorage.getItem(key),KEY)).statuses['demo-01'],'done');
        await page.reload(); await ready(page);
        report.storageDiagnostics.push({scenario:scenario.name,phase:'after-reload',state:await page.evaluate(key=>({url:location.href,raw:localStorage.getItem(key),initial:window.__coordinatorInitialStorage}),KEY)});
        assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
        assert.equal(await page.locator('#filter').inputValue(), 'done');
        assert.equal(await page.locator('#demo-01').inputValue(), 'done');
        assert.equal(new URL(page.url()).searchParams.get('from'), 'acceptance');
        assert.equal(new URL(page.url()).hash, '#board');
        const savedURL = page.url();
        // Local navigation / Back, no external page or operational action.
        await page.goto(`${fileURL}?lang=ka`); await ready(page);
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        assert.equal(await page.locator('#fallback').isVisible(), true);
        await page.goBack(); await ready(page);
        assert.equal(page.url(), savedURL);
        assert.equal(await page.locator('#demo-01').inputValue(), 'done');
        await page.locator('#demo-01').focus();
        await page.locator('#demo-01').selectOption('doing'); await focus(page, 'filter');
        assert.equal(await page.locator('#empty').isVisible(), true);
        await keyClick(page, 'reset'); await focus(page, 'cancel');
        await page.keyboard.press('Enter'); await focus(page, 'reset');
        assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), KEY)).statuses['demo-01'], 'doing');
        await keyClick(page, 'reset'); await keyClick(page, 'confirm'); await focus(page, 'reset');
        assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), null);
        assert.equal(await page.evaluate(key => localStorage.getItem(key), OTHER), 'keep');
        await page.locator('#filter').selectOption('all');
        const links = await page.locator('#links a').evaluateAll(nodes => nodes.map(n => ({ href: n.href, target: n.target, rel: n.rel })));
        assert.deepEqual(links.map(link => link.href), ['https://www.primserv.pl/', 'https://oleksandrkiris.github.io/kiris-jobs/?lang=uk', 'https://oleksandrkiris.github.io/citronex-hydra-project/?lang=ua', 'https://t.me/KirisWorkPoland_bot']);
        assert.ok(links.every(link => link.target === '_blank' && link.rel === 'noopener noreferrer'));
        await page.screenshot({ path: join(reportDir, `${scenario.name}-offline-uk.png`), fullPage: true });
        await page.goto(`${fileURL}?lang=ua`); await ready(page);
        assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
        assert.equal(await page.locator('#fallback').isVisible(), false);
        await context.setOffline(false); await page.reload(); await ready(page);
      } else {
        if (scenario.mode === 'v1') assert.equal(await page.locator('#demo-02').inputValue(), 'done');
        if (['corrupt', 'future'].includes(scenario.mode)) assert.match(await page.locator('#storage').innerText(), /preserved/);
        if (scenario.mode === 'denied-read') assert.match(await page.locator('#storage').innerText(), /unavailable/);
        await page.locator('#demo-01').selectOption('doing');
        assert.equal(await page.locator('#demo-01').inputValue(), 'doing');
        if (scenario.mode === 'denied-write') assert.match(await page.locator('#storage').innerText(), /unavailable/);
        if (scenario.mode === 'denied-remove') {
          await keyClick(page, 'reset'); await keyClick(page, 'confirm');
          assert.match(await page.locator('#storage').innerText(), /cannot guarantee removal/);
          assert.equal(JSON.parse(await page.evaluate(key => localStorage.getItem(key), KEY)).statuses['demo-01'], 'doing');
          // Reproduce missing sessionStorage on file navigation deterministically.
          await page.evaluate(() => sessionStorage.clear());
        }
        if (scenario.mode !== 'denied-read') {
          const raw = await page.evaluate(key => localStorage.getItem(key), KEY);
          if (scenario.mode === 'corrupt') assert.equal(raw, '{broken');
          if (scenario.mode === 'future') assert.equal(raw, JSON.stringify({ version: 2, statuses: {} }));
          if (scenario.mode === 'denied-write') assert.equal(raw, previous);
          assert.equal(await page.evaluate(key => localStorage.getItem(key), OTHER), 'keep');
        }
        await page.reload(); await ready(page);
        if (scenario.mode === 'v1' || scenario.mode === 'denied-remove') {
          assert.equal(await page.locator('#demo-01').inputValue(), 'doing');
          assert.equal(await page.locator('#demo-02').inputValue(), 'done');
        } else assert.equal(await page.locator('#demo-01').inputValue(), 'todo');
        await page.screenshot({ path: join(reportDir, `${scenario.name}.png`), fullPage: true });
      }
      await fits(page); assert.deepEqual(errors, []); assert.deepEqual(requests, []);
      report.scenarios.push({ ...scenario, viewport, status: 'passed', offline: true,
        actions: scenario.mode === 'empty'
          ? ['offline file launch', 'keyboard status', 'four languages', 'filter/reload/Back', 'fallback', 'cancel/confirm reset', 'online recovery']
          : ['offline seeded launch', 'status edit', 'storage preservation', 'reload'],
        results: { networkRequests: requests.length, pageErrors: errors.length, horizontalOverflow: false },
        limitations: ['Emulated viewport, not a phone; external links not opened'] });
    } catch (error) {
      report.scenarios.push({ ...scenario, viewport, status: 'failed', error: error.stack });
      await page.screenshot({ path: join(reportDir, `${scenario.name}-failure.png`), fullPage: true }).catch(() => {});
      throw error;
    } finally {
      report.networkRequests.push(...requests); report.pageErrors.push(...errors);
      await context.tracing.stop({ path: join(reportDir, `${scenario.name}-trace.zip`) });
      await context.close();
    }
  }
  report.status = 'passed';
} catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; }
finally {
  await browser?.close(); report.finished = new Date().toISOString();
  await writeFile(join(reportDir, 'acceptance.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
