import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`Application validation failed: ${message}`);
  process.exit(1);
};

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

if (!config) fail('RECRUITMENT_CONFIG was not created.');
if (!i18n) fail('RECRUITMENT_I18N was not created.');
if (!extra) fail('RECRUITMENT_EXTRA_I18N was not created.');
if (!mobile) fail('RECRUITMENT_MOBILE_I18N was not created.');
if (config.version !== '8.1.0') fail(`expected version 8.1.0, found ${config.version}.`);

const expectedRecruiters = new Map([
  ['Yana Radushynska', 'yana.radushynska@pposiechnice.pl'],
  ['Yuliia Korniienko', 'yuliia.korniienko@pposiechnice.pl'],
  ['Fariz Injaev', 'fariz.injaev@pposiechnice.pl'],
  ['Oleksandr Kiris', 'oleksandr.kiris@pposiechnice.pl'],
  ['Maksym Saliuk', 'maksym.saliuk@pposiechnice.pl'],
  ['Anastasiia Derepa', 'anastasiia.derepa@citronex.pl']
]);

if (config.recruiters.length !== expectedRecruiters.size) {
  fail(`expected ${expectedRecruiters.size} recruiters, found ${config.recruiters.length}.`);
}
const recruiterIds = new Set();
const recruiterEmails = new Set();
for (const recruiter of config.recruiters) {
  if (!recruiter.id || recruiterIds.has(recruiter.id)) fail(`duplicate or missing recruiter id: ${recruiter.id}`);
  recruiterIds.add(recruiter.id);
  if (expectedRecruiters.get(recruiter.name) !== recruiter.email) fail(`incorrect recruiter or email: ${recruiter.name}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recruiter.email)) fail(`invalid email: ${recruiter.email}`);
  if (recruiterEmails.has(recruiter.email.toLowerCase())) fail(`duplicate recruiter email: ${recruiter.email}`);
  recruiterEmails.add(recruiter.email.toLowerCase());
}

const expectedLocations = ['siechnice', 'ryczywol', 'bogatynia', 'zgorzelec', 'pruszcz', 'any'];
if (JSON.stringify(config.locations.map((item) => item.id)) !== JSON.stringify(expectedLocations)) {
  fail(`unexpected locations: ${config.locations.map((item) => item.id).join(', ')}`);
}
for (const item of config.locations) {
  if (!item.name || !item.subtitle || !item.address) fail(`incomplete location: ${item.id}`);
}

for (const parameter of ['language', 'recruiter', 'source', 'campaign', 'vacancy', 'location', 'partner', 'group']) {
  if (!config.queryParams[parameter]) fail(`missing query parameter: ${parameter}`);
}

const languageCodes = Object.keys(i18n.languages);
if (languageCodes.length !== 20) fail(`expected exactly 20 languages, found ${languageCodes.length}.`);
const extraKeys = [
  'step1Title', 'filledBy', 'self', 'representative', 'representativeName', 'groupCode',
  'preferredLocation', 'sourceDetails', 'reviewIntro', 'emailInstruction', 'sendButton'
];
for (const code of languageCodes) {
  if (!i18n.locales[code]) fail(`missing main locale: ${code}`);
  if (!extra.locales[code]) fail(`missing extra locale: ${code}`);
  for (const key of extraKeys) {
    if (!extra.locales[code][key]) fail(`missing extra translation ${code}.${key}`);
  }
}
for (const code of ['en', 'pl', 'ru', 'uk']) {
  for (const key of ['self', 'representative', 'step4Title', 'sourceDetails', 'sourceDetailsHint', 'emailInstruction']) {
    if (!mobile[code]?.[key]) fail(`missing mobile wording ${code}.${key}`);
  }
}

if (config.excelColumns.length !== 40) fail(`expected 40 Excel columns, found ${config.excelColumns.length}.`);
for (const column of [
  'Ankietę wypełnia', 'Osoba / partner wypełniający', 'Kod grupy / partnera',
  'Preferowana lokalizacja', 'Szczegóły źródła / polecający', 'Status', 'Następny kontakt'
]) {
  if (!config.excelColumns.includes(column)) fail(`missing Excel column: ${column}`);
}

const index = read('apply/index.html');
for (const asset of [
  'styles.css?v=8.1.0', 'mobile-v8.css?v=8.1.0', 'config.js?v=8.1.0',
  'i18n-core.js?v=8.1.0', 'i18n-caucasus-central.js?v=8.1.0',
  'i18n-asia.js?v=8.1.0', 'i18n-extra.js?v=8.1.0',
  'i18n-mobile.js?v=8.1.0', 'app-mobile.js?v=8.1.0', '../assets/citronex-logo.jpg'
]) {
  if (!index.includes(asset)) fail(`index.html does not reference ${asset}.`);
}
if (!index.includes('id="app"')) fail('index.html is missing #app.');
if (!index.includes('viewport-fit=cover')) fail('mobile viewport is incomplete.');
if (!index.includes('apple-mobile-web-app-capable')) fail('iPhone web-app metadata is missing.');

const app = read('apply/app-mobile.js');
for (const marker of [
  "'filledBy'", "'representativeName'", "'groupCode'", "'sourceDetails'", "'location'",
  "4: ['source', 'sourceDetails', 'consent']", 'function buildEmailBody(compact = false)',
  'function buildMailto()', 'window.location.href = buildMailto()',
  'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
  'Status początkowy: NOWY', '[NOWY KANDYDAT]', 'route.partner', 'route.group',
  'CFG.locations', 'CFG.excelColumns', 'data-action="send"'
]) {
  if (!app.includes(marker)) fail(`app-mobile.js is missing required marker: ${marker}`);
}

const combined = `${index}\n${app}`.toLowerCase();
for (const forbidden of [
  'enhancements-v8.js', 'type="file"', 'buildeml', '.eml', 'prepareemlbutton',
  'downloadtxt', 'copyapplication', 'navigator.clipboard', 'formsubmit', 'firebase', 'supabase'
]) {
  if (combined.includes(forbidden)) fail(`unwanted workflow is still present: ${forbidden}`);
}

const css = `${read('apply/styles.css')}\n${read('apply/mobile-v8.css')}`;
for (const marker of [
  '.site-header', '.language-grid', '.recruiter-grid', '.location-grid', '.choice-grid',
  '.actions{position:sticky', '.partner-panel', '.source-panel', '.send-button',
  'font-size:16px', '@media(max-width:520px)'
]) {
  if (!css.includes(marker)) fail(`CSS is missing mobile marker: ${marker}`);
}

console.log(`Application validation passed: v${config.version}, ${config.recruiters.length} recruiters, ${config.locations.length} locations, ${languageCodes.length} languages, ${config.excelColumns.length} Excel columns.`);
