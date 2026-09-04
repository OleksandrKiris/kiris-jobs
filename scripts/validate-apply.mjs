import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`Application validation failed: ${message}`); process.exit(1); };
const assert = (condition, message) => { if (!condition) fail(message); };

const context = vm.createContext({ window: {}, console, URL, Intl, Object });
for (const path of [
  'apply/config.js',
  'apply/i18n-core.js',
  'apply/i18n-caucasus-central.js',
  'apply/i18n-asia.js',
  'apply/i18n-extra.js',
  'apply/i18n-mobile.js',
  'apply/translations.js'
]) vm.runInContext(read(path), context, { filename: path });

const config = context.window.CITRONEX_SIMPLE_CONFIG;
const i18n = context.window.CITRONEX_SIMPLE_I18N;
assert(config, 'CITRONEX_SIMPLE_CONFIG was not created.');
assert(i18n, 'CITRONEX_SIMPLE_I18N was not created.');
assert(config.version === '17.0.0', `expected version 17.0.0, found ${config.version}.`);
assert(config.pdfGeneratorUrl === './pdf/', 'PDF generator must use the separate /apply/pdf/ route.');
assert(config.recruiters.length === 6, `expected 6 recruiters, found ${config.recruiters.length}.`);
assert(config.locations.length === 4, `expected 4 locations, found ${config.locations.length}.`);
assert(config.excelColumns.length === 12, `expected 12 Excel columns, found ${config.excelColumns.length}.`);
assert(config.excelColumns[0] === 'Dane osobowe / telefon / komunikator', 'first Excel column must match the operating sheet.');
assert(config.excelColumns[10] === 'Ocena rekrutera' && config.excelColumns[11] === 'Decyzja', 'last two columns must remain recruiter-only.');

const contacts = new Map([
  ['yana', ['Yana Radushynska', 'yana.radushynska@pposiechnice.pl', '+48 797 066 987']],
  ['yuliia', ['Yuliia Korniienko', 'yuliia.korniienko@pposiechnice.pl', '+48 506 845 667']],
  ['fariz', ['Fariz Injaev', 'fariz.injaev@pposiechnice.pl', '+48 504 165 739']],
  ['oleksandr', ['Oleksandr Kiris', 'oleksandr.kiris@pposiechnice.pl', '+48 502 251 384']],
  ['maksym', ['Maksym Saliuk', 'maksym.saliuk@pposiechnice.pl', '+48 506 845 637']],
  ['anastasiia', ['Anastasiia Derepa', 'anastasiia.derepa@citronex.pl', '+48 797 684 159']]
]);
for (const person of config.recruiters) {
  const expected = contacts.get(person.id);
  assert(expected, `unexpected recruiter: ${person.id}`);
  assert(person.name === expected[0] && person.email === expected[1] && person.phone === expected[2], `incorrect contact data for ${person.id}.`);
}

const codes = Object.keys(i18n.languages);
assert(codes.length === 20, `expected 20 languages, found ${codes.length}.`);
for (const code of codes) {
  const locale = i18n.locales[code];
  assert(locale, `missing locale: ${code}`);
  for (const key of ['chooseLanguage','chooseRecruiter','step1Title','step2Title','step3Title','sendRow','copyRow','pdfOpen','options']) {
    assert(locale[key], `missing ${code}.${key}`);
  }
}

const index = read('apply/index.html');
for (const marker of [
  'styles.css?v=17.1.2',
  'config.js?v=17.0.0',
  'translations.js?v=17.0.0',
  'app.js?v=17.1.1',
  '../assets/citronex-logo.jpg',
  'href="pdf/"',
  'id="app"'
]) assert(index.includes(marker), `index.html is missing ${marker}.`);

for (const obsolete of ['mobile-v8.css','ui-v9','ui-v11','delivery-v10','app-mobile.js','offline-redirect.js']) {
  assert(!index.includes(obsolete), `index.html still loads obsolete layer: ${obsolete}`);
}
assert((index.match(/rel="stylesheet"/g) || []).length === 1, 'main form must load exactly one stylesheet.');

const app = read('apply/app.js');
for (const marker of [
  'CITRONEX_SIMPLE_CONFIG',
  'CITRONEX_SIMPLE_I18N',
  'const TOTAL_STEPS = 3',
  'function rowValues',
  'function sendRow',
  'function copyRow',
  'window.location.assign(mailto)',
  'WSKAŹNIKI:',
  'FILMY:',
  'single-action',
  '<em class="ltr"><span>',
  'CFG.excelColumns.length',
  'pdfGeneratorUrl'
]) assert(app.includes(marker), `app.js is missing required marker: ${marker}`);

for (const forbidden of ['type="file"','navigator.share','new File(','buildPdf','createPdf','delivery-v10','ui-v11','app-mobile']) {
  assert(!app.includes(forbidden), `main application still contains removed workflow: ${forbidden}`);
}
assert(!/\bcsv\b/i.test(`${index}\n${app}`), 'main form still contains CSV workflow.');
assert(!app.includes('TABELA KANDYDATA'), 'main email must send one row, not a full table.');

const css = read('apply/styles.css');
for (const marker of [
  '.language-grid',
  '.recruiter-list',
  '.sticky-actions',
  '.sticky-actions.single-action',
  '.choice-card',
  '.choice-grid.three .choice-card:last-child:nth-child(3)',
  '.screening-question',
  '.professional-note',
  '.send-box',
  '.pdf-card',
  '@media(max-width:380px)',
  'font-size:16px'
]) assert(css.includes(marker), `styles.css is missing mobile marker: ${marker}`);
assert(!css.includes('position:sticky'), 'main form must not use sticky positioning.');
assert(!css.includes('position:fixed'), 'main form must not use fixed positioning.');
assert(!css.includes('backdrop-filter'), 'main form must not use overlay blur layers.');

console.log(`Application validation passed: screening layout v17.0.0, ${codes.length} languages, ${config.recruiters.length} recruiters, ${config.excelColumns.length} Excel columns.`);
