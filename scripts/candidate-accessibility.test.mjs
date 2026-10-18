import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const locales = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
const source = await fs.readFile(process.env.CANDIDATE_SOURCE_FILE || new URL("assets/candidate.js", root), "utf8");
const instrumented = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.accessibilityTest = { detail, updateSkipLink };\n})();");
assert.notEqual(instrumented, source);
const scripts = await Promise.all(["data/content.js", ...locales.map(l => `data/locales/${l}.js`), "assets/i18n.js"].map(p => fs.readFile(new URL(p, root), "utf8")));

test("installed shortcuts focus existing targets, preserve URLs/context, and leave vacancy routes alone", async () => {
  const routed = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.shortcutTest = { focusCatalogShortcut };\n})();");
  for (const direct of [false, true]) {
    const location = new URL(`https://example.test/${direct ? 'vacancies/greenhouse-tomatoes/' : ''}?lang=ka`);
    const calls = [];
    const nodes = Object.fromEntries(['job-search', 'footer-whatsapp', 'main-content'].map(id => [id, {
      focus(options) { calls.push(['focus', id, options.preventScroll]); },
      scrollIntoView(options) { calls.push(['scroll', id, options.block, options.behavior]); }
    }]));
    const window = { location };
    const context = vm.createContext({ window, location, URL, Intl, Date,
      document: { body: { dataset: direct ? { jobId: 'greenhouse-tomatoes' } : {} },
        getElementById: id => nodes[id], querySelector: () => null },
      navigator: { language: 'ka', languages: ['ka'] }, localStorage: { getItem: () => null },
      fetch() { throw Error('No network or submissions'); }
    });
    scripts.forEach(script => vm.runInContext(script, context));
    vm.runInContext(routed, context);
    for (const [hash, id] of Object.entries({ '#jobs': 'job-search', '#job-search': 'job-search', '#profile': 'footer-whatsapp', '#footer-whatsapp': 'footer-whatsapp', '#home': 'main-content', '#main-content': 'main-content' })) {
      location.hash = hash; calls.length = 0; const before = location.href;
      window.shortcutTest.focusCatalogShortcut();
      assert.equal(location.href, before, 'Language/query/hash remain intact');
      assert.deepEqual(calls, direct ? [] : [['focus', id, true], ['scroll', id, 'center', 'instant']]);
    }
    for (const hash of ['', '#job=greenhouse-tomatoes', '#unknown', '#%E0%A4%A']) {
      location.hash = hash; calls.length = 0; window.shortcutTest.focusCatalogShortcut();
      assert.deepEqual(calls, [], 'Only the exact allowlist may move focus');
    }
  }
  const manifest = JSON.parse(await fs.readFile(new URL('manifest.webmanifest', root), 'utf8'));
  assert.equal(manifest.start_url, './#main-content');
  assert.deepEqual(manifest.shortcuts.map(s => s.url), ['./#job-search', './#footer-whatsapp']);
  assert.match(source, /addEventListener\("hashchange", focusCatalogShortcut\)/);
});

for (const action of ["settled", "visible", "focus", "hash", "wheel"]) {
  test(`late font layout / ${action}: shortcut visibility recovers without stealing interaction`, async () => {
    const routed = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.shortcutTest = { focusCatalogShortcut };\n})();");
    const location = new URL("https://example.test/?lang=ka#profile");
    let finishFonts;
    const ready = new Promise(resolve => { finishFonts = resolve; });
    const calls = [];
    const listeners = new Map();
    const document = { body: { dataset: {} }, fonts: { ready }, querySelector: () => null,
      getElementById: id => id === "footer-whatsapp" ? target : null };
    const target = {
      focus() { document.activeElement = target; },
      scrollIntoView() { calls.push("scroll"); },
      getBoundingClientRect() { return action === "visible" ? {top: 400,bottom: 440} : {top: 950,bottom: 990}; }
    };
    const window = {location,innerHeight:900,
      addEventListener: (event,listener) => listeners.set(event,listener),
      removeEventListener: (event,listener) => { if (listeners.get(event) === listener) listeners.delete(event); } };
    const context = vm.createContext({window,document,location,URL,Intl,Date,
      navigator:{language:"ka",languages:["ka"]},localStorage:{getItem:()=>null},
      fetch(){throw Error("No network or submissions");}});
    scripts.forEach(script => vm.runInContext(script,context));
    vm.runInContext(routed,context);
    window.shortcutTest.focusCatalogShortcut();
    assert.equal(calls.length,1,"The target is focused and scrolled immediately");
    if(action === "focus") document.activeElement = {};
    if(action === "hash") location.hash = "#jobs";
    if(action === "wheel") listeners.get("wheel")?.();
    finishFonts();
    await ready; await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    assert.equal(calls.length,action === "settled" ? 2 : 1);
    assert.equal(listeners.size,0,"Pending interaction listeners are removed after font settlement");
    assert.equal(location.search,"?lang=ka");
  });
}

for (const locale of locales) {
  test(`${locale}: footer landmark follows the chosen language without a Polish fallback`, async () => {
    const index = await fs.readFile(new URL("index.html", root), "utf8");
    const footer = index.match(/<nav class="candidate-footer-links"[^>]*>/)?.[0];
    assert.ok(footer?.includes('data-i18n-aria-label="ui.footerNavigation"'));
    const node = { dataset: { i18nAriaLabel: "ui.footerNavigation" },
      setAttribute(name, value) { this[name] = value; } };
    const window = { location: new URL(`https://example.test/?lang=${locale}`), dispatchEvent() {} };
    const context = vm.createContext({ window, URL, Intl, Date,
      document: { documentElement: {}, getElementById: () => null,
        querySelectorAll: selector => selector === "[data-i18n-aria-label]" ? [node] : [] },
      navigator: { language: locale, languages: [locale] },
      localStorage: { getItem: () => null, setItem() {} },
      CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
      fetch() { throw Error("Network and submissions forbidden"); }
    });
    scripts.forEach(script => vm.runInContext(script, context));
    const before = JSON.stringify(window.PORTAL_CONTENT);
    const api = window.PortalI18n;
    api.applyStaticTranslations();
    const expected = window.PORTAL_TRANSLATIONS[locale].ui.footerNavigation;
    assert.ok(expected && expected !== "ui.footerNavigation");
    assert.equal(node["aria-label"], expected);
    if (locale !== "pl") assert.notEqual(expected, window.PORTAL_TRANSLATIONS.pl.ui.footerNavigation);
    assert.notEqual(expected, window.PORTAL_TRANSLATIONS[locale].ui.mainNavigation);
    for (const next of ["pl", "en", locale]) {
      assert.equal(await api.setLocale(next, { updateUrl: false }), true);
      assert.equal(node["aria-label"], window.PORTAL_TRANSLATIONS[next].ui.footerNavigation);
      assert.equal(context.document.documentElement.lang, next);
    }
    assert.equal(JSON.stringify(window.PORTAL_CONTENT), before);
  });
}

test("all generated vacancy pages expose the same localizable footer landmark", async () => {
  for (const id of await fs.readdir(new URL("vacancies/", root))) {
    const html = await fs.readFile(new URL(`vacancies/${id}/index.html`, root), "utf8");
    assert.ok(/class="candidate-footer-links" data-i18n-aria-label="ui\.footerNavigation" aria-label="PrimServ, kontakt i prywatność"/.test(html), id);
  }
});

for (const locale of locales) {
  test(`${locale}: skip navigation stays on the current page and vacancy titles have native page headings`, () => {
    const location = new URL(`https://oleksandrkiris.github.io/kiris-jobs/?lang=${locale}`);
    const link = {};
    const window = { location };
    const context = vm.createContext({ window, location, URL, Intl, Date,
      document: { baseURI: "https://oleksandrkiris.github.io/kiris-jobs/", querySelector: selector => selector === ".skip-link" ? link : null },
      navigator: { language: locale, languages: [locale] }, localStorage: { getItem: () => null },
      fetch() { throw Error("Network and submissions forbidden"); }
    });
    scripts.forEach(script => vm.runInContext(script, context));
    vm.runInContext(instrumented, context);
    const api = window.accessibilityTest;
    const before = JSON.stringify(window.PORTAL_CONTENT);
    for (const path of ["", ...window.PORTAL_CONTENT.jobs.map(job => `vacancies/${job.id}/`)]) {
      for (const suffix of ["", "&apply=1&src=qa#old-anchor"]) {
        location.href = `https://oleksandrkiris.github.io/kiris-jobs/${path}?lang=${locale}${suffix}`;
        api.updateSkipLink();
        const target = new URL(link.href);
        assert.equal(target.pathname, location.pathname);
        assert.equal(target.search, location.search);
        assert.equal(target.hash, "#main-content");
      }
    }
    for (const job of window.PORTAL_CONTENT.jobs) {
      assert.match(api.detail(job, { page: true }), /<h1 id="job-page-title">[^<]+<\/h1>/);
      assert.match(api.detail(job), /<h2 id="job-dialog-title">[^<]+<\/h2>/);
    }
    assert.equal(JSON.stringify(window.PORTAL_CONTENT), before);
  });
}

test("generated skip links work even before JavaScript, with a focusable main target", async () => {
  const index = await fs.readFile(new URL("index.html", root), "utf8");
  assert.match(index, /class="skip-link" href="#main-content"/);
  assert.match(index, /<main id="main-content" tabindex="-1">/);
  const dirs = await fs.readdir(new URL("vacancies/", root));
  assert.equal(dirs.length, 14);
  for (const id of dirs) {
    const html = await fs.readFile(new URL(`vacancies/${id}/index.html`, root), "utf8");
    assert.ok(html.includes(`class="skip-link" href="https://oleksandrkiris.github.io/kiris-jobs/vacancies/${id}/#main-content"`));
    assert.match(html, /<main id="main-content" tabindex="-1">/);
  }
  const css = await fs.readFile(new URL("assets/clean.css", root), "utf8");
  assert.ok(css.includes(".vacancy-hero :is(h1, h2)"));
  assert.ok(!css.includes(".vacancy-hero h2"), "Every existing title layout must cover the native h1 too");
});
