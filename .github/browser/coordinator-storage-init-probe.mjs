// Diagnostic only: preserve the original acceptance suite and its failures.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFileProfile } from '../../coordinator-demo/browser-profile.mjs';

assert.equal(process.env.GITHUB_ACTIONS, 'true', 'GitHub Actions only; no local browser launch');
const { PLAYWRIGHT_PACKAGE, BROWSER_REPORT, TESTED_HEAD, TESTED_BASE } = process.env;
assert.ok(PLAYWRIGHT_PACKAGE && BROWSER_REPORT);
for (const sha of [TESTED_HEAD, TESTED_BASE]) assert.match(sha || '', /^[0-9a-f]{40}$/);
const root = resolve(import.meta.dirname, '../..');
const git = (...args) => execFileSync('git', ['-C', root, ...args]);
for (const sha of [TESTED_HEAD, TESTED_BASE]) git('merge-base', '--is-ancestor', sha, 'HEAD');
const report = { head: TESTED_HEAD, base: TESTED_BASE, checkout: git('rev-parse', 'HEAD').toString().trim(),
  protocol: 'Three fixed samples per mode and action sequence, fresh profile each. Compare no fixture, original init fixture and the same fixture executed once after readiness.',
  limitations: ['Small diagnostic sample; observer and scheduler effects remain possible.',
    'A pass is not a durability guarantee; the existing full acceptance suite is unchanged.'], resources: [], scenarios: [] };
for (const name of ['index.html', 'model.js', 'app.js', 'style.css', 'primserv-logo.svg']) {
  const relative = `coordinator-demo/${name}`, bytes = await readFile(join(root, relative));
  assert.deepEqual(bytes, git('show', `${TESTED_HEAD}:${relative}`));
  report.resources.push({ path: relative, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
}
await mkdir(BROWSER_REPORT, { recursive: true });
const require = createRequire(import.meta.url);
const { chromium } = require(PLAYWRIGHT_PACKAGE);
const { seedFixture } = require('../../coordinator-demo/browser-fixtures.cjs');
const KEY = 'primserv:coordinator-demo:v1';
const url = pathToFileURL(join(root, 'coordinator-demo/index.html')).href + '?lang=en&from=acceptance#board';
try {
  for (let sample = 1; sample <= 3; sample++) for (const actions of ['status-only', 'full-board']) for (const mode of ['no-init-script', 'empty-fixture', 'ready-fixture']) {
    const name = `${actions}-${mode}-${sample}`, profile = await createFileProfile(chromium, { width: 320, height: 900 });
    const context = profile.context, result = { name, mode, sample, actions, status: 'running' };
    const requests = [], errors = [];
    let page, tracing = false;
    try {
      report.browser = `Chromium ${context.browser().version()}`;
      context.setDefaultTimeout(10000);
      context.on('request', request => { if (!request.url().startsWith('file:')) requests.push(request.url()); });
      await context.route(/^https?:/, route => route.abort());
      await context.setOffline(true);
      if (mode === 'empty-fixture') await context.addInitScript(seedFixture, {
        key: KEY, other: 'primserv:acceptance:unrelated', mode: 'empty', previous: '', observe: false
      });
      await context.tracing.start({ screenshots: true, snapshots: true }); tracing = true;
      page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      const ready = async () => { await page.locator('#language').waitFor();
        await page.waitForFunction(() => document.querySelector('#filter').options.length === 4); };
      await page.goto(url); await ready();
      if (mode === 'ready-fixture') await page.evaluate(seedFixture, {
        key: KEY, other: 'primserv:acceptance:unrelated', mode: 'empty', previous: '', observe: false
      });
      assert.equal(await page.locator('#demo-01').inputValue(), 'todo');
      if (actions === 'full-board') {
        // Match the full acceptance's existing keyboard/language/filter calls.
        const focused = async id => assert.equal(await page.evaluate(() => document.activeElement.id), id);
        const fits = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.equal(await page.locator('.task').count(), 3); await fits();
        await page.locator('#language').focus(); await page.keyboard.press('Tab'); await focused('filter');
        await page.keyboard.press('Shift+Tab'); await focused('language');
        for (const lang of ['ru', 'uk', 'pl', 'en']) {
          await page.locator('#language').selectOption(lang);
          assert.equal(await page.locator('html').getAttribute('lang'), lang); await fits();
        }
        await page.locator('#demo-01').focus();
        await page.keyboard.press('End'); await page.keyboard.press('Enter');
        assert.equal(await page.locator('#demo-01').inputValue(), 'done'); await focused('demo-01');
        await page.locator('#filter').selectOption('done');
        await page.locator('#language').selectOption('uk');
      } else {
        await page.locator('#demo-01').selectOption('doing');
        assert.equal(await page.locator('#demo-01').inputValue(), 'doing');
      }
      // No extra storage reads, export/import, replay, retries or waits.
      const savedURL = page.url();
      await page.reload(); await ready();
      assert.equal(page.url(), savedURL);
      if (actions === 'full-board') {
        assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
        assert.equal(await page.locator('#filter').inputValue(), 'done');
      }
      assert.equal(await page.locator('#demo-01').inputValue(), actions === 'full-board' ? 'done' : 'doing');
      assert.deepEqual(requests, []); assert.deepEqual(errors, []);
      result.status = 'passed';
    } catch (error) {
      result.status = 'failed'; result.error = error.stack;
      result.postFailureOnly = await page?.evaluate(() => ({ url: location.href,
        raw: localStorage.getItem('primserv:coordinator-demo:v1'),
        marker: localStorage.getItem('primserv:acceptance:coordinator-seeded'),
        tasks: [...document.querySelectorAll('#tasks select')].map(n => ({ id: n.id, value: n.value }))
      })).catch(error => ({ captureError: error.message }));
    } finally {
      result.requests = requests; result.pageErrors = errors;
      report.scenarios.push(result);
      try {
        await page?.screenshot({ path: join(BROWSER_REPORT, `${name}.png`), fullPage: true }).catch(() => {});
        if (tracing) await context.tracing.stop({ path: join(BROWSER_REPORT, `${name}-trace.zip`) });
      } finally { await profile.dispose(); }
    }
  }
} catch (error) { report.error = error.stack; }
finally {
  report.status = !report.error && report.scenarios.length === 18 && report.scenarios.every(s => s.status === 'passed') ? 'passed' : 'failed';
  if (report.status === 'failed') process.exitCode = 1;
  await writeFile(join(BROWSER_REPORT, 'init-probe.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
