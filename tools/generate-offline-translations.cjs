const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const candidatePath = path.join(root, 'apply', 'offline-candidate.js');
const htmlPath = path.join(root, 'apply', 'offline.html');
const cssPath = path.join(root, 'apply', 'offline-v12.css');
const workerPath = path.join(root, 'apply', 'service-worker.js');
const translationsPath = path.join(root, 'apply', 'offline-translations.js');

function objectAfter(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) throw new Error(`Marker not found: ${marker}`);
  const start = source.indexOf('{', markerAt + marker.length);
  let quote = '';
  let escaped = false;
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return vm.runInNewContext(`(${source.slice(start, i + 1)})`);
    }
  }
  throw new Error(`Unclosed object after: ${marker}`);
}

const customEnglish = {
  optionalDetails: 'Additional data (optional)',
  additionalConditions: 'Additional conditions (optional)',
  chooseDuties: 'Choose main duties',
  successLead: 'Everything is ready. Send one email to the selected recruiter.',
  openEmail: 'Open email',
  sharePdf: 'Share PDF',
  shareNote: 'The system share menu will open with the PDF attached. Choose your email application.',
  shareFallback: 'If the PDF is not attached automatically, download it below and attach it to the email.',
  excelRow: 'Excel row',
  copyRow: 'Copy row',
  downloadManual: 'Manual download',
  pdfDossier: 'CV and documents (PDF)',
  excelFile: 'Candidate row (Excel)',
  chooseRecruiterError: 'Choose your recruiter.',
  oneSubmissionError: 'Confirm that you will send the form only once.',
};

const customExisting = {
  en: customEnglish,
  pl: {
    optionalDetails: 'Dodatkowe dane (opcjonalnie)', additionalConditions: 'Dodatkowe warunki (opcjonalnie)', chooseDuties: 'Wybierz główne obowiązki',
    successLead: 'Wszystko gotowe. Wyślij jedną wiadomość e-mail do wybranego rekrutera.', openEmail: 'Otwórz e-mail', sharePdf: 'Udostępnij PDF',
    shareNote: 'Otworzy się menu udostępniania z załączonym PDF. Wybierz aplikację pocztową.', shareFallback: 'Jeśli PDF nie zostanie dołączony automatycznie, pobierz go poniżej i dodaj do wiadomości.',
    excelRow: 'Wiersz do Excela', copyRow: 'Kopiuj wiersz', downloadManual: 'Pobieranie ręczne', pdfDossier: 'CV i dokumenty (PDF)', excelFile: 'Wiersz kandydata (Excel)',
    chooseRecruiterError: 'Wybierz swojego rekrutera.', oneSubmissionError: 'Potwierdź, że wyślesz ankietę tylko raz.',
  },
  ru: {
    optionalDetails: 'Дополнительные данные (необязательно)', additionalConditions: 'Дополнительные условия (необязательно)', chooseDuties: 'Выберите основные обязанности',
    successLead: 'Всё готово. Отправьте одно письмо выбранному рекрутеру.', openEmail: 'Открыть почту', sharePdf: 'Поделиться PDF',
    shareNote: 'Откроется системное меню с прикреплённым PDF. Выберите почтовое приложение.', shareFallback: 'Если PDF не прикрепился автоматически, скачайте его ниже и добавьте к письму.',
    excelRow: 'Строка для Excel', copyRow: 'Скопировать строку', downloadManual: 'Скачать вручную', pdfDossier: 'Резюме и документы (PDF)', excelFile: 'Строка кандидата (Excel)',
    chooseRecruiterError: 'Выберите своего рекрутера.', oneSubmissionError: 'Подтвердите, что отправите анкету только один раз.',
  },
  uk: {
    optionalDetails: 'Додаткові дані (необов’язково)', additionalConditions: 'Додаткові умови (необов’язково)', chooseDuties: 'Оберіть основні обов’язки',
    successLead: 'Усе готово. Надішліть один лист обраному рекрутеру.', openEmail: 'Відкрити пошту', sharePdf: 'Поділитися PDF',
    shareNote: 'Відкриється системне меню з прикріпленим PDF. Оберіть поштовий застосунок.', shareFallback: 'Якщо PDF не прикріпився автоматично, завантажте його нижче та додайте до листа.',
    excelRow: 'Рядок для Excel', copyRow: 'Скопіювати рядок', downloadManual: 'Завантажити вручну', pdfDossier: 'Резюме та документи (PDF)', excelFile: 'Рядок кандидата (Excel)',
    chooseRecruiterError: 'Оберіть свого рекрутера.', oneSubmissionError: 'Підтвердьте, що надішлете анкету лише один раз.',
  },
};

const targetLanguages = {
  ka: 'ka', az: 'az', hy: 'hy', tr: 'tr', uz: 'uz', ky: 'ky', tg: 'tg', kk: 'kk',
  hi: 'hi', bn: 'bn', ne: 'ne', ur: 'ur', si: 'si', fil: 'tl', id: 'id', vi: 'vi',
};

const optionEnglish = {
  select: 'Select', yes: 'Yes', no: 'No', female: 'Female', male: 'Male', otherGender: 'Other / prefer not to say',
  none: 'No document', visa: 'Visa', residence: 'Residence card / permit', pesel: 'PESEL UKR', other: 'Other', unknown: 'I do not know',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateRequest(text, language, attempt = 1) {
  const request = JSON.stringify([[text, 'en', language, true], [null]]);
  const payload = JSON.stringify([[['MkEWBc', request, null, 'generic']]]);
  try {
    const response = await fetch('https://translate.google.com/_/TranslateWebserverUi/data/batchexecute?rpcids=MkEWBc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 'User-Agent': 'Mozilla/5.0' },
      body: new URLSearchParams({ 'f.req': payload }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    const envelope = JSON.parse(raw.replace(/^\)\]\}'\s*/, ''));
    const rpc = envelope.find((row) => row[0] === 'wrb.fr' && row[1] === 'MkEWBc');
    const body = JSON.parse(rpc[2]);
    const segments = body?.[1]?.[0]?.[0]?.[5];
    if (!Array.isArray(segments)) throw new Error('Translation payload has an unexpected shape');
    return segments.map((segment) => segment[0]).join('');
  } catch (error) {
    if (attempt >= 5) throw error;
    await delay(4000 * attempt);
    return translateRequest(text, language, attempt + 1);
  }
}

async function translateValues(values, language) {
  const result = [];
  for (let i = 0; i < values.length; i += 200) {
    const group = values.slice(i, i + 200);
    const translated = await translateRequest(group.join('\n'), language);
    const lines = translated.split(/\r?\n/);
    if (lines.length === group.length) result.push(...lines);
    else {
      for (const value of group) result.push(await translateRequest(value, language));
    }
  }
  return result;
}

async function main() {
  let candidate = fs.readFileSync(candidatePath, 'utf8');
  const existingText = objectAfter(candidate, 'const TEXT =');
  const baseText = { ...existingText.en, ...customEnglish };
  const textEntries = Object.entries(baseText);
  const optionEntries = Object.entries(optionEnglish);
  const generatedText = {};
  const generatedOptions = {};
  const locales = Object.entries(targetLanguages);

  for (const [appLanguage, translationLanguage] of locales) {
      const translated = await translateValues([...textEntries.map((entry) => entry[1]), ...optionEntries.map((entry) => entry[1])], translationLanguage);
      generatedText[appLanguage] = Object.fromEntries(textEntries.map(([key], index) => [key, translated[index]]));
      generatedOptions[appLanguage] = Object.fromEntries(optionEntries.map(([key], index) => [key, translated[textEntries.length + index]]));
      await delay(1200);
  }

  const allText = { ...customExisting, ...generatedText };
  const options = {};
  for (const [language, labels] of Object.entries(generatedOptions)) {
    options[language] = {
      yesno: [['', labels.select], ['yes', labels.yes], ['no', labels.no]],
      gender: [['', labels.select], ['female', labels.female], ['male', labels.male], ['other', labels.otherGender]],
      legal: [['', labels.select], ['none', labels.none], ['visa', labels.visa], ['residence', labels.residence], ['pesel', labels.pesel], ['other', labels.other], ['unknown', labels.unknown]],
    };
  }
  const output = `/* Generated static translations. No network is used by the application. */\nwindow.CitronexTranslations = ${JSON.stringify({ text: allText, options }, null, 2)};\n`;

  if (!candidate.includes('CITRONEX_TRANSLATIONS_TEXT')) {
    const optionsAt = candidate.indexOf('const OPTIONS =');
    if (optionsAt < 0) throw new Error('OPTIONS insertion point not found');
    const lineAt = candidate.lastIndexOf('\n', optionsAt) + 1;
    const mergeText = "  // CITRONEX_TRANSLATIONS_TEXT\n  const OFFLINE_TRANSLATIONS = window.CitronexTranslations || { text: {}, options: {} };\n  for (const [language, values] of Object.entries(OFFLINE_TRANSLATIONS.text || {})) TEXT[language] = { ...TEXT.en, ...(TEXT[language] || {}), ...values };\n\n";
    candidate = candidate.slice(0, lineAt) + mergeText + candidate.slice(lineAt);
  }
  if (!candidate.includes('CITRONEX_TRANSLATIONS_OPTIONS')) {
    const tAt = candidate.indexOf('const t =');
    if (tAt < 0) throw new Error('Translation helper insertion point not found');
    const lineAt = candidate.lastIndexOf('\n', tAt) + 1;
    const mergeOptions = "  // CITRONEX_TRANSLATIONS_OPTIONS\n  for (const [language, values] of Object.entries(OFFLINE_TRANSLATIONS.options || {})) {\n    for (const name of ['yesno', 'gender', 'legal']) {\n      if (OPTIONS[name] && values[name]) OPTIONS[name][language] = values[name];\n    }\n  }\n\n";
    candidate = candidate.slice(0, lineAt) + mergeOptions + candidate.slice(lineAt);
  }

  candidate = candidate.replace(
    /const optionalLabel=\{ru:'Дополнительные данные \(необязательно\)',uk:'Додаткові дані \(необов’язково\)',pl:'Dodatkowe dane \(opcjonalnie\)',en:'Additional data \(optional\)'\}\[state\.language\]\|\|'Additional data \(optional\)'/,
    "const optionalLabel=t('optionalDetails')",
  );
  candidate = candidate.replace(
    /const extraLabel=\{ru:'Дополнительные условия \(необязательно\)',uk:'Додаткові умови \(необов’язково\)',pl:'Dodatkowe warunki \(opcjonalnie\)',en:'Additional conditions \(optional\)'\}\[state\.language\]\|\|'Additional conditions \(optional\)'/,
    "const extraLabel=t('additionalConditions')",
  );
  candidate = candidate.replace(
    /const duties=\{ru:'Выбрать основные обязанности',uk:'Обрати основні обов’язки',pl:'Wybierz główne obowiązki',en:'Choose main duties'\}\[state\.language\]\|\|'Choose main duties'/,
    "const duties=t('chooseDuties')",
  );
  candidate = candidate.replace(
    /const firstMessages=\{[\s\S]*?\}\[state\.language\]\|\|\{[\s\S]*?\};(?=if\(!state\.recruiterId\))/, 
    "const firstMessages={recruiter:t('chooseRecruiterError'),ack:t('oneSubmissionError')};",
  );
  candidate = candidate.replace(
    'const l=labels[state.language]||labels.en;',
    "const l={lead:t('successLead'),email:t('openEmail'),share:t('sharePdf'),shareNote:t('shareNote'),fallbackNote:t('shareFallback'),excel:t('excelRow'),copyLine:t('copyRow'),downloads:t('downloadManual'),pdf:t('pdfDossier'),xlsx:t('excelFile')};",
  );
  candidate = candidate.replace(
    "function render(){document.documentElement.lang=state.language||'en';",
    "function render(){document.documentElement.lang=state.language||'en';document.documentElement.dir=state.language==='ur'?'rtl':'ltr';",
  );
  candidate = candidate.replace(/!\['pl','uk','ru','en'\]\.includes\(state\.language\)/g, '!TEXT[state.language]');
  candidate = candidate.replace(/!\['en','pl','ru','uk'\]\.includes\(state\.language\)/g, '!TEXT[state.language]');

  let html = fs.readFileSync(htmlPath, 'utf8');
  if (!html.includes('offline-translations.js')) {
    html = html.replace(/(<script[^>]+src=["']\.\/offline-candidate\.js["'][^>]*><\/script>)/, '<script src="./offline-translations.js"></script>\n  $1');
  }
  html = html.replaceAll('13.3.0', '14.0.0');

  let worker = fs.readFileSync(workerPath, 'utf8');
  if (!worker.includes('offline-translations.js')) {
    worker = worker.replace(/(["']\.\/offline-candidate\.js["'],?)/, "$1\n  './offline-translations.js',");
  }
  worker = worker.replaceAll('13.3.0', '14.0.0');

  let css = fs.readFileSync(cssPath, 'utf8');
  if (!css.includes('CITRONEX_RTL')) css += `\n/* CITRONEX_RTL */\nhtml[dir="rtl"] body { direction: rtl; }\nhtml[dir="rtl"] .topbar, html[dir="rtl"] .section-head, html[dir="rtl"] .notice, html[dir="rtl"] .field, html[dir="rtl"] .upload-card, html[dir="rtl"] .summary-card { text-align: right; }\nhtml[dir="rtl"] input, html[dir="rtl"] select, html[dir="rtl"] textarea { text-align: right; }\nhtml[dir="rtl"] input[type="email"], html[dir="rtl"] input[type="tel"] { direction: ltr; text-align: left; }\nhtml[dir="rtl"] .arrow { transform: scaleX(-1); }\n`;

  fs.writeFileSync(translationsPath, output, 'utf8');
  fs.writeFileSync(candidatePath, candidate, 'utf8');
  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(workerPath, worker, 'utf8');
  fs.writeFileSync(cssPath, css, 'utf8');
  process.stdout.write(`Generated ${Object.keys(generatedText).length} complete language dictionaries.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
