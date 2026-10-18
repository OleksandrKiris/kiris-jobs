import {acceptApplyScreening} from './apply-screening.mjs';
import {acceptFormErrors,cachedFormHash,acceptOfflineFormErrors} from './catalogue-form-errors.mjs';
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
import { acceptApplyEntry } from './apply-entry.mjs';
import { acceptHousingControls } from './catalogue-housing.mjs';
import { contrastRegressionStylesheet } from './catalogue-contrast.mjs';
import { acceptCoordinatorRefresh, JOINT_TOOL_TRANSITION, TOOL_FILES } from './coordinator-refresh.mjs';

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
  scope: process.argv.includes('--current-only') ? 'full-current-catalogue-core; historical tool overlays excluded' : 'historical full runner',
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

  const actionContrast = locator => locator.evaluateAll(elements => {
    const luminance = color => color.match(/[\d.]+/g).slice(0,3).map(Number)
      .map(x => x/255).map(x => x <= 0.04045 ? x/12.92 : ((x+0.055)/1.055)**2.4)
      .reduce((sum,x,index) => sum+x*[0.2126,0.7152,0.0722][index],0);
    return elements.map(el => {
      const style=getComputedStyle(el), fg=luminance(style.color), bg=luminance(style.backgroundColor);
      return {text:el.textContent.trim(),color:style.color,background:style.backgroundColor,
        ratio:(Math.max(fg,bg)+0.05)/(Math.min(fg,bg)+0.05)};
    });
  });
  const buttonKinds = [
    {kind:'secondary',job:'greenhouse-tomatoes',selector:'.job-card-body > .primary-button'},
    {kind:'primary',job:'banana-warehouse-poland',selector:'.job-card-body > .primary-button'},
    {kind:'hrappka',job:'greenhouse-tomatoes',selector:'[data-hrappka-link]'}
  ];
  report.cardContrastOldRed = [];
  const oldContrast = contrastRegressionStylesheet();
  const oldHomepage = oldContrast.bytes;
  report.cardContrastRegressionSource = {ref:oldContrast.ref,sha256:oldContrast.sha256,fetched:oldContrast.fetched,eventBase:report.base};
  for(const width of [1280,320]) {
    const ctx=await context({width,height:900});const page=activePage=await ctx.newPage();
    // Explicit historical fixture, isolated from the actual staged-head checks.
    await ctx.route('**/assets/homepage.css?*',route=>route.fulfill({status:200,contentType:'text/css',body:oldHomepage}));
    await page.goto(base+'?lang=ru');await ready(page);
    const old=await actionContrast(page.locator('[data-job-id="greenhouse-tomatoes"] .job-card-body > .primary-button'));
    assert.equal(old.length,1);assert.ok(old[0].ratio<4.5,'The exact witnessed pre-fix stylesheet must expose the regression');
    report.cardContrastOldRed.push({width,base:report.base,regressionRef:oldContrast.ref,stylesheetSHA256:sha256(oldHomepage),status:'expected-failure-observed',button:old[0]});
    await ctx.close();activePage=null;
  }
  report.cardActionContrast = [];
  for(const width of [1280,320]) {
    const ctx=await context({width,height:900});const page=activePage=await ctx.newPage();
    await page.goto(base+'?lang=pl');await ready(page);
    for(const lang of ['pl','ru','uk','en','az','ka','id','es','fil','ne','hy']) {
      if(lang!=='pl')await locale(page,lang);
      await page.mouse.move(0,0);
      const normal=await actionContrast(page.locator('#job-grid .primary-button'));
      assert.equal(normal.length,17);assert.ok(normal.every(x=>x.ratio>=4.5),JSON.stringify(normal));
      const states=[];
      for(const item of buttonKinds) {
        const card=page.locator(`[data-job-id="${item.job}"]`),button=card.locator(item.selector);
        const focusTarget=item.kind==='hrappka'?button:card.locator('.job-card-link');
        await button.hover();
        const hover=await actionContrast(button);assert.equal(hover.length,1);assert.ok(hover[0].ratio>=4.5,JSON.stringify(hover));
        await page.mouse.move(0,0);await page.keyboard.press('Tab');await focusTarget.focus();
        assert.equal(await focusTarget.evaluate(el=>el===document.activeElement&&el.matches(':focus-visible')),true);
        const focus=await actionContrast(button);assert.ok(focus[0].ratio>=4.5,JSON.stringify(focus));
        states.push({kind:item.kind,hover:hover[0],focus:focus[0]});
        if(lang==='ru'&&item.kind==='secondary')await shot(page,`card-contrast-focus-${width}`);
      }
      await fits(page);
      report.cardActionContrast.push({width,lang,status:'passed',normal,states});
    }
    await ctx.close();activePage=null;
  }

  // A delayed font response can move a translated mobile footer after focus.
  report.shortcutFonts = [];
  for (const width of [1280,320]) {
    const ctx = await context({width,height:900}, 'denied');
    const page = activePage = await ctx.newPage();
    let releaseFonts, enteredFonts;
    const pending = new Promise(resolve => {releaseFonts=resolve;});
    const entered = new Promise(resolve => {enteredFonts=resolve;});
    await ctx.route('**/assets/fonts/*.woff2', async route => {enteredFonts();await pending;await route.continue();});
    await page.goto(base+'?lang=ka#profile',{waitUntil:'domcontentloaded'});await ready(page);
    await page.waitForFunction(()=>document.activeElement?.id==='footer-whatsapp');
    await entered;
    const before = await page.locator('#footer-whatsapp').boundingBox();
    releaseFonts();
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForFunction(()=>{const r=document.getElementById('footer-whatsapp').getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;});
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'footer-whatsapp');
    await fits(page);await shot(page,`shortcuts-fonts-${width}`);
    report.shortcutFonts.push({width,status:'passed',before,after:await page.locator('#footer-whatsapp').boundingBox()});
    await ctx.close();activePage=null;
  }

  // Real user input while the content module is still loading. This belongs
  // to the catalogue route acceptance, not historical scenario totals.
  report.earlyInput = [];
  for (const width of [1280,320]) for (const clear of [false,true]) {
    const ctx = await context({width,height:900});
    const page = activePage = await ctx.newPage();
    let releaseImport, enteredImport;
    const pending = new Promise(resolve => {releaseImport=resolve;});
    const entered = new Promise(resolve => {enteredImport=resolve;});
    await ctx.addInitScript(() => {if(!sessionStorage.getItem('early-input-seeded')){sessionStorage.setItem('kiris-jobs:catalog-context:v1',JSON.stringify({query:'no-such-old-query',country:'PL',feature:'housing'}));sessionStorage.setItem('early-input-seeded','1');}});
    await ctx.route('**/data/content.js?v=220', async route => { enteredImport();await pending;await route.continue(); });
    await ctx.tracing.start({screenshots:true,snapshots:true,sources:false});
    try {
      await page.goto(base+'?lang=ru',{waitUntil:'domcontentloaded'});
      await entered;
      await page.locator('#job-search').fill('томат');
      if(clear)await page.locator('#job-search').fill('');
      releaseImport();await ready(page);
      const expected=clear?'':'томат';
      assert.equal(await page.locator('#job-search').inputValue(),expected);
      assert.equal(await page.locator('[data-country-filter="PL"]').getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('[data-feature-filter="housing"]').getAttribute('aria-pressed'),'true');
      const count=await page.locator('#job-grid .job-card').count();
      if(clear)assert.ok(count>2);else assert.equal(count,2);
      await fits(page);await shot(page,`early-input-${clear?'clear':'typed'}-${width}`);
      // Persisted new user input must win when the document is reloaded.
      await page.reload();await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(),expected);
      assert.equal(await page.locator('#job-grid .job-card').count(),count);
      report.earlyInput.push({width,clear,status:'passed',firstPaintCards:count,reload:true});
    } finally {
      releaseImport();await ctx.tracing.stop({path:join(reportDir,`early-input-${clear?'clear':'typed'}-${width}.zip`)});await ctx.close();activePage=null;
    }
  }

  // Regression #57: an uncached locale must not take down the cached catalogue.
  for (const width of [1280, 320]) {
    const ctx = await context({ width, height: 900 });
    const page = activePage = await ctx.newPage();
    let originStopped = false;
    await ctx.tracing.start({ screenshots: true, snapshots: true, sources: false });
    try {
      await page.goto(`${base}?lang=pl`); await ready(page);
      assert.equal(await page.locator('.job-card').count(), 14);
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await page.locator('#job-search').fill('Siechnice');
      await page.reload(); await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      assert.equal(await page.evaluate(async () => Boolean(await caches.match(new URL('data/locales/en.js?v=220', location.href)))), false);
      await stopServer(); originStopped = true; await ctx.setOffline(true);
      await page.goto(`${base}?lang=en`); await ready(page);
      assert.equal(await page.locator('html').getAttribute('lang'), 'pl');
      assert.match(await page.locator('#locale-load-message').innerText(), /English.*Polski/);
      assert.equal(await page.locator('#locale-load-notice').getAttribute('lang'), 'en');
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      assert.ok(await page.locator('.job-card').count() > 0);
      await fits(page); await shot(page, `locale-fallback-offline-${width}`);
      await page.locator('#locale-load-retry').focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => !document.getElementById('locale-load-retry').disabled);
      assert.equal(await page.locator('#locale-load-retry').evaluate(node => node === document.activeElement), true);
      assert.equal(await page.locator('html').getAttribute('lang'), 'pl');
      await page.reload(); await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      await startServer(); originStopped = false; await ctx.setOffline(false);
      await page.locator('#locale-load-retry').focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.documentElement.lang === 'en');
      assert.equal(await page.locator('#locale-load-notice').count(), 0);
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      assert.equal(await page.locator('.language-switcher-button').evaluate(node => node === document.activeElement), true);
      await fits(page); await shot(page, `locale-retry-restored-${width}`);
      await page.reload(); await ready(page);
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      // The same recovery also covers a switch attempted after the app has started.
      await stopServer(); originStopped = true; await ctx.setOffline(true);
      await page.locator('.language-switcher-button').click();
      await page.locator('[data-language-option="ka"]').click();
      await page.locator('#locale-load-notice[lang="ka"]').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
      await fits(page); await shot(page, `locale-switch-failed-ka-${width}`);
      report.results.push({ scenario: 'uncached locale with origin stopped: Polish fallback, failed keyboard retry, reload, reconnect/retry without lost search, failed Georgian switch', width, status: 'passed' });
    } finally {
      if (originStopped) await startServer();
      await ctx.tracing.stop({ path: join(reportDir, `locale-recovery-${width}.zip`) });
      await ctx.close(); activePage = null;
    }
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

  const shortcutTargets = { home: 'main-content', jobs: 'job-search', profile: 'footer-whatsapp',
    'main-content': 'main-content', 'job-search': 'job-search', 'footer-whatsapp': 'footer-whatsapp' };
  for (const width of [1280, 320]) {
    for (const storage of ['', 'corrupt', 'denied']) {
      const ctx = await context({ width, height: 900 }, storage);
      const page = activePage = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const [hash, id] of Object.entries(shortcutTargets)) {
        await page.goto(`${base}?lang=ka#${hash}`); await ready(page);
        await page.waitForFunction(id => document.activeElement?.id === id, id);
        assert.equal(await page.locator('html').getAttribute('lang'), 'ka');
        assert.equal(new URL(page.url()).hash, '#' + hash);
        await page.evaluate(() => document.fonts.ready);
        const visible = await page.locator('#' + id).evaluate(el => {
          const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight;
        });
        assert.ok(visible, hash + ' must be in view');
        await fits(page);
      }
      await shot(page, `shortcuts-${width}-${storage || 'normal'}`);
      if (!storage) {
        await page.goto(`${base}?lang=en#jobs`); await ready(page);
        await page.locator('#job-search').fill('Siechnice');
        await page.goto(`${base}?lang=en#profile`); await ready(page);
        await page.waitForFunction(() => document.activeElement?.id === 'footer-whatsapp');
        await page.goBack(); await ready(page);
        await page.waitForFunction(() => document.activeElement?.id === 'job-search');
        assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
        await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
        await ctx.setOffline(true); await page.reload(); await ready(page);
        await page.waitForFunction(() => document.activeElement?.id === 'job-search');
        assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
        assert.equal(await page.evaluate(() => navigator.onLine), false);
        await shot(page, `shortcuts-offline-${width}`);
        await ctx.setOffline(false);
      }
      assert.deepEqual(errors, []);
      report.results.push({ scenario: 'six shortcut anchors / focus / language' + (storage ? ' / ' + storage : ' / Back / offline reload / saved search'), width, status: 'passed' });
      await ctx.close(); activePage = null;
    }
  }

  for (const name of ['index.html','model.js','app.js','style.css','primserv-logo.svg']) {
    const bytes=await readFile(join(artifact,'tools/coordinator',name));
    assert.deepEqual(bytes,await readFile(join(checkout,'coordinator-demo',name)));
    report.files['tools/coordinator/'+name]={bytes:bytes.length,sha256:sha256(bytes)};
  }
  for(const width of [1280,320]) {
    const ctx=await context({width,height:900});const page=activePage=await ctx.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await ctx.tracing.start({screenshots:true,snapshots:true});
    try {
      await page.goto(base+'?lang=uk');await ready(page);
      await page.locator('#job-search').fill('Siechnice');
      await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
      await page.waitForFunction(async()=>Boolean(await caches.match(new URL('data/locales/uk.js?v=220',location.href).href)));
      // No visit to the tool yet: offline navigation must explain the missing copy.
      assert.equal(await page.evaluate(async()=>{
        const names=await caches.keys();
        const all=await Promise.all(names.map(async name=>(await (await caches.open(name)).keys()).map(r=>r.url)));
        return all.flat().filter(url=>url.includes('/tools/coordinator/')).length;
      }),0);
      // Stop the actual origin as well: this browser version can still send
      // worker requests after setOffline. A cached page must never mask that.
      await stopServer();
      await ctx.setOffline(true);
      await page.locator('[data-primserv-service="coordinator"]').click();
      await page.locator('#tool-unavailable').waitFor();await fits(page);
      await shot(page,`demo-cold-offline-${width}`);
      await page.locator('a').click();await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(),'Siechnice');
      await startServer();
      await ctx.setOffline(false);
      const entry=page.locator('[data-primserv-service="coordinator"]');
      await entry.focus();await page.keyboard.press('Enter');
      await page.locator('#demo-01').waitFor();
      await page.locator('#offline[data-offline-state="ready"]').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'),'uk');
      await page.locator('#demo-01').selectOption('doing');
      await page.locator('#filter').selectOption('doing');
      await page.reload();assert.equal(await page.locator('#demo-01').inputValue(),'doing');
      for(const lang of ['ru','uk','pl','en']) {
        await page.locator('#language').selectOption(lang);
        assert.equal(await page.locator('html').getAttribute('lang'),lang);
        assert.equal(await page.locator('#demo-01').inputValue(),'doing');await fits(page);
      }
      for(const lang of ['ka','tr','hy']) {
        await page.goto(base+'tools/coordinator/?lang='+lang+'&fromLang=uk');
        assert.equal(await page.locator('html').getAttribute('lang'),'en');
        assert.equal(await page.locator('#fallback').isVisible(),true);
        assert.equal(await page.locator('#demo-01').inputValue(),'doing');
      }
      await page.goto(base+'tools/coordinator/?lang=ua&fromLang=uk');
      assert.equal(await page.locator('html').getAttribute('lang'),'uk');
      await page.locator('#offline[data-offline-state="ready"]').waitFor();
      await stopServer();
      await ctx.setOffline(true);await page.reload();
      assert.equal(await page.locator('#demo-01').inputValue(),'doing');
      await page.locator('#offline[data-offline-state="ready"]').waitFor();
      await page.locator('#demo-02').selectOption('done');await fits(page);
      await shot(page,`demo-online-entry-offline-${width}`);
      await page.locator('#catalogue-return').click();await ready(page);
      assert.equal(await page.locator('html').getAttribute('lang'),'uk');
      assert.equal(await page.locator('#job-search').inputValue(),'Siechnice');
      await page.locator('[data-primserv-service="coordinator"]').click();
      assert.equal(await page.locator('#demo-02').inputValue(),'done');
      await page.goBack();await ready(page);
      await startServer();
      await ctx.setOffline(false);await page.reload();await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(),'Siechnice');
      assert.deepEqual(errors,[]);
      const toolCache=await page.evaluate(async()=>{
        const names=await caches.keys();
        const entries=await Promise.all(names.map(async name=>(await (await caches.open(name)).keys()).map(r=>r.url)));
        return entries.flat().filter(u=>u.includes('/tools/coordinator/'));
      });
      assert.equal(toolCache.length,5);assert(toolCache.every(u=>!new URL(u).search));
      report.results.push({scenario:'catalogue → coordinator → return / cold and warm offline / four languages + fallback',width,status:'passed',toolCache});
    } finally {await ctx.tracing.stop({path:join(reportDir,`demo-${width}.zip`)});await ctx.close();activePage=null;}
  }
  for(const mode of ['corrupt','denied']) {
    const ctx=await context({width:320,height:900},mode==='denied'?'denied':'');
    if(mode==='corrupt') await ctx.addInitScript(()=>{
      if(localStorage.getItem('demo-fixture-marker'))return;
      localStorage.setItem('demo-fixture-marker','keep');localStorage.setItem('primserv:coordinator-demo:v1','{broken');
    });
    const page=activePage=await ctx.newPage();
    try {
      await page.goto(base+'tools/coordinator/?lang=en&fromLang=ka');
      await page.locator('#demo-01').selectOption('done');
      assert.equal(await page.locator('#demo-01').inputValue(),'done');
      assert.match(await page.locator('#storage').innerText(),mode==='corrupt'?/preserved/:/unavailable/);
      assert((await page.locator('#catalogue-return').getAttribute('href')).endsWith('?lang=ka'));
      if(mode==='corrupt') assert.equal(await page.evaluate(()=>localStorage.getItem('primserv:coordinator-demo:v1')),'{broken');
      await fits(page);await shot(page,'demo-storage-'+mode);
      report.results.push({scenario:'published demo '+mode+' storage / preserved record and return language',status:'passed'});
    } finally {await ctx.close();activePage=null;}
  }

  // Download the actual base runtime, then update only from the catalogue.
  // There must be no online tool visit/refresh after activation of the head SW.
  const upgradeFiles = ['index.html', 'privacy.html', 'assets/bootstrap.js', 'assets/privacy-bootstrap.js', 'assets/i18n.js', 'assets/homepage.css', 'assets/candidate.js', 'manifest.webmanifest', 'sw.js', 'assets/application-form.js', 'assets/application-loader.js', 'assets/clean.css'];
  upgradeFiles.push(...execFileSync('git',['diff','--name-only',report.base,report.checkout],{encoding:'utf8'}).trim().split('\n').filter(path=>path.startsWith('vacancies/')&&path.endsWith('/index.html')));
  const headFiles = new Map(await Promise.all(upgradeFiles.map(async file => [file, await readFile(join(artifact, file))])));
  const headTools = new Map(await Promise.all(TOOL_FILES.map(async name =>
    [name, await readFile(join(artifact, 'tools/coordinator', name))])));
  const headCache = headFiles.get('sw.js').toString().match(/const CACHE_VERSION = "([^"]+)"/)[1];
  const baseWorker = execFileSync('git', ['show', `${report.base}:sw.js`]).toString();
  const baseCache = baseWorker.match(/const CACHE_VERSION = "([^"]+)"/)[1];
  const upgradeWidths = baseWorker === headFiles.get('sw.js').toString() ? [] : [1280,320];
  if(upgradeWidths.length) assert.notEqual(baseCache, headCache, 'A changed worker must change its cache version');
  else report.results.push({scenario:'base → head worker upgrade',status:'not-applicable',reason:'Worker bytes are unchanged'});
  async function toolSnapshot(page) {
    return page.evaluate(async () => {
      const result=[];
      for(const name of await caches.keys()) {
        const cache=await caches.open(name);
        for(const request of await cache.keys()) {
          if(!new URL(request.url).pathname.includes('/tools/coordinator/'))continue;
          const bytes=await (await cache.match(request)).arrayBuffer();
          const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
          result.push({url:request.url,sha256:hash});
        }
      }
      return result.sort((a,b)=>a.url.localeCompare(b.url));
    });
  }
  report.formUpgrades=[];
  for(const width of upgradeWidths) {
    const ctx = await context({ width, height: 900 });
    const page = activePage = await ctx.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    let originStopped=false;
    await ctx.tracing.start({screenshots:true,snapshots:true,sources:false});
    try {
      for (const file of upgradeFiles) await writeFile(join(artifact, file), execFileSync('git', ['show', `${report.base}:${file}`]));
      const baseToolHashes = {};
      for (const name of TOOL_FILES) {
        const bytes = execFileSync('git', ['show', `${report.base}:coordinator-demo/${name}`]);
        baseToolHashes[new URL('tools/coordinator/' + name, base).href] = sha256(bytes);
        await writeFile(join(artifact, 'tools/coordinator', name), bytes);
      }
      await page.goto(`${base}?lang=uk#jobs`); await ready(page);
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await page.locator('#job-search').fill('Siechnice');
      await page.locator('[data-primserv-service="coordinator"]').click();
      await page.locator('#offline[data-offline-state="ready"]').waitFor();
      await page.locator('#demo-01').selectOption('doing');
      await page.locator('#demo-03').selectOption('done');
      await page.locator('#catalogue-return').click();await ready(page);
      await page.goto(base+'?lang=uk#jobs');await ready(page);
      const before=await toolSnapshot(page);
      assert.equal(before.length,5);assert(before.every(item=>!new URL(item.url).search));
      for (const item of before) assert.equal(item.sha256, baseToolHashes[item.url], 'Base phase must use actual base tool bytes');
      assert.ok((await page.evaluate(()=>caches.keys())).includes(baseCache));
      const oldFormSha=sha256(execFileSync('git',['show',`${report.base}:assets/application-form.js`]));
      const baseFormExact=await cachedFormHash(page,baseCache,new URL('assets/application-form.js?v=220&formErrorLocale=1',base).href)===oldFormSha;
      assert.equal(baseFormExact,true,'Base worker must cache actual old form bytes');
      await page.evaluate(async () => {
        localStorage.setItem('shortcut-unrelated', 'keep');
        await caches.open('unrelated-shortcut-cache');
      });
      const onlineToolRequests=[];
      const observe=request=>{
        if(new URL(request.url()).pathname.includes('/tools/coordinator/')) onlineToolRequests.push(request.url());
      };
      ctx.on('request',observe);
      for (const [file, bytes] of headFiles) await writeFile(join(artifact, file), bytes);
      for (const [name, bytes] of headTools) await writeFile(join(artifact, 'tools/coordinator', name), bytes);
      await page.evaluate(async () => { const registration = await navigator.serviceWorker.ready; await registration.update(); });
      await page.waitForFunction(async ({headCache,baseCache}) => {
        const keys = await caches.keys();
        return keys.includes(headCache) && !keys.includes(baseCache);
      }, {headCache,baseCache});
      // Controllerchange warms only the current catalogue locale. Reopening the
      // shell is allowed, but the tool is deliberately not opened online.
      await page.reload();await ready(page);
      await page.waitForFunction(() => document.activeElement?.id === 'job-search');
      await page.waitForFunction(async headCache=>Boolean(await (await caches.open(headCache))
        .match(new URL('data/locales/uk.js?v=220',location.href).href)),headCache);
      assert.equal(await page.locator('#job-search').inputValue(),'Siechnice');
      assert.equal(await page.evaluate(()=>localStorage.getItem('shortcut-unrelated')),'keep');
      assert.ok((await page.evaluate(()=>caches.keys())).includes('unrelated-shortcut-cache'));
      const after=await toolSnapshot(page);
      assert.deepEqual(after,before,'Migration must preserve the exact complete old runtime');
      assert.deepEqual(onlineToolRequests,[],'No online tool visit or refresh may hide a broken migration');
      ctx.off('request',observe);
      const headFormExact=await cachedFormHash(page,headCache,new URL('assets/application-form.js?v=220&formErrorLocale=1',base).href)===sha256(headFiles.get('assets/application-form.js'));
      const headLoaderExact=await cachedFormHash(page,headCache,new URL('assets/application-loader.js?v=220&formErrorLocale=1',base).href)===sha256(headFiles.get('assets/application-loader.js'));
      const headErrorStyleExact=await cachedFormHash(page,headCache,new URL('assets/clean.css?v=220&formErrorLocale=1&fieldStatus=2',base).href)===sha256(headFiles.get('assets/clean.css'));
      assert.ok(headFormExact&&headLoaderExact&&headErrorStyleExact,'New worker must cache the exact new import/style chain');
      await stopServer();originStopped=true;await ctx.setOffline(true);
      await page.locator('[data-primserv-service="coordinator"]').click();
      await page.locator('#offline[data-offline-state="ready"]').waitFor();
      assert.equal(await page.locator('html').getAttribute('lang'),'uk');
      assert.equal(await page.locator('#demo-01').inputValue(),'doing');
      assert.equal(await page.locator('#demo-03').inputValue(),'done');
      await page.reload();
      assert.equal(await page.locator('#demo-01').inputValue(),'doing');
      for(const lang of ['ru','uk','pl','en']) {
        await page.locator('#language').selectOption(lang);
        assert.equal(await page.locator('html').getAttribute('lang'),lang);
        assert.equal(await page.locator('#demo-03').inputValue(),'done');await fits(page);
      }
      await page.locator('#demo-02').selectOption('done');
      await shot(page,`demo-upgrade-offline-${width}`);
      await page.locator('#catalogue-return').click();await ready(page);
      assert.equal(await page.locator('html').getAttribute('lang'),'uk');
      assert.equal(await page.locator('#job-search').inputValue(),'Siechnice');await fits(page);
      await shot(page,`catalogue-upgrade-offline-${width}`);
      await page.locator('[data-primserv-service="coordinator"]').click();await page.reload();
      assert.equal(await page.locator('#demo-02').inputValue(),'done');
      await page.locator('#offline[data-offline-state="ready"]').waitFor();
      assert.deepEqual(await toolSnapshot(page),before);
      const offlineLanguages=await acceptOfflineFormErrors({page,base,width,reportDir});
      report.formUpgrades.push({width,status:'passed',originStopped:true,baseFormExact,headFormExact,headLoaderExact,headErrorStyleExact,offlineLanguages});
      assert.deepEqual(errors,[]);
      report.results.push({scenario:'actual base complete tool → head shell → origin stopped/offline first tool entry, reload, languages, return and saved fictional statuses',
        width,status:'passed',baseCache,headCache,baseToolHashes,before,after,onlineToolRequests});
    } finally {
      for (const [file, bytes] of headFiles) await writeFile(join(artifact, file), bytes);
      for (const [name, bytes] of headTools) await writeFile(join(artifact, 'tools/coordinator', name), bytes);
      if(originStopped)await startServer();
      await ctx.tracing.stop({path:join(reportDir,`demo-upgrade-${width}.zip`)});
      await ctx.close(); activePage = null;
    }
  }

  // The shared guard runs mandatory19 separately on actual captured HEAD5.
  if (!process.argv.includes('--current-only')) {
  // A changed tool must refresh atomically even if the worker bytes do not change.
  await acceptCoordinatorRefresh({ artifact, reportDir, report, base, origin, context,
    ready, fits, shot, active: page => { activePage = page; }, startServer, stopServer });

  // Additional immutable public62cb → actualPR68 bytes. The original33 groups
  // remain above; this separate gate uses the combined PR60 worker/SW80 fix.
  await acceptCoordinatorRefresh({ artifact, reportDir, report, base, origin, context,
    ready, fits, shot, active: page => { activePage = page; }, startServer, stopServer,
    transition: JOINT_TOOL_TRANSITION });

  }

  // These use separate anonymous contexts after all server/SW mutations finish.
  // Keep the existing deadline and every scenario; overlap independent UI waits.
  await Promise.all([
    acceptFormErrors({context,base,reportDir,report,active:page=>{activePage=page;}}),
    acceptApplyEntry({context,base,reportDir,report,active:page=>{activePage=page;}}),
    acceptHousingControls({context,base,reportDir,report,active:page=>{activePage=page;}}),
    acceptApplyScreening({context,base,reportDir,report,active:page=>{activePage=page;}})
  ]);

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
  await browser?.close();
  await origin.stop();
  report.finished = new Date().toISOString(); report.blockedMutations = mutations;
  await writeFile(join(reportDir, 'acceptance.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

