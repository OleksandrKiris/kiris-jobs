import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const bootstrap = await readFile(new URL('../assets/bootstrap.js', import.meta.url), 'utf8');
async function start({ lang = 'en', fail = '', storageDenied = false } = {}) {
  const loaded = [], classes = [], errors = [];
  const window = { location: { href: `https://example.test/kiris-jobs/?lang=${lang}` } };
  const context = vm.createContext({ window, URL,
    navigator: { languages: ['pl-PL'] },
    localStorage: { getItem() { if (storageDenied) throw Error('denied'); return null; } },
    document: { documentElement: { classList: { add: value => classes.push(value) } } },
    console: { error: (...args) => errors.push(args) },
    async loadModule(url) {
      const path = String(url);
      if (fail && path.includes(fail)) throw Error('locale unavailable');
      loaded.push(path);
    }
  });
  await vm.runInContext(bootstrap.replaceAll('import.meta.url', JSON.stringify('https://example.test/kiris-jobs/assets/bootstrap.js'))
    .replace(/\bimport\(/g, 'loadModule('), context);
  return { loaded, classes, errors, window };
}

test('missing requested locale preserves the Polish catalogue and exposes an explicit fallback', async () => {
  const result = await start({ fail: '/en.js', storageDenied: true });
  assert.ok(result.loaded.some(path => path.includes('candidate.js')), 'catalogue must still start');
  assert.ok(result.loaded.some(path => path.includes('/pl.js')));
  assert.equal(result.window.PORTAL_LOCALE_LOAD_ERROR, 'en');
  assert.deepEqual(result.classes, []);
});
test('successful selection does not report a failure', async () => {
  const result = await start();
  assert.ok(result.loaded.some(path => path.includes('/en.js')));
  assert.ok(result.loaded.some(path => path.includes('candidate.js')));
  assert.equal(result.window.PORTAL_LOCALE_LOAD_ERROR, undefined);
});
test('unavailable base locale remains a startup failure, not a false working catalogue', async () => {
  const result = await start({ fail: '/pl.js' });
  assert.deepEqual(result.classes, ['app-load-failed']);
  assert.equal(result.loaded.some(path => path.includes('candidate.js')), false);
});
test('unsupported locale does not cause an unexpected fetch', async () => {
  const result = await start({ lang: '../xx' });
  assert.equal(result.loaded.some(path => path.includes('/xx')), false);
  assert.ok(result.loaded.some(path => path.includes('candidate.js')));
});
test('all fallback bootstrap modules use the exact precached URLs', async () => {
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const shell = vm.runInNewContext(sw.match(/const CORE_SHELL = (\[[\s\S]*?\]);/)[1]);
  const cached = new Set(shell.map(path => new URL(path, 'https://example.test/kiris-jobs/').href));
  const result = await start({ fail: '/en.js' });
  for (const path of result.loaded) {
    const absolute = new URL(path, 'https://example.test/kiris-jobs/assets/bootstrap.js').href;
    assert.ok(cached.has(absolute), `Not precached: ${absolute}`);
  }
});

const i18nSource = await readFile(new URL('../assets/i18n.js', import.meta.url), 'utf8');
function languageApp({ denied = false, failure = '', stored = 'en' } = {}) {
  const elements = [], scripts = [], timers = new Map(), events = [];
  let sequence = 0;
  function element(tag) {
    const node = { tag, children: [], dataset: {}, attributes: {}, handlers: {},
      setAttribute(k, v) { this.attributes[k] = v; },
      removeAttribute(k) { delete this.attributes[k]; },
      addEventListener(k, fn) { this.handlers[k] = fn; },
      append(...children) { this.children.push(...children); },
      before() {}, remove() { this.removed = true; },
      contains(value) { return this === value || this.children.includes(value); },
      querySelector(tag) { return this.children.find(child => child.tag === tag); },
      focus() { document.activeElement = this; }
    };
    elements.push(node); return node;
  }
  const main = element('main');
  const document = { documentElement: {}, body: {}, activeElement: null,
    createElement: element,
    getElementById: id => elements.find(node => node.id === id && !node.removed),
    querySelector: tag => tag === 'main' ? main : null,
    querySelectorAll: () => [],
    head: { append: script => scripts.push(script) }
  };
  const saved = new Map([['kiris-jobs:language:v1', stored], ['unrelated', 'keep']]);
  const window = { location: { href: 'https://example.test/?lang=en&src=test' },
    PORTAL_TRANSLATIONS: { pl: { meta: { name: 'Polski' } } },
    PORTAL_LOCALE_BASE: 'https://example.test/data/locales/', PORTAL_ASSET_VERSION: '220',
    PORTAL_LOCALE_LOAD_ERROR: failure, dispatchEvent: event => events.push(event) };
  const context = vm.createContext({ window, document, URL, Intl,
    navigator: { languages: ['pl'] },
    localStorage: {
      getItem(k) { if (denied) throw Error('denied'); return saved.get(k); },
      setItem(k, v) { if (denied) throw Error('denied'); saved.set(k, v); }
    },
    history: { state: { keep: true }, replaceState(_state, _title, url) { window.location.href = String(url); } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    setTimeout(fn) { const id = ++sequence; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(i18nSource, context);
  const api = window.PortalI18n; api.init();
  function complete(locale, ok) {
    const script = scripts.findLast(node => node.src.includes(`/${locale}.js`) && !node.removed);
    assert.ok(script, `pending ${locale} script`);
    if (ok) window.PORTAL_TRANSLATIONS[locale] = { meta: { name: locale.toUpperCase() } };
    script.handlers[ok ? 'load' : 'error']();
  }
  return { api, document, window, saved, scripts, timers, events, complete };
}

test('startup recovery explains the fallback in every supported requested language', () => {
  for (const language of ['ru','uk','pl','en','az','ka','id','es','fil','ne','hy']) {
    const app = languageApp({ failure: language, denied: true });
    const notice = app.document.getElementById('locale-load-notice');
    assert.equal(notice.lang, language);
    assert.match(notice.querySelector('p').textContent, /Polski/);
    assert.ok(notice.querySelector('button').textContent.length > 4);
    assert.equal(notice.querySelector('p').attributes.role, 'status');
    assert.equal(app.api.locale, 'pl');
    assert.equal(app.scripts.length, 0, 'no automatic retry or preload');
  }
});
test('failed switch and failed retry keep the active catalogue, URL and saved preference', async () => {
  const app = languageApp();
  const switching = app.api.setLocale('en'); app.complete('en', false);
  assert.equal(await switching, false);
  const button = app.document.getElementById('locale-load-retry');
  const retrying = button.handlers.click();
  assert.equal(button.disabled, true);
  app.document.activeElement = app.document.body; // disabling a focused native button
  app.complete('en', false); await retrying;
  assert.equal(button.disabled, false);
  assert.equal(app.document.activeElement, button);
  assert.equal(app.api.locale, 'pl');
  assert.equal(app.saved.get('kiris-jobs:language:v1'), 'en');
  assert.equal(app.window.location.href, 'https://example.test/?lang=en&src=test');
  assert.equal(app.events.length, 0);
});
test('retry succeeds without reload, including unavailable storage, preserving URL context', async () => {
  for (const denied of [false, true]) {
    const app = languageApp({ denied, failure: 'en', stored: '{broken' });
    const button = app.document.getElementById('locale-load-retry');
    const retrying = button.handlers.click(); app.complete('en', true); await retrying;
    assert.equal(app.api.locale, 'en');
    assert.equal(app.document.documentElement.lang, 'en');
    assert.equal(app.document.getElementById('locale-load-notice'), undefined);
    assert.equal(app.saved.get('unrelated'), 'keep');
    assert.equal(new URL(app.window.location.href).searchParams.get('src'), 'test');
    assert.equal(app.events.length, 1);
  }
});
test('stalled request releases retry after a bounded timeout', async () => {
  const app = languageApp();
  const switching = app.api.setLocale('en');
  [...app.timers.values()][0]();
  assert.equal(await switching, false);
  assert.equal(app.scripts[0].removed, true);
  assert.equal(app.timers.size, 0);
  assert.ok(app.document.getElementById('locale-load-retry'));
});
test('an older retry cannot override a newer explicit language choice', async () => {
  const app = languageApp();
  const english = app.api.setLocale('en');
  assert.equal(await app.api.setLocale('pl'), true);
  app.complete('en', true);
  assert.equal(await english, false);
  assert.equal(app.api.locale, 'pl');
  assert.equal(app.document.getElementById('locale-load-notice'), undefined);
});
test('concurrent identical requests share one download; unsupported choices do not load', async () => {
  const app = languageApp();
  assert.equal(await app.api.setLocale('xx'), false);
  const first = app.api.setLocale('en'), second = app.api.setLocale('en');
  assert.equal(app.scripts.length, 1);
  app.complete('en', true);
  assert.equal(await first, false);
  assert.equal(await second, true);
});
