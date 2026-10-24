import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`PDF generator validation failed: ${message}`); process.exit(1); };
const assert = (condition, message) => { if (!condition) fail(message); };

const mainIndex = read('apply/index.html');
const mainApp = read('apply/app.js');
const pdfIndex = read('apply/pdf/index.html');
const pdfCss = read('apply/pdf/styles.css');
const pdfApp = read('apply/pdf/app.js');
const pdfImages = read('apply/pdf/images.js');
const pdfCopy = read('apply/pdf/translations.js');
const pdfNavigation = read('apply/pdf/navigation.js');
const redirect = read('apply/offline.html');
const workflow = read('.github/workflows/pages.yml');
const packageJson = JSON.parse(read('package.json'));

assert(mainIndex.includes('href="pdf/"'), 'main page does not link to the separate PDF generator.');
assert(mainIndex.includes('styles.css?v=17.2.4'), 'main form does not load the current interface styles.');
assert(mainIndex.includes('app.js?v=17.2.6'), 'main form does not load the current interface logic.');
assert(!mainIndex.includes('type="file"'), 'main form still contains a file input.');
assert(!mainApp.includes('new File(') && !mainApp.includes('navigator.share'), 'main form still creates or shares files.');
assert(!/\bcsv\b/i.test(`${mainIndex}\n${mainApp}`), 'main form still contains CSV workflow.');

for (const marker of [
  'styles.css?v=1.1.6',
  'app.js?v=1.1.5',
  'translations.js?v=1.0.1',
  'images.js?v=1.0.0',
  'id="pdfApp"',
  '../../assets/primserv-avatar.jpg',
  "connect-src 'none'"
]) assert(pdfIndex.includes(marker), `PDF page is missing ${marker}.`);
assert(mainIndex.includes('pdf/navigation.js?v=1.0.0') && pdfIndex.includes('navigation.js?v=1.0.0'), 'both routes must load the shared navigation helper.');
assert((pdfIndex.match(/rel="stylesheet"/g) || []).length === 1, 'PDF generator must load exactly one stylesheet.');

for (const marker of [
  'window.print()',
  'function renderPreview()',
  'function pageWord(n)',
  'renderPreview()});',
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

assert(pdfImages.includes('URL.createObjectURL') && pdfImages.includes('URL.revokeObjectURL'), 'local image URL lifecycle is missing.');
assert(!pdfCss.includes('position:sticky'), 'PDF generator must not use sticky positioning.');
assert(!pdfCss.includes('position:fixed'), 'PDF generator must not use fixed positioning.');
assert(!pdfCss.includes('min-max('), 'PDF generator contains invalid min-max() CSS.');

const pdfCombined = `${pdfIndex}\n${pdfCss}\n${pdfApp}\n${pdfNavigation}\n${pdfCopy}\n${pdfImages}`;
for (const forbidden of [
  /\bcsv\b/i, /\bxlsx\b/i, /\btsv\b/i, /\bzip\b/i,
  /navigator\.share/, /mailto:/i, /wa\.me/i, /viber:\/\//i,
  /fetch\s*\(/, /XMLHttpRequest/, /serviceWorker\.register/
]) assert(!forbidden.test(pdfCombined), `PDF generator contains forbidden workflow: ${forbidden}.`);

assert(redirect.includes('url=pdf/'), 'legacy offline.html does not redirect to /apply/pdf/.');
assert(packageJson.scripts['check:js'].includes('apply/pdf/app.js'), 'package.json does not syntax-check the PDF generator.');

for (const marker of [
  'styles.css?v=17.2.4',
  'translations.js?v=17.0.6',
  'app.js?v=17.2.6',
  'styles.css?v=1.1.6',
  'app.js?v=1.1.5',
  'CFG.excelColumns.length'
]) assert(workflow.includes(marker), `GitHub Pages workflow is missing current marker: ${marker}`);

console.log('PDF generator validation passed: stable non-overlapping print-only PDF tool.');
