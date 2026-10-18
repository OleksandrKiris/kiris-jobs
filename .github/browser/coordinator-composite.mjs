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
import { captureStagedPublication, captureCurrentToolTarget, gitPublication, publicationReuse, selectToolTarget, toolInput, assertFullCurrentResult, transitionForTarget } from './catalogue-scope.mjs';
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
    'Pinned historical published worker/tool input is separate from event base; subsequent tool entry is offline with the origin stopped.']
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

  report.currentScenario = 'publication-guard';
  const reused = JSON.parse(await readFile(new URL('./catalogue-reuse.json', import.meta.url), 'utf8'));
  const oldHashes = Object.fromEntries(TOOL_FILES.map(name =>
    [name, reused.files['tools/coordinator/' + name].sha256]));
  // Make only the pinned reference object/five small sources available. Past
  // media are represented by Git object identities, never downloaded here.
  publishedToolBytes({ ref: reused.head, hashes: oldHashes }, false);
  const staged = captureStagedPublication(checkout, artifact, report.checkout);
  const historical = gitPublication(checkout, reused.head);
  const reuse = publicationReuse(historical, staged.files);
  originalTools = new Map(await Promise.all(TOOL_FILES.map(async name =>
    [name, await readFile(join(artifact, 'tools/coordinator', name))])));
  const actualHashes = Object.fromEntries([...originalTools].map(([name, bytes]) => [name, sha256(bytes)]));
  const currentTarget = captureCurrentToolTarget(checkout, report.head, staged, originalTools, report.base);
  report.currentStagedHead = { sourceHead: currentTarget.sourceHead, testedHead: report.head, checkout: report.checkout,
    eventBase: report.base, checkoutParents: currentTarget.checkoutParents,
    inventorySHA256: staged.sha256, files: staged.files.length, actualToolHashes: actualHashes,
    expectedCurrentTools: currentTarget.resources };
  const mode = selectToolTarget(actualHashes, oldHashes, currentTarget.hashes);
  report.currentStagedHead.toolMode = mode;
  report.historicalEvidence = { head: reused.head, base: reused.base, run: reused.run,
    artifact: reused.artifact, zipSHA256: reused.zipSHA256, historicalGroups: 33,
    historicalTotalGroups: 48, historical33IsCurrentRun: false, publicationComparison: reuse };
  await writeFile(join(reportDir, 'publication-manifest.json'), JSON.stringify(staged, null, 2));
  await writeFile(join(reportDir, 'historical-publication.json'), JSON.stringify({ ref: reused.head, files: historical }, null, 2));
  assert.equal(execFileSync('git', ['hash-object', 'sw.js'], { encoding: 'utf8' }).trim(),
    '8fd4f2a8d34259b18dcbf23e18afcaad0e6ce036', 'This composite requires reviewed SW80 code plus the card-contrast shell revision');

  if (reuse.requireFullCurrentCatalogue) {
    const fullDir = join(reportDir, 'full-current');
    let failure;
    try {
      execFileSync(process.execPath, [new URL('./catalogue-full.mjs', import.meta.url).pathname, '--current-only'],
        { env: { ...process.env, BROWSER_REPORT: fullDir }, timeout: 300000, maxBuffer: 8 * 1024 * 1024 });
    } catch (error) { failure = error; }
    if (failure) {
      report.fullCurrentCatalogue = { status: 'process-failed', processSucceeded: false,
        exitCode: failure.status ?? null, code: failure.code || null, error: failure.message };
      // Reject BEFORE reading any possibly stale passed JSON.
      assertFullCurrentResult(failure, undefined);
    }
    const full = JSON.parse(await readFile(join(fullDir, 'acceptance.json'), 'utf8'));
    assert.deepEqual(full.earlyInput?.map(x=>`${x.width}:${x.clear}`).sort(), ['1280:false','1280:true','320:false','320:true']);
    assert.ok(full.earlyInput.every(x=>x.status==='passed' && x.reload), 'Early-input typing/clear and persisted reload must all pass');
    assert.deepEqual(full.shortcutFonts?.map(x=>x.width).sort((a,b)=>a-b), [320,1280]);
    assert.ok(full.shortcutFonts.every(x=>x.status==='passed'), 'Delayed-font shortcuts must remain visible with denied storage');
    const contrastLocales=['pl','ru','uk','en','az','ka','id','es','fil','ne','hy'];
    assert.deepEqual(full.cardActionContrast?.map(x=>`${x.width}:${x.lang}`).sort(),
      [320,1280].flatMap(width=>contrastLocales.map(lang=>`${width}:${lang}`)).sort());
    assert.ok(full.cardActionContrast.every(x=>x.status==='passed'&&x.normal.length===17&&x.states.length===3));
    assert.deepEqual(full.cardContrastOldRed?.map(x=>x.width).sort((a,b)=>a-b),[320,1280]);
    assert.ok(full.cardContrastOldRed.every(x=>x.base===report.base&&x.status==='expected-failure-observed'&&x.button.ratio<4.5));
    report.fullCurrentCatalogue = { status: full.status, processSucceeded: true, head: full.head, base: full.base,
      checkout: full.checkout, scope: full.scope, report: 'full-current/acceptance.json',
      passed: full.results.filter(x => x.status === 'passed').length,
      notApplicable: full.results.filter(x => x.status === 'not-applicable'), earlyInput: full.earlyInput,
      shortcutFonts: full.shortcutFonts,
      cardActionContrast:full.cardActionContrast.map(x=>({width:x.width,lang:x.lang,status:x.status})),
      cardContrastOldRed:full.cardContrastOldRed, error: full.error || null };
    assertFullCurrentResult(failure, full, { head: report.head, base: report.base, checkout: report.checkout,
      tools: currentTarget.resources, workerChanged: execFileSync('git', ['show', report.base + ':sw.js']).toString()
        !== (await readFile(join(artifact, 'sw.js'))).toString() });
    assert.equal(captureStagedPublication(checkout, artifact, report.checkout).sha256, staged.sha256,
      'Full-current core must leave the actual staged HEAD intact');
  }

  const candidate = toolInput(mode, currentTarget.files, () => publishedToolBytes(JOINT_TOOL_TRANSITION.target, false));
  const targetHashes = Object.fromEntries([...candidate.files].map(([name, bytes]) => [name, sha256(bytes)]));
  const transition = transitionForTarget(JOINT_TOOL_TRANSITION,
    { head: currentTarget.sourceHead, base: report.base, hashes: targetHashes, mode });
  report.compositeReceipt = {
    kind: mode === 'actual-staged-head' ? 'actual-staged-head-with-pinned-published-base' : 'composite-test-inputs', version: 2,
    currentStagedHead: report.currentStagedHead, eventBase: transition.eventBase,
    shell: { sourceHead: report.head, checkout: report.checkout, files: report.files,
      workerBlob: '8fd4f2a8d34259b18dcbf23e18afcaad0e6ce036', workerSHA256: sha256(await readFile(join(artifact, 'sw.js'))) },
    candidate5: { sourceHead: transition.target.ref, sourcePath: 'coordinator-demo/',
      stagedPath: 'tools/coordinator/', hashes: targetHashes, actualStagedHead: mode === 'actual-staged-head' },
    publishedOld5: { sourceHead: transition.published.ref, hashes: transition.published.hashes },
    acceptedCandidateReference: JOINT_TOOL_TRANSITION.target.ref,
    scope: '19 current groups:4HTTPfunctional +10warmcuts +5coldcuts',
    limitation: mode === 'actual-staged-head' ? 'Target is captured actual HEAD5; no external target overlay.'
      : 'Actual OLD tuple independently verified. Candidate overlay is a separate test input, not current HEAD runtime.'
  };
  await startServer();
  browser = await chromium.launch({ headless: true });
  report.browser = `Chromium ${browser.version()} / Playwright 1.56.1`;
  if (mode !== 'actual-staged-head') {
    for (const [name, bytes] of candidate.files) await writeFile(join(artifact, 'tools/coordinator', name), bytes);
  }
  await acceptCoordinatorHTTP({ report, reportDir, base, context, ready, fits, shot,
    active: page => { activePage = page; }, startServer, stopServer, targetFiles: candidate.files });
  await acceptCoordinatorRefresh({ artifact, reportDir, report, base, origin, context,
    ready, fits, shot, active: page => { activePage = page; }, startServer, stopServer,
    transition, targetFiles: candidate.files });
  assert.equal(report.results.length, 19, 'Exactly19 current composite groups are required');
  assert.equal(report.results.filter(result => result.transition === 'pr68-http').length, 4);
  assert.equal(report.results.filter(result => result.transition === 'pr68').length, 15);

  for (const [name, bytes] of originalTools) await writeFile(join(artifact, 'tools/coordinator', name), bytes);
  assert.equal(captureStagedPublication(checkout, artifact, report.checkout).sha256, staged.sha256,
    'Actual staged HEAD must be restored after all test phases');
  report.currentStagedHead.restoredAndVerified = true;

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

