import assert from 'node:assert/strict';
import { join } from 'node:path';
import { verifyMaterialOffline } from './coordinator-refresh.mjs';
const KEY = 'primserv:coordinator-demo:v1';

export async function acceptCoordinatorHTTP({ report, reportDir, base, context, ready, fits, shot,
  active, startServer, stopServer }) {
  const toolReady = page => page.locator('#offline[data-offline-state="ready"]').waitFor();
  const statuses = async (page, raw) => {
    assert.equal(await page.locator('#demo-01').inputValue(), 'doing');
    assert.equal(await page.locator('#demo-03').inputValue(), 'done');
    assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), raw);
  };
  for (const width of [1280, 320]) {
    const id = `composite-http-normal-${width}`;
    const ctx = await context({ width, height: 900 }), page = await ctx.newPage();
    active(page); let stopped = false; report.currentScenario = id;
    await ctx.tracing.start({ screenshots: true, snapshots: true, sources: false });
    try {
      await page.goto(base + '?lang=uk'); await ready(page);
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      await page.locator('#job-search').fill('Siechnice');
      await stopServer(); stopped = true; await ctx.setOffline(true);
      await page.locator('[data-primserv-service="coordinator"]').click();
      await page.locator('#tool-unavailable').waitFor();
      await page.locator('a').click(); await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      await startServer(); stopped = false; await ctx.setOffline(false);
      await page.locator('[data-primserv-service="coordinator"]').click(); await toolReady(page);
      await page.locator('#materialQuery').waitFor();
      await page.locator('#demo-01').selectOption('doing');
      await page.locator('#demo-03').selectOption('done');
      const raw = await page.evaluate(key => localStorage.getItem(key), KEY);
      for (const lang of ['en', 'ru', 'pl', 'uk']) {
        await page.locator('#language').selectOption(lang);
        assert.equal(await page.locator('html').getAttribute('lang'), lang);
        await statuses(page, raw); await fits(page);
      }
      for (const lang of ['ka', 'tr', 'hy']) {
        await page.goto(base + 'tools/coordinator/?lang=' + lang + '&fromLang=uk'); await toolReady(page);
        assert.equal(await page.locator('html').getAttribute('lang'), 'en');
        assert.equal(await page.locator('#fallback').isVisible(), true);
        assert.match(await page.locator('#materialsStatus').innerText(), new RegExp(lang + '.*ru'));
        await page.reload(); await toolReady(page); await statuses(page, raw);
      }
      await page.locator('#language').selectOption('uk');
      await stopServer(); stopped = true; await ctx.setOffline(true);
      await page.reload(); await toolReady(page); await statuses(page, raw);
      const material = await verifyMaterialOffline(page, { id, fits, shot });
      await page.locator('#catalogue-return').click(); await ready(page);
      assert.equal(await page.locator('#job-search').inputValue(), 'Siechnice');
      assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
      await shot(page, id + '-catalogue-return');
      await page.goBack(); await page.reload(); await toolReady(page); await statuses(page, raw);
      assert.equal(await page.locator('#materialQuery').inputValue(), '');
      await startServer(); stopped = false; await ctx.setOffline(false);
      await page.reload(); await toolReady(page); await statuses(page, raw);
      report.results.push({ scenario: 'candidate HTTP functional / four languages + three fallbacks / cold first offline entry / raw state / reload / Back / offline material',
        transition: 'pr68-http', width, status: 'passed', material, progress: JSON.parse(raw) });
    } catch (error) {
      await page.screenshot({ path: join(reportDir, id + '-failure.png') }).catch(() => {}); throw error;
    } finally {
      if (stopped) await startServer();
      await ctx.tracing.stop({ path: join(reportDir, id + '.zip') }); await ctx.close(); active(null);
    }
  }
  for (const mode of ['corrupt', 'denied']) {
    const id = 'composite-http-' + mode + '-320';
    const ctx = await context({ width: 320, height: 900 }, mode === 'denied' ? 'denied' : '');
    const page = await ctx.newPage(); active(page); let stopped = false; report.currentScenario = id;
    await ctx.tracing.start({ screenshots: true, snapshots: true, sources: false });
    try {
      await page.goto(base + '?lang=uk'); await ready(page);
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
      if (mode === 'corrupt') await page.evaluate(key => localStorage.setItem(key, '{broken'), KEY);
      await page.goto(base + 'tools/coordinator/?lang=en&fromLang=uk'); await toolReady(page);
      await page.locator('#materialQuery').waitFor();
      await page.locator('#demo-01').selectOption('done');
      assert.equal(await page.locator('#demo-01').inputValue(), 'done');
      assert.match(await page.locator('#storage').innerText(), mode === 'corrupt' ? /preserved/ : /unavailable/);
      if (mode === 'corrupt') assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), '{broken');
      await shot(page, id + '-memory-edit');
      await stopServer(); stopped = true; await ctx.setOffline(true);
      await page.reload(); await toolReady(page);
      assert.equal(await page.locator('#demo-01').inputValue(), 'todo', 'Protected/denied storage must not promise durable tab edits');
      assert.match(await page.locator('#storage').innerText(), mode === 'corrupt' ? /preserved/ : /unavailable/);
      if (mode === 'corrupt') assert.equal(await page.evaluate(key => localStorage.getItem(key), KEY), '{broken');
      const material = await verifyMaterialOffline(page, { id, fits, shot });
      assert.equal(await page.locator('#demo-01').inputValue(), 'todo');
      assert.ok((await page.locator('#catalogue-return').getAttribute('href')).endsWith('?lang=uk'));
      await page.locator('#catalogue-return').click(); await ready(page);
      assert.equal(await page.locator('html').getAttribute('lang'), 'uk');
      await page.goBack(); await page.reload(); await toolReady(page);
      assert.equal(await page.locator('#demo-01').inputValue(), 'todo');
      report.results.push({ scenario: 'candidate HTTP functional / ' + mode + ' storage / ephemeral changes / offline reload / material / Back',
        transition: 'pr68-http', width: 320, mode, status: 'passed', material,
        persistence: mode === 'corrupt' ? 'unknown original record preserved' : 'tab-only edits; reload persistence not promised' });
    } catch (error) {
      await page.screenshot({ path: join(reportDir, id + '-failure.png') }).catch(() => {}); throw error;
    } finally {
      if (stopped) await startServer();
      await ctx.tracing.stop({ path: join(reportDir, id + '.zip') }); await ctx.close(); active(null);
    }
  }
  delete report.currentScenario;
}
