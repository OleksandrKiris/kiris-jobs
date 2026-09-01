import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const fail = (message) => {
  console.error(`Recruitment application v6 validation failed: ${message}`);
  process.exit(1);
};
const assert = (condition, message) => {
  if (!condition) fail(message);
};

const requiredFiles = [
  'apply/index.html',
  'apply/privacy.html',
  'apply/config.js',
  'apply/i18n-core.js',
  'apply/i18n-caucasus-central.js',
  'apply/i18n-asia.js',
  'apply/delivery-i18n.js',
  'apply/assets/extra-i18n.js',
  'apply/assets/styles.css',
  'apply/assets/mail.js',
  'apply/assets/app-core.js',
  'apply/assets/app-ui.js',
  'apply/assets/app.js'
];
for (const file of requiredFiles) assert(exists(file), `missing ${file}`);

const context = vm.createContext({ window: {}, console, URL, Intl, TextEncoder, Object });
for (const file of [
  'apply/config.js',
  'apply/i18n-core.js',
  'apply/i18n-caucasus-central.js',
  'apply/i18n-asia.js',
  'apply/delivery-i18n.js',
  'apply/assets/extra-i18n.js'
]) {
  vm.runInContext(read(file), context, { filename: file });
}

const config = context.window.RECRUITMENT_CONFIG;
const i18n = context.window.RECRUITMENT_I18N;
const delivery = context.window.RECRUITMENT_DELIVERY_I18N;
const extra = context.window.RECRUITMENT_EXTRA_I18N;
assert(config, 'RECRUITMENT_CONFIG was not created');
assert(i18n, 'RECRUITMENT_I18N was not created');
assert(delivery, 'RECRUITMENT_DELIVERY_I18N was not created');
assert(extra, 'RECRUITMENT_EXTRA_I18N was not created');
assert(config.version === '6.0.0', `expected version 6.0.0, found ${config.version}`);

const expectedRecruiters = new Map([
  ['Yana Radushynska', 'yana.radushynska@pposiechnice.pl'],
  ['Yuliia Korniienko', 'yuliia.korniienko@pposiechnice.pl'],
  ['Fariz Injaev', 'fariz.injaev@pposiechnice.pl'],
  ['Oleksandr Kiris', 'oleksandr.kiris@pposiechnice.pl'],
  ['Maksym Saliuk', 'maksym.saliuk@pposiechnice.pl'],
  ['Anastasiia Derepa', 'anastasiia.derepa@citronex.pl']
]);
assert(config.recruiters.length === expectedRecruiters.size, 'expected exactly six recruiters');
const recruiterIds = new Set();
for (const recruiter of config.recruiters) {
  assert(recruiter.id && !recruiterIds.has(recruiter.id), `duplicate recruiter id: ${recruiter.id}`);
  recruiterIds.add(recruiter.id);
  assert(expectedRecruiters.get(recruiter.name) === recruiter.email, `incorrect recruiter or email: ${recruiter.name}`);
  assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recruiter.email), `invalid email: ${recruiter.email}`);
}

const expectedLocations = ['siechnice', 'ryczywol', 'bogatynia', 'zgorzelec', 'pruszcz', 'any'];
assert(JSON.stringify(config.locations.map((item) => item.id)) === JSON.stringify(expectedLocations), 'unexpected work-location list');
assert(config.locations.every((item) => item.name && item.detailKey && item.address), 'each work location needs name, detail and address');

const languageCodes = Object.keys(i18n.languages);
assert(languageCodes.length === 20, `expected 20 languages, found ${languageCodes.length}`);
assert(languageCodes.includes('pl') && languageCodes.includes('ru') && languageCodes.includes('uk') && languageCodes.includes('en'), 'core languages are missing');
assert(i18n.languages.ur.direction === 'rtl', 'Urdu must use RTL direction');
for (const code of languageCodes) {
  assert(i18n.locales[code], `missing core locale ${code}`);
  assert(delivery.locales[code], `missing delivery locale ${code}`);
  assert(extra[code], `missing location locale ${code}`);
  for (const key of ['locationTitle', 'locationSubtitle', 'locationLabel', 'locationRequired', 'contactStep', 'personalStep', 'workStep', 'documentsStep', 'reviewStep', 'greenhouseSorting', 'greenhouse', 'bananaCleaning', 'bananaWarehouse', 'recruiterChoice']) {
    assert(extra[code][key], `missing ${code}.${key}`);
  }
}

assert(config.maxFiles === 12, 'maxFiles must be 12');
assert(config.maxFileBytes === 8 * 1024 * 1024, 'per-file limit must be 8 MB');
assert(config.maxTotalFileBytes === 12 * 1024 * 1024, 'total file limit must be 12 MB');
for (const extension of ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'doc', 'docx']) {
  assert(config.allowedExtensions.includes(extension), `missing allowed extension ${extension}`);
}
assert(config.excelColumns.length === 39, `expected 39 Excel columns, found ${config.excelColumns.length}`);
assert(new Set(config.excelColumns).size === config.excelColumns.length, 'Excel columns must be unique');
for (const column of ['SLA do', 'Preferowana lokalizacja', 'Liczba prób kontaktu', 'Wynik rozmowy', 'Powód odmowy']) {
  assert(config.excelColumns.includes(column), `missing Excel column ${column}`);
}

const index = read('apply/index.html');
for (const asset of [
  'assets/styles.css?v=6.0.0',
  'config.js?v=6.0.0',
  'i18n-core.js?v=6.0.0',
  'i18n-caucasus-central.js?v=6.0.0',
  'i18n-asia.js?v=6.0.0',
  'delivery-i18n.js?v=6.0.0',
  'assets/extra-i18n.js?v=6.0.0',
  'assets/mail.js?v=6.0.0',
  'assets/app-core.js?v=6.0.0',
  'assets/app-ui.js?v=6.0.0',
  'assets/app.js?v=6.0.0'
]) {
  assert(index.includes(asset), `index.html does not load ${asset}`);
}
assert(index.includes('id="app"'), 'index.html is missing the application mount point');
assert(index.includes('../assets/citronex-logo.jpg'), 'index.html is missing the Citronex logo');
assert(index.includes('Content-Security-Policy'), 'index.html is missing a content security policy');
assert(index.includes('privacy.html'), 'index.html is missing the privacy link');

const core = read('apply/assets/app-core.js');
for (const marker of ['function renderLanguage(', 'function renderRecruiters(', 'function renderLocationCards(', 'function saveDraft()', 'draftMaxAgeMs', 'preferredLocation']) {
  assert(core.includes(marker), `app-core.js is missing ${marker}`);
}
const ui = read('apply/assets/app-ui.js');
for (const marker of ['function renderForm()', 'function validateStep()', 'function renderReview()', 'function addFiles(', 'data-location=', 'data-document-type=', 'createMailer()']) {
  assert(ui.includes(marker), `app-ui.js is missing ${marker}`);
}
const mail = read('apply/assets/mail.js');
for (const marker of ['function buildCsv()', 'function buildHtmlMessage()', 'async function buildEml()', 'multipart/mixed', 'multipart/alternative', 'X-Unsent: 1', 'Content-Type: text/csv', 'function spreadsheetSafe', 'filename*=UTF-8', '[NOWY KANDYDAT]']) {
  assert(mail.includes(marker) || core.includes(marker), `mail workflow is missing ${marker}`);
}
const start = read('apply/assets/app.js');
assert(start.includes('applyLanguage();') && start.includes('renderLanguage();'), 'app.js does not start the application');

const css = read('apply/assets/styles.css');
for (const selector of ['.language-grid', '.recruiter-grid', '.location-grid', '.document-grid', '.delivery-options', '.review-section', '@media (max-width:540px)']) {
  assert(css.includes(selector), `styles.css is missing ${selector}`);
}

const privacy = read('apply/privacy.html');
assert(privacy.includes('Dane pozostają na urządzeniu'), 'privacy page does not explain local storage');
assert(privacy.includes('samodzielnie ją wyśle'), 'privacy page does not explain candidate-controlled sending');

const workflowDir = path.join(root, '.github', 'workflows');
const workflows = fs.readdirSync(workflowDir).sort();
assert(JSON.stringify(workflows) === JSON.stringify(['pages.yml']), `obsolete workflows remain: ${workflows.join(', ')}`);
for (const forbidden of ['.apply-update-v51.b64', '.github/install-v5-2']) {
  assert(!exists(forbidden), `obsolete installer payload remains: ${forbidden}`);
}

console.log(`Recruitment application v6 validation passed: ${config.recruiters.length} recruiters, ${config.locations.length} locations, ${languageCodes.length} languages, ${config.excelColumns.length} Excel columns.`);
