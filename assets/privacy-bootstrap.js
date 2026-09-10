(async function () {
  "use strict";

  const supported = ["ru", "uk", "pl", "en", "az", "ka", "id", "es", "fil", "ne", "hy"];
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
  const browserLanguage = (navigator.languages || [navigator.language]).map(normalize).find(Boolean);
  const active = normalize(new URL(window.location.href).searchParams.get("lang"))
    || normalize(stored)
    || browserLanguage
    || "pl";
  const localeBase = new URL("../data/locales/", import.meta.url);
  window.PORTAL_LOCALE_BASE = localeBase.href;
  window.PORTAL_ASSET_VERSION = "206";

  await import(new URL("pl.js?v=206", localeBase));
  if (active !== "pl") await import(new URL(`${active}.js?v=206`, localeBase));
  await import("./i18n.js?v=206");
  await import("./privacy.js?v=206");
})().catch((error) => console.error("[kiris-jobs] unable to load privacy page", error));
