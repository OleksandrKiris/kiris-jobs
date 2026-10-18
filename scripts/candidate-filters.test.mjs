import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const locales = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
const source = await fs.readFile(process.env.CANDIDATE_SOURCE_FILE || new URL("assets/candidate.js", root), "utf8");
const instrumented = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.filterTest = { bind, renderCountryFilter, renderFeatureFilter, resetFilters, restoreCatalogContext, visibleJobs, state };\n})();");
assert.notEqual(instrumented, source, "Replace startup only; never run analytics or candidate submissions");
const scripts = await Promise.all(["data/content.js", ...locales.map(l => `data/locales/${l}.js`), "assets/i18n.js"].map(async path => fs.readFile(new URL(path, root), "utf8")));

function catalog(locale = "pl", options = {}) {
  const location = new URL(`https://oleksandrkiris.github.io/kiris-jobs/${options.path || ""}?lang=${locale}`);
  const storage = options.storage || new Map();
  const storageCalls = [];
  const window = { location, addEventListener() {}, sessionStorage: {
    getItem(key) { storageCalls.push(["get", key]); if (options.blockRead) throw Error("Storage blocked"); return storage.get(key) ?? null; },
    setItem(key, value) { storageCalls.push(["set", key]); if (options.blockWrite) throw Error("Storage full"); storage.set(key, value); },
    removeItem(key) { storageCalls.push(["remove", key]); if (options.blockWrite) throw Error("Storage blocked"); storage.delete(key); }
  } };
  const handlers = new Map();
  const elements = new Map();
  const document = {
    baseURI: location.href, activeElement: null,
    getElementById: id => elements.get(id),
    querySelector: () => null, querySelectorAll: () => [],
    addEventListener: (type, handler) => { handlers.set(type, handler); }
  };
  function element(id) {
    let html = "";
    let buttons = [];
    const node = {
      id, attributes: {}, value: "", focusCalls: [],
      handlers: new Map(),
      addEventListener(type, handler) { this.handlers.set(type, handler); },
      setAttribute(key, value) { this.attributes[key] = value; },
      focus(options) { document.activeElement = this; this.focusCalls.push(options); },
      querySelectorAll: selector => selector === "button" ? buttons : [],
      get innerHTML() { return html; },
      set innerHTML(value) {
        html = value;
        if (buttons.includes(document.activeElement)) document.activeElement = null;
        buttons = Array.from(value.matchAll(/<button\s+([\s\S]*?)>([\s\S]*?)<\/button>/g), ([, attrs, label]) => {
          const kind = attrs.includes("data-country-filter") ? "countryFilter" : "featureFilter";
          const selected = attrs.match(/data-(?:country|feature)-filter="([^"]*)"/)?.[1] || "";
          const button = element(`${id}:${selected}`);
          button.dataset = { [kind]: selected };
          button.label = label.trim();
          button.attributes["aria-pressed"] = attrs.match(/aria-pressed="([^"]*)"/)?.[1];
          button.classes = new Set(attrs.includes('class="is-active"') ? ["is-active"] : []);
          button.classList = { toggle(name, active) { active ? button.classes.add(name) : button.classes.delete(name); } };
          button.closest = selector => selector === (kind === "countryFilter" ? "[data-country-filter]" : "[data-feature-filter]") ? button : null;
          return button;
        });
      }
    };
    return node;
  }
  for (const id of ["country-filter", "feature-filter", "job-search", "reset-filters", "job-grid", "other-job-grid", "other-job-count", "other-jobs", "result-count", "empty-state", "job-total"]) elements.set(id, element(id));
  if (options.earlyQuery !== undefined) elements.get("job-search").value = options.earlyQuery;
  if (options.earlyEdited) elements.get("job-search").dataset = { pendingInput: "true" };
  const context = vm.createContext({ window, document, location, URL, Intl, Date,
    navigator: { language: locale, languages: [locale] }, localStorage: { getItem: () => null },
    fetch() { throw Error("Network forbidden in filter tests"); }
  });
  scripts.forEach(script => vm.runInContext(script, context));
  vm.runInContext(instrumented, context);
  const api = window.filterTest;
  api.restoreCatalogContext();
  api.renderCountryFilter();
  api.renderFeatureFilter();
  api.bind();
  return { api, window, document, elements, storage, storageCalls,
    input(query) { const node = elements.get("job-search"); node.value = query; node.handlers.get("input")({ target: node }); },
    click(button) { button.focus(); handlers.get("click")({ target: button }); } };
}

for (const locale of locales) {
  for (const [id, key, other] of [["country-filter", "countryFilter", "feature"], ["feature-filter", "featureFilter", "country"]]) {
    test(`${locale}: ${id} keeps the same buttons and keyboard focus when selecting`, () => {
      const c = catalog(locale);
      const originalFacts = JSON.stringify(c.window.PORTAL_CONTENT);
      const group = c.elements.get(id);
      const buttons = group.querySelectorAll("button");
      const labels = buttons.map(button => button.label);
      c.api.state[other] = other === "country" ? "PL" : "housing";
      const query = c.window.PortalI18n.job(c.window.PORTAL_CONTENT.jobs[0]).title;
      c.api.state.query = query;
      for (const button of [...buttons, buttons.at(-1)]) {
        c.click(button);
        assert.equal(group.querySelectorAll("button")[buttons.indexOf(button)], button, "Do not replace the activated DOM button");
        assert.equal(c.document.activeElement, button);
        assert.deepEqual(group.querySelectorAll("button").map(item => item.label), labels);
        assert.equal(c.api.state[key === "countryFilter" ? "country" : "feature"], button.dataset[key]);
        assert.equal(c.api.state[other], other === "country" ? "PL" : "housing");
        assert.equal(c.api.state.query, query);
        for (const item of buttons) {
          const selected = item === button;
          assert.equal(item.attributes["aria-pressed"], String(selected));
          assert.equal(item.classes.has("is-active"), selected);
        }
        assert.equal(c.elements.get("empty-state").hidden, c.api.visibleJobs().length > 0);
      }
      assert.equal(JSON.stringify(c.window.PORTAL_CONTENT), originalFacts, "Never mutate vacancy facts or media");
    });
  }
}

test("reset still clears query and both filters and intentionally returns focus to search", () => {
  const c = catalog();
  c.api.state.query = "no-such-job";
  c.api.state.country = "BE";
  c.api.state.feature = "housing";
  c.api.resetFilters();
  assert.equal(c.api.state.query, "");
  assert.equal(c.api.state.country, "");
  assert.equal(c.api.state.feature, "");
  assert.equal(c.api.visibleJobs().length, 14);
  assert.equal(c.elements.get("job-search").value, "");
  assert.equal(c.document.activeElement, c.elements.get("job-search"));
  for (const [id, key] of [["country-filter", "countryFilter"], ["feature-filter", "featureFilter"]]) {
    assert.ok(c.elements.get(id).querySelectorAll("button").every(button => button.attributes["aria-pressed"] === String(!button.dataset[key])));
  }
});

const contextKey = "kiris-jobs:catalog-context:v1";
for (const locale of locales) {
  test(`${locale}: catalogue → vacancy → catalogue restores query and both filters in the same tab`, () => {
    const first = catalog(locale);
    const originalFacts = JSON.stringify(first.window.PORTAL_CONTENT);
    first.input("Ryczywół");
    first.click(first.elements.get("country-filter").querySelectorAll("button").find(b => b.dataset.countryFilter === "PL"));
    first.click(first.elements.get("feature-filter").querySelectorAll("button").find(b => b.dataset.featureFilter === "housing"));
    const expected = Array.from(first.api.visibleJobs(), job => job.id);
    assert.ok(expected.length > 0);
    const saved = first.storage.get(contextKey);
    assert.deepEqual(JSON.parse(saved), { query: "Ryczywół", country: "PL", feature: "housing" });
    const direct = catalog(locale, { storage: first.storage, path: "vacancies/greenhouse-tomatoes/" });
    assert.equal(direct.storageCalls.length, 0, "Vacancy pages must not read or overwrite catalogue context");
    const returned = catalog(locale, { storage: first.storage });
    assert.deepEqual(Array.from(returned.api.visibleJobs(), job => job.id), expected);
    assert.equal(returned.elements.get("job-search").value, "Ryczywół");
    assert.equal(returned.api.state.country, "PL");
    assert.equal(returned.api.state.feature, "housing");
    const changedLanguage = catalog(locale === "en" ? "uk" : "en", { storage: first.storage });
    assert.equal(changedLanguage.api.state.query, "Ryczywół", "Language changes must not discard the query");
    assert.equal(JSON.stringify(first.window.PORTAL_CONTENT), originalFacts);
    returned.api.resetFilters();
    assert.equal(returned.storage.has(contextKey), false);
    assert.equal(catalog(locale, { storage: returned.storage }).api.visibleJobs().length, 14);
    assert.equal(catalog(locale).api.state.query, "", "A fresh tab without saved context starts unfiltered");
  });
}

test("invalid or unavailable session context never breaks catalogue filters", () => {
  for (const value of ["{", "null", "[]", "1", '"text"']) {
    const c = catalog("pl", { storage: new Map([[contextKey, value]]) });
    assert.equal(c.api.visibleJobs().length, 14);
  }
  const invalid = catalog("pl", { storage: new Map([[contextKey, JSON.stringify({ query: 5, country: "unknown", feature: "unknown", openJobId: "x" })]]) });
  assert.equal(invalid.api.state.query, "");
  assert.equal(invalid.api.state.country, "");
  assert.equal(invalid.api.state.feature, "");
  assert.equal(invalid.api.state.openJobId, "");
  const blocked = catalog("pl", { blockRead: true, blockWrite: true });
  blocked.input("Ryczywół");
  assert.ok(blocked.api.visibleJobs().length > 0);
  assert.doesNotThrow(() => blocked.api.resetFilters());
  assert.equal(blocked.api.visibleJobs().length, 14);
});

test("startup restores context before rendering the catalogue", () => {
  assert.match(source, /function init\(\)\s*\{\s*i18n\.init\(\);\s*restoreCatalogContext\(\);/);
});

for (const locale of locales) {
  test(`${locale}: text entered before startup survives context restore and filters immediately`, () => {
    const ready = catalog(locale);
    const facts = JSON.stringify(ready.window.PORTAL_CONTENT);
    const job = ready.window.PORTAL_CONTENT.jobs.find(job => job.id === "greenhouse-tomatoes");
    const earlyQuery = "  " + ready.window.PortalI18n.job(job).title + "  ";
    for (const saved of [null, { query: "no-such-old-query", country: "PL", feature: "housing" }]) {
      const storage = new Map(saved ? [[contextKey, JSON.stringify(saved)]] : []);
      const before = storage.get(contextKey);
      const c = catalog(locale, { earlyQuery, storage });
      assert.equal(c.api.state.query, earlyQuery);
      assert.equal(c.elements.get("job-search").value, earlyQuery);
      assert.ok(c.api.visibleJobs().some(job => job.id === "greenhouse-tomatoes"));
      assert.ok(c.api.visibleJobs().length < 14, "Initial render must filter the visible typed text");
      if (saved) {
        assert.equal(c.api.state.country, "PL");
        assert.equal(c.api.state.feature, "housing");
      }
      assert.deepEqual(JSON.parse(storage.get(contextKey)), { query: earlyQuery, country: saved?.country || "", feature: saved?.feature || "" }, "Early user input updates only the catalogue context");
      assert.equal(JSON.stringify(c.window.PORTAL_CONTENT), facts);
    }
  });
}
test("early search remains usable when session storage cannot be read or written", () => {
  const c = catalog("ru", { earlyQuery: "томат", blockRead: true, blockWrite: true });
  assert.equal(c.api.state.query, "томат");
  assert.equal(c.api.visibleJobs().length, 2);
});

test("clearing a search before startup overrides an older saved query", () => {
  const storage = new Map([[contextKey, JSON.stringify({query:"no-such-old-query",country:"PL",feature:"housing"})]]);
  const c = catalog("ru", { earlyQuery: "", earlyEdited: true, storage });
  assert.equal(c.api.state.query, "");
  assert.equal(c.elements.get("job-search").value, "");
  assert.ok(c.api.visibleJobs().some(job => job.id === "greenhouse-tomatoes"));
  assert.equal(JSON.parse(storage.get(contextKey)).query, "");
});
