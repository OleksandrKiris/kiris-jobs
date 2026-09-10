import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const index = read("index.html");
const privacy = read("privacy.html");
const privacyScript = read("assets/privacy.js");
const form = read("assets/application-form.js");
const serviceWorker = read("sw.js");

assert(index.includes('href="privacy.html"'), "Homepage does not link to the privacy policy.");
assert(privacy.includes('id="privacy-policy"'), "Privacy page has no policy container.");
assert(privacy.includes('assets/privacy-bootstrap.js?v=208'), "Privacy page does not load the current policy bootstrap.");
for (const locale of ["pl", "en", "ru", "uk", "az"]) {
  assert(privacyScript.includes(`${locale}: {`), `Privacy policy has no ${locale} version.`);
}
for (const marker of [
  "90 days",
  "12 months",
  "Resend",
  "Lovable Cloud",
  "Cloudflare Turnstile",
  "GitHub Pages",
  "UODO",
  "document numbers",
  "one-way IP hash"
]) assert(privacyScript.includes(marker), `Privacy policy is missing: ${marker}.`);

assert(!form.includes('field("pesel"'), "Public form must not collect a PESEL number.");
assert(!form.includes('field("passportNumber"'), "Public form must not collect a passport number.");
assert(!form.includes('field("emergencyContactName"'), "Public form must not collect third-party names.");
assert(!form.includes('field("emergencyContactPhone"'), "Public form must not collect third-party phone numbers.");
assert(form.includes("const DRAFT_VERSION = 5"), "Old browser drafts were not invalidated.");
assert(form.includes("TURNSTILE_SITE_KEY"), "Turnstile site key is not configured.");
assert(form.includes("turnstileToken"), "Turnstile token is not sent to the backend.");
assert(form.includes('action: "application_submit"'), "Turnstile action binding is missing.");
assert(serviceWorker.includes('"./privacy.html"'), "Privacy page is not available through the app cache.");

if (errors.length) {
  console.error(`Privacy validation failed (${errors.length}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Privacy validation passed: disclosure, retention and data-minimisation checks are present.");
