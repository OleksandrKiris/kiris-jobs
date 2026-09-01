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
  'apply/i18n-extra.js'
]) {
  vm.runInContext(read(path), context, { filename: path });
}

const config = context.window.RECRUITMENT_CONFIG;
const i18n = context.window.RECRUITMENT_I18N;
const extra = context.window.RECRUITMENT_EXTRA_I18N;
if (!config) fail('RECRUITMENT_CONFIG was not created.');
if (!i18n) fail('RECRUITMENT_I18N was not created.');
if (!extra) fail('RECRUITMENT_EXTRA_I18N was not created.');
if (config.version !== '7.0.0') fail(`expected version 7.0.0, found ${config.version}.`);

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

if (config.excelColumns.length !== 40) fail(`expected 40 Excel columns, found ${config.excelColumns.length}.`);
for (const column of [
  'Ankietę wypełnia', 'Osoba / partner wypełniający', 'Kod grupy / partnera',
  'Preferowana lokalizacja', 'Szczegóły źródła / polecający', 'Status', 'Następny kontakt'
]) {
  if (!config.excelColumns.includes(column)) fail(`missing Excel column: ${column}`);
}

const index = read('apply/index.html');
for (const asset of [
  'styles.css?v=7.0.0', 'config.js?v=7.0.0', 'i18n-core.js?v=7.0.0',
  'i18n-caucasus-central.js?v=7.0.0', 'i18n-asia.js?v=7.0.0',
  'i18n-extra.js?v=7.0.0', 'app.js?v=7.0.0', '../assets/citronex-logo.jpg'
]) {
  if (!index.includes(asset)) fail(`index.html does not reference ${asset}.`);
}
if (!index.includes('id="app"')) fail('index.html is missing #app.');
if (!index.includes('viewport-fit=cover')) fail('mobile viewport is incomplete.');

const app = read('apply/app.js');
for (const marker of [
  "'filledBy'", "'representativeName'", "'groupCode'", "'sourceDetails'", "'location'",
  'function buildEmailBody()', 'function buildMailto()', 'window.location.href = buildMailto()',
  'TABELA KANDYDATA (2 KOLUMNY)', 'DANE DO EXCEL — NAGŁÓWKI TSV',
  'DANE DO EXCEL — WIERSZ KANDYDATA', 'Status początkowy: NOWY',
  "data-action=\"send\"", 'CFG.locations', 'CFG.excelColumns'
]) {
  if (!app.includes(marker)) fail(`app.js is missing required marker: ${marker}`);
}
for (const forbidden of [
  'type="file"', 'buildEml', '.eml', 'prepareEmlButton', 'downloadTxt',
  'copyApplication', 'navigator.clipboard', 'FormSubmit', 'firebase', 'supabase'
]) {
  if (`${index}\n${app}`.toLowerCase().includes(forbidden.toLowerCase())) {
    fail(`unwanted workflow is still present: ${forbidden}`);
  }
}

const css = read('apply/styles.css');
for (const marker of [
  '.site-header', '.language-grid', '.recruiter-grid', '.location-grid',
  '.choice-grid', '.actions{position:sticky', '.send-button', '@media (max-width:520px)'
]) {
  if (!css.includes(marker)) fail(`styles.css is missing mobile marker: ${marker}`);
}

console.log(`Application validation passed: v${config.version}, ${config.recruiters.length} recruiters, ${config.locations.length} locations, ${languageCodes.length} languages, ${config.excelColumns.length} Excel columns.`);
