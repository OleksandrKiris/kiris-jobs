import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const source = await fs.readFile(new URL("assets/application-loader.js", root), "utf8");
const instrumented = source.replace("modulePromise = import(", "modulePromise = importModule(");
assert.notEqual(source, instrumented);
const locales = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];

function harness(locale = "en") {
  const requests = [], opened = [], subscriptions = [], listeners = {};
  const retry = { focus() {}, addEventListener(event, callback) { this[event] = callback; } };
  const container = {
    innerHTML: "",
    querySelector(selector) {
      if (selector === "h2") return { focus() {} };
      return this.innerHTML.includes("data-retry-application") ? retry : null;
    }
  };
  const dialog = {
    open: false, mode: null,
    show() { this.open = true; this.mode = "standalone"; },
    showModal() { this.open = true; this.mode = "modal"; },
    close() { this.open = false; listeners.close(); },
    addEventListener(event, callback) { listeners[event] = callback; }
  };
  const i18n = { locale, t: () => `Questionnaire (${i18n.locale})`, subscribe: fn => subscriptions.push(fn) };
  const window = { PortalI18n: i18n, PORTAL_ASSET_VERSION: "218" };
  const application = { open: (id, options) => opened.push({ id, ...options }) };
  vm.runInNewContext(instrumented, {
    window,
    document: { getElementById: id => id === "application-dialog" ? dialog : container },
    importModule: url => new Promise((resolve, reject) => requests.push({ url, resolve, reject })),
    fetch: () => { throw new Error("No network or submissions allowed"); }
  });
  return {
    window, container, dialog, requests, opened, retry,
    open: window.PortalApplicationLoader.open,
    resolve() { window.PortalApplication = application; requests.at(-1).resolve(); },
    changeLocale(value) { i18n.locale = value; subscriptions.forEach(fn => fn()); }
  };
}

test("catalogue bootstrap loads only the small loader, with the existing form retained for offline use", async () => {
  const bootstrap = await fs.readFile(new URL("assets/bootstrap.js", root), "utf8");
  const worker = await fs.readFile(new URL("sw.js", root), "utf8");
  const candidate = await fs.readFile(new URL("assets/candidate.js", root), "utf8");
  assert.ok(!bootstrap.includes("application-form.js"));
  assert.ok(bootstrap.indexOf("application-loader.js") < bootstrap.indexOf("candidate.js"));
  assert.ok(worker.includes("assets/application-form.js?v=218"));
  assert.ok(worker.includes("assets/application-loader.js?v=218"));
  assert.equal((candidate.match(/PortalApplicationLoader\?\.open/g) || []).length, 2);
  assert.ok(Buffer.byteLength(source) < 6000);
  const h = harness();
  assert.equal(h.requests.length, 0);
  assert.equal(h.dialog.open, false);
});

for (const locale of locales) {
  test(`${locale}: loading, translated failure and successful retry retain vacancy and standalone mode`, async () => {
    const h = harness(locale);
    const pending = h.open("greenhouse-tomatoes", { standalone: true });
    assert.equal(h.dialog.mode, "standalone");
    assert.ok(h.container.innerHTML.includes('role="status"'));
    const loading = h.container.innerHTML;
    assert.equal(h.requests.length, 1);
    h.requests[0].reject(new Error("Offline"));
    await pending;
    assert.equal(h.opened.length, 0);
    assert.ok(h.container.innerHTML.includes('role="alert"'));
    assert.ok(h.container.innerHTML.includes("data-retry-application"));
    assert.notEqual(h.container.innerHTML, loading);
    const retry = h.open("greenhouse-tomatoes", { standalone: true });
    assert.equal(h.requests.length, 2);
    assert.ok(h.requests[1].url.includes("v=218&retry=1"));
    h.resolve();
    await retry;
    assert.deepEqual(h.opened, [{ id: "greenhouse-tomatoes", standalone: true }]);
  });
}

test("repeated clicks share one request and open only the most recently selected vacancy", async () => {
  const h = harness();
  const first = h.open("first"), second = h.open("second");
  assert.equal(h.requests.length, 1);
  assert.equal(h.dialog.mode, "modal");
  h.resolve();
  await Promise.all([first, second]);
  assert.deepEqual(h.opened, [{ id: "second" }]);
  await h.open("third");
  assert.equal(h.requests.length, 1);
  assert.deepEqual(h.opened.at(-1), { id: "third" });
});

test("closing a loading dialog does not reopen it when the request completes", async () => {
  const h = harness();
  const pending = h.open("greenhouse-tomatoes");
  h.dialog.close();
  h.resolve();
  await pending;
  assert.equal(h.opened.length, 0);
  assert.equal(h.dialog.open, false);
});

test("language changes update the pending loading/error status", async () => {
  const h = harness("en");
  const pending = h.open("greenhouse-tomatoes");
  h.changeLocale("uk");
  assert.ok(h.container.innerHTML.includes("Завантаження анкети"));
  h.requests[0].reject(new Error("Offline"));
  await pending;
  h.changeLocale("pl");
  assert.ok(h.container.innerHTML.includes("Sprawdź połączenie"));
});

test("a module that does not register its API leaves a retryable error", async () => {
  const h = harness();
  const pending = h.open("greenhouse-tomatoes");
  h.requests[0].resolve();
  await pending;
  assert.ok(h.container.innerHTML.includes("data-retry-application"));
  assert.equal(h.opened.length, 0);
});
