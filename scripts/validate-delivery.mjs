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
assert(!mainIndex.includes('type="file"'), 'main form still contains a file input.');
assert(!mainIndex.includes('offline-candidate') && !mainIndex.includes('delivery-v10'), 'main form still loads generator/package code.');
assert(!mainApp.includes('new File(') && !mainApp.includes('navigator.share'), 'main form still creates or shares files.');
assert(!/\bcsv\b/i.test(`${mainIndex}\n${mainApp}`), 'main form still contains CSV workflow.');

for (const marker of [
  'styles.css?v=1.0.0', 'app.js?v=1.0.0', 'id="pdfApp"',
  '../../assets/citronex-logo.jpg', 'connect-src \'none\''
]) assert(pdfIndex.includes(marker), `PDF page is missing ${marker}.`);
for (const marker of [
  'window.print()', 'URL.createObjectURL', 'type="file"',
  'image/jpeg,image/png,image/webp,image/heic,image/heif',
  "const L={", "pl:['🇵🇱'", "ru:['🇷🇺'", "uk:['🇺🇦'"
]) assert(pdfApp.includes(marker), `PDF app is missing ${marker}.`);
for (const marker of ['@page{size:A4', '@media print', '.pdf-sheet', '.photo-sheet']) {
  assert(pdfCss.includes(marker), `PDF styles are missing ${marker}.`);
}

const pdfCombined = `${pdfIndex}\n${pdfCss}\n${pdfApp}`;
for (const forbidden of [
  /\bcsv\b/i, /\bxlsx\b/i, /\btsv\b/i, /\bzip\b/i,
  /navigator\.share/, /mailto:/i, /wa\.me/i, /viber:\/\//i,
  /fetch\s*\(/, /XMLHttpRequest/, /serviceWorker\.register/
]) assert(!forbidden.test(pdfCombined), `PDF generator contains forbidden workflow: ${forbidden}.`);

assert(redirect.includes('url=pdf/'), 'legacy offline.html does not redirect to /apply/pdf/.');
assert(packageJson.scripts['check:js'].includes('apply/pdf/app.js'), 'package.json does not syntax-check the PDF generator.');
assert(!packageJson.scripts['check:js'].includes('offline-candidate'), 'package.json still checks old PDF package modules.');
console.log('PDF generator validation passed: separate print-only PDF tool, no CSV/XLSX/TSV/ZIP or server upload.');
