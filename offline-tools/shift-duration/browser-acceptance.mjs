// CI entry for PR39's isolated-module contract; never a local preview bypass.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('CI-only browser entry; use the approved browser for local acceptance');
const { PLAYWRIGHT_PACKAGE, TESTED_HEAD: head, TESTED_BASE: base, BROWSER_REPORT } = process.env;
assert(PLAYWRIGHT_PACKAGE && BROWSER_REPORT, 'CI must provide installed Playwright and report directory');
assert(/^[a-f0-9]{40}$/.test(head || '') && /^[a-f0-9]{40}$/.test(base || ''), 'Exact head/base required');
const folder = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(folder, '../..');
const reportDir = path.resolve(BROWSER_REPORT);
const relativeReport = path.relative(root, reportDir);
assert(relativeReport.startsWith(`..${path.sep}`) || path.isAbsolute(relativeReport), 'Reports must stay outside checkout/Pages');
const git = args => execFileSync('git', args, { cwd: root, timeout: 15000 });
git(['merge-base', '--is-ancestor', base, 'HEAD']);
git(['merge-base', '--is-ancestor', head, 'HEAD']);
const runtime = ['index.html', 'core.js', 'locales.js', 'app.js', 'style.css', 'primserv-logo.svg'];
const resources = [];
for (const name of runtime) {
  const resource = `offline-tools/shift-duration/${name}`;
  const bytes = await readFile(path.join(folder, name));
  assert.deepEqual(bytes, git(['show', `${head}:${resource}`]), `Exact-head mismatch: ${resource}`);
  resources.push({ path: resource, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
}
await mkdir(reportDir, { recursive: true });
const { chromium } = createRequire(import.meta.url)(PLAYWRIGHT_PACKAGE);
const url = pathToFileURL(path.join(folder, 'index.html')).href;
const KEY = 'primserv.offline.shift-duration.v1';
const OTHER = 'primserv.acceptance.unrelated';
const v1 = JSON.stringify({ version: 1, value: { start: '06:00', end: '14:00', nextDay: false, breakMinutes: '30', lang: 'en' } });
const report = { status: 'failed', head, base, browser: '', method: 'Downloaded exact-head folder via file://; contexts offline before first load; no server or SW', resources, scenarios: [], requests: [], pageErrors: [], limitations: ['Emulated viewports, not physical phones', 'Storage failure fixtures use native Storage method overrides', 'v1 compatibility fixture, not an upgrade of a previously published product', 'No screen-reader or alternative localhost HTTP acceptance'] };
let browser;
async function scenario(name, viewport, run, fixture) {
  const item = { name, status: 'failed', viewport, actions: [], results: [], limitations: [] };
  report.scenarios.push(item);
  const context = await browser.newContext({ viewport, offline: true, serviceWorkers: 'block' });
  let page;
  try {
    await context.tracing.start({ screenshots: true, snapshots: true });
    context.on('request', request => {
      const entry = { scenario: name, url: request.url(), method: request.method() };
      report.requests.push(entry);
    });
    await context.route(/^https?:/, route => route.abort('blockedbyclient'));
    if (fixture) await context.addInitScript(({ key, other, raw, denied }) => {
      // Seed only fictitious values and only once in this fresh context.
      if (sessionStorage.getItem('fixture-seeded')) return;
      sessionStorage.setItem('fixture-seeded', 'yes');
      localStorage.setItem(key, raw);
      localStorage.setItem(other, 'keep');
      const original = Object.fromEntries(['getItem', 'setItem', 'removeItem'].map(method => [method, Storage.prototype[method]]));
      if (denied) Storage.prototype[denied] = function (k, ...args) {
        if (this === localStorage && k === key) throw new DOMException('Test storage denial', 'SecurityError');
        return original[denied].call(this, k, ...args);
      };
      window.__shiftFixture = {
        read: k => original.getItem.call(localStorage, k),
        restore: () => { for (const method of Object.keys(original)) Storage.prototype[method] = original[method]; }
      };
    }, { key: KEY, other: OTHER, ...fixture });
    page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on('pageerror', error => report.pageErrors.push({ scenario: name, message: error.message }));
    await page.goto(`${url}?lang=en`);
    assert.equal(await page.evaluate(() => navigator.onLine), false, 'Context must really be offline');
    await run(page, context, item);
    assert.deepEqual(report.pageErrors.filter(e => e.scenario === name), []);
    assert.deepEqual(report.requests.filter(e => e.scenario === name && !e.url.startsWith('file:')), [], 'No external requests, even failed attempts');
    await page.screenshot({ path: path.join(reportDir, `${name}.png`), fullPage: true });
    item.status = 'passed';
  } catch (error) {
    item.error = error.stack;
    if (page) await page.screenshot({ path: path.join(reportDir, `${name}-failure.png`), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    try { await context.tracing.stop({ path: path.join(reportDir, `${name}.zip`) }); }
    finally { await context.close(); }
  }
}
async function fields(page, start = '22:00', end = '06:00', overnight = true) {
  await page.locator('#start').fill(start);
  await page.locator('#end').fill(end);
  await page.locator('#nextDay').setChecked(overnight);
  await page.locator('#breakMinutes').fill('30');
}
async function calculate(page) { await page.locator('button[type=submit]').click(); }
async function result(page, text = '7 h 30 min') { assert((await page.locator('#result').innerText()).startsWith(text)); }
async function saved(page) { return page.evaluate(key => localStorage.getItem(key), KEY); }
async function remove(page, accept) {
  const dialog = page.waitForEvent('dialog');
  const click = page.locator('#forget').click();
  const prompt = await dialog;
  assert.equal(prompt.type(), 'confirm');
  if (accept) await prompt.accept(); else await prompt.dismiss();
  await click;
}
async function narrow(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow');
  const start = await page.locator('#start').boundingBox();
  const end = await page.locator('#end').boundingBox();
  assert(start && end && end.y >= start.y + start.height, 'Native time editors must stack on narrow screens');
  assert(await page.locator('.times').evaluate(el => [...el.querySelectorAll('input')].every(input => {
    const box = input.getBoundingClientRect(), parent = el.getBoundingClientRect();
    return box.left >= parent.left && box.right <= parent.right + 1;
  })), 'Time editors must remain inside their card');
  for (const selector of ['#language', '#start', '#end', '#breakMinutes', '#save', '#forget']) {
    const box = await page.locator(selector).boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= 321, `Control outside narrow viewport: ${selector}`);
  }
}
try {
  browser = await chromium.launch({ headless: true });
  report.browser = `Chromium ${browser.version()}`;
  for (const width of [1280, 320]) await scenario(`route-${width}`, { width, height: 900 }, async (page, context, item) => {
    item.actions.push('Offline first load, empty state, invalid form, overnight calculation, keyboard Save, reload/Back, seven locales and fallback, reset, online recovery');
    assert.match(await page.locator('#storageStatus').innerText(), /Nothing saved/);
    await calculate(page);
    assert.equal(await page.locator('#start').getAttribute('aria-invalid'), 'true');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'start');
    await fields(page, '22:00', '06:00', false);
    // Keyboard path: checkbox -> minutes -> Calculate -> Save.
    await page.locator('#nextDay').focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'breakMinutes');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('button[type=submit]').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    await result(page);
    assert.equal(await saved(page), null, 'No implicit save');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'save');
    await page.keyboard.press('Enter');
    const raw = await saved(page);
    assert.equal(JSON.parse(raw).value.start, '22:00');
    await page.reload();
    await result(page);
    assert.equal(await page.locator('#nextDay').isChecked(), true);
    await page.goto('about:blank');
    await page.goBack();
    await result(page);
    for (const [lang, expected] of [['ru', '7 ч 30 мин'], ['uk', '7 год 30 хв'], ['pl', '7 godz. 30 min'], ['en', '7 h 30 min'], ['ka', '7 სთ 30 წთ'], ['tr', '7 sa 30 dk'], ['hy', '7 ժ 30 ր']]) {
      await page.locator('#language').selectOption(lang);
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.equal(await page.locator('#start').inputValue(), '22:00');
      await result(page, expected);
      assert(await page.locator('[data-i18n]').evaluateAll(nodes => nodes.every(el => el.textContent.trim().length > 0)));
      assert((await page.locator('#jobs').getAttribute('href')).endsWith(`lang=${lang}`));
      assert((await page.locator('#hydra').getAttribute('href')).endsWith(`lang=${lang === 'uk' ? 'ua' : lang}`));
      if (width === 320) await narrow(page);
    }
    await page.locator('#language').selectOption('uk');
    await page.locator('#save').click();
    await page.goto(url); // No query: restore saved language, not a URL override.
    assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
    await result(page, '7 год 30 хв');
    for (const language of ['ka', 'tr', 'hy']) {
      await page.goto(`${url}?lang=${language}`);
      assert.equal(await page.locator('html').getAttribute('lang'), language);
      assert.equal(await page.locator('#fallback').isVisible(), false);
      assert.equal(await page.locator('#externalNotice').isVisible(), true);
      await result(page, {ka:'7 სთ 30 წთ',tr:'7 sa 30 dk',hy:'7 ժ 30 ր'}[language]);
      await page.locator('#save').click();
      await page.goto(url);
      assert.equal(await page.locator('html').getAttribute('lang'), language);
      await page.screenshot({path:path.join(reportDir, `language-${language}-${width}.png`), fullPage:true});
      if(width === 320) await narrow(page);
      assert.equal(await page.locator('#start').inputValue(), '22:00');
    }
    await page.goto(`${url}?lang=xx`);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.equal(await page.locator('#fallback').isVisible(), true);
    await result(page);
    await page.goto(`${url}?lang=ua`);
    assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
    assert.equal(await page.locator('#fallback').isVisible(), false);
    await page.locator('#language').selectOption('en');
    await page.locator('#nextDay').uncheck();
    assert.equal(await page.locator('#end').getAttribute('aria-invalid'), 'true');
    assert(!(await page.locator('#result').innerText()).includes('7 h'));
    await page.locator('#nextDay').check();
    await page.locator('#breakMinutes').fill('480');
    assert.equal(await page.locator('#breakMinutes').getAttribute('aria-invalid'), 'true');
    await page.locator('#breakMinutes').fill('30');
    await result(page);
    await page.evaluate(key => localStorage.setItem(key, 'keep'), OTHER);
    const beforeReset = await saved(page);
    await remove(page, false);
    assert.equal(await saved(page), beforeReset);
    await remove(page, true);
    assert.equal(await saved(page), null);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), OTHER), 'keep');
    await result(page);
    await page.locator('#save').click();
    await page.reload();
    await result(page);
    await page.screenshot({ path: path.join(reportDir, `offline-${width}.png`), fullPage: true });
    const links = await page.locator('#links a').evaluateAll(nodes => nodes.map(a => a.href));
    assert.deepEqual(links, ['https://www.primserv.pl/', 'https://oleksandrkiris.github.io/kiris-jobs/?lang=en', 'https://oleksandrkiris.github.io/citronex-hydra-project/?lang=en', 'https://t.me/KirisWorkPoland_bot']);
    await context.setOffline(false);
    assert.equal(await page.evaluate(() => navigator.onLine), true);
    await page.reload();
    await result(page);
    if (width === 320) await narrow(page);
    item.results.push('7h30 calculation; explicit save and cancel/confirm reset; saved fields/language restored; no external requests; offline first load/reload and online recovery');
    item.limitations.push('External operational links inspected, never visited; no physical phone');
  });
  for (const fixture of [
    { name: 'previous-v1', raw: v1 },
    { name: 'corrupt', raw: '{broken' },
    { name: 'future', raw: JSON.stringify({ version: 2, value: { marker: 'fictitious-future' } }) },
    { name: 'read-denied', raw: v1, denied: 'getItem' },
    { name: 'write-denied', raw: v1, denied: 'setItem' },
    { name: 'remove-denied', raw: v1, denied: 'removeItem' }
  ]) await scenario(fixture.name, { width: 320, height: 900 }, async (page, context, item) => {
    item.actions.push('Seed fixed nonsecret previous record and unrelated key; calculate; attempt save/remove; verify preservation; restore storage; explicit recovery/reload');
    const readFixture = () => page.evaluate(key => window.__shiftFixture.read(key), KEY);
    assert.equal(await readFixture(), fixture.raw);
    if (fixture.name === 'previous-v1') {
      await result(page);
      assert.equal(await page.locator('#start').inputValue(), '06:00');
      await page.reload();
      assert.equal(await saved(page), fixture.raw);
      await result(page);
    } else {
      await fields(page);
      await calculate(page);
      await result(page);
      if (fixture.denied === 'removeItem') await remove(page, true);
      else await page.locator('#save').click();
      assert.equal(await readFixture(), fixture.raw, 'Unknown or inaccessible record must survive');
      assert.equal(await page.evaluate(key => window.__shiftFixture.read(key), OTHER), 'keep');
      assert.match(await page.locator('#storageStatus').innerText(), fixture.denied ? /Could not save or remove/ : /damaged or uses another format/);
      await page.evaluate(() => window.__shiftFixture.restore());
      if (!fixture.denied) await remove(page, true); // Unknown formats require explicit consent to remove.
      await page.locator('#save').click();
      assert.match(await page.locator('#storageStatus').innerText(), /Fields saved/);
      assert.equal(JSON.parse(await saved(page)).value.start, '22:00');
      await page.reload();
      await result(page);
    }
    assert.equal(await page.evaluate(key => localStorage.getItem(key), OTHER), 'keep');
    assert.equal(await page.evaluate(() => navigator.onLine), false);
    await narrow(page);
    item.results.push('Prior data preserved until explicit valid save/reset; unrelated key intact; no network; restored state survives offline reload');
    item.limitations.push('Storage denial and prior v1 use fixtures; no production migration exists');
  }, fixture);
  report.status = 'passed';
} catch (error) {
  report.error = error.stack;
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  report.requestCount = report.requests.length;
  report.externalRequestCount = report.requests.filter(r => !r.url.startsWith('file:')).length;
  await writeFile(path.join(reportDir, 'acceptance.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, head, base, scenarios: report.scenarios.map(s => ({ name: s.name, status: s.status })), externalRequestCount: report.externalRequestCount }));
}


