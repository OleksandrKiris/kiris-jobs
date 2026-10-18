// CI-only acceptance. Never starts a local preview, server or browser in the agent workspace.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withFileProfile } from './browser-profile.mjs';
import { captureStorageIdentity,compareStorageIdentity,hasCompleteIdentity } from './storage-identity.mjs';
import { captureBackendOpen,compareBackendOpen,hasCompleteBackendOpen } from './backend-open-observation.mjs';

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
  profile: 'fresh isolated on-disk Chromium profile per scenario; no storage import or replay',
  resources: [], scenarios: [], networkRequests: [], pageErrors: [],
  limitations: ['Chromium emulated viewport, not a physical phone',
    'External links inspected, not opened; no forms or messages sent',
    'v1 fixture compatibility, not an upgrade from a previously released coordinator',
    'Incognito file storage, other browsers and optional localhost HTTP launch remain untested'] };
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
const { seedNativeFixture, installFixtureHooks, acceptanceStatus } = createRequire(import.meta.url)('./browser-fixtures.cjs');
const KEY = 'primserv:coordinator-demo:v1', OTHER = 'primserv:acceptance:unrelated';
const initial = { version: 1, statuses: { 'demo-01': 'todo', 'demo-02': 'todo', 'demo-03': 'todo' } };
const previous = JSON.stringify({ version: 1, statuses: { ...initial.statuses, 'demo-02': 'done' } });
const fileURL = pathToFileURL(join(dir, 'index.html')).href;
const readEvidence=()=>({
  fixture:window.__coordinatorEvidence||null,model:window.__coordinatorObservedModel?.snapshot()||null,
  focused:document.activeElement?.id,url:location.href,
  dom:{summary:document.querySelector('#summary')?.textContent,storage:document.querySelector('#storage')?.textContent,
    filter:document.querySelector('#filter')?.value,tasks:[...document.querySelectorAll('#tasks select')].map(x=>({id:x.id,value:x.value}))}
});
report.storageEvidence=[];
report.storageIdentity=[];
report.backendOpen=[];
report.backendOpenObservation={effect:"Extra browser CDP attach/read/detach changes timing; not a fix",
  scope:"Existing six observed state reloads only; cumulative process-wide open telemetry selected from each measured profile",
  sourceRevision:null, // No universal revision: see each sample.provenance.
  provenanceContract:"Per-sample measured profile/version, selected schema, source revision and attempted names; unknown fields remain null",
  limits:"Missing/empty is unavailable, unchanged is no new open sample; OK includes memory/recovery, not KEY commit/load/durability"};
report.identityObservation={scope:'Only six explicitly observed scenarios, state reload only; original controls and restarts unchanged',
  effect:'Extra CDP attach/read-only RPC/detach round trips can change timing; not a causal fix',
  context:'Optional browserContextId is kept null when not reported; no fabricated context ID',
  protocolSource:'https://raw.githubusercontent.com/microsoft/playwright/v1.56.1/packages/playwright-core/src/server/chromium/protocol.d.ts',
  protocolSourceSha256:'3f6ef9c13ca4e92bc06426a01f2c3198448e949f64f62eb02e2db23146a8d06c',
  acceptance:'Issue79 remains open; even green observation does not accept PR68 or establish Chromium cause'};
const backendOpenProvenance=sample=>{
  const maxCode=sample.profile==='chromium141'?5:sample.profile==='chromium156'?6:null;
  return {measuredProfile:sample.profile??null,measuredVersion:sample.version??null,
    schema:maxCode===null?null:{id:sample.profile==='chromium141'?'legacy-leveldb-status':'dom-storage-db-status',minCode:0,maxCode},
    sourceRevision:maxCode===null?null:sample.version?.revision?.replace(/^@/,'')??null,
    attemptedHistogramNames:sample.requests.filter(x=>x.method==='Browser.getHistogram').map(x=>x.params.name)};
};
const observeIdentity=async(context,page,scenario,phase)=>{
  const sample=await captureStorageIdentity(context,page);
  report.storageIdentity.push({scenario:scenario.name,phase,...sample});
  const backend=await captureBackendOpen(context);
  report.backendOpen.push({scenario:scenario.name,phase,...backend,provenance:backendOpenProvenance(backend)});
};
report.observationProtocol={control:'No observer; one native fixture preparation before the tested journey',
  passive:'Wrap existing storage calls and retain real model; no added storage reads, but CPU/payload timing changes',
  preseed:'Passive plus one labelled raw read during ready-document fixture preparation, before tested edits',
  failure:'Unobserved controls inspected only after the original assertion failed; never retried'};
const collectEvidence=async(page,scenario,phase)=>report.storageEvidence.push({scenario:scenario.name,phase,...await page.evaluate(readEvidence)});
const focus = async (page, id, scenario) => {
  if(!scenario?.observe)return assert.equal(await page.evaluate(() => document.activeElement.id), id);
  // Same existing evaluate call; larger returned payload, no added storage read.
  const data=await page.evaluate(readEvidence);
  report.storageEvidence.push({scenario:scenario.name,phase:'existing-focus-read',...data});
  assert.equal(data.focused,id);
};
const fits = async page => assert.ok(await page.evaluate(() =>
  document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
const ready = async page => {
  await page.locator('#language').waitFor();
  await page.waitForFunction(() => document.querySelector('#filter').options.length === 4);
};
const keyClick = async (page, id) => { await page.locator(`#${id}`).focus(); await page.keyboard.press('Enter'); };
let browser;
try {
  for (const scenario of [
    { name: 'board-wide', width: 1280, mode: 'empty' },
    { name: 'board-narrow', width: 320, mode: 'empty' },
    ...['v1', 'corrupt', 'future', 'denied-read', 'denied-write', 'denied-remove'].map(mode => ({ name: mode, width: 320, mode })),
    ...['passive','preseed'].flatMap(observe=>[
      {name:'observed-wide-'+observe,width:1280,mode:'empty',observe},
      {name:'observed-narrow-'+observe,width:320,mode:'empty',observe},
      {name:'observed-v1-'+observe,width:320,mode:'v1',observe}
    ])
  ]) {
    const viewport = { width: scenario.width, height: 900 };
    await withFileProfile(chromium,viewport,async profile=>{
    const context = profile.context;
    browser = context.browser();
    report.browser = `Chromium ${browser.version()}`;
    context.setDefaultTimeout(10000);
    const requests = [], errors = [];
    context.on('request', request => { if (!request.url().startsWith('file:')) requests.push({ method: request.method(), url: request.url() }); });
    // Any attempted network request is blocked and fails the run, including GET.
    await context.route(/^https?:/, route => route.abort());
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    try {
      // Start already offline: all five runtime files must already be on disk.
      await context.setOffline(true);
      await page.goto(`${fileURL}?lang=en&from=acceptance#board`); await ready(page);
      const fixtureArgs={key:KEY,other:OTHER,mode:scenario.mode,previous,observe:scenario.observe||false};
      // Initialize this owned profile once, after a real file document is ready.
      // Subsequent reloads have observation/denial hooks but NO seeding or replay.
      const preparation=await page.evaluate(seedNativeFixture,fixtureArgs);
      if(scenario.observe)report.storageEvidence.push({scenario:scenario.name,...preparation});
      await context.addInitScript(installFixtureHooks,fixtureArgs);
      await page.reload(); await ready(page);
      const originalFileSearch = new URL(page.url()).search;
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
      await page.locator('#materialQuery').fill('zgorzelec');
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
        assert.equal(await page.locator('#demo-01').inputValue(), 'done'); await focus(page, 'demo-01',scenario);
        await page.locator('#filter').selectOption('done');
        await page.locator('#language').selectOption('uk');
        if(scenario.observe)await observeIdentity(context,page,scenario,'before-state-reload');
        await page.reload(); await ready(page);
        if(scenario.observe)await observeIdentity(context,page,scenario,'after-state-reload');
        if(scenario.observe)await collectEvidence(page,scenario,'after-reload');
        assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
        assert.equal(await page.locator('#filter').inputValue(), 'done');
        assert.equal(await page.locator('#demo-01').inputValue(), 'done');
        assert.equal(new URL(page.url()).searchParams.get('from'), 'acceptance');
        assert.equal(new URL(page.url()).search, originalFileSearch, 'File storage address stays stable');
        assert.equal(new URL(page.url()).hash, '#board?lang=uk&status=done');
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
        await page.goto(`${fileURL}?lang=RU`); await ready(page);
        assert.equal(await page.locator('html').getAttribute('lang'),'ru');
        assert.equal(await page.locator('#materialsStatus').innerText(),'ru · Zgorzelec');
        assert.equal(new URL(page.url()).searchParams.get('lang'),'RU');
        await page.goto(`${fileURL}?lang=UA`); await ready(page);
        assert.equal(await page.locator('html').getAttribute('lang'),'uk');
        assert.match(await page.locator('#materialsStatus').innerText(),/ua.*ru/);
        assert.equal(new URL(page.url()).searchParams.get('lang'),'UA');
        await context.setOffline(false); await page.reload(); await ready(page);
        if(scenario.observe)await collectEvidence(page,scenario,'after-reload');
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
          let raw;
          if(scenario.observe) {
            // Reuse the existing getItem/RPC rather than adding a pre-reload read.
            const capture=await page.evaluate(key=>({raw:localStorage.getItem(key),fixture:window.__coordinatorEvidence,
              model:window.__coordinatorObservedModel?.snapshot()}),KEY);
            raw=capture.raw;report.storageEvidence.push({scenario:scenario.name,phase:'existing-raw-read',...capture});
          } else raw=await page.evaluate(key => localStorage.getItem(key), KEY);
          if (scenario.mode === 'corrupt') assert.equal(raw, '{broken');
          if (scenario.mode === 'future') assert.equal(raw, JSON.stringify({ version: 2, statuses: {} }));
          if (scenario.mode === 'denied-write') assert.equal(raw, previous);
          assert.equal(await page.evaluate(key => localStorage.getItem(key), OTHER), 'keep');
        }
        if(scenario.observe)await observeIdentity(context,page,scenario,'before-state-reload');
        await page.reload(); await ready(page);
        if(scenario.observe)await observeIdentity(context,page,scenario,'after-state-reload');
        if(scenario.observe)await collectEvidence(page,scenario,'after-reload');
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
      if(scenario.observe)await collectEvidence(page,scenario,'failure-after-assertion').catch(()=>{});
      else {
        // Post-failure inspection cannot turn the already failed assertion green.
        const data=await page.evaluate(()=>{
          let storage;
          try {storage={raw:localStorage.getItem('primserv:coordinator-demo:v1'),marker:localStorage.getItem('primserv:acceptance:coordinator-seeded')};}
          catch(error){storage={error:error.name};}
          return {storage,url:location.href,summary:document.querySelector('#summary')?.textContent,
            tasks:[...document.querySelectorAll('#tasks select')].map(x=>({id:x.id,value:x.value}))};
        }).catch(error=>({captureError:error.message}));
        report.storageEvidence.push({scenario:scenario.name,phase:'control-post-failure-only',...data});
      }
      // Continue independent diagnostic scenarios, retaining this failure and exit 1.
    } finally {
      report.networkRequests.push(...requests); report.pageErrors.push(...errors);
      await context.tracing.stop({ path: join(reportDir, `${scenario.name}-trace.zip`) });
    }
    });
  }
  // Mandatory durability checks: restart the browser with its native profile,
  // without an init script/seed, storageState(), or any test-side state write.
  for (const width of [1280, 320]) {
    const name = `profile-restart-${width}`, viewport = { width, height: 900 };
    await withFileProfile(chromium,viewport,async profile=>{
    const requests = [], errors = [];
    let context = profile.context;
    const prepare = async () => {
      context.setDefaultTimeout(10000);
      context.on('request', request => {
        if (!request.url().startsWith('file:')) requests.push({ method: request.method(), url: request.url() });
      });
      context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
      await context.route(/^https?:/, route => route.abort());
      await context.setOffline(true);
      await context.tracing.start({ screenshots: true, snapshots: true });
      return context.newPage();
    };
    let tracing = false;
    try {
      let page = await prepare(); tracing = true;
      await page.goto(`${fileURL}?lang=en&from=restart#board`); await ready(page);
      assert.equal(await page.locator('#demo-01').inputValue(), 'todo');
      await page.locator('#demo-01').selectOption('doing');
      await page.locator('#demo-02').selectOption('done');
      await page.locator('#filter').selectOption('done');
      await page.locator('#language').selectOption('uk');
      const savedURL = page.url();
      const savedMaterialText=await page.locator('#materials').innerText();
      await page.locator('#materialsSource').selectOption('mock');
      assert.equal(await page.locator('#materials').innerText(),savedMaterialText);
      await page.locator('#materialQuery').fill('zgorzelec');
      assert.equal(await page.locator('#materials article').count(),1);
      assert.equal(await page.locator('#materialReading').isHidden(),true);
      await page.locator('#read-site-cleaning-summary-ru').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#reading-title').getAttribute('lang'),'ru');
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('primserv:coordinator:last-material:v1'))),
        {version:1,material_id:'site-cleaning-summary-ru',requested_language:'uk'});
      await context.tracing.stop({ path: join(reportDir, `${name}-before-trace.zip`) }); tracing = false;
      context = await profile.reopen();
      page = await prepare(); tracing = true;
      await page.goto(savedURL); await ready(page);
      assert.equal(await page.evaluate(() => navigator.onLine), false);
      assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
      assert.equal(await page.locator('#filter').inputValue(), 'done');
      assert.equal(await page.locator('#materialsSource').inputValue(),'snapshot');
      assert.equal(await page.locator('#materialQuery').inputValue(),'');
      assert.equal(await page.locator('#materials').innerText(),savedMaterialText);
      assert.match(await page.locator('#materialsStatus').innerText(),/uk.*ru/);
      assert.equal(await page.locator('#demo-02').inputValue(), 'done');
      assert.equal(await page.locator('.task').count(), 1);
      await page.locator('#filter').selectOption('all');
      assert.equal(await page.locator('#demo-01').inputValue(), 'doing');
      assert.equal(await page.locator('#demo-02').inputValue(), 'done');
      assert.equal(await page.locator('#demo-03').inputValue(), 'todo');
      // Real native restart restores only the pointer; opening remains explicit.
      assert.equal(await page.locator('#materialReading').isHidden(),true);
      assert.equal(await page.locator('#lastMaterialReturn').isEnabled(),true);
      await page.locator('#language').selectOption('pl');
      await page.locator('#materialsSource').selectOption('mock');
      await page.locator('#materialQuery').fill('no matching material');
      assert.equal(await page.locator('#materials article').count(),0);
      await page.locator('#lastMaterialReturn').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('html').getAttribute('lang'),'uk');
      assert.equal(await page.locator('#materialQuery').inputValue(),'no matching material');
      assert.equal(await page.locator('#materialsSource').inputValue(),'mock');
      assert.equal(await page.locator('#filter').inputValue(),'all');
      assert.equal(await page.locator('#materialReading').isVisible(),true);
      assert.match(await page.locator('#materialReading').innerText(),/uk.*ru/);
      assert.equal(await page.locator('#reading-title').getAttribute('lang'),'ru');
      await page.locator('#lastMaterialClear').click();
      assert.equal(await page.locator('#materialReading').isHidden(),true);
      assert.equal(await page.evaluate(()=>localStorage.getItem('primserv:coordinator:last-material:v1')),null);
      await page.reload();await ready(page);
      assert.equal(await page.locator('#lastMaterialReturn').isDisabled(),true);
      assert.equal(await page.locator('#materialReading').isHidden(),true);
      assert.equal(await page.locator('#demo-01').inputValue(),'doing');
      assert.equal(await page.locator('#demo-02').inputValue(),'done');
      // Favourites are separate intentional storage, never a recent-pointer import.
      const favouriteKey='primserv:coordinator:favourites:v1',lastKey='primserv:coordinator:last-material:v1';
      const taskBytes=await page.evaluate(key=>localStorage.getItem(key),KEY);
      await page.locator('#pin-site-cleaning-summary-ru').focus();await page.keyboard.press('Enter');
      const pinBytes=await page.evaluate(key=>localStorage.getItem(key),favouriteKey);
      assert.deepEqual(JSON.parse(pinBytes),{version:1,items:[{material_id:'site-cleaning-summary-ru',requested_language:'uk'}]});
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),lastKey),null);
      await page.locator('#language').selectOption('pl');
      await page.locator('#read-site-cleaning-summary-ru').click();
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),favouriteKey),pinBytes);
      assert.equal(await page.locator('#pin-site-cleaning-summary-ru').isDisabled(),true);
      await page.locator('#lastMaterialClear').click();
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),favouriteKey),pinBytes);
      await page.reload();await ready(page);
      assert.equal(await page.locator('#favouritesList article').count(),1);
      assert.equal(await page.locator('#materialReading').isHidden(),true);
      assert.equal(await page.locator('#lastMaterialReturn').isDisabled(),true);
      await page.locator('#materialsSource').selectOption('mock');
      await page.locator('#filter').selectOption('doing');
      await page.locator('#materialQuery').fill('no matching pinned source');
      await page.locator('#pin-open-site-cleaning-summary-ru').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('html').getAttribute('lang'),'uk');
      assert.equal(await page.locator('#reading-title').getAttribute('lang'),'ru');
      assert.match(await page.locator('#materialReading').innerText(),/uk.*ru/);
      assert.equal(await page.locator('#materialQuery').inputValue(),'no matching pinned source');
      assert.equal(await page.locator('#materialsSource').inputValue(),'mock');
      assert.equal(await page.locator('#filter').inputValue(),'doing');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),taskBytes);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),lastKey),null);
      await fits(page);
      await page.screenshot({path:join(reportDir,`${name}-pinned-open.png`),fullPage:true});
      await page.locator('#pin-remove-site-cleaning-summary-ru').focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#favouritesList article').count(),0);
      assert.equal(await page.locator('#materialQuery').inputValue(),'no matching pinned source');
      assert.equal(await page.locator('#materialsSource').inputValue(),'mock');
      assert.equal(await page.locator('#filter').inputValue(),'doing');
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),taskBytes);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),lastKey),null);
      // Labelled negative fixture: corrupt only the NEW key after normal journeys.
      await page.locator('#language').selectOption('en');
      await page.evaluate(key=>localStorage.setItem(key,'{broken'),favouriteKey);
      await page.reload();await ready(page);
      assert.match(await page.locator('#favouritesNotice').innerText(),/damaged/);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),favouriteKey),'{broken');
      assert.equal(await page.locator('#favouritesList article').count(),0);
      await page.locator('#favouritesClear').click();
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),favouriteKey),null);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),taskBytes);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),lastKey),null);
      // Negative write fixture affects only the NEW key and is always restored.
      await page.evaluate(key=>{
        const original=Storage.prototype.setItem;
        window.__restorePinnedWrite=()=>{Storage.prototype.setItem=original;delete window.__restorePinnedWrite;};
        Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Pinned fixture denied','SecurityError');return original.call(this,k,v);};
      },favouriteKey);
      try {
        await page.locator('#pin-site-cleaning-summary-ru').click();
        assert.match(await page.locator('#favouritesNotice').innerText(),/only on this page/);
        assert.equal(await page.locator('#favouritesList article').count(),1);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),favouriteKey),null);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),taskBytes);
        assert.equal(await page.evaluate(key=>localStorage.getItem(key),lastKey),null);
      } finally {await page.evaluate(()=>window.__restorePinnedWrite?.());}
      await page.locator('#favouritesClear').click();
      await page.reload();await ready(page);
      assert.equal(await page.locator('#favouritesList article').count(),0);
      assert.equal(await page.locator('#materialReading').isHidden(),true);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),taskBytes);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),lastKey),null);
      await page.locator('#filter').selectOption('all');
      await fits(page); assert.deepEqual(requests, []); assert.deepEqual(errors, []);
      await page.screenshot({ path: join(reportDir, `${name}.png`), fullPage: true });
      report.scenarios.push({ name, viewport, status: 'passed', offline: true,
        actions: ['fresh native profile', 'UI status edits', 'close browser', 'reopen same profile without fixture', 'restore filtered and full board', 'explicit last material return preserves search/source context', 'clear material pointer without task reset', 'keyboard pin and saved-language open preserve search/source/tasks/recent pointer', 'remove pin and corrupt/denied new-key recovery'],
        results: { networkRequests: requests.length, pageErrors: errors.length, horizontalOverflow: false } });
    } catch (error) {
      report.scenarios.push({ name, viewport, status: 'failed', error: error.stack });
    } finally {
      report.networkRequests.push(...requests); report.pageErrors.push(...errors);
      if (tracing) await context.tracing.stop({ path: join(reportDir, `${name}-after-trace.zip`) });
    }
    });
  }
  report.status = acceptanceStatus(report.scenarios);
  const observedNames=report.scenarios.filter(x=>x.observe).map(x=>x.name);
  report.identityComparisons=observedNames.map(scenario=>({scenario,result:compareStorageIdentity(
    report.storageIdentity.find(x=>x.scenario===scenario&&x.phase==='before-state-reload'),
    report.storageIdentity.find(x=>x.scenario===scenario&&x.phase==='after-state-reload'))}));
  report.identityGate={expectedObservedScenarios:6,samples:report.storageIdentity.length,
    status:observedNames.length===6&&hasCompleteIdentity(report.storageIdentity,observedNames)&&
      report.identityComparisons.every(x=>!['unavailable','incomparable-version'].includes(x.result))?'observed':'unavailable'};
  if(report.identityGate.status!=='observed')report.status='failed';
  report.backendOpenComparisons=observedNames.map(scenario=>({scenario,...compareBackendOpen(
    report.backendOpen.find(x=>x.scenario===scenario&&x.phase==='before-state-reload'),
    report.backendOpen.find(x=>x.scenario===scenario&&x.phase==='after-state-reload'))}));
  report.backendOpenGate={samples:report.backendOpen.length,status:hasCompleteBackendOpen(report.backendOpen,observedNames)&&
    report.backendOpenComparisons.every(x=>x.status==='observed')?'observed':'unavailable'};
  if(report.backendOpenGate.status!=='observed')report.status='failed';
  if(report.status==='failed')process.exitCode=1;
} catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; }
finally {
  await browser?.close(); report.finished = new Date().toISOString();
  await writeFile(join(reportDir, 'acceptance.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
