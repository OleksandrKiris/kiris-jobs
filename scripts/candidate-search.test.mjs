import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const locales = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
const source = await fs.readFile(new URL("assets/candidate.js", root), "utf8");
const instrumented = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.searchTest = { visibleJobs, state };\n})();");
assert.notEqual(instrumented, source, "Instrument only the startup call, never run live UI or analytics");
const scripts = await Promise.all(["data/content.js", ...locales.map(l => `data/locales/${l}.js`), "assets/i18n.js"].map(async path => fs.readFile(new URL(path, root), "utf8")));

function catalog(locale = "pl") {
  const location = new URL(`https://oleksandrkiris.github.io/kiris-jobs/?lang=${locale}`);
  const window = { location };
  const context = vm.createContext({ window, location, URL, Intl, Date,
    navigator: { language: locale, languages: [locale] },
    localStorage: { getItem: () => null },
    fetch: () => { throw new Error("Network requests are forbidden in search tests"); }
  });
  scripts.forEach(script => vm.runInContext(script, context));
  vm.runInContext(instrumented, context);
  const { state, visibleJobs } = window.searchTest;
  return { window, state, find(query) { state.query = query; return Array.from(visibleJobs(), job => job.id); } };
}

test("Polish city search accepts names without keyboard diacritics", () => {
  const c = catalog();
  assert.ok(c.find("Ryczywół").includes("greenhouse-tomatoes"));
  assert.deepEqual(c.find("Ryczywol"), c.find("Ryczywół"));
  assert.deepEqual(c.find("RYCZYWOL"), c.find("Ryczywół"));
  assert.ok(c.find("Pruszcz Gdański").length > 0);
  assert.deepEqual(c.find("Pruszcz Gdanski"), c.find("Pruszcz Gdański"));
});

test("composed and decomposed Latin city names find the same jobs", () => {
  const c = catalog();
  assert.deepEqual(c.find("Ryczywo\u0301ł"), c.find("Ryczywół"));
});

for (const locale of locales) {
  test(`${locale}: exact localized titles still match and country/benefit filters stay active`, () => {
    const c = catalog(locale);
    const jobs = c.window.PORTAL_CONTENT.jobs;
    const original = JSON.stringify(jobs);
    const job = jobs.find(j => j.id === "greenhouse-tomatoes");
    const title = c.window.PortalI18n.job(job).title;
    assert.ok(c.find(title).includes(job.id));
    assert.equal(c.find("  ").length, 14);
    c.state.country = "PL";
    c.state.feature = "housing";
    assert.ok(c.find(title).includes(job.id));
    c.state.country = "BE";
    assert.equal(c.find(title).includes(job.id), false);
    c.state.country = "";
    c.state.feature = "";
    assert.equal(c.find("no-such-vacancy-99999").length, 0);
    assert.equal(JSON.stringify(jobs), original, "Search must never mutate job facts");
  });
}

test("non-Latin combining marks are not stripped as Latin accents", () => {
  const c = catalog("ru");
  const job = { id: "unicode-fixture", title: "й नेपाली საქართველო Հայերեն" };
  c.window.PORTAL_CONTENT.jobs.push(job);
  for (const query of ["й", "नेपाली", "საქართველო", "Հայերեն"]) {
    assert.ok(c.find(query).includes(job.id));
  }
  job.title = "й";
  assert.equal(c.find("и").includes(job.id), false);
});

test("Latin city uppercase works independently of the selected interface language", () => {
  const c = catalog("az");
  assert.ok(c.find("SIECHNICE").includes("greenhouse-tomatoes"));
  assert.deepEqual(c.find("SIECHNICE"), c.find("Siechnice"));
});
