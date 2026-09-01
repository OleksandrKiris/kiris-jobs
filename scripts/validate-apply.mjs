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
  'apply/delivery-i18n.js'
]) {
  vm.runInContext(read(path), context, { filename: path });
}

const config = context.window.RECRUITMENT_CONFIG;
const i18n = context.window.RECRUITMENT_I18N;
const delivery = context.window.RECRUITMENT_DELIVERY_I18N;
if (!config) fail('RECRUITMENT_CONFIG was not created.');
if (!i18n) fail('RECRUITMENT_I18N was not created.');
if (!delivery) fail('RECRUITMENT_DELIVERY_I18N was not created.');
if (config.version !== '4.0.0') fail(`expected version 4.0.0, found ${config.version}.`);

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

const ids = new Set();
const emails = new Set();
for (const recruiter of config.recruiters) {
  if (!recruiter.id || ids.has(recruiter.id)) fail(`duplicate or missing recruiter id: ${recruiter.id}`);
  ids.add(recruiter.id);
  if (!expectedRecruiters.has(recruiter.name)) fail(`unexpected recruiter: ${recruiter.name}`);
  if (expectedRecruiters.get(recruiter.name) !== recruiter.email) fail(`incorrect email for ${recruiter.name}`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recruiter.email)) fail(`invalid email: ${recruiter.email}`);
  if (emails.has(recruiter.email.toLowerCase())) fail(`duplicate recruiter email: ${recruiter.email}`);
  emails.add(recruiter.email.toLowerCase());
}

const languageCodes = Object.keys(i18n.languages);
if (languageCodes.length !== 20) fail(`expected exactly 20 languages, found ${languageCodes.length}.`);

const requiredCoreKeys = [
  'languageTitle', 'recruiterTitle', 'recruiterSubtitle', 'changeRecruiter',
  'stepContactTitle', 'stepLocationTitle', 'stepWorkTitle', 'reviewTitle',
  'firstName', 'lastName', 'phone', 'messenger', 'citizenship', 'country',
  'city', 'age', 'inPoland', 'documents', 'job', 'start', 'shift', 'housing',
  'source', 'consentBefore', 'required', 'invalidPhone', 'invalidAge',
  'back', 'continue', 'checkApplication', 'edit', 'newApplication'
];
const optionGroups = ['messenger', 'yesNo', 'documents', 'jobs', 'starts', 'shifts', 'sources'];

for (const code of languageCodes) {
  const locale = i18n.locales[code];
  if (!locale) fail(`missing locale object for ${code}.`);
  for (const key of requiredCoreKeys) {
    if (!locale[key] && !i18n.locales.en[key]) fail(`missing ${code}.${key}`);
  }
  for (const group of optionGroups) {
    const options = locale.options?.[group] || i18n.locales.en.options?.[group];
    if (!options || Object.keys(options).length === 0) fail(`missing option group ${code}.${group}`);
  }
}

const documentIds = config.documentTypes.map((item) => item.id);
const expectedDocumentIds = [
  'passport', 'visaResidence', 'peselUkr', 'workPermit', 'driver',
  'qualification', 'cv', 'other', 'noneYet'
];
if (JSON.stringify(documentIds) !== JSON.stringify(expectedDocumentIds)) {
  fail(`unexpected document type IDs: ${documentIds.join(', ')}`);
}

if (config.maxFiles !== 12) fail(`expected maxFiles=12, found ${config.maxFiles}.`);
if (config.maxFileBytes !== 8 * 1024 * 1024) fail('expected 8 MB per-file limit.');
if (config.maxTotalFileBytes !== 12 * 1024 * 1024) fail('expected 12 MB total-file limit.');
for (const ext of ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'doc', 'docx']) {
  if (!config.allowedExtensions.includes(ext)) fail(`missing allowed extension: ${ext}`);
}
if (config.excelColumns.length !== 34) fail(`expected 34 CSV columns, found ${config.excelColumns.length}.`);

const requiredDeliveryKeys = [
  'trustPrivate', 'stepDocumentsTitle', 'stepDocumentsSubtitle', 'filePrivacyTitle',
  'filePrivacyText', 'documentTypesLabel', 'documentTypesHint', 'fileUploadLabel',
  'fileUploadHint', 'selectedFilesTitle', 'filesReloadNotice', 'documentConsent',
  'reviewDocumentsTitle', 'noFilesSelected', 'deliveryTitle', 'deliverySubtitle',
  'recommended', 'emlTitle', 'emlDescription', 'emlSteps', 'prepareEml',
  'emlBuilding', 'emlReady', 'emlError', 'mailtoTitle', 'mailtoDescription',
  'mailtoSteps', 'openEmail', 'mailOpened', 'mailLong', 'fileTooLarge',
  'totalTooLarge', 'tooManyFiles', 'unsupportedFile', 'removeFile',
  'selectDocumentType', 'noneConflict', 'footerPrivacy', 'footerPrivacyLink'
];

const deliveryCodes = Object.keys(delivery.locales).sort();
if (JSON.stringify(deliveryCodes) !== JSON.stringify([...languageCodes].sort())) {
  fail(`delivery locales do not match application languages: ${deliveryCodes.join(', ')}`);
}
for (const code of languageCodes) {
  const locale = delivery.locales[code];
  if (!locale) fail(`missing delivery locale for ${code}.`);
  for (const key of requiredDeliveryKeys) {
    if (!locale[key]) fail(`missing delivery translation ${code}.${key}`);
  }
  if (!Array.isArray(locale.emlSteps) || locale.emlSteps.length < 3) fail(`invalid ${code}.emlSteps`);
  if (!Array.isArray(locale.mailtoSteps) || locale.mailtoSteps.length < 4) fail(`invalid ${code}.mailtoSteps`);
  for (const id of documentIds) {
    if (!locale.documentTypes?.[id]) fail(`missing ${code}.documentTypes.${id}`);
  }
}

const index = read('apply/index.html');
for (const requiredFile of [
  'config.js?v=4.0.0', 'i18n-core.js?v=4.0.0', 'i18n-caucasus-central.js?v=4.0.0',
  'i18n-asia.js?v=4.0.0', 'delivery-i18n.js?v=4.0.0', 'app.js?v=4.0.0',
  'styles.css?v=4.0.0'
]) {
  if (!index.includes(requiredFile)) fail(`index.html does not reference ${requiredFile}.`);
}
for (const id of [
  'languageScreen', 'recruiterScreen', 'recruiterGrid', 'formScreen', 'step4',
  'documentTypeGrid', 'documentFiles', 'selectedFilesList', 'documentConsent',
  'reviewScreen', 'reviewDocumentTypes', 'reviewFileList', 'prepareEmlButton', 'mailButton'
]) {
  if (!index.includes(`id="${id}"`)) fail(`index.html is missing #${id}.`);
}
if (!index.includes('multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx')) {
  fail('document file input does not expose the approved file extensions.');
}

const app = read('apply/app.js');
for (const marker of [
  'function buildCsv()', 'function buildHtmlMessage()', 'async function buildEml()',
  'multipart/mixed', 'multipart/alternative', 'X-Unsent: 1', 'Content-Type: text/csv',
  'function spreadsheetSafe(', 'filename*=UTF-8', 'prepareEmlButton', 'documentFiles'
]) {
  if (!app.includes(marker)) fail(`app.js is missing required marker: ${marker}`);
}

const combined = `${index}\n${app}\n${read('apply/README.md')}`;
for (const forbidden of [
  'id="copyButton"', 'copyApplication', 'navigator.clipboard', "execCommand('copy')",
  'WIERSZ DO EXCEL (TSV)', 'Kopiuj zgłoszenie', 'Copy application'
]) {
  if (combined.includes(forbidden)) fail(`manual copying workflow is still present: ${forbidden}`);
}

console.log(`Application validation passed: v${config.version}, ${config.recruiters.length} recruiters, ${languageCodes.length} languages, ${documentIds.length} document types.`);
