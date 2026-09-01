import fs from 'node:fs';
import vm from 'node:vm';

const read = (path) => fs.readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`Delivery validation failed: ${message}`);
  process.exit(1);
};
const requireMarker = (content, marker, file) => {
  if (!content.includes(marker)) fail(`${file} is missing required marker: ${marker}`);
};

const configSource = read('apply/config.js');
const index = read('apply/index.html');
const delivery = read('apply/delivery-v10.js');
const deliveryI18n = read('apply/delivery-v10-i18n.js');
const deliveryCss = read('apply/delivery-v10.css');
const packageJson = JSON.parse(read('package.json'));

const context = { window: {} };
vm.runInNewContext(configSource, context, { filename: 'apply/config.js' });
const config = context.window.RECRUITMENT_CONFIG;
if (!config) fail('RECRUITMENT_CONFIG was not created.');

const expectedContacts = {
  yana: ['yana.radushynska@pposiechnice.pl', '+48 797 066 987', '48797066987'],
  yuliia: ['yuliia.korniienko@pposiechnice.pl', '+48 506 845 667', '48506845667'],
  fariz: ['fariz.injaev@pposiechnice.pl', '+48 504 165 739', '48504165739'],
  oleksandr: ['oleksandr.kiris@pposiechnice.pl', '+48 502 251 384', '48502251384'],
  maksym: ['maksym.saliuk@pposiechnice.pl', '+48 506 845 637', '48506845637'],
  anastasiia: ['anastasiia.derepa@citronex.pl', '+48 797 684 159', '48797684159']
};

if (!Array.isArray(config.recruiters) || config.recruiters.length !== 6) fail('Exactly six recruiters are required.');
for (const recruiter of config.recruiters) {
  const expected = expectedContacts[recruiter.id];
  if (!expected) fail(`Unexpected recruiter id: ${recruiter.id}`);
  if (recruiter.email !== expected[0] || recruiter.phone !== expected[1] || recruiter.phoneDigits !== expected[2]) {
    fail(`Incorrect contact data for ${recruiter.id}.`);
  }
}

if (config.delivery?.maxFiles !== 30) fail('maxFiles must be 30.');
if (config.delivery?.maxFileBytes !== 12 * 1024 * 1024) fail('maxFileBytes must be 12 MB.');
if (config.delivery?.maxTotalFileBytes !== 80 * 1024 * 1024) fail('maxTotalFileBytes must be 80 MB.');
if (!Array.isArray(config.excelColumns) || config.excelColumns.length !== 40) fail('Excel queue must keep 40 columns.');

for (const marker of [
  'delivery-v10.css?v=10.2.0',
  'delivery-v10-i18n.js?v=10.2.0',
  'delivery-v10.js?v=10.2.0'
]) requireMarker(index, marker, 'apply/index.html');

for (const marker of [
  'navigator.share', 'navigator.canShare', 'new File(', '-excel.tsv', '-ankieta.txt',
  'https://wa.me/', 'https://t.me/+', 'viber://chat?number=', 'tel:',
  'data-delivery-file-input', 'multiple accept=', 'CV / DOKUMENTY WYBRANE PRZEZ KANDYDATA',
  'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A'
]) requireMarker(delivery, marker, 'apply/delivery-v10.js');

for (const marker of [
  '.delivery-files-panel', '.delivery-channel-grid', '.delivery-share-primary',
  '.delivery-original-send', '.delivery-file-picker'
]) requireMarker(deliveryCss, marker, 'apply/delivery-v10.css');

const languageMarkers = {
  en: 'en,', pl: 'pl:', ru: 'ru:', uk: 'uk:', ka: 'ka:', az: 'az:', hy: 'hy:', tr: 'tr:',
  uz: 'uz:', ky: 'ky:', tg: 'tg:', kk: 'kk:', hi: 'hi:', bn: 'bn:', ne: 'ne:', ur: 'ur:',
  si: 'si:', fil: 'fil:', id: 'id:', vi: 'vi:'
};
for (const [language, marker] of Object.entries(languageMarkers)) {
  requireMarker(deliveryI18n, marker, `apply/delivery-v10-i18n.js (${language})`);
}

if (!packageJson.scripts?.['check:js']?.includes('apply/delivery-v10.js')) fail('package.json does not syntax-check delivery-v10.js.');
if (!packageJson.scripts?.['check:delivery']?.includes('validate-delivery.mjs')) fail('package.json does not run delivery validation.');
if (!packageJson.scripts?.test?.includes('check:delivery')) fail('npm test does not include check:delivery.');

for (const forbidden of ['XMLHttpRequest', 'FormData(', 'fetch(', 'firebase', 'supabase']) {
  if (delivery.toLowerCase().includes(forbidden.toLowerCase())) fail(`Forbidden upload/backend marker found: ${forbidden}`);
}

console.log('Delivery validation passed: 6 recruiter contacts, 20 languages, direct channels, document sharing and 40 Excel columns.');
