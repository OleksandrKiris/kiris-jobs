import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`Application validation failed: ${message}`);
  process.exit(1);
};
const assert = (condition, message) => { if (!condition) fail(message); };

const context = vm.createContext({ window: {}, console, URL, Intl });
for (const path of [
  'apply/config.js',
  'apply/i18n-core.js',
  'apply/i18n-caucasus-central.js',
  'apply/i18n-asia.js',
  'apply/i18n-extra.js',
  'apply/i18n-mobile.js'
]) {
  vm.runInContext(read(path), context, { filename: path });
}

const config = context.window.RECRUITMENT_CONFIG;
const i18n = context.window.RECRUITMENT_I18N;
const extra = context.window.RECRUITMENT_EXTRA_I18N;
const mobile = context.window.RECRUITMENT_MOBILE_I18N;

assert(config, 'RECRUITMENT_CONFIG was not created.');
assert(i18n, 'RECRUITMENT_I18N was not created.');
assert(extra, 'RECRUITMENT_EXTRA_I18N was not created.');
assert(mobile, 'RECRUITMENT_MOBILE_I18N was not created.');
assert(config.version === '8.3.0', `expected version 8.3.0, found ${config.version}.`);
assert(config.maxMailtoLength >= 5000 && config.maxMailtoLength <= 7000, 'mobile mailto limit is unsafe.');

const expectedRecruiters = new Map([
  ['Yana Radushynska', 'yana.radushynska@pposiechnice.pl'],
  ['Yuliia Korniienko', 'yuliia.korniienko@pposiechnice.pl'],
  ['Fariz Injaev', 'fariz.injaev@pposiechnice.pl'],
  ['Oleksandr Kiris', 'oleksandr.kiris@pposiechnice.pl'],
  ['Maksym Saliuk', 'maksym.saliuk@pposiechnice.pl'],
  ['Anastasiia Derepa', 'anastasiia.derepa@citronex.pl']
]);
assert(config.recruiters.length === expectedRecruiters.size, `expected ${expectedRecruiters.size} recruiters, found ${config.recruiters.length}.`);
const recruiterIds = new Set();
const recruiterEmails = new Set();
for (const recruiter of config.recruiters) {
  assert(recruiter.id && !recruiterIds.has(recruiter.id), `duplicate or missing recruiter id: ${recruiter.id}`);
  recruiterIds.add(recruiter.id);
  assert(expectedRecruiters.get(recruiter.name) === recruiter.email, `incorrect recruiter or email: ${recruiter.name}`);
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recruiter.email), `invalid email: ${recruiter.email}`);
  assert(!recruiterEmails.has(recruiter.email.toLowerCase()), `duplicate recruiter email: ${recruiter.email}`);
  recruiterEmails.add(recruiter.email.toLowerCase());
}

const expectedLocations = ['siechnice', 'ryczywol', 'bogatynia', 'zgorzelec', 'pruszcz', 'any'];
assert(JSON.stringify(config.locations.map((item) => item.id)) === JSON.stringify(expectedLocations), `unexpected locations: ${config.locations.map((item) => item.id).join(', ')}`);
for (const item of config.locations) assert(item.name && item.subtitle && item.address, `incomplete location: ${item.id}`);

for (const parameter of ['language', 'recruiter', 'source', 'campaign', 'vacancy', 'location', 'partner', 'group']) {
  assert(config.queryParams[parameter], `missing query parameter: ${parameter}`);
}

const languageCodes = Object.keys(i18n.languages);
assert(languageCodes.length === 20, `expected exactly 20 languages, found ${languageCodes.length}.`);
for (const code of languageCodes) {
  assert(i18n.locales[code], `missing main locale: ${code}`);
  assert(extra.locales[code], `missing extra locale: ${code}`);
}

const primaryLanguages = ['en', 'pl', 'ru', 'uk', 'ka', 'az', 'hy', 'tr', 'uz'];
const mobileKeys = [
  'self', 'representative', 'step1Subtitle', 'step4Title', 'step4Subtitle',
  'sourceDetails', 'sourceDetailsHint', 'sourceDetailsPlaceholder', 'emailInstruction',
  'partnerPanelTitle', 'sourcePanelTitle', 'nextCandidate', 'nextCandidateHint'
];
for (const code of primaryLanguages) {
  for (const key of mobileKeys) assert(mobile[code]?.[key], `missing mobile translation ${code}.${key}`);
}

assert(config.excelColumns.length === 40, `expected 40 Excel columns, found ${config.excelColumns.length}.`);
for (const column of [
  'Ankietę wypełnia', 'Osoba / partner wypełniający', 'Kod grupy / partnera',
  'Preferowana lokalizacja', 'Szczegóły źródła / polecający', 'Status', 'Następny kontakt'
]) {
  assert(config.excelColumns.includes(column), `missing Excel column: ${column}`);
}

const index = read('apply/index.html');
for (const asset of [
  'styles.css?v=8.3.0', 'mobile-v8.css?v=8.3.0', 'config.js?v=8.3.0',
  'i18n-core.js?v=8.3.0', 'i18n-caucasus-central.js?v=8.3.0',
  'i18n-asia.js?v=8.3.0', 'i18n-extra.js?v=8.3.0',
  'i18n-mobile.js?v=8.3.0', 'app-mobile.js?v=8.3.0', '../assets/citronex-logo.jpg'
]) {
  assert(index.includes(asset), `index.html does not reference ${asset}.`);
}
assert(index.includes('id="app"'), 'index.html is missing #app.');
assert(index.includes('viewport-fit=cover'), 'mobile viewport is incomplete.');
assert(index.includes('apple-mobile-web-app-capable'), 'iPhone web-app metadata is missing.');
assert(!index.includes('compatibility markers'), 'obsolete compatibility markers are still present.');

const app = read('apply/app-mobile.js');
for (const marker of [
  "data.filledBy = partnerMode ? 'representative' : ''",
  "data.source = suggestedSource || (partnerMode ? 'referral' : '')",
  'routeContextKey', "view = state.recruiterId ? 'form' : 'recruiter'",
  "4: ['source', 'sourceDetails', 'consent']", 'function nextCandidateInGroup()',
  "for (const level of ['full', 'compact', 'minimal'])", 'function buildMailto()',
  'window.location.assign(mailto)', 'CFG.excelColumns.length',
  'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
  'Status początkowy: NOWY', '[NOWY KANDYDAT]', 'route.partner', 'route.group',
  'data-action="send"', 'data-action="next-candidate"', 'function sourceCards()',
  "['filledBy', 'location', 'source']", 'PRIORYTET — PIERWSZY KONTAKT DO 24 GODZIN'
]) {
  assert(app.includes(marker), `app-mobile.js is missing required marker: ${marker}`);
}

const rowStart = app.indexOf('    const row = [', app.indexOf('function excelValues'));
const rowEnd = app.indexOf('\n    ].map', rowStart);
assert(rowStart >= 0 && rowEnd > rowStart, 'Excel row definition could not be inspected.');
const rowSource = app.slice(rowStart + '    const row = ['.length, rowEnd);
let depth = 0;
let quote = '';
let escaped = false;
let items = 1;
for (const character of rowSource) {
  if (quote) {
    if (escaped) escaped = false;
    else if (character === '\\') escaped = true;
    else if (character === quote) quote = '';
    continue;
  }
  if (character === "'" || character === '"' || character === '`') quote = character;
  else if ('([{'.includes(character)) depth += 1;
  else if (')]}'.includes(character)) depth -= 1;
  else if (character === ',' && depth === 0) items += 1;
}
assert(items === config.excelColumns.length, `Excel row has ${items} values but config has ${config.excelColumns.length} columns.`);

const combined = `${index}\n${app}`.toLowerCase();
for (const forbidden of [
  'enhancements-v8.js', 'type="file"', 'buildeml', '.eml', 'prepareemlbutton',
  'downloadtxt', 'copyapplication', 'navigator.clipboard', 'formsubmit', 'firebase', 'supabase'
]) {
  assert(!combined.includes(forbidden), `unwanted workflow is still present: ${forbidden}`);
}

const css = `${read('apply/styles.css')}\n${read('apply/mobile-v8.css')}`;
for (const marker of [
  '.site-header', '.language-grid', '.recruiter-grid', '.location-grid', '.choice-grid',
  '.actions{position:sticky', '.partner-panel', '.source-panel', '.partner-chip',
  '.batch-button', '.fast-language-grid', '.source-choice-grid', '.source-choice-card', 'font-size:16px', '@media(max-width:520px)'
]) {
  assert(css.includes(marker), `CSS is missing mobile marker: ${marker}`);
}

console.log(`Application validation passed: v${config.version}, ${config.recruiters.length} recruiters, ${config.locations.length} locations, ${languageCodes.length} languages, ${config.excelColumns.length} Excel columns.`);
