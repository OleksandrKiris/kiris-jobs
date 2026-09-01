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
  'apply/i18n-asia.js'
]) {
  vm.runInContext(read(path), context, { filename: path });
}

const config = context.window.RECRUITMENT_CONFIG;
const i18n = context.window.RECRUITMENT_I18N;
if (!config) fail('RECRUITMENT_CONFIG was not created.');
if (!i18n) fail('RECRUITMENT_I18N was not created.');

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
if (languageCodes.length < 20) fail(`expected at least 20 languages, found ${languageCodes.length}.`);

const requiredKeys = [
  'languageTitle', 'recruiterTitle', 'recruiterSubtitle', 'changeRecruiter',
  'stepContactTitle', 'stepLocationTitle', 'stepWorkTitle', 'reviewTitle',
  'firstName', 'lastName', 'phone', 'messenger', 'citizenship', 'country',
  'city', 'age', 'inPoland', 'documents', 'job', 'start', 'shift', 'housing',
  'source', 'consentBefore', 'required', 'invalidPhone', 'invalidAge',
  'back', 'continue', 'checkApplication', 'sendEmail', 'copyApplication'
];
const optionGroups = ['messenger', 'yesNo', 'documents', 'jobs', 'starts', 'shifts', 'sources'];

for (const code of languageCodes) {
  const locale = i18n.locales[code];
  if (!locale) fail(`missing locale object for ${code}.`);
  for (const key of requiredKeys) {
    if (!locale[key] && !i18n.locales.en[key]) fail(`missing ${code}.${key}`);
  }
  for (const group of optionGroups) {
    const options = locale.options?.[group] || i18n.locales.en.options?.[group];
    if (!options || Object.keys(options).length === 0) fail(`missing option group ${code}.${group}`);
  }
}

const index = read('apply/index.html');
for (const requiredFile of ['config.js', 'i18n-core.js', 'i18n-caucasus-central.js', 'i18n-asia.js', 'app.js', 'styles.css']) {
  if (!index.includes(requiredFile)) fail(`index.html does not reference ${requiredFile}.`);
}
for (const id of ['languageScreen', 'recruiterScreen', 'recruiterGrid', 'formScreen', 'reviewScreen']) {
  if (!index.includes(`id="${id}"`)) fail(`index.html is missing #${id}.`);
}

console.log(`Application validation passed: ${config.recruiters.length} recruiters, ${languageCodes.length} languages.`);
