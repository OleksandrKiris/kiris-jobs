// Runs only in the user-authorized GitHub Actions browser environment.
// No submissions: only local GET/HEAD, with external requests blocked.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { once } from 'node:events';

assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Use the authorized CI runner');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE);
const checkout = process.cwd();
const artifact = resolve(process.env.PAGES_ARTIFACT);
const reportDir = resolve(process.env.BROWSER_REPORT);
await mkdir(reportDir, { recursive: true });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const report = {
  head: process.env.TESTED_HEAD, base: process.env.TESTED_BASE,
  checkout: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  started: new Date().toISOString(), browser: '', results: [], files: {},
  limits: ['Desktop Chromium; narrow viewport is not a physical phone.',
    'External services are blocked; HRappka delivery and Telegram are not tested.',
    'Offline means browser network disabled after successful local installation.',
    'Cache version unchanged; no new service-worker migration is introduced.']
};
for (const file of ['index.html', 'sw.js', 'assets/bootstrap.js', 'assets/candidate.js',
  'assets/i18n.js', 'assets/candidate-base.css', 'assets/clean.css', 'assets/homepage.css',
  'data/content.js', 'manifest.webmanifest']) {
  const bytes = await readFile(join(artifact, file));
  assert.equal(sha256(bytes), sha256(await readFile(join(checkout, file))), file);
  report.files[file] = { bytes: bytes.length, sha256: sha256(bytes) };
}

const serveRoot = await mkdtemp(join(tmpdir(), 'primserv-browser-site-'));
await symlink(artifact, join(serveRoot, 'kiris-jobs'), 'dir');
const server = spawn(process.execPath, [join(checkout, 'scripts/serve.mjs'), '4173'], {
  cwd: serveRoot, stdio: ['ignore', 'pipe', 'pipe']
});
const base = 'http://127.0.0.1:4173/kiris-jobs/';
let browser;
let activePage;
const mutations = [];
try {
  await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(([code]) => { throw Error(`Server exited: ${code}`); }),
    new Promise((_, reject) => setTimeout(() => reject(Error('Server startup timeout')), 10000).unref())
  ]);
  browser = await chromium.launch({ headless: true });
  report.browser = `Chromium ${browser.version()} / Playwright 1.56.1`;

  async function context(viewport, storageMode = '') {
    const ctx = await browser.newContext({ viewport, locale: 'pl-PL', serviceWorkers: 'allow' });
    ctx.setDefaultTimeout(15000);
    await ctx.route('**/*', route => {
      const request = route.request();
      if (!['GET', 'HEAD'].includes(request.method())) {
        mutations.push({ method: request.method(), url: request.url().split('?')[0] });
        return route.abort();
      }
      if (new URL(request.url()).origin !== new URL(base).origin) return route.abort();
      return route.continue();
    });
    if (storageMode === 'corrupt') await ctx.addInitScript(() => {
      sessionStorage.setItem('kiris-jobs:catalog-context:v1', '{broken');
      localStorage.setItem('kiris-jobs:language:v1', 'unknown');
    });
    if (storageMode === 'denied') await ctx.addInitScript(() => {
      for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(window, key, {
        get() { throw new DOMException('Test storage denied', 'SecurityError'); }
      });
    });
    return ctx;
  }
  async function ready(page) {
    await page.locator('#job-grid[aria-busy="false"]').waitFor({ state: 'attached' });
    await page.waitForFunction(() => Boolean(window.PortalI18n));
  }
  async function locale(page, lang) {
    await page.locator('.language-switcher-button').click();
    await page.locator(`[data-language-option="${lang}"]`).click();
    await page.waitForFunction(value => document.documentElement.lang === value, lang);
  }
  async function fits(page) {
    const sizes = await page.evaluate(() => ({ viewport: innerWidth,
      document: document.documentElement.scrollWidth }));
    assert.ok(sizes.document <= sizes.viewport + 1, `Horizontal overflow: ${JSON.stringify(sizes)}`);
  }
  async function shot(page, name) {
    await page.screenshot({ path: join(reportDir, `${name}.png`), fullPage: false });
  }

  for (const viewport of [{ width: 1280, height: 900 }, { width: 320, height: 900 }]) {
    const ctx = await context(viewport);
    const errors = [];
    const page = activePage = await ctx.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const prefix = `catalogue-${viewport.width}`;
    await ctx.tracing.start({ screenshots: true, snapshots: true, sources: false });
    try {
      await page.goto(`${base}?lang=pl`);
      await ready(page);
      assert.equal(await page.locator('.job-card').count(), 14);
      await fits(page);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator('.skip-link').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#main-content').evaluate(el => el === document.activeElement), true);
      await shot(page, `${prefix}-initial`);

      // Change PL -> UK using the visible switcher's keyboard controls.
      await page.locator('.language-switcher-button').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement?.hasAttribute('data-language-option'));
      await page.keyboard.press('Home');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.documentElement.lang === 'uk');
      assert.match(await page.locator('[data-primserv-service="training"]').first().getAttribute('href'), /lang=ua/);
      await page.locator('#job-search').fill('Siechnice');
      await page.locator('[data-country-filter="PL"]').click();
      assert.ok(await page.locator('#job-grid .job-card').count() > 0);
      await page.reload(); await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      assert.equal(await page.locator('[data-country-filter="PL"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
      await fits(page);
      await shot(page, `${prefix}-filtered`);

      const offer = page.locator('[data-open-job="greenhouse-tomatoes"]');
      await offer.focus(); await page.keyboard.press('Enter');
      await page.locator('#job-page-title').waitFor();
      // Direct vacancy pages do not render the catalogue grid.
      await page.waitForFunction(() => Boolean(window.PortalI18n));
      assert.match(page.url(), /vacancies\/greenhouse-tomatoes/);
      await fits(page);
      const form = page.locator('#direct-vacancy-content [data-hrappka-link]');
      assert.match(await form.getAttribute('href'), /^https:\/\/aplikuj\.hrappka\.pl\/oferta\//);
      assert.equal(await form.getAttribute('target'), '_blank');
      // Read the existing form link only: do not visit/submit external forms.
      const photo = page.locator('#direct-vacancy-content .housing-grid a').first();
      await photo.focus(); await page.keyboard.press('Enter');
      await page.locator('#housing-lightbox[open]').waitFor();
      await page.waitForFunction(() => document.querySelector('[data-housing-lightbox-image]').naturalWidth > 0);
      const firstPhoto = await page.locator('[data-housing-lightbox-image]').getAttribute('src');
      await page.keyboard.press('ArrowRight');
      assert.notEqual(await page.locator('[data-housing-lightbox-image]').getAttribute('src'), firstPhoto);
      await page.waitForFunction(() => document.querySelector('[data-housing-lightbox-image]').complete
        && document.querySelector('[data-housing-lightbox-image]').naturalWidth > 0);
      await shot(page, `${prefix}-photo`);
      await page.keyboard.press('Escape');
      await page.locator('#housing-lightbox[open]').waitFor({ state: 'hidden' });
      assert.equal(await photo.evaluate(el => el === document.activeElement), true);
      await page.goBack(); await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');

      await page.locator('#job-search').fill('no-such-vacancy-fixture');
      await page.locator('#empty-state').waitFor();
      await page.locator('#reset-filters').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#job-search').inputValue(), '');
      assert.equal(await page.locator('.job-card').count(), 14);
      await locale(page, 'en');
      // ka is actually supported by the catalogue (11 languages); keep it.
      await locale(page, 'ka');
      await locale(page, 'en');
      await fits(page);

      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      const cacheBefore = await page.evaluate(async () => {
        const names = await caches.keys();
        const name = names.find(x => x.startsWith('kiris-jobs-v220-'));
        const cache = await caches.open(name);
        return { names, entries: (await cache.keys()).length };
      });
      assert.ok(cacheBefore.names.some(x => x.startsWith('kiris-jobs-v220-')));
      await page.locator('#job-search').fill('Siechnice');
      await ctx.setOffline(true);
      await page.waitForFunction(() => navigator.onLine === false);
      await page.reload(); await ready(page);
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      assert.ok(await page.locator('#job-grid .job-card').count() > 0);
      await fits(page);
      await shot(page, `${prefix}-offline`);
      await ctx.setOffline(false);
      await page.reload(); await ready(page);
      const cacheAfter = await page.evaluate(async () => (await caches.keys()).filter(x => x.startsWith('kiris-jobs-')));
      assert.deepEqual(cacheAfter, cacheBefore.names.filter(x => x.startsWith('kiris-jobs-')));
      assert.deepEqual(errors, []);
      report.results.push({ scenario: 'catalogue-route', viewport, status: 'passed', cacheBefore,
        steps: ['PL -> UK keyboard', 'search/country/reload', 'vacancy/photo/next/Escape/focus/Back',
          'HRappka link unchanged (no external visit)', 'empty/reset', 'EN/KA/EN', 'offline/reload/context', 'online recovery'] });
    } catch (error) {
      await shot(page, `${prefix}-failure`).catch(() => {});
      throw error;
    } finally {
      await ctx.tracing.stop({ path: join(reportDir, `${prefix}-trace.zip`) });
      await ctx.close(); activePage = null;
    }
  }

  for (const mode of ['corrupt', 'denied']) {
    const ctx = await context({ width: 320, height: 900 }, mode);
    const page = activePage = await ctx.newPage();
    try {
      // An unsupported URL and corrupt saved locale fall back to browser PL.
      await page.goto(`${base}?lang=${mode === 'corrupt' ? 'xx' : 'en'}`); await ready(page);
      assert.equal(await page.locator('html').getAttribute('lang'), mode === 'corrupt' ? 'pl' : 'en');
      await page.locator('#job-search').fill('Siechnice');
      assert.ok(await page.locator('#job-grid .job-card').count() > 0);
      await locale(page, 'uk'); await fits(page);
      await shot(page, `storage-${mode}`);
      report.results.push({ scenario: `storage-${mode}`, status: 'passed', viewport: { width: 320, height: 900 } });
    } finally { await ctx.close(); activePage = null; }
  }

  for (const path of ['coordinator-demo/', 'offline-tools/']) {
    // Use a separate request context so the existing navigation SW fallback
    // cannot disguise the actual publication boundary as the catalogue shell.
    const response = await fetch(base + path);
    assert.equal(response.status, 404, path);
  }
  for (const path of ['apply/', 'apply/pdf/', 'manifest.webmanifest', 'sw.js', 'assets/primserv-logo.svg']) {
    assert.equal((await fetch(base + path)).status, 200, path);
  }
  // Existing aggregate page-view telemetry is intercepted, never sent.
  // Any business submission or other mutation attempt still fails acceptance.
  assert.deepEqual(mutations.filter(request => request.method !== 'POST'
    || request.url !== 'https://candidate-form-flow.lovable.app/api/public/funnel'), []);
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = error.stack;
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: join(reportDir, 'failure.png') }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  report.finished = new Date().toISOString(); report.blockedMutations = mutations;
  await writeFile(join(reportDir, 'acceptance.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
