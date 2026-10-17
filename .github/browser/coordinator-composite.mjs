// Runs only in the user-authorized GitHub Actions browser environment.
// No submissions: only local GET/HEAD, with external requests blocked.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { staticOrigin } from './static-origin.mjs';
import { acceptCoordinatorHTTP } from './coordinator-http.mjs';
import { acceptCoordinatorRefresh, JOINT_TOOL_TRANSITION, publishedToolBytes, TOOL_FILES } from './coordinator-refresh.mjs';

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
    'Coordinator offline tests disable the browser network and stop the origin server; a cold entry has no cached tool.',
    'The actual base worker downloads the tool before upgrading to the head worker; subsequent tool entry is offline with the origin stopped.']
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
const base = 'http://127.0.0.1:4173/kiris-jobs/';
const origin = staticOrigin(serveRoot);
async function startServer() {
  await origin.start();
}
async function stopServer() {
  await origin.stop();
  await assert.rejects(fetch(base), 'The origin must really be unreachable during offline acceptance');
}
let originalTools;
let browser;
let activePage;
const mutations = [];
try {
  await startServer();
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

  const reused = JSON.parse(await readFile(new URL('./catalogue-reuse.json', import.meta.url), 'utf8'));
  for (const [name, value] of Object.entries(report.files)) {
    assert.equal(value.sha256, reused.files[name].sha256, 'Reused public shell hash: ' + name);
  }
  originalTools = new Map(await Promise.all(TOOL_FILES.map(async name =>
    [name, await readFile(join(artifact, 'tools/coordinator', name))])));
  for (const [name, bytes] of originalTools) {
    assert.equal(sha256(bytes), reused.files['tools/coordinator/' + name].sha256, 'Unchanged branch baseline: ' + name);
  }
  publishedToolBytes({ ref: reused.head, hashes: Object.fromEntries(TOOL_FILES.map(name =>
    [name, reused.files['tools/coordinator/' + name].sha256])) }, false);
  const sinceProof = execFileSync('git', ['diff', '--name-only', reused.head, 'HEAD'], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  const inheritedBackend77 = ['backend/core/material_response.py',
    'backend/tests/core/test_material_response.py', 'docs/backend/core/material-response-bytes.md'];
  assert.deepEqual(sinceProof.filter(path => !path.startsWith('.github/browser/')
    && !inheritedBackend77.includes(path)), [], 'Reusing old catalogue groups requires ALL public source paths unchanged');
  const candidate = publishedToolBytes(JOINT_TOOL_TRANSITION.target, false);
  assert.equal(execFileSync('git', ['hash-object', 'sw.js'], { encoding: 'utf8' }).trim(),
    '50ef25e6f86f4d95897e94bb391896d8d22141c6', 'This composite requires the real SW80 fix');
  report.compositeReceipt = {
    kind: 'composite-test-inputs', version: 1,
    shell: { sourceHead: report.head, checkout: report.checkout, files: report.files,
      workerBlob: '50ef25e6f86f4d95897e94bb391896d8d22141c6', workerSHA256: sha256(await readFile(join(artifact, 'sw.js'))) },
    candidate5: { sourceHead: JOINT_TOOL_TRANSITION.target.ref, sourcePath: 'coordinator-demo/',
      stagedPath: 'tools/coordinator/', hashes: JOINT_TOOL_TRANSITION.target.hashes },
    publishedOld5: { sourceHead: JOINT_TOOL_TRANSITION.published.ref, hashes: JOINT_TOOL_TRANSITION.published.hashes },
    scope: '19 current groups:4HTTPfunctional +10warmcuts +5coldcuts',
    limitation: 'Overlay receipt, not a claim that candidate5 belongs to the shell Git commit. SW80 is a release prerequisite.'
  };
  report.reusedEvidence = { head: reused.head, base: reused.base, run: reused.run,
    artifact: reused.artifact, zipSHA256: reused.zipSHA256, scope: reused.scope,
    reportedPublicHashesEqual: true, changedPathsSinceProof: sinceProof, old33BrowserGroupsReexecuted: false };
  for (const [name, bytes] of candidate.files) await writeFile(join(artifact, 'tools/coordinator', name), bytes);
  await acceptCoordinatorHTTP({ report, reportDir, base, context, ready, fits, shot,
    active: page => { activePage = page; }, startServer, stopServer });
  await acceptCoordinatorRefresh({ artifact, reportDir, report, base, origin, context,
    ready, fits, shot, active: page => { activePage = page; }, startServer, stopServer,
    transition: JOINT_TOOL_TRANSITION });
  assert.equal(report.results.length, 19, 'Exactly19 current composite groups are required');
  assert.equal(report.results.filter(result => result.transition === 'pr68-http').length, 4);
  assert.equal(report.results.filter(result => result.transition === 'pr68').length, 15);

  for (const path of ['coordinator-demo/', 'offline-tools/', 'backend/core/views.py', 'tools/coordinator/test.cjs', 'tools/coordinator/browser-acceptance.mjs']) {
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
  if (originalTools) for (const [name, bytes] of originalTools) await writeFile(join(artifact, 'tools/coordinator', name), bytes);
  await browser?.close();
  await origin.stop();
  report.finished = new Date().toISOString(); report.blockedMutations = mutations;
  await writeFile(join(reportDir, 'acceptance.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

