import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`Application validation failed: ${message}`); process.exit(1); };
const assert = (condition, message) => { if (!condition) fail(message); };

const context = vm.createContext({ window: {}, console, URL, Intl, Object });
for (const path of ['apply/config.js','apply/i18n-core.js','apply/i18n-caucasus-central.js','apply/i18n-asia.js','apply/i18n-extra.js','apply/i18n-mobile.js','apply/translations.js']) {
  vm.runInContext(read(path), context, { filename: path });
}

const config = context.window.CITRONEX_SIMPLE_CONFIG;
const i18n = context.window.CITRONEX_SIMPLE_I18N;
assert(config, 'CITRONEX_SIMPLE_CONFIG was not created.');
assert(i18n, 'CITRONEX_SIMPLE_I18N was not created.');
assert(config.version === '16.0.0', `expected version 16.0.0, found ${config.version}.`);
assert(config.pdfGeneratorUrl === './pdf/', 'PDF generator must use a separate /apply/pdf/ route.');

const expectedContacts = new Map([
  ['yana', ['Yana Radushynska', 'yana.radushynska@pposiechnice.pl', '+48 797 066 987']],
  ['yuliia', ['Yuliia Korniienko', 'yuliia.korniienko@pposiechnice.pl', '+48 506 845 667']],
  ['fariz', ['Fariz Injaev', 'fariz.injaev@pposiechnice.pl', '+48 504 165 739']],
  ['oleksandr', ['Oleksandr Kiris', 'oleksandr.kiris@pposiechnice.pl', '+48 502 251 384']],
  ['maksym', ['Maksym Saliuk', 'maksym.saliuk@pposiechnice.pl', '+48 506 845 637']],
  ['anastasiia', ['Anastasiia Derepa', 'anastasiia.derepa@citronex.pl', '+48 797 684 159']]
]);
assert(config.recruiters.length === 6, `expected 6 recruiters, found ${config.recruiters.length}.`);
for (const person of config.recruiters) {
  const expected = expectedContacts.get(person.id);
  assert(expected, `unexpected recruiter: ${person.id}`);
  assert(person.name === expected[0] && person.email === expected[1] && person.phone === expected[2], `incorrect contact data for ${person.id}.`);
}
assert(JSON.stringify(config.locations) === JSON.stringify(['siechnice','ryczywol','bogatynia','zgorzelec','pruszcz','any']), 'location list changed unexpectedly.');
assert(config.excelColumns.length === 40, `expected 40 Excel columns, found ${config.excelColumns.length}.`);
for (const column of ['ID zgłoszenia','SLA do','Rekruter','Preferowana lokalizacja','Szczegóły źródła / polecający','Status','Następny kontakt']) {
  assert(config.excelColumns.includes(column), `missing Excel column: ${column}`);
}

const codes = Object.keys(i18n.languages);
assert(codes.length === 20, `expected 20 languages, found ${codes.length}.`);
assert(i18n.priority.length === 9, `expected 9 priority languages, found ${i18n.priority.length}.`);
for (const code of ['pl','uk','ru','en','ka','az','hy','tr','uz']) assert(i18n.priority.includes(code), `missing priority language: ${code}`);
for (const code of codes) {
  const locale = i18n.locales[code];
  assert(locale, `missing locale: ${code}`);
  for (const key of ['chooseLanguage','chooseRecruiter','step1Title','step2Title','step3Title','step4Title','sendRow','pdfOpen','options']) {
    assert(locale[key], `missing ${code}.${key}`);
  }
}

const index = read('apply/index.html');
for (const marker of ['styles.css?v=16.0.0','config.js?v=16.0.0','i18n-core.js?v=16.0.0','i18n-caucasus-central.js?v=16.0.0','i18n-asia.js?v=16.0.0','i18n-extra.js?v=16.0.0','i18n-mobile.js?v=16.0.0','translations.js?v=16.0.0','app.js?v=16.0.0','../assets/citronex-logo.jpg','href="pdf/"','id="app"']) {
  assert(index.includes(marker), `index.html is missing ${marker}.`);
}
for (const obsolete of ['mobile-v8.css','ui-v9','ui-v11','delivery-v10','app-mobile.js','offline-redirect.js']) {
  assert(!index.includes(obsolete), `index.html still loads obsolete layer: ${obsolete}`);
}

const app = read('apply/app.js');
for (const marker of [
  'CITRONEX_SIMPLE_CONFIG','CITRONEX_SIMPLE_I18N','function rowValues','function sendRow',
  "const sentAt = new Date()",'window.location.assign(mailto)',
  'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
  "'NOWY'",'CFG.excelColumns.length','pdfGeneratorUrl','cleanupLegacyServiceWorker',
  "4: ['source', 'sourceDetails', 'consent']"
]) assert(app.includes(marker), `app.js is missing required marker: ${marker}`);

for (const forbidden of ['type="file"','navigator.share','new File(','buildPdf','createPdf','delivery-v10','ui-v11','app-mobile']) {
  assert(!app.includes(forbidden), `main application still contains removed workflow: ${forbidden}`);
}
assert(!app.includes('TABELA KANDYDATA'), 'main email must send one row, not a full table.');
assert(!app.includes('WIERSZ DO EXCEL — NAGŁÓWKI'), 'main email must not send headers.');

const rowStart = app.indexOf('    const values = [', app.indexOf('function rowValues'));
const rowEnd = app.indexOf('\n    ].map', rowStart);
assert(rowStart >= 0 && rowEnd > rowStart, 'Excel row definition could not be inspected.');
const rowSource = app.slice(rowStart + '    const values = ['.length, rowEnd);
let depth = 0, quote = '', escaped = false, items = 1;
for (const character of rowSource) {
  if (quote) {
    if (escaped) escaped = false;
    else if (character === '\\') escaped = true;
    else if (character === quote) quote = '';
    continue;
  }
  if (["'", '"', '`'].includes(character)) quote = character;
  else if ('([{'.includes(character)) depth += 1;
  else if (')]}'.includes(character)) depth -= 1;
  else if (character === ',' && depth === 0) items += 1;
}
assert(items === config.excelColumns.length, `Excel row has ${items} values but config has ${config.excelColumns.length} columns.`);

const css = read('apply/styles.css');
for (const marker of ['.language-grid','.recruiter-list','.sticky-actions','.choice-card','.send-box','.pdf-card','@media(max-width:440px)','font-size:16px']) {
  assert(css.includes(marker), `styles.css is missing mobile marker: ${marker}`);
}
console.log(`Application validation passed: clean v${config.version}, ${codes.length} languages, ${config.recruiters.length} recruiters, ${config.excelColumns.length} Excel columns.`);
