import {combineScreening} from './screening-phase.mjs';
import {assertScreeningRows} from './apply-screening.mjs';
import {assertFieldStatusProof} from './catalogue-field-status.mjs';
import {assertFormErrors,assertFormUpgrades,FORM_VACANCY_IDS} from './catalogue-form-errors.mjs';
import { assertApplyEntry } from './apply-entry.mjs';
import { assertHousingControls } from './catalogue-housing.mjs';
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
import { assertContrastRegressionRows } from './catalogue-contrast.mjs';
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
    '891539399d857f40a4fb3637ba11075517c6bf65', 'This composite requires reviewed SW80 algorithm plus the form-error locale import/cache revision');
  const workerSource=(await readFile(join(artifact,'sw.js'))).toString();
  assert.equal((workerSource.match(/formErrorLocale=1/g)||[]).length,4);
  const accepted108=workerSource.replace('kiris-jobs-v220-field-status-2026-10-18-2','kiris-jobs-v220-form-error-locale-2026-10-18-1').replaceAll('&fieldStatus=2','');
  assert.equal(execFileSync('git',['hash-object','--stdin'],{input:accepted108,encoding:'utf8'}).trim(),'725e9cc83e4492bb2e11bc525afce92e441a253c','Only the cache generation and reviewed error-state CSS query may differ from accepted PR108 worker');
  let oldAlgorithm=accepted108.replace('kiris-jobs-v220-form-error-locale-2026-10-18-1','kiris-jobs-v220-card-contrast-2026-10-18-1').replaceAll('&formErrorLocale=1','');
  for(const id of FORM_VACANCY_IDS)oldAlgorithm=oldAlgorithm.replace(',\n  "./vacancies/'+id+'/"','');
  oldAlgorithm=oldAlgorithm.replace('          || await caches.match(requestUrl.origin + requestUrl.pathname)\n','');
  assert.equal(execFileSync('git',['hash-object','--stdin'],{input:oldAlgorithm,encoding:'utf8'}).trim(),'8fd4f2a8d34259b18dcbf23e18afcaad0e6ce036','Only the reviewed import/cache revision and14 canonical vacancy-navigation entries may differ from the accepted worker');

  if (reuse.requireFullCurrentCatalogue) {
    const fullDir = join(reportDir, 'full-current');
    let failure;
    try {
      execFileSync(process.execPath, [new URL('./catalogue-full.mjs', import.meta.url).pathname, '--current-only'],
        { env: { ...process.env, BROWSER_REPORT: fullDir, SEPARATE_SCREENING:'1' }, timeout: 300000, maxBuffer: 8 * 1024 * 1024 });
    } catch (error) { failure = error; }
    if (failure) {
      report.fullCurrentCatalogue = { status: 'process-failed', processSucceeded: false,
        exitCode: failure.status ?? null, code: failure.code || null, error: failure.message };
      // Reject BEFORE reading any possibly stale passed JSON.
      assertFullCurrentResult(failure, undefined);
    }
    const rawFull = JSON.parse(await readFile(join(fullDir, 'acceptance.json'), 'utf8'));
    const screeningDir=join(fullDir,'screening');let screeningFailure;
    try {execFileSync(process.execPath,[new URL('./screening-runner.mjs',import.meta.url).pathname],
      {env:{...process.env,BROWSER_REPORT:screeningDir},timeout:300000,maxBuffer:8*1024*1024});}
    catch(error){screeningFailure=error;}
    if(screeningFailure)combineScreening(rawFull,undefined,screeningFailure,{});
    const screening=JSON.parse(await readFile(join(screeningDir,'acceptance.json'),'utf8'));
    const full=combineScreening(rawFull,screening,null,{head:report.head,base:report.base,checkout:report.checkout,publicationSHA256:staged.sha256});
    await writeFile(join(fullDir,'aggregate-acceptance.json'),JSON.stringify(full,null,2));
    assert.deepEqual(full.earlyInput?.map(x=>`${x.width}:${x.clear}`).sort(), ['1280:false','1280:true','320:false','320:true']);
    assert.ok(full.earlyInput.every(x=>x.status==='passed' && x.reload), 'Early-input typing/clear and persisted reload must all pass');
    assert.deepEqual(full.shortcutFonts?.map(x=>x.width).sort((a,b)=>a-b), [320,1280]);
    assert.ok(full.shortcutFonts.every(x=>x.status==='passed'), 'Delayed-font shortcuts must remain visible with denied storage');
    const contrastLocales=['pl','ru','uk','en','az','ka','id','es','fil','ne','hy'];
    assert.deepEqual(full.cardActionContrast?.map(x=>`${x.width}:${x.lang}`).sort(),
      [320,1280].flatMap(width=>contrastLocales.map(lang=>`${width}:${lang}`)).sort());
    assert.ok(full.cardActionContrast.every(x=>x.status==='passed'&&x.normal.length===17&&x.states.length===3));
    assertContrastRegressionRows(full.cardContrastOldRed,report.base);
    assertFieldStatusProof(full);assertFormErrors(full.formErrors);assertFormUpgrades(full.formUpgrades,execFileSync('git',['show',report.base+':sw.js']).toString()!==(await readFile(join(artifact,'sw.js'))).toString());
    assert.deepEqual(full.formErrorOldRed?.map(r=>r.width).sort((a,b)=>a-b),[320,1280]);assert.ok(full.formErrorOldRed.every(r=>r.iconClear===false));
    assert.equal(full.applySeaOldRed?.length,3);assert.deepEqual(full.applySeaOldRed.map(r=>r.lang).sort(),['fil','id','vi']);assert.ok(full.applySeaOldRed.every(r=>r.status==='expected-failure'&&r.ref==='e3c4f7da7334864f229bf6e276150a13bfae2af4'));
    assert.equal(full.applyProgressOldRed?.length,1);assert.ok(full.applyProgressOldRed.every(r=>r.status==='expected-failure'&&r.lang==='fil'&&r.width===320&&r.ref==='d1a0bbc4748b70edc12a88c821b86bc9208048e3'&&r.lines>1));
    assert.equal(full.applyHiNeOldRed?.length,2);assert.deepEqual(full.applyHiNeOldRed.map(r=>r.lang).sort(),['hi','ne']);assert.ok(full.applyHiNeOldRed.every(r=>r.status==='expected-failure'&&r.width===320&&r.ref==='6bc7550941e078eb7c95b3ea5feea2eb90619b48'));
    assert.equal(full.applyCentralOldRed?.length,3);assert.deepEqual(full.applyCentralOldRed.map(r=>r.lang).sort(),['kk','ky','tg']);assert.ok(full.applyCentralOldRed.every(r=>r.status==='expected-failure'&&r.width===320&&r.ref==='b974b534b8c378de1f82e63ec6334cefe33b90ce'));
    assert.equal(full.applyTailOldRed?.length,3);assert.deepEqual(full.applyTailOldRed.map(r=>r.lang).sort(),['bn','si','ur']);assert.ok(full.applyTailOldRed.every(r=>r.status==='expected-failure'&&r.width===320&&r.ref==='3e7f04bfbccb5caacb9141f7af193c802f6fb8cb'));
    assert.equal(full.applyUrduHintOldRed?.status,'expected-failure');assert.ok(full.applyUrduHintOldRed.plusX>full.applyUrduHintOldRed.lastDigitX);
    assert.equal(full.applyUrduCounterOldRed?.direction,'rtl');assert.ok(full.applyUrduCounterOldRed.firstX>full.applyUrduCounterOldRed.lastX);
    assert.equal(full.applyUrduPhoneOldRed?.direction,'rtl');assert.ok(full.applyUrduPhoneOldRed.plusX>full.applyUrduPhoneOldRed.lastDigitX);assert.equal(full.applyUrduPhoneOldRed.ref,'3e7f04bfbccb5caacb9141f7af193c802f6fb8cb');
    assertApplyEntry(full.applyEntry);assertScreeningRows(full.applyScreening);assert.equal(full.applyScreeningIconOldRed.length,1);assert.ok(full.applyScreeningIconOldRed[0].lines.some(n=>n>1));
    assert.equal(full.applyScreeningOldRed.length,2);assert.ok(full.applyScreeningOldRed.every(r=>r.status==='expected-failure'));
    assert.deepEqual(full.applyOldRed?.map(r=>r.width).sort((a,b)=>a-b),[320,1280]);
    assert.ok(full.applyOldRed.every(r=>r.status==='expected-failure'));
    assertHousingControls(full.housingControls);
    assert.deepEqual(full.housingGroups?.map(r=>`${r.width}:${r.cases}:${r.status}`).sort(),['1280:33:passed','320:33:passed']);
    report.fullCurrentCatalogue = { status: full.status, processSucceeded: true, head: full.head, base: full.base,
      checkout: full.checkout, scope: full.scope, report: 'full-current/aggregate-acceptance.json', rawCoreReport:'full-current/acceptance.json', screeningExecution:full.screeningExecution,
      passed: full.results.filter(x => x.status === 'passed').length,
      notApplicable: full.results.filter(x => x.status === 'not-applicable'), earlyInput: full.earlyInput,
      shortcutFonts: full.shortcutFonts,
      applyTailOldRed:full.applyTailOldRed,applyTailRegressionSource:full.applyTailRegressionSource,applyUrduPhoneOldRed:full.applyUrduPhoneOldRed,applyUrduCounterOldRed:full.applyUrduCounterOldRed,applyUrduHintOldRed:full.applyUrduHintOldRed,
      applyCentralOldRed:full.applyCentralOldRed,applyCentralRegressionSource:full.applyCentralRegressionSource,
      applyHiNeOldRed:full.applyHiNeOldRed,applyHiNeRegressionSource:full.applyHiNeRegressionSource,
      applyProgressOldRed:full.applyProgressOldRed,applyProgressRegressionSource:full.applyProgressRegressionSource,
      applySeaOldRed:full.applySeaOldRed,applySeaRegressionSource:full.applySeaRegressionSource,
      applyScreening:full.applyScreening,applyScreeningOldRed:full.applyScreeningOldRed,applyScreeningIconOldRed:full.applyScreeningIconOldRed,
      formErrors:full.formErrors,formFieldStatusOldRed:full.formFieldStatusOldRed,formFieldLifecycle:full.formFieldLifecycle,formUpgrades:full.formUpgrades,formErrorOldRed:full.formErrorOldRed,
      applyEntry:full.applyEntry, applyOldRed:full.applyOldRed, applyRegressionSource:full.applyRegressionSource,
      housingControls:full.housingControls, housingReturns:full.housingReturns, housingGroups:full.housingGroups,
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
      workerBlob: '891539399d857f40a4fb3637ba11075517c6bf65', workerSHA256: sha256(await readFile(join(artifact, 'sw.js'))) },
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

