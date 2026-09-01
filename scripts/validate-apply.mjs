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
  'apply/location-i18n.js',
  'apply/delivery-i18n.js'
]) {
  vm.runInContext(read(path), context, { filename: path });
}

const config = context.window.RECRUITMENT_CONFIG;
const i18n = context.window.RECRUITMENT_I18N;
const delivery = context.window.RECRUITMENT_DELIVERY_I18N;
if (!config || !i18n || !delivery) fail('configuration or translations were not created.');
if (config.version !== '5.0.0') fail(`expected version 5.0.0, found ${config.version}.`);

const expectedRecruiters = new Map([
  ['Yana Radushynska', 'yana.radushynska@pposiechnice.pl'],
  ['Yuliia Korniienko', 'yuliia.korniienko@pposiechnice.pl'],
  ['Fariz Injaev', 'fariz.injaev@pposiechnice.pl'],
  ['Oleksandr Kiris', 'oleksandr.kiris@pposiechnice.pl'],
  ['Maksym Saliuk', 'maksym.saliuk@pposiechnice.pl'],
  ['Anastasiia Derepa', 'anastasiia.derepa@citronex.pl']
]);
if (config.recruiters.length !== 6) fail(`expected 6 recruiters, found ${config.recruiters.length}.`);
for (const recruiter of config.recruiters) {
  if (expectedRecruiters.get(recruiter.name) !== recruiter.email) fail(`incorrect recruiter: ${recruiter.name}`);
}

const expectedLocations = ['siechnice', 'ryczywol', 'bogatynia', 'zgorzelec', 'pruszcz', 'any'];
if (JSON.stringify(config.locations.map((item) => item.id)) !== JSON.stringify(expectedLocations)) {
  fail(`unexpected locations: ${config.locations.map((item) => item.id).join(', ')}`);
}

const languageCodes = Object.keys(i18n.languages);
if (languageCodes.length !== 20) fail(`expected 20 languages, found ${languageCodes.length}.`);
for (const code of languageCodes) {
  const locale = i18n.locales[code];
  if (!locale) fail(`missing locale ${code}.`);
  for (const key of ['workLocation', 'workLocationHint', 'locationAvailability', 'progressContact', 'progressLocation', 'progressWork', 'progressDocuments', 'progressReview']) {
    if (!locale[key]) fail(`missing ${code}.${key}`);
  }
  for (const location of expectedLocations) {
    if (!locale.options?.locations?.[location]) fail(`missing ${code}.options.locations.${location}`);
  }
  if (!delivery.locales[code]) fail(`missing delivery locale ${code}.`);
}
if (!i18n.internal?.locations) fail('missing internal Polish location labels.');

if (config.maxFiles !== 8) fail(`expected maxFiles=8, found ${config.maxFiles}.`);
if (config.maxFileBytes !== 8 * 1024 * 1024) fail('expected 8 MB per-file limit.');
if (config.maxTotalFileBytes !== 20 * 1024 * 1024) fail('expected 20 MB total-file limit.');
if (config.excelColumns.length !== 41) fail(`expected 41 Excel columns, found ${config.excelColumns.length}.`);
for (const column of ['SLA do', 'Preferowana lokalizacja', 'Następny kontakt', 'Decyzja', 'Uwagi rekrutera']) {
  if (!config.excelColumns.includes(column)) fail(`missing Excel column: ${column}`);
}

const index = read('apply/index.html');
for (const file of [
  'styles.css?v=5.0.0', 'config.js?v=5.0.0', 'i18n-core.js?v=5.0.0',
  'i18n-caucasus-central.js?v=5.0.0', 'i18n-asia.js?v=5.0.0',
  'location-i18n.js?v=5.0.0', 'delivery-i18n.js?v=5.0.0', 'app.js?v=5.0.0'
]) {
  if (!index.includes(file)) fail(`index.html does not reference ${file}.`);
}
for (const id of [
  'languageScreen', 'recruiterScreen', 'recruiterGrid', 'formScreen', 'workLocation',
  'step4', 'documentTypeGrid', 'documentFiles', 'selectedFilesList', 'documentConsent',
  'reviewScreen', 'reviewLocation', 'reviewSla', 'prepareEmlButton', 'mailButton'
]) {
  if (!index.includes(`id="${id}"`)) fail(`index.html is missing #${id}.`);
}
if (!index.includes('../assets/citronex-logo.jpg')) fail('Citronex logo is not used.');
if (!index.includes('multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx')) fail('approved file types are missing.');

const app = read('apply/app.js');
for (const marker of [
  "'workLocation'", 'function buildTsvRow(', 'DANE DO EXCEL — SKOPIUJ TYLKO NASTĘPNY WIERSZ',
  'function buildHtmlMessage()', 'async function buildEml()', 'multipart/mixed', 'X-Unsent: 1',
  'Content-Type: text/csv', 'function spreadsheetSafe(', 'SLA — pierwszy kontakt do',
  '[NOWY KANDYDAT]'
]) {
  if (!app.includes(marker)) fail(`app.js is missing marker: ${marker}`);
}

const combined = `${index}\n${app}\n${read('apply/README.md')}`;
for (const forbidden of [
  'id="copyButton"', 'copyApplication', 'navigator.clipboard', "execCommand('copy')",
  'id="downloadButton"', 'downloadTxt', 'Pobierz TXT', 'Copy application'
]) {
  if (combined.includes(forbidden)) fail(`forbidden workflow is present: ${forbidden}`);
}

console.log(`Application validation passed: v${config.version}, ${config.recruiters.length} recruiters, ${config.locations.length} locations, ${languageCodes.length} languages, ${config.excelColumns.length} Excel columns.`);
