import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const locales = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
const source = await fs.readFile(new URL("assets/candidate.js", root), "utf8");
const instrumented = source.replace(/\n  init\(\);\n\}\)\(\);\s*$/, "\n  window.galleryTest = { ensureHousingLightbox, openHousingLightbox, closeDialog, lightboxState, photoUrl };\n})();");
assert.notEqual(instrumented, source, "Replace startup only; no real UI, analytics or candidate actions");
const scripts = await Promise.all(["data/content.js", ...locales.map(l => `data/locales/${l}.js`), "assets/i18n.js"].map(async file => fs.readFile(new URL(file, root), "utf8")));

function gallery(locale = "pl") {
  const elements = new Map();
  const childNodes = new Map();
  const location = new URL(`https://oleksandrkiris.github.io/kiris-jobs/?lang=${locale}`);
  const window = { location };
  function node() {
    const handlers = new Map();
    return {
      open: false, isConnected: true, focusCalls: [], attributes: {},
      addEventListener(type, handler) {
        if (!handlers.has(type)) handlers.set(type, []);
        handlers.get(type).push(handler);
      },
      emit(type, event = {}) { for (const handler of handlers.get(type) || []) handler(event); },
      setAttribute(key, value) { this.attributes[key] = value; },
      querySelector(selector) {
        if (!childNodes.has(selector)) childNodes.set(selector, node());
        return childNodes.get(selector);
      },
      showModal() { this.open = true; },
      close() { this.open = false; this.emit("close"); },
      focus(options) { this.focusCalls.push(options); }
    };
  }
  const context = vm.createContext({ window, location, URL, Intl, Date,
    document: { getElementById: id => elements.get(id), createElement: node,
      body: { append: element => elements.set(element.id, element) } },
    navigator: { language: locale, languages: [locale] }, localStorage: { getItem: () => null },
    fetch: () => { throw Error("Network requests forbidden in gallery tests"); }
  });
  scripts.forEach(script => vm.runInContext(script, context));
  vm.runInContext(instrumented, context);
  const api = window.galleryTest;
  function open(key, index = 0) {
    const housing = window.PORTAL_CONTENT.housingLocations[key];
    const locationNode = { querySelector: () => ({ textContent: housing.name }) };
    const links = Array.from({ length: housing.photoCount }, (_, i) => ({
      ...node(), href: api.photoUrl(key, i),
      querySelector: () => ({ alt: `${housing.name} · ${i + 1}` }),
      closest: selector => selector === ".housing-grid" ? grid : locationNode
    }));
    const grid = { querySelectorAll: () => links };
    const trigger = links[index];
    api.openHousingLightbox(trigger);
    return { dialog: api.ensureHousingLightbox(), trigger, links, housing };
  }
  return { api, window, open, childNodes };
}

test("backdrop closes a dynamically created photo dialog and returns focus", () => {
  const c = gallery();
  const { dialog, trigger } = c.open(Object.keys(c.window.PORTAL_CONTENT.housingLocations)[0]);
  assert.equal(dialog.open, true);
  dialog.emit("click", { target: dialog });
  assert.equal(dialog.open, false);
  assert.equal(trigger.focusCalls.length, 1);
  assert.equal(trigger.focusCalls[0].preventScroll, true);
});

test("clicking the image or dialog content does not close the gallery", () => {
  const c = gallery();
  const { dialog } = c.open(Object.keys(c.window.PORTAL_CONTENT.housingLocations)[0]);
  for (const selector of ["[data-housing-lightbox-image]", ".housing-lightbox-shell", "[data-housing-lightbox-next]"]) {
    dialog.emit("click", { target: dialog.querySelector(selector) });
    assert.equal(dialog.open, true);
  }
});

test("close button, repeat opening and detached focus target remain safe", () => {
  const c = gallery();
  const key = Object.keys(c.window.PORTAL_CONTENT.housingLocations)[0];
  const first = c.open(key);
  first.dialog.querySelector("[data-housing-lightbox-close]").emit("click");
  assert.equal(first.dialog.open, false);
  assert.equal(first.trigger.focusCalls.length, 1);
  const second = c.open(key, 1);
  assert.equal(first.dialog, second.dialog, "Reuse one dialog and one set of listeners");
  second.trigger.isConnected = false;
  second.dialog.emit("click", { target: second.dialog });
  assert.equal(second.dialog.open, false);
  assert.equal(second.trigger.focusCalls.length, 0);
});

for (const locale of locales) {
  test(`${locale}: all 54 existing photos keep their locations, counter and navigation`, () => {
    const c = gallery(locale);
    const original = JSON.stringify(c.window.PORTAL_CONTENT);
    let photos = 0;
    for (const [key, housing] of Object.entries(c.window.PORTAL_CONTENT.housingLocations)) {
      if (!housing.photoCount) continue;
      photos += housing.photoCount;
      const last = housing.photoCount - 1;
      const { dialog, links, trigger } = c.open(key, last);
      assert.deepEqual(Array.from(c.api.lightboxState.items, item => item.href), links.map(link => link.href));
      const image = dialog.querySelector("[data-housing-lightbox-image]");
      assert.equal(image.src, links[last].href);
      assert.equal(dialog.querySelector("[data-housing-lightbox-title]").textContent, housing.name);
      assert.equal(dialog.querySelector("[data-housing-lightbox-counter]").textContent,
        c.window.PortalI18n.t("ui.photoCounter", { current: last + 1, total: housing.photoCount }));
      for (const [keyName, expected] of [["Home", 0], ["End", last], ["ArrowRight", 0], ["ArrowLeft", last]]) {
        let prevented = false;
        dialog.emit("keydown", { key: keyName, preventDefault() { prevented = true; } });
        assert.equal(prevented, true);
        assert.equal(image.src, links[expected].href);
      }
      dialog.emit("click", { target: dialog });
      assert.equal(trigger.focusCalls.length, 1);
      assert.equal(dialog.open, false);
    }
    assert.equal(photos, 54);
    assert.equal(JSON.stringify(c.window.PORTAL_CONTENT), original, "No media or vacancy facts mutated");
  });
}
