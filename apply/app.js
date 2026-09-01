(() => {
  'use strict';

  const CFG = window.RECRUITMENT_CONFIG;
  const I18N = window.RECRUITMENT_I18N;
  if (!CFG || !I18N) throw new Error('Recruitment configuration is missing.');

  const $ = (id) => document.getElementById(id);
  const fieldIds = [
    'firstName', 'lastName', 'phone', 'messenger', 'email', 'citizenship',
    'country', 'city', 'age', 'inPoland', 'documents', 'job', 'experience',
    'start', 'shift', 'housing', 'source', 'comment'
  ];
  const requiredByStep = {
    1: ['firstName', 'lastName', 'phone', 'messenger'],
    2: ['citizenship', 'country', 'city', 'age', 'inPoland', 'documents'],
    3: ['job', 'start', 'shift', 'housing', 'source', 'consent']
  };
  const reviewFields = [
    'firstName', 'lastName', 'phone', 'messenger', 'email', 'citizenship',
    'country', 'city', 'age', 'inPoland', 'documents', 'job', 'experience',
    'start', 'shift', 'housing', 'source', 'comment'
  ];
  const selectMaps = {
    messenger: 'messenger', inPoland: 'yesNo', documents: 'documents', job: 'jobs',
    start: 'starts', shift: 'shifts', housing: 'yesNo', source: 'sources'
  };

  const url = new URL(window.location.href);
  const params = CFG.queryParams;
  const route = {
    source: sanitizeRoute(url.searchParams.get(params.source)),
    campaign: sanitizeRoute(url.searchParams.get(params.campaign)),
    vacancy: sanitizeRoute(url.searchParams.get(params.vacancy))
  };
  const suggestedLanguage = validLanguage(url.searchParams.get(params.language));
  const suggestedRecruiter = validRecruiterId(url.searchParams.get(params.recruiter));

  let state = {
    id: createApplicationId(),
    createdAt: new Date().toISOString(),
    language: null,
    recruiterId: null,
    step: 1,
    data: emptyData()
  };

  function emptyData() {
    return Object.fromEntries([...fieldIds.map((id) => [id, '']), ['consent', false]]);
  }

  function sanitizeRoute(value) {
    return String(value || '')
      .trim()
      .replace(/[^\p{L}\p{N}_.+\- ]/gu, '')
      .slice(0, 100);
  }

  function validLanguage(code) {
    const normalized = String(code || '').toLowerCase();
    return I18N.languages[normalized] ? normalized : null;
  }

  function validRecruiterId(id) {
    const normalized = String(id || '').toLowerCase();
    return CFG.recruiters.some((item) => item.id === normalized) ? normalized : null;
  }

  function recruiterById(id = state.recruiterId) {
    return CFG.recruiters.find((item) => item.id === id) || null;
  }

  function deepMerge(base, patch) {
    const result = Array.isArray(base) ? [...base] : { ...base };
    Object.entries(patch || {}).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = deepMerge(base?.[key] || {}, value);
      } else {
        result[key] = value;
      }
    });
    return result;
  }

  function locale(code = state.language) {
    return deepMerge(I18N.locales.en, I18N.locales[code] || {});
  }

  function t(key) {
    return locale()[key] ?? I18N.locales.en[key] ?? key;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function warsawParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: CFG.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    return Object.fromEntries(
      formatter.formatToParts(date)
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value])
    );
  }

  function createApplicationId() {
    const p = warsawParts();
    const random = (window.crypto?.getRandomValues
      ? Array.from(window.crypto.getRandomValues(new Uint8Array(2)), (n) => n.toString(16).padStart(2, '0')).join('')
      : Math.random().toString(16).slice(2, 6)
    ).toUpperCase();
    return `KAND-${p.year}${p.month}${p.day}-${p.hour}${p.minute}${p.second}-${random}`;
  }

  function formattedWarsawDate(iso = state.createdAt) {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: CFG.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(iso));
  }

  function normalizePhone(raw) {
    const input = String(raw || '').trim();
    const startsWithPlus = input.startsWith('+');
    const digits = input.replace(/\D/g, '');
    return `${startsWithPlus ? '+' : ''}${digits}`;
  }

  function cleanCell(value) {
    return String(value ?? '')
      .replace(/[\t\r\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function readForm() {
    const data = {};
    fieldIds.forEach((id) => { data[id] = $(id).value.trim(); });
    data.phone = normalizePhone(data.phone);
    data.consent = $('consent').checked;
    return data;
  }

  function writeForm(data) {
    fieldIds.forEach((id) => { if ($(id)) $(id).value = data?.[id] ?? ''; });
    $('consent').checked = Boolean(data?.consent);
  }

  function saveDraft() {
    if (!$('formScreen').classList.contains('hidden')) state.data = readForm();
    try {
      localStorage.setItem(CFG.storageKey, JSON.stringify({ ...state, route, version: CFG.version }));
      if (state.language) localStorage.setItem(CFG.languageKey, state.language);
      if (state.recruiterId) localStorage.setItem(CFG.recruiterKey, state.recruiterId);
    } catch (error) {
      console.warn('Draft could not be saved.', error);
    }
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(CFG.storageKey));
      if (!draft || !draft.id || !draft.data) return null;
      draft.language = validLanguage(draft.language);
      draft.recruiterId = validRecruiterId(draft.recruiterId);
      draft.step = Math.min(3, Math.max(1, Number(draft.step) || 1));
      return draft;
    } catch {
      return null;
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(CFG.storageKey); } catch { /* no-op */ }
  }

  function applyDocumentLanguage() {
    const code = state.language || 'en';
    const metadata = I18N.languages[code] || I18N.languages.en;
    document.documentElement.lang = code === 'uk' ? 'uk' : code;
    document.documentElement.dir = metadata.direction;
    document.title = `${CFG.brand} — ${t('languageTitle')}`;
  }

  function showScreen(screenId) {
    ['languageScreen', 'recruiterScreen', 'formScreen', 'reviewScreen'].forEach((id) => {
      $(id).classList.toggle('hidden', id !== screenId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      const heading = $(screenId).querySelector('h1, h2, input, button');
      if (heading && typeof heading.focus === 'function') heading.focus({ preventScroll: true });
    });
  }

  function renderLanguages(query = '') {
    const search = query.trim().toLocaleLowerCase();
    let entries = Object.entries(I18N.languages);
    const preferred = suggestedLanguage || validLanguage(localStorage.getItem(CFG.languageKey));
    if (preferred) entries.sort(([a], [b]) => (a === preferred ? -1 : b === preferred ? 1 : 0));
    entries = entries.filter(([code, meta]) => {
      const haystack = `${code} ${meta.native} ${meta.english}`.toLocaleLowerCase();
      return !search || haystack.includes(search);
    });
    $('languageGrid').innerHTML = entries.length
      ? entries.map(([code, meta]) => `
          <button class="language-button" type="button" data-language="${code}">
            <span class="language-flag" aria-hidden="true">${meta.flag}</span>
            <span><span class="language-native">${escapeHtml(meta.native)}</span><span class="language-english">${escapeHtml(meta.english)} · ${code.toUpperCase()}</span></span>
          </button>`).join('')
      : `<div class="empty-state">${escapeHtml((state.language ? t('noLanguages') : I18N.locales.en.noLanguages))}</div>`;
    document.querySelectorAll('[data-language]').forEach((button) => {
      button.addEventListener('click', () => chooseLanguage(button.dataset.language));
    });
  }

  function chooseLanguage(code) {
    state.language = validLanguage(code) || 'en';
    applyDocumentLanguage();
    renderRecruiterScreen();
    showScreen('recruiterScreen');
    saveDraft();
  }

  function renderRecruiterScreen() {
    $('recruiterTitle').textContent = t('recruiterTitle');
    $('recruiterSubtitle').textContent = t('recruiterSubtitle');
    $('recruiterRequired').textContent = t('recruiterRequired');
    $('recruiterBackLanguage').textContent = `← ${t('changeLanguage')}`;
    const preferred = suggestedRecruiter || validRecruiterId(localStorage.getItem(CFG.recruiterKey));
    const recruiters = [...CFG.recruiters].sort((a, b) => (a.id === preferred ? -1 : b.id === preferred ? 1 : 0));
    $('recruiterGrid').innerHTML = recruiters.map((item) => `
      <button class="recruiter-button" type="button" data-recruiter="${item.id}">
        ${item.id === suggestedRecruiter ? `<span class="suggested-badge">${escapeHtml(t('suggested'))}</span>` : ''}
        <span class="recruiter-avatar" aria-hidden="true">${escapeHtml(item.initials)}</span>
        <span><span class="recruiter-name">${escapeHtml(item.name)}</span><span class="recruiter-email ltr-value">${escapeHtml(item.email)}</span></span>
      </button>`).join('');
    document.querySelectorAll('[data-recruiter]').forEach((button) => {
      button.addEventListener('click', () => chooseRecruiter(button.dataset.recruiter));
    });
  }

  function chooseRecruiter(id) {
    const recruiterId = validRecruiterId(id);
    if (!recruiterId) return;
    state.recruiterId = recruiterId;
    state.step = Math.min(3, Math.max(1, state.step || 1));
    renderFormText();
    writeForm(state.data);
    renderStep();
    showScreen('formScreen');
    saveDraft();
  }

  function optionEntries(group) {
    return Object.entries(locale().options[group] || I18N.locales.en.options[group] || {});
  }

  function fillSelect(id, group) {
    const current = $(id).value;
    $(id).innerHTML = `<option value="">${escapeHtml(t('selectOption'))}</option>` +
      optionEntries(group).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('');
    $(id).value = current;
  }

  function renderFormText() {
    document.querySelectorAll('[data-label]').forEach((element) => {
      const key = element.dataset.label;
      element.innerHTML = `${escapeHtml(t(key))} <span class="required-star" aria-hidden="true">*</span>`;
    });
    document.querySelectorAll('[data-label-optional]').forEach((element) => {
      element.textContent = t(element.dataset.labelOptional);
    });
    $('phoneHint').textContent = t('phoneHint');
    $('experienceHint').textContent = t('experienceHint');
    $('safetyNotice').textContent = t('safety');
    $('consentLabel').innerHTML = `${escapeHtml(t('consentBefore'))} <a href="${escapeHtml(CFG.privacyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('privacyLink'))}</a>. <span class="required-star" aria-hidden="true">*</span>`;
    $('changeLanguage').textContent = `🌍 ${t('changeLanguage')}`;
    $('changeRecruiter').textContent = `👤 ${t('changeRecruiter')}`;
    $('backButton').textContent = t('back');
    fillSelect('messenger', 'messenger');
    fillSelect('inPoland', 'yesNo');
    fillSelect('documents', 'documents');
    fillSelect('job', 'jobs');
    fillSelect('start', 'starts');
    fillSelect('shift', 'shifts');
    fillSelect('housing', 'yesNo');
    fillSelect('source', 'sources');
    const recruiter = recruiterById();
    $('applicationIdChip').textContent = state.id;
    $('recruiterChip').textContent = recruiter ? recruiter.name : t('recruiterTitle');
  }

  function renderStep() {
    [1, 2, 3].forEach((number) => $('step' + number).classList.toggle('hidden', number !== state.step));
    [1, 2, 3, 4].forEach((number) => $('progress' + number).classList.toggle('active', number <= state.step));
    const titleKey = state.step === 1 ? 'stepContactTitle' : state.step === 2 ? 'stepLocationTitle' : 'stepWorkTitle';
    const subtitleKey = state.step === 1 ? 'stepContactSubtitle' : state.step === 2 ? 'stepLocationSubtitle' : 'stepWorkSubtitle';
    $('formStepTitle').textContent = t(titleKey);
    $('formStepSubtitle').textContent = t(subtitleKey);
    $('backButton').classList.toggle('hidden', state.step === 1);
    $('nextButton').textContent = state.step === 3 ? t('checkApplication') : t('continue');
    state.step = Math.min(3, Math.max(1, state.step));
  }

  function clearErrors() {
    document.querySelectorAll('.field-error').forEach((element) => { element.textContent = ''; });
    document.querySelectorAll('.invalid').forEach((element) => element.classList.remove('invalid'));
  }

  function showFieldError(id, message) {
    const input = $(id);
    const error = document.querySelector(`[data-error="${id}"]`);
    if (input) input.classList.add('invalid');
    if (error) error.textContent = message;
  }

  function validateStep(step) {
    clearErrors();
    const data = readForm();
    let valid = true;
    requiredByStep[step].forEach((id) => {
      const empty = id === 'consent' ? !data.consent : !String(data[id] || '').trim();
      if (empty) { showFieldError(id, t('required')); valid = false; }
    });
    if (step === 1) {
      const digits = data.phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) { showFieldError('phone', t('invalidPhone')); valid = false; }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(data.email)) { showFieldError('email', t('invalidEmail')); valid = false; }
    }
    if (step === 2) {
      const age = Number(data.age);
      if (!Number.isInteger(age) || age < 18 || age > 75) { showFieldError('age', t('invalidAge')); valid = false; }
    }
    if (!valid) {
      const first = $('step' + step).querySelector('.invalid');
      first?.focus();
    }
    state.data = data;
    saveDraft();
    return valid;
  }

  function localizedValue(field, code) {
    const group = selectMaps[field];
    if (!group) return code;
    return locale().options[group]?.[code] || I18N.locales.en.options[group]?.[code] || code;
  }

  function polishValue(field, code) {
    const group = selectMaps[field];
    if (!group) return code;
    return I18N.internal[group]?.[code] || code;
  }

  function fieldDisplayValue(field, data) {
    if (selectMaps[field]) return localizedValue(field, data[field]);
    return data[field] || '—';
  }

  function routeSource() {
    return route.source || 'brak';
  }

  function excelValues(data = state.data) {
    const recruiter = recruiterById();
    return [
      state.id,
      formattedWarsawDate(),
      state.language?.toUpperCase() || '',
      recruiter?.name || '',
      recruiter?.email || '',
      data.firstName,
      data.lastName,
      data.phone,
      polishValue('messenger', data.messenger),
      data.email,
      data.citizenship,
      data.country,
      data.city,
      data.age,
      polishValue('job', data.job),
      data.experience,
      polishValue('inPoland', data.inPoland),
      polishValue('documents', data.documents),
      polishValue('start', data.start),
      polishValue('shift', data.shift),
      polishValue('housing', data.housing),
      polishValue('source', data.source),
      routeSource(),
      route.campaign || '',
      route.vacancy || '',
      data.comment,
      'NOWY',
      '',
      '',
      '',
      ''
    ].map(cleanCell);
  }

  function excelRow(data = state.data) {
    return excelValues(data).join('\t');
  }

  function buildMessage(data = state.data) {
    const recruiter = recruiterById();
    const lines = [
      'NOWE ZGŁOSZENIE KANDYDATA',
      '',
      `ID zgłoszenia: ${state.id}`,
      `Data zgłoszenia: ${formattedWarsawDate()}`,
      `Język formularza: ${(state.language || '').toUpperCase()}`,
      `Rekruter: ${recruiter?.name || ''}`,
      `E-mail rekrutera: ${recruiter?.email || ''}`,
      `Źródło linku: ${routeSource()}`,
      `Kampania: ${route.campaign || 'brak'}`,
      `Wakacja / oferta: ${route.vacancy || 'brak'}`,
      '',
      '--- DANE KANDYDATA ---',
      '',
      `Imię: ${data.firstName}`,
      `Nazwisko: ${data.lastName}`,
      `Telefon: ${data.phone}`,
      `Komunikator: ${polishValue('messenger', data.messenger)}`,
      `E-mail kandydata: ${data.email || 'brak'}`,
      `Obywatelstwo: ${data.citizenship}`,
      `Kraj pobytu: ${data.country}`,
      `Miasto: ${data.city}`,
      `Wiek: ${data.age}`,
      '',
      '--- PRACA I DOKUMENTY ---',
      '',
      `Stanowisko: ${polishValue('job', data.job)}`,
      `Doświadczenie: ${data.experience || 'brak informacji'}`,
      `Obecnie w Polsce: ${polishValue('inPoland', data.inPoland)}`,
      `Dokumenty: ${polishValue('documents', data.documents)}`,
      `Gotowość do rozpoczęcia: ${polishValue('start', data.start)}`,
      `Praca zmianowa: ${polishValue('shift', data.shift)}`,
      `Zakwaterowanie: ${polishValue('housing', data.housing)}`,
      `Źródło deklarowane: ${polishValue('source', data.source)}`,
      `Komentarz: ${data.comment || 'brak'}`,
      '',
      '--- WIERSZ DO EXCEL (TSV) ---',
      'Skopiuj wyłącznie następny wiersz i wklej go do pierwszej pustej komórki w Excelu:',
      excelRow(data),
      '',
      'Status początkowy: NOWY',
      `Wersja formularza: ${CFG.version}`
    ];
    return lines.join('\n');
  }

  function emailSubject(data = state.data) {
    const recruiter = recruiterById();
    return `[REKRUTACJA] ${state.id} | ${data.firstName} ${data.lastName} | ${data.citizenship} | ${polishValue('job', data.job)} | ${recruiter?.name || ''}`.slice(0, 220);
  }

  function showReview() {
    state.data = readForm();
    const recruiter = recruiterById();
    if (!recruiter) { renderRecruiterScreen(); showScreen('recruiterScreen'); return; }
    $('reviewTitle').textContent = t('reviewTitle');
    $('reviewSubtitle').textContent = t('reviewSubtitle');
    $('reviewIdChip').textContent = state.id;
    $('reviewLanguageChip').textContent = `${I18N.languages[state.language].flag} ${I18N.languages[state.language].native}`;
    $('recipientLabel').textContent = t('recipient');
    $('recipientName').textContent = recruiter.name;
    $('recipientEmail').textContent = recruiter.email;
    $('recipientInfo').textContent = t('recruiterEmail');
    $('reviewChangeRecruiter').textContent = t('changeRecruiter');
    $('reviewList').innerHTML = reviewFields.map((field) => `
      <div class="review-row">
        <dt>${escapeHtml(t(field))}</dt>
        <dd class="${['phone', 'email'].includes(field) ? 'ltr-value' : ''}">${escapeHtml(fieldDisplayValue(field, state.data))}</dd>
      </div>`).join('');
    $('mailButton').textContent = `✉️ ${t('sendEmail')}`;
    $('copyButton').textContent = `📋 ${t('copyApplication')}`;
    $('shareButton').textContent = `📤 ${t('shareApplication')}`;
    $('downloadButton').textContent = `⬇️ ${t('downloadTxt')}`;
    $('editButton').textContent = t('edit');
    $('newButton').textContent = t('newApplication');
    $('otherOptionsSummary').textContent = t('otherOptions');
    const mailtoLength = buildMailto().length;
    $('mailNotice').textContent = mailtoLength > CFG.maxMailtoLength ? t('mailLong') : t('mailInfo');
    $('mailNotice').className = mailtoLength > CFG.maxMailtoLength ? 'notice warning' : 'notice';
    $('resultMessage').classList.add('hidden');
    [1, 2, 3, 4].forEach((number) => $('progress' + number).classList.add('active'));
    saveDraft();
    showScreen('reviewScreen');
  }

  function buildMailto() {
    const recruiter = recruiterById();
    return `mailto:${recruiter?.email || ''}?subject=${encodeURIComponent(emailSubject())}&body=${encodeURIComponent(buildMessage())}`;
  }

  function openEmail() {
    const recruiter = recruiterById();
    if (!recruiter) { renderRecruiterScreen(); showScreen('recruiterScreen'); return; }
    const button = $('mailButton');
    button.disabled = true;
    showResult(t('mailOpened'), 'success');
    window.location.href = buildMailto();
    window.setTimeout(() => { button.disabled = false; }, 1600);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.focus();
    area.select();
    document.execCommand('copy');
    area.remove();
  }

  function showResult(message, type = 'success') {
    $('resultMessage').textContent = message;
    $('resultMessage').className = `notice ${type}`;
  }

  async function copyApplication() {
    try { await copyText(buildMessage()); showResult(t('copied')); }
    catch { showResult(t('shareUnavailable'), 'error'); }
  }

  async function shareApplication() {
    if (navigator.share) {
      try {
        await navigator.share({ title: emailSubject(), text: buildMessage() });
        showResult(t('shared'));
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try { await copyText(buildMessage()); showResult(t('shareUnavailable')); }
    catch { showResult(t('shareUnavailable'), 'error'); }
  }

  function downloadTxt() {
    const content = [
      buildMessage(),
      '',
      '--- NAGŁÓWKI EXCEL ---',
      CFG.excelColumns.join('\t')
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${state.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => { URL.revokeObjectURL(anchor.href); anchor.remove(); }, 500);
    showResult(t('downloadReady'));
  }

  function resetApplication() {
    clearDraft();
    state = { id: createApplicationId(), createdAt: new Date().toISOString(), language: null, recruiterId: null, step: 1, data: emptyData() };
    writeForm(state.data);
    $('languageSearch').value = '';
    applyDocumentLanguage();
    renderLanguages();
    showScreen('languageScreen');
  }

  function resumeDraft(draft) {
    state = {
      id: draft.id,
      createdAt: draft.createdAt || new Date().toISOString(),
      language: draft.language || suggestedLanguage || 'en',
      recruiterId: draft.recruiterId || null,
      step: draft.step || 1,
      data: { ...emptyData(), ...draft.data }
    };
    applyDocumentLanguage();
    $('resumeBanner').classList.add('hidden');
    if (!state.recruiterId) {
      renderRecruiterScreen();
      showScreen('recruiterScreen');
      return;
    }
    renderFormText();
    writeForm(state.data);
    renderStep();
    showScreen('formScreen');
  }

  function renderInitialStaticText() {
    const initialLocale = I18N.locales.en;
    $('languageTitle').textContent = initialLocale.languageTitle;
    $('languageSubtitle').textContent = initialLocale.languageSubtitle;
    $('languageSearch').placeholder = initialLocale.languageSearch;
    $('trustPrivate').textContent = `🔒 ${initialLocale.trustPrivate}`;
    $('trustMobile').textContent = `📱 ${initialLocale.trustMobile}`;
    $('trustControl').textContent = `📨 ${initialLocale.trustControl}`;
  }

  function updateLanguageScreenText() {
    const L = locale(state.language || 'en');
    $('languageTitle').textContent = L.languageTitle;
    $('languageSubtitle').textContent = L.languageSubtitle;
    $('languageSearch').placeholder = L.languageSearch;
    $('trustPrivate').textContent = `🔒 ${L.trustPrivate}`;
    $('trustMobile').textContent = `📱 ${L.trustMobile}`;
    $('trustControl').textContent = `📨 ${L.trustControl}`;
  }

  function bindEvents() {
    $('languageSearch').addEventListener('input', (event) => renderLanguages(event.target.value));
    $('recruiterBackLanguage').addEventListener('click', () => { updateLanguageScreenText(); showScreen('languageScreen'); });
    $('changeLanguage').addEventListener('click', () => { state.data = readForm(); updateLanguageScreenText(); showScreen('languageScreen'); saveDraft(); });
    $('changeRecruiter').addEventListener('click', () => { state.data = readForm(); renderRecruiterScreen(); showScreen('recruiterScreen'); saveDraft(); });
    $('reviewChangeRecruiter').addEventListener('click', () => { renderRecruiterScreen(); showScreen('recruiterScreen'); });
    $('backButton').addEventListener('click', () => { if (state.step > 1) { state.data = readForm(); state.step -= 1; renderStep(); saveDraft(); } });
    $('nextButton').addEventListener('click', () => {
      if (!validateStep(state.step)) return;
      if (state.step < 3) { state.step += 1; renderStep(); saveDraft(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else showReview();
    });
    $('editButton').addEventListener('click', () => { state.step = 3; renderFormText(); writeForm(state.data); renderStep(); showScreen('formScreen'); });
    $('mailButton').addEventListener('click', openEmail);
    $('copyButton').addEventListener('click', copyApplication);
    $('shareButton').addEventListener('click', shareApplication);
    $('downloadButton').addEventListener('click', downloadTxt);
    $('newButton').addEventListener('click', resetApplication);
    $('candidateForm').addEventListener('input', () => { state.data = readForm(); saveDraft(); });
    $('candidateForm').addEventListener('change', () => { state.data = readForm(); saveDraft(); });
    $('resumeButton').addEventListener('click', () => { const draft = loadDraft(); if (draft) resumeDraft(draft); });
    $('discardButton').addEventListener('click', () => { $('resumeBanner').classList.add('hidden'); resetApplication(); });
  }

  function initialize() {
    renderInitialStaticText();
    renderLanguages();
    bindEvents();
    applyDocumentLanguage();
    const draft = loadDraft();
    if (draft) {
      const draftLocale = locale(draft.language || 'en');
      $('resumeText').textContent = draftLocale.draftFound;
      $('resumeButton').textContent = draftLocale.resumeDraft;
      $('discardButton').textContent = draftLocale.discardDraft;
      $('resumeBanner').classList.remove('hidden');
    }
  }

  initialize();
})();
