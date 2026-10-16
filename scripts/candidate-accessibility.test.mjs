import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const locales = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
const source = await fs.readFile(new URL("assets/candidate.js", root), "utf8");
const instrumented = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.accessibilityTest = { detail, updateSkipLink };\n})();");
assert.notEqual(instrumented, source);
const scripts = await Promise.all(["data/content.js", ...locales.map(l => `data/locales/${l}.js`), "assets/i18n.js"].map(p => fs.readFile(new URL(p, root), "utf8")));

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
