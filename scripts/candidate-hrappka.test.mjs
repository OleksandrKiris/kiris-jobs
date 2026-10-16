import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const locales = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
const application = "https://aplikuj.hrappka.pl/oferta/Konfekcjonowanie-i-pomocnicze-czynnosci-przy-uprawie-warzyw/177999/Facebooklink?lang=pl";
const vegetableJobs = ["greenhouse-tomatoes", "greenhouse-renewal", "tomato-sorting"];
const source = await fs.readFile(new URL("assets/candidate.js", root), "utf8");
const instrumented = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.applicationTest = { card, detail, hrappkaUrl, applicationUrl };\n})();");
assert.notEqual(instrumented, source, "Only replace startup; never submit forms or run analytics");
const scripts = await Promise.all(["data/content.js", ...locales.map(l => `data/locales/${l}.js`), "assets/i18n.js"].map(async path => fs.readFile(new URL(path, root), "utf8")));

function catalog(locale = "pl") {
  const location = new URL(`https://oleksandrkiris.github.io/kiris-jobs/?lang=${locale}&src=catalog-test`);
  const window = { location };
  const context = vm.createContext({ window, location, URL, Intl, Date,
    document: { baseURI: "https://oleksandrkiris.github.io/kiris-jobs/" },
    navigator: { language: locale, languages: [locale] },
    localStorage: { getItem: () => null },
    fetch: () => { throw new Error("HRappka tests must not use the network"); }
  });
  scripts.forEach(script => vm.runInContext(script, context));
  vm.runInContext(instrumented, context);
  return { window, ...window.applicationTest };
}

for (const locale of locales) {
  test(`${locale}: direct HRappka links are scoped, Polish, separate from details, and preserve the original form`, () => {
    const c = catalog(locale);
    const jobs = c.window.PORTAL_CONTENT.jobs;
    assert.equal(jobs.length, 14);
    for (const job of jobs) {
      const eligible = vegetableJobs.includes(job.id);
      assert.equal(c.hrappkaUrl(job), eligible ? application : "");
      const card = c.card(job);
      const detail = c.detail(job);
      for (const html of [card, detail]) {
        assert.equal((html.match(/data-hrappka-link/g) || []).length, eligible ? 1 : 0);
        if (eligible) {
          const anchor = html.match(/<a\b[^>]*data-hrappka-link[^>]*>/)?.[0];
          assert.ok(anchor.includes(`href="${application}"`));
          assert.ok(anchor.includes('target="_blank"'));
          assert.ok(anchor.includes('rel="noopener noreferrer"'));
          assert.ok(!anchor.includes("data-open-job") && !anchor.includes("data-apply-job"), "Native link must not open the internal application or job modal");
          assert.ok(html.includes(c.window.PortalI18n.t("ui.hrappkaLanguage")));
        }
      }
      let depth = 0;
      for (const tag of card.match(/<\/?a\b[^>]*>/g) || []) {
        depth += tag.startsWith("</") ? -1 : 1;
        assert.ok(depth >= 0 && depth <= 1, "Card must never contain nested anchors");
      }
      assert.equal(depth, 0);
      const originalForm = new URL(c.applicationUrl(job));
      assert.equal(originalForm.pathname, `/kiris-jobs/vacancies/${job.id}/`);
      assert.equal(originalForm.searchParams.get("lang"), locale);
      assert.equal(originalForm.searchParams.get("apply"), "1");
      assert.equal(originalForm.searchParams.get("src"), "catalog-test");
      assert.ok(detail.includes(`data-apply-job="${job.id}"`), "The existing form remains directly reachable for every job");
    }
  });
}

test("paused and closed vegetable jobs do not show direct or internal application actions", () => {
  const c = catalog();
  for (const id of vegetableJobs) {
    const original = c.window.PORTAL_CONTENT.jobs.find(job => job.id === id);
    for (const status of ["paused", "closed"]) {
      const job = { ...original, status };
      assert.equal(c.hrappkaUrl(job), "");
      assert.ok(!c.card(job).includes("data-hrappka-link"));
      assert.ok(!c.detail(job).includes("data-hrappka-link"));
      assert.ok(!c.detail(job).includes("data-apply-job"));
    }
  }
});

test("the homepage has usable native HRappka links even before JavaScript loads", async () => {
  const html = await fs.readFile(new URL("index.html", root), "utf8");
  const links = html.match(/<a\b[^>]*data-hrappka-link[^>]*>/g) || [];
  assert.equal(links.length, 2);
  for (const link of links) {
    assert.ok(link.includes(`href="${application}"`));
    assert.ok(link.includes('target="_blank"'));
    assert.ok(link.includes('rel="noopener noreferrer"'));
  }
  assert.ok(html.includes('data-i18n="ui.hrappkaScope"'));
  assert.ok(html.includes('data-i18n="ui.hrappkaLanguage"'));
});
