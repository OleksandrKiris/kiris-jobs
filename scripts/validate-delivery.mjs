import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`PDF generator validation failed: ${message}`); process.exit(1); };
const assert = (condition, message) => { if (!condition) fail(message); };

const mainIndex = read('apply/index.html');
const mainApp = read('apply/app.js');
const pdfIndex = read('apply/pdf/index.html');
const pdfCss = read('apply/pdf/styles.css');
const pdfApp = read('apply/pdf/app.js');
const redirect = read('apply/offline.html');
const packageJson = JSON.parse(read('package.json'));

assert(mainIndex.includes('href="pdf/"'), 'main page does not link to the separate PDF generator.');
assert(mainIndex.includes('styles.css?v=17.1.2'), 'main form does not load the current interface styles.');
assert(mainIndex.includes('app.js?v=17.1.1'), 'main form does not load the current interface logic.');
assert(!mainIndex.includes('type="file"'), 'main form still contains a file input.');
assert(!mainApp.includes('new File(') && !mainApp.includes('navigator.share'), 'main form still creates or shares files.');
assert(!/\bcsv\b/i.test(`${mainIndex}\n${mainApp}`), 'main form still contains CSV workflow.');

for (const marker of [
  'styles.css?v=1.1.0',
  'app.js?v=1.1.1',
  'id="pdfApp"',
  '../../assets/citronex-logo.jpg',
  "connect-src 'none'"
]) assert(pdfIndex.includes(marker), `PDF page is missing ${marker}.`);
assert((pdfIndex.match(/rel="stylesheet"/g) || []).length === 1, 'PDF generator must load exactly one stylesheet.');

for (const marker of [
  'window.print()',
  'function renderPreview()',
  'function pageWord(n)',
  'renderPreview()});',
  'URL.createObjectURL',
  'type="file"',
  'image/jpeg,image/png,image/webp,image/heic,image/heif',
  "const L={",
  "pl:['🇵🇱'",
  "ru:['🇷🇺'",
  "uk:['🇺🇦'"
]) assert(pdfApp.includes(marker), `PDF app is missing ${marker}.`);

for (const marker of [
  '@page{size:A4',
  '@media print',
  '.generator-grid',
  'minmax(0,420px)',
  '.pdf-sheet',
  '.photo-sheet'
]) assert(pdfCss.includes(marker), `PDF styles are missing ${marker}.`);

assert(!pdfCss.includes('position:sticky'), 'PDF generator must not use sticky positioning.');
assert(!pdfCss.includes('position:fixed'), 'PDF generator must not use fixed positioning.');
assert(!pdfCss.includes('min-max('), 'PDF generator contains invalid min-max() CSS.');

const pdfCombined = `${pdfIndex}\n${pdfCss}\n${pdfApp}`;
for (const forbidden of [
  /\bcsv\b/i, /\bxlsx\b/i, /\btsv\b/i, /\bzip\b/i,
  /navigator\.share/, /mailto:/i, /wa\.me/i, /viber:\/\//i,
  /fetch\s*\(/, /XMLHttpRequest/, /serviceWorker\.register/
]) assert(!forbidden.test(pdfCombined), `PDF generator contains forbidden workflow: ${forbidden}.`);

assert(redirect.includes('url=pdf/'), 'legacy offline.html does not redirect to /apply/pdf/.');
assert(packageJson.scripts['check:js'].includes('apply/pdf/app.js'), 'package.json does not syntax-check the PDF generator.');

console.log('PDF generator validation passed: stable non-overlapping print-only PDF tool.');
