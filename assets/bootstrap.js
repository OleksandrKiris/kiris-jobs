(async function () {
  "use strict";

  const supported = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
  const fallback = "pl";
  const normalize = (value) => {
    const language = String(value || "").toLowerCase().split("-")[0];
    const normalized = language === "tl" ? "fil" : language;
    return supported.includes(normalized) ? normalized : "";
  };
  const stored = (() => {
    try {
      return localStorage.getItem("kiris-jobs:language:v1");
    } catch {
      return "";
    }
  })();
  const browserLanguage = (navigator.languages || [navigator.language])
    .map(normalize)
    .find(Boolean);
  const active = normalize(new URL(window.location.href).searchParams.get("lang"))
    || normalize(stored)
    || browserLanguage
    || fallback;
  const localeBase = new URL("../data/locales/", import.meta.url);
  window.PORTAL_LOCALE_BASE = localeBase.href;
  window.PORTAL_ASSET_VERSION = "208";

  await import(new URL(`pl.js?v=${window.PORTAL_ASSET_VERSION}`, localeBase));
  if (active !== fallback) {
    await import(new URL(`${active}.js?v=${window.PORTAL_ASSET_VERSION}`, localeBase));
  }
  await import(`../data/content.js?v=${window.PORTAL_ASSET_VERSION}`);
  await import(`./vacancy-overrides.js?v=${window.PORTAL_ASSET_VERSION}`);
  await window.PORTAL_VACANCY_OVERRIDES_READY;
  await import(`./i18n.js?v=${window.PORTAL_ASSET_VERSION}`);
  await import(`./application-form.js?v=${window.PORTAL_ASSET_VERSION}`);
  await import(`./candidate.js?v=${window.PORTAL_ASSET_VERSION}`);
})().catch((error) => {
  console.error("[kiris-jobs] unable to start", error);
  document.documentElement.classList.add("app-load-failed");
});
