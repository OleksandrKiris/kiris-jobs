import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => { console.error(`PDF generator validation failed: ${message}`); process.exit(1); };
const assert = (condition, message) => { if (!condition) fail(message); };

const mainIndex = read('apply/index.html');
const pdfIndex = read('apply/pdf/index.html');
const redirect = read('apply/offline.html');
const sw = read('apply/pdf/service-worker.js');
const manifest = JSON.parse(read('apply/pdf/manifest.webmanifest'));
const packageJson = JSON.parse(read('package.json'));

assert(mainIndex.includes('href="pdf/"'), 'main page does not link to the separate PDF generator.');
assert(!mainIndex.includes('offline-candidate'), 'main page still loads generator code.');
assert(!mainIndex.includes('type="file"'), 'main page still contains file upload.');
for (const marker of ['../offline-v12.css?v=14.0.4','../offline-shared-v14.0.3.js','../offline-translations-v14.0.4.js','../offline-candidate-v14.0.4.js','data-mode="candidate"']) {
  assert(pdfIndex.includes(marker), `PDF generator page is missing ${marker}.`);
}
for (const file of [
  'apply/offline-v12.css','apply/offline-shared-v14.0.3.js','apply/offline-translations-v14.0.4.js','apply/offline-candidate-v14.0.4.js',
  'apply/pdf/service-worker.js','apply/pdf/manifest.webmanifest','apply/offline-icon.svg'
]) assert(fs.existsSync(file) && fs.statSync(file).size > 0, `missing PDF generator asset: ${file}`);
assert(redirect.includes('url=pdf/'), 'legacy offline.html does not redirect to the generator.');
assert(sw.includes("const CACHE = 'citronex-pdf-generator-v16'"), 'PDF generator service worker has wrong cache.');
assert(sw.includes("caches.match('./index.html')"), 'PDF generator has no offline navigation fallback.');
assert(manifest.start_url === './' && manifest.scope === './', 'PDF generator manifest must be isolated to /apply/pdf/.');
assert(packageJson.scripts['check:js'].includes('apply/app.js'), 'package.json does not syntax-check the simple form.');
assert(packageJson.scripts['check:js'].includes('apply/offline-candidate-v14.0.4.js'), 'package.json does not syntax-check the PDF generator.');
console.log('PDF generator validation passed: isolated optional generator, main form remains row-only.');
