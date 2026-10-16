import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const locales = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
const source = await fs.readFile(new URL("assets/candidate.js", root), "utf8");
const instrumented = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.filterTest = { bind, renderCountryFilter, renderFeatureFilter, resetFilters, visibleJobs, state };\n})();");
assert.notEqual(instrumented, source, "Replace startup only; never run analytics or candidate submissions");
const scripts = await Promise.all(["data/content.js", ...locales.map(l => `data/locales/${l}.js`), "assets/i18n.js"].map(async path => fs.readFile(new URL(path, root), "utf8")));

function catalog(locale = "pl") {
  const location = new URL(`https://oleksandrkiris.github.io/kiris-jobs/?lang=${locale}`);
  const window = { location, addEventListener() {} };
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
      addEventListener() {},
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
  const context = vm.createContext({ window, document, location, URL, Intl, Date,
    navigator: { language: locale, languages: [locale] }, localStorage: { getItem: () => null },
    fetch() { throw Error("Network forbidden in filter tests"); }
  });
  scripts.forEach(script => vm.runInContext(script, context));
  vm.runInContext(instrumented, context);
  const api = window.filterTest;
  api.renderCountryFilter();
  api.renderFeatureFilter();
  api.bind();
  return { api, window, document, elements, click(button) { button.focus(); handlers.get("click")({ target: button }); } };
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
