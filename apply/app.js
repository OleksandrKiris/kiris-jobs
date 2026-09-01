(() => {
  'use strict';

  const CFG = window.RECRUITMENT_CONFIG;
  const I18N = window.RECRUITMENT_I18N;
  const DELIVERY = window.RECRUITMENT_DELIVERY_I18N;
  if (!CFG || !I18N || !DELIVERY) throw new Error('Recruitment configuration or translations are missing.');

  const $ = (id) => document.getElementById(id);
  const fieldIds = [
    'firstName', 'lastName', 'phone', 'messenger', 'email', 'citizenship',
    'country', 'city', 'age', 'inPoland', 'documents', 'job', 'workLocation',
    'experience', 'start', 'shift', 'housing', 'source', 'comment'
  ];
  const requiredByStep = {
    1: ['firstName', 'lastName', 'phone', 'messenger'],
    2: ['citizenship', 'country', 'city', 'age', 'inPoland', 'documents'],
    3: ['job', 'workLocation', 'start', 'shift', 'housing', 'source']
  };
  const selectMaps = {
    messenger: 'messenger',
    inPoland: 'yesNo',
    documents: 'documents',
    job: 'jobs',
    workLocation: 'locations',
    start: 'starts',
    shift: 'shifts',
    housing: 'yesNo',
    source: 'sources'
  };
  const reviewGroups = [
    { icon: '☎️', title: 'stepContactTitle', fields: ['firstName', 'lastName', 'phone', 'messenger', 'email'] },
    { icon: '📍', title: 'stepLocationTitle', fields: ['citizenship', 'country', 'city', 'age', 'inPoland', 'documents'] },
    { icon: '💼', title: 'stepWorkTitle', fields: ['job', 'workLocation', 'experience', 'start', 'shift', 'housing', 'source', 'comment'] }
  ];

  const url = new URL(window.location.href);
  const route = {
    source: sanitizeRoute(url.searchParams.get(CFG.queryParams.source)),
    campaign: sanitizeRoute(url.searchParams.get(CFG.queryParams.campaign)),
    vacancy: sanitizeRoute(url.searchParams.get(CFG.queryParams.vacancy))
  };
  const suggestedLanguage = validLanguage(url.searchParams.get(CFG.queryParams.language));
  const suggestedRecruiter = validRecruiterId(url.searchParams.get(CFG.queryParams.recruiter));
  const suggestedLocation = validLocationId(url.searchParams.get(CFG.queryParams.location));

  let selectedFiles = [];
  let filesLostAfterResume = false;
  let state = newState();

  function newState() {
    return {
      id: createApplicationId(),
      createdAt: new Date().toISOString(),
      submittedAt: '',
      language: null,
      recruiterId: null,
      step: 1,
      data: emptyData(),
      documentTypes: [],
      hadFiles: false,
      savedAt: Date.now()
    };
  }

  function emptyData() {
    return Object.fromEntries([
      ...fieldIds.map((id) => [id, '']),
      ['consent', false],
      ['documentConsent', false]
    ]);
  }

  function sanitizeRoute(value) {
    return String(value || '')
      .trim()
      .replace(/[^\p{L}\p{N}_.+\- /]/gu, '')
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

  function validLocationId(id) {
    const normalized = String(id || '').toLowerCase();
    return CFG.locations.some((item) => item.id === normalized) ? normalized : null;
  }

  function recruiterById(id = state.recruiterId) {
    return CFG.recruiters.find((item) => item.id === id) || null;
  }

  function locationById(id = state.data.workLocation) {
    return CFG.locations.find((item) => item.id === id) || null;
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

  function deliveryLocale(code = state.language) {
    return deepMerge(DELIVERY.locales.en, DELIVERY.locales[code] || {});
  }

  function t(key) {
    return locale()[key] ?? I18N.locales.en[key] ?? key;
  }

  function dt(key) {
    return deliveryLocale()[key] ?? DELIVERY.locales.en[key] ?? key;
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

  function formatWarsawDate(iso) {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: CFG.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(iso));
  }

  function submissionIso() {
    return state.submittedAt || state.createdAt;
  }

  function slaIso() {
    return new Date(new Date(submissionIso()).getTime() + CFG.slaHours * 60 * 60 * 1000).toISOString();
  }

  function normalizePhone(raw) {
    const input = String(raw || '').trim();
    const startsWithPlus = input.startsWith('+');
    const digits = input.replace(/\D/g, '');
    return `${startsWithPlus ? '+' : ''}${digits}`;
  }

  function cleanText(value) {
    return String(value ?? '').replace(/\r\n?/g, '\n').trim();
  }

  function singleLine(value) {
    return cleanText(value).replace(/[\t\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  function truncate(value, max = CFG.limits.mailLongText) {
    const text = singleLine(value);
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function readForm() {
    const data = {};
    fieldIds.forEach((id) => { data[id] = cleanText($(id)?.value); });
    data.phone = normalizePhone(data.phone);
    data.consent = Boolean($('consent')?.checked);
    data.documentConsent = Boolean($('documentConsent')?.checked);
    return data;
  }

  function readDocumentTypes() {
    return Array.from(document.querySelectorAll('[data-document-type]:checked'), (input) => input.value);
  }

  function writeForm(data) {
    fieldIds.forEach((id) => { if ($(id)) $(id).value = data?.[id] ?? ''; });
    if ($('consent')) $('consent').checked = Boolean(data?.consent);
    if ($('documentConsent')) $('documentConsent').checked = Boolean(data?.documentConsent);
    document.querySelectorAll('[data-document-type]').forEach((input) => {
      input.checked = state.documentTypes.includes(input.value);
    });
    updateDocumentConsentVisibility();
  }

  function saveDraft() {
    if ($('formScreen') && !$('formScreen').classList.contains('hidden')) {
      state.data = readForm();
      state.documentTypes = readDocumentTypes();
    }
    state.hadFiles = selectedFiles.length > 0 || state.hadFiles;
    state.savedAt = Date.now();
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
      if (Date.now() - Number(draft.savedAt || 0) > CFG.draftMaxAgeMs) {
        localStorage.removeItem(CFG.storageKey);
        return null;
      }
      draft.language = validLanguage(draft.language);
      draft.recruiterId = validRecruiterId(draft.recruiterId);
      draft.step = Math.min(4, Math.max(1, Number(draft.step) || 1));
      draft.documentTypes = Array.isArray(draft.documentTypes)
        ? draft.documentTypes.filter((id) => CFG.documentTypes.some((item) => item.id === id))
        : [];
      if (!validLocationId(draft.data.workLocation)) draft.data.workLocation = '';
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
    document.documentElement.lang = code;
    document.documentElement.dir = metadata.direction;
    document.title = `${CFG.brand} — ${t('languageTitle')}`;
    renderFooter();
  }

  function renderFooter() {
    $('footerPrivacy').textContent = dt('footerPrivacy');
    $('footerPrivacyLink').textContent = dt('footerPrivacyLink');
    $('footerPrivacyLink').href = CFG.privacyUrl;
  }

  function showScreen(screenId) {
    ['languageScreen', 'recruiterScreen', 'formScreen', 'reviewScreen'].forEach((id) => {
      $(id).classList.toggle('hidden', id !== screenId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      const heading = $(screenId)?.querySelector('h1, h2, input, button');
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
            <span class="language-copy"><strong>${escapeHtml(meta.native)}</strong><small>${escapeHtml(meta.english)} · ${code.toUpperCase()}</small></span>
            <span class="choice-arrow" aria-hidden="true">›</span>
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
      <button class="recruiter-button ${item.id === suggestedRecruiter ? 'recommended' : ''}" type="button" data-recruiter="${item.id}">
        <span class="recruiter-avatar" aria-hidden="true">${escapeHtml(item.initials)}</span>
        <span class="recruiter-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <small class="ltr-value">${escapeHtml(item.email)}</small>
          ${item.id === suggestedRecruiter ? `<em>${escapeHtml(t('suggested'))}</em>` : ''}
        </span>
        <span class="choice-arrow" aria-hidden="true">›</span>
      </button>`).join('');
    document.querySelectorAll('[data-recruiter]').forEach((button) => {
      button.addEventListener('click', () => chooseRecruiter(button.dataset.recruiter));
    });
  }

  function chooseRecruiter(id) {
    const recruiterId = validRecruiterId(id);
    if (!recruiterId) return;
    state.recruiterId = recruiterId;
    state.step = Math.min(4, Math.max(1, state.step || 1));
    if (!state.data.workLocation && suggestedLocation) state.data.workLocation = suggestedLocation;
    renderFormText();
    writeForm(state.data);
    renderStep();
    showScreen('formScreen');
    saveDraft();
  }

  function optionEntries(group) {
    return Object.entries(locale().options?.[group] || I18N.locales.en.options?.[group] || {});
  }

  function fillSelect(id, group) {
    const current = state.data[id] || $(id)?.value || '';
    $(id).innerHTML = `<option value="">${escapeHtml(t('selectOption'))}</option>` +
      optionEntries(group).map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
    $(id).value = current;
  }

  function renderDocumentTypes() {
    const labels = deliveryLocale().documentTypes || DELIVERY.locales.en.documentTypes;
    $('documentTypeGrid').innerHTML = CFG.documentTypes.map((item) => `
      <label class="document-option">
        <input type="checkbox" value="${item.id}" data-document-type ${state.documentTypes.includes(item.id) ? 'checked' : ''}>
        <span class="document-check" aria-hidden="true">✓</span>
        <span>${escapeHtml(labels[item.id] || item.internal)}</span>
      </label>`).join('');
    document.querySelectorAll('[data-document-type]').forEach((input) => {
      input.addEventListener('change', () => {
        if (input.value === 'noneYet' && input.checked) {
          if (selectedFiles.length) {
            input.checked = false;
            showFileError(dt('noneConflict'));
          } else {
            document.querySelectorAll('[data-document-type]').forEach((other) => {
              if (other !== input) other.checked = false;
            });
          }
        } else if (input.checked) {
          const none = document.querySelector('[data-document-type="noneYet"]');
          if (none) none.checked = false;
        }
        state.documentTypes = readDocumentTypes();
        clearDocumentTypeError();
        saveDraft();
      });
    });
  }

  function renderProgressLabels() {
    const labels = [t('progressContact'), t('progressLocation'), t('progressWork'), t('progressDocuments'), t('progressReview')];
    labels.forEach((label, index) => {
      const element = $(`progressLabel${index + 1}`);
      if (element) element.textContent = label;
    });
  }

  function renderSelectedRecruiter() {
    const recruiter = recruiterById();
    if (!recruiter) return;
    $('selectedRecruiterAvatar').textContent = recruiter.initials;
    $('selectedRecruiterLabel').textContent = t('selectedRecruiter');
    $('selectedRecruiterName').textContent = recruiter.name;
    $('selectedRecruiterEmail').textContent = recruiter.email;
    $('applicationIdChip').textContent = state.id;
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
    $('workLocationHint').textContent = t('workLocationHint');
    $('locationAvailability').textContent = t('locationAvailability');
    $('consentLabel').innerHTML = `${escapeHtml(t('consentBefore'))} <a href="${escapeHtml(CFG.privacyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('privacyLink'))}</a>. <span class="required-star" aria-hidden="true">*</span>`;
    $('documentConsentLabel').innerHTML = `${escapeHtml(dt('documentConsent'))} <span class="required-star" aria-hidden="true">*</span>`;
    $('changeLanguage').textContent = `🌍 ${t('changeLanguage')}`;
    $('changeRecruiter').textContent = `👤 ${t('changeRecruiter')}`;
    $('backButton').textContent = t('back');

    $('filePrivacyTitle').textContent = dt('filePrivacyTitle');
    $('filePrivacyText').textContent = dt('filePrivacyText');
    $('documentTypesLabel').innerHTML = `${escapeHtml(dt('documentTypesLabel'))} <span class="required-star" aria-hidden="true">*</span>`;
    $('documentTypesHint').textContent = dt('documentTypesHint');
    $('fileUploadLabel').textContent = dt('fileUploadLabel');
    $('uploadActionText').textContent = dt('fileUploadLabel');
    $('fileUploadHint').textContent = dt('fileUploadHint');
    $('selectedFilesTitle').textContent = dt('selectedFilesTitle');
    $('filesReloadNotice').textContent = dt('filesReloadNotice');
    $('filesReloadNotice').classList.toggle('hidden', !filesLostAfterResume && !state.hadFiles);

    fillSelect('messenger', 'messenger');
    fillSelect('inPoland', 'yesNo');
    fillSelect('documents', 'documents');
    fillSelect('job', 'jobs');
    fillSelect('workLocation', 'locations');
    fillSelect('start', 'starts');
    fillSelect('shift', 'shifts');
    fillSelect('housing', 'yesNo');
    fillSelect('source', 'sources');
    renderDocumentTypes();
    renderSelectedFiles();
    renderProgressLabels();
    renderSelectedRecruiter();
  }

  function renderStep() {
    [1, 2, 3, 4].forEach((number) => $('step' + number).classList.toggle('hidden', number !== state.step));
    [1, 2, 3, 4, 5].forEach((number) => {
      $(`progress${number}`).classList.toggle('active', number <= state.step);
      $(`progressLabel${number}`)?.classList.toggle('active', number === state.step);
    });
    const keys = {
      1: ['stepContactTitle', 'stepContactSubtitle'],
      2: ['stepLocationTitle', 'stepLocationSubtitle'],
      3: ['stepWorkTitle', 'stepWorkSubtitle']
    };
    if (state.step === 4) {
      $('formStepTitle').textContent = dt('stepDocumentsTitle');
      $('formStepSubtitle').textContent = dt('stepDocumentsSubtitle');
    } else {
      $('formStepTitle').textContent = t(keys[state.step][0]);
      $('formStepSubtitle').textContent = t(keys[state.step][1]);
    }
    $('stepCounter').textContent = `${state.step} / 4`;
    $('backButton').classList.toggle('hidden', state.step === 1);
    $('nextButton').textContent = state.step === 4 ? t('checkApplication') : t('continue');
    state.step = Math.min(4, Math.max(1, state.step));
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

  function clearDocumentTypeError() {
    const error = document.querySelector('[data-error="documentTypes"]');
    if (error) error.textContent = '';
  }

  function validateStep(step) {
    clearErrors();
    const data = readForm();
    let valid = true;

    (requiredByStep[step] || []).forEach((id) => {
      if (!String(data[id] || '').trim()) {
        showFieldError(id, t('required'));
        valid = false;
      }
    });

    if (step === 1) {
      const digits = data.phone.replace(/\D/g, '');
      if (!data.phone.startsWith('+') || digits.length < 7 || digits.length > 15) {
        showFieldError('phone', t('invalidPhone'));
        valid = false;
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(data.email)) {
        showFieldError('email', t('invalidEmail'));
        valid = false;
      }
    }

    if (step === 2) {
      const age = Number(data.age);
      if (!Number.isInteger(age) || age < 18 || age > 75) {
        showFieldError('age', t('invalidAge'));
        valid = false;
      }
    }

    if (step === 4) {
      const types = readDocumentTypes();
      const hasNone = types.includes('noneYet');
      if (!types.length) {
        showFieldError('documentTypes', dt('selectDocumentType'));
        valid = false;
      }
      if (hasNone && (types.length > 1 || selectedFiles.length > 0)) {
        showFieldError('documentTypes', dt('noneConflict'));
        valid = false;
      }
      if (!data.consent) {
        showFieldError('consent', t('required'));
        valid = false;
      }
      if (selectedFiles.length > 0 && !data.documentConsent) {
        showFieldError('documentConsent', t('required'));
        valid = false;
      }
      state.documentTypes = types;
    }

    if (!valid) {
      const current = $('step' + step);
      const first = current.querySelector('.invalid, .field-error:not(:empty)');
      const focusTarget = first?.matches('input, select, textarea, button')
        ? first
        : first?.closest('.field, fieldset')?.querySelector('input, select, textarea, button');
      focusTarget?.focus();
    }

    state.data = data;
    saveDraft();
    return valid;
  }

  function fileExtension(name) {
    return String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
  }

  function fileKey(file) {
    return `${file.name}::${file.size}::${file.lastModified}`;
  }

  function totalFileSize(files = selectedFiles) {
    return files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    const units = ['B', 'KB', 'MB', 'GB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / (1024 ** exponent);
    return `${value.toFixed(exponent === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[exponent]}`;
  }

  function showFileError(message) {
    $('fileError').textContent = message;
  }

  function clearFileError() {
    $('fileError').textContent = '';
  }

  function addFiles(fileList) {
    clearFileError();
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const existingKeys = new Set(selectedFiles.map(fileKey));
    const accepted = [];
    for (const file of incoming) {
      if (existingKeys.has(fileKey(file))) continue;
      const ext = fileExtension(file.name);
      if (!CFG.allowedExtensions.includes(ext)) {
        showFileError(`${dt('unsupportedFile')} ${file.name}`);
        continue;
      }
      if (file.size > CFG.maxFileBytes) {
        showFileError(`${dt('fileTooLarge')} ${file.name}`);
        continue;
      }
      accepted.push(file);
      existingKeys.add(fileKey(file));
    }

    if (selectedFiles.length + accepted.length > CFG.maxFiles) {
      showFileError(dt('tooManyFiles'));
      $('documentFiles').value = '';
      return;
    }
    if (totalFileSize([...selectedFiles, ...accepted]) > CFG.maxTotalFileBytes) {
      showFileError(dt('totalTooLarge'));
      $('documentFiles').value = '';
      return;
    }

    selectedFiles = [...selectedFiles, ...accepted];
    state.hadFiles = selectedFiles.length > 0;
    filesLostAfterResume = false;
    const none = document.querySelector('[data-document-type="noneYet"]');
    if (none?.checked) {
      none.checked = false;
      state.documentTypes = readDocumentTypes();
    }
    $('documentFiles').value = '';
    renderSelectedFiles();
    saveDraft();
  }

  function removeFile(index) {
    selectedFiles = selectedFiles.filter((_, fileIndex) => fileIndex !== index);
    state.hadFiles = selectedFiles.length > 0;
    if (!selectedFiles.length) state.data.documentConsent = false;
    renderSelectedFiles();
    saveDraft();
  }

  function updateDocumentConsentVisibility() {
    const field = $('documentConsentField');
    if (!field) return;
    field.classList.toggle('hidden', selectedFiles.length === 0);
    if (!selectedFiles.length) $('documentConsent').checked = false;
  }

  function renderSelectedFiles() {
    const hasFiles = selectedFiles.length > 0;
    $('selectedFilesPanel').classList.toggle('hidden', !hasFiles);
    $('selectedFilesSize').textContent = hasFiles ? `${selectedFiles.length} · ${formatBytes(totalFileSize())}` : '';
    $('selectedFilesList').innerHTML = selectedFiles.map((file, index) => `
      <li class="file-item">
        <span class="file-icon" aria-hidden="true">📄</span>
        <span class="file-main"><strong class="ltr-value">${escapeHtml(file.name)}</strong><small>${escapeHtml(formatBytes(file.size))}</small></span>
        <button class="remove-file" type="button" data-remove-file="${index}" aria-label="${escapeHtml(dt('removeFile'))}: ${escapeHtml(file.name)}">×</button>
      </li>`).join('');
    document.querySelectorAll('[data-remove-file]').forEach((button) => {
      button.addEventListener('click', () => removeFile(Number(button.dataset.removeFile)));
    });
    updateDocumentConsentVisibility();
  }

  function localizedValue(field, code) {
    const group = selectMaps[field];
    if (!group) return code;
    return locale().options?.[group]?.[code] || I18N.locales.en.options?.[group]?.[code] || code;
  }

  function polishValue(field, code) {
    const group = selectMaps[field];
    if (!group) return code;
    return I18N.internal?.[group]?.[code] || code;
  }

  function fieldDisplayValue(field, data = state.data) {
    if (selectMaps[field]) return localizedValue(field, data[field]);
    return data[field] || '—';
  }

  function routeSource() {
    return route.source || 'brak';
  }

  function documentTypeLabel(id, language = state.language) {
    return deliveryLocale(language).documentTypes?.[id]
      || DELIVERY.locales.en.documentTypes?.[id]
      || CFG.documentTypes.find((item) => item.id === id)?.internal
      || id;
  }

  function documentTypeInternal(id) {
    return CFG.documentTypes.find((item) => item.id === id)?.internal || id;
  }

  function spreadsheetSafe(value) {
    const clean = singleLine(value);
    return /^[=+\-@]/.test(clean) ? `'${clean}` : clean;
  }

  function excelValues({ concise = false } = {}) {
    const data = state.data;
    const recruiter = recruiterById();
    const experience = concise ? truncate(data.experience) : data.experience;
    const comment = concise ? truncate(data.comment) : data.comment;
    return [
      state.id,
      formatWarsawDate(submissionIso()),
      formatWarsawDate(slaIso()),
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
      polishValue('inPoland', data.inPoland),
      polishValue('documents', data.documents),
      polishValue('job', data.job),
      polishValue('workLocation', data.workLocation),
      experience,
      polishValue('start', data.start),
      polishValue('shift', data.shift),
      polishValue('housing', data.housing),
      polishValue('source', data.source),
      routeSource(),
      route.campaign || '',
      route.vacancy || '',
      comment,
      state.documentTypes.map(documentTypeInternal).join(' | '),
      selectedFiles.map((file) => file.name).join(' | '),
      selectedFiles.length,
      (totalFileSize() / (1024 * 1024)).toFixed(2),
      'NOWY',
      '', '', '', '', '', '', '', ''
    ].map(spreadsheetSafe);
  }

  function buildTsvRow(options) {
    return excelValues(options).join('\t');
  }

  function csvCell(value) {
    return `"${spreadsheetSafe(value).replace(/"/g, '""')}"`;
  }

  function buildCsv() {
    const rows = [CFG.excelColumns, excelValues()];
    return `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}\r\n`;
  }

  function emailSubject(data = state.data) {
    const recruiter = recruiterById();
    const location = polishValue('workLocation', data.workLocation);
    return `[NOWY KANDYDAT][${location.split('—')[0].trim()}] ${state.id} | ${data.firstName} ${data.lastName} | ${data.citizenship} | ${polishValue('job', data.job)} | ${recruiter?.name || ''}`.slice(0, 240);
  }

  function attachmentNames() {
    return selectedFiles.length ? selectedFiles.map((file) => file.name).join(', ') : 'brak plików';
  }

  function candidateRows({ concise = false } = {}) {
    const data = state.data;
    const recruiter = recruiterById();
    return [
      ['ID zgłoszenia', state.id],
      ['Data zgłoszenia', formatWarsawDate(submissionIso())],
      ['SLA — pierwszy kontakt do', formatWarsawDate(slaIso())],
      ['Status początkowy', 'NOWY'],
      ['Język formularza', (state.language || '').toUpperCase()],
      ['Rekruter', recruiter?.name || ''],
      ['E-mail rekrutera', recruiter?.email || ''],
      ['Imię', data.firstName],
      ['Nazwisko', data.lastName],
      ['Telefon', data.phone],
      ['Komunikator', polishValue('messenger', data.messenger)],
      ['E-mail kandydata', data.email || 'brak'],
      ['Obywatelstwo', data.citizenship],
      ['Kraj pobytu', data.country],
      ['Miasto', data.city],
      ['Wiek', data.age],
      ['Obecnie w Polsce', polishValue('inPoland', data.inPoland)],
      ['Dokumenty pobytowe / status', polishValue('documents', data.documents)],
      ['Stanowisko', polishValue('job', data.job)],
      ['Preferowana lokalizacja', polishValue('workLocation', data.workLocation)],
      ['Doświadczenie', concise ? truncate(data.experience) || 'brak informacji' : data.experience || 'brak informacji'],
      ['Gotowość do rozpoczęcia', polishValue('start', data.start)],
      ['Praca zmianowa', polishValue('shift', data.shift)],
      ['Zakwaterowanie', polishValue('housing', data.housing)],
      ['Źródło deklarowane', polishValue('source', data.source)],
      ['Źródło linku', routeSource()],
      ['Kampania', route.campaign || 'brak'],
      ['Wakacja / oferta', route.vacancy || 'brak'],
      ['Komentarz', concise ? truncate(data.comment) || 'brak' : data.comment || 'brak'],
      ['Rodzaje dokumentów', state.documentTypes.map(documentTypeInternal).join(' | ') || 'brak'],
      ['Nazwy załączników', attachmentNames()],
      ['Liczba załączników', String(selectedFiles.length)],
      ['Łączny rozmiar załączników', formatBytes(totalFileSize())]
    ];
  }

  function buildPlainMessage({ concise = false } = {}) {
    const recruiter = recruiterById();
    const rows = candidateRows({ concise });
    return [
      'CITRONEX / PPO SIECHNICE — NOWE ZGŁOSZENIE KANDYDATA',
      '',
      `ODBIORCA: ${recruiter?.name || ''} <${recruiter?.email || ''}>`,
      `STATUS: NOWY`,
      `SLA: pierwsza próba kontaktu do ${formatWarsawDate(slaIso())}`,
      '',
      'TABELA KANDYDATA — POLE / WARTOŚĆ',
      'Pole\tWartość',
      ...rows.map(([label, value]) => `${singleLine(label)}\t${singleLine(value)}`),
      '',
      'DOKUMENTY',
      selectedFiles.length
        ? 'Dokumenty powinny być dołączone do tej wiadomości. Lista znajduje się w tabeli powyżej.'
        : 'Kandydat nie wybrał plików. W razie potrzeby poproś o dokumenty w odpowiedzi.',
      '',
      'DANE DO EXCEL — SKOPIUJ TYLKO NASTĘPNY WIERSZ',
      buildTsvRow({ concise }),
      '',
      `Wersja formularza: ${CFG.version}`
    ].join('\n');
  }

  function htmlRow(label, value) {
    return `<tr><th style="padding:9px 12px;border:1px solid #d9e4de;background:#f4f8f6;text-align:left;vertical-align:top;width:35%;font:700 12px Arial,sans-serif;color:#52645b;">${escapeHtml(label)}</th><td style="padding:9px 12px;border:1px solid #d9e4de;text-align:left;vertical-align:top;font:14px Arial,sans-serif;color:#17211d;white-space:pre-wrap;">${escapeHtml(value || '—')}</td></tr>`;
  }

  function buildHtmlMessage() {
    const recruiter = recruiterById();
    const rows = candidateRows();
    const tsv = buildTsvRow();
    const fileList = selectedFiles.length
      ? `<ul style="margin:8px 0 0;padding-left:20px;">${selectedFiles.map((file) => `<li style="margin:4px 0;">${escapeHtml(file.name)} — ${escapeHtml(formatBytes(file.size))}</li>`).join('')}</ul>`
      : '<p style="margin:8px 0 0;">Brak plików dołączonych przez kandydata.</p>';
    return `<!doctype html><html><body style="margin:0;padding:22px;background:#eef4f0;color:#17211d;">
      <div style="max-width:860px;margin:0 auto;background:#ffffff;border:1px solid #d9e4de;border-radius:18px;overflow:hidden;font-family:Arial,sans-serif;">
        <div style="padding:22px 24px;background:linear-gradient(135deg,#075c39,#0b7a4b);color:#ffffff;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;opacity:.82;">Citronex / PPO Siechnice</div>
          <h1 style="margin:6px 0 0;font-size:24px;line-height:1.25;">Nowe zgłoszenie kandydata</h1>
          <p style="margin:9px 0 0;font-size:14px;opacity:.9;">${escapeHtml(state.id)} · ${escapeHtml(polishValue('workLocation', state.data.workLocation))}</p>
        </div>
        <div style="padding:20px 24px;">
          <div style="display:block;margin-bottom:16px;padding:14px 16px;border-radius:12px;background:#ecf8f1;border:1px solid #b8dfc8;color:#174c35;">
            <strong>Rekruter: ${escapeHtml(recruiter?.name || '')}</strong><br>
            <span>${escapeHtml(recruiter?.email || '')}</span><br>
            <span>SLA pierwszego kontaktu: <strong>${escapeHtml(formatWarsawDate(slaIso()))}</strong></span>
          </div>
          <h2 style="margin:0 0 10px;font-size:18px;color:#075c39;">Tabela kandydata</h2>
          <table role="presentation" style="width:100%;border-collapse:collapse;border-spacing:0;">${rows.map(([label, value]) => htmlRow(label, String(value ?? ''))).join('')}</table>
          <div style="margin-top:18px;padding:15px 16px;border-radius:12px;background:#f8faf9;border:1px solid #d9e4de;">
            <strong style="color:#075c39;">Załączniki</strong>${fileList}
          </div>
          <div style="margin-top:18px;padding:15px 16px;border-radius:12px;background:#fff8e8;border:1px solid #efd28d;">
            <strong style="display:block;margin-bottom:7px;color:#7a4b00;">DANE DO EXCEL — skopiuj tylko następny wiersz</strong>
            <div style="font:12px/1.5 Consolas,Monaco,monospace;white-space:pre-wrap;word-break:break-all;color:#3b352a;">${escapeHtml(tsv)}</div>
          </div>
          <p style="margin:16px 0 0;color:#738078;font-size:11px;">W załączniku znajduje się również plik CSV zgodny z kolejką rekrutacyjną. Wersja formularza ${escapeHtml(CFG.version)}.</p>
        </div>
      </div>
    </body></html>`;
  }

  function buildMailto() {
    const recruiter = recruiterById();
    return `mailto:${recruiter?.email || ''}?subject=${encodeURIComponent(emailSubject())}&body=${encodeURIComponent(buildPlainMessage({ concise: true }))}`;
  }

  function showResult(message, type = 'success') {
    $('resultMessage').textContent = message;
    $('resultMessage').className = `notice ${type}`;
  }

  function openEmail() {
    const recruiter = recruiterById();
    if (!recruiter) {
      renderRecruiterScreen();
      showScreen('recruiterScreen');
      return;
    }
    showResult(dt('mailOpened'), 'success');
    window.location.href = buildMailto();
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  }

  function utf8ToBase64(text) {
    return bytesToBase64(new TextEncoder().encode(String(text)));
  }

  function wrapBase64(value) {
    return String(value).replace(/.{1,76}/g, '$&\r\n').trimEnd();
  }

  function encodedHeader(value) {
    return `=?UTF-8?B?${utf8ToBase64(value)}?=`;
  }

  function fallbackFilename(name) {
    return String(name || 'attachment')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 110) || 'attachment';
  }

  function mimeTypeFor(file) {
    const ext = fileExtension(file.name);
    const known = {
      pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return file.type || known[ext] || 'application/octet-stream';
  }

  async function buildEml() {
    const recruiter = recruiterById();
    if (!recruiter) throw new Error('Recruiter missing.');
    const mixed = `mix_${state.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    const alternative = `alt_${Date.now()}`;
    const replyTo = state.data.email ? `Reply-To: ${state.data.email}` : '';
    const lines = [
      'MIME-Version: 1.0',
      'X-Unsent: 1',
      `To: ${encodedHeader(recruiter.name)} <${recruiter.email}>`,
      `Subject: ${encodedHeader(emailSubject())}`,
      ...(replyTo ? [replyTo] : []),
      `Date: ${new Date().toUTCString()}`,
      `Content-Type: multipart/mixed; boundary="${mixed}"`,
      '',
      `--${mixed}`,
      `Content-Type: multipart/alternative; boundary="${alternative}"`,
      '',
      `--${alternative}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(utf8ToBase64(buildPlainMessage())),
      '',
      `--${alternative}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(utf8ToBase64(buildHtmlMessage())),
      '',
      `--${alternative}--`,
      '',
      `--${mixed}`,
      `Content-Type: text/csv; charset="UTF-8"; name="${state.id}.csv"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${state.id}.csv"`,
      '',
      wrapBase64(utf8ToBase64(buildCsv())),
      ''
    ];

    for (const file of selectedFiles) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const fallback = fallbackFilename(file.name);
      lines.push(
        `--${mixed}`,
        `Content-Type: ${mimeTypeFor(file)}; name="${fallback}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        '',
        wrapBase64(bytesToBase64(bytes)),
        ''
      );
    }

    lines.push(`--${mixed}--`, '');
    return lines.join('\r\n');
  }

  async function prepareEml() {
    const button = $('prepareEmlButton');
    button.disabled = true;
    button.textContent = dt('emlBuilding');
    showResult(dt('emlBuilding'), 'success');
    try {
      const eml = await buildEml();
      const blob = new Blob([eml], { type: 'message/rfc822;charset=utf-8' });
      const anchor = document.createElement('a');
      const safeName = fallbackFilename(`${state.id}_${state.data.firstName}_${state.data.lastName}`);
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `${safeName}.eml`;
      document.body.appendChild(anchor);
      anchor.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(anchor.href);
        anchor.remove();
      }, 1500);
      showResult(dt('emlReady'), 'success');
    } catch (error) {
      console.error('EML generation failed.', error);
      showResult(dt('emlError'), 'error');
    } finally {
      button.disabled = false;
      button.textContent = `📎 ${dt('prepareEml')}`;
    }
  }

  function reviewSection(group) {
    return `<section class="review-section">
      <header><span aria-hidden="true">${group.icon}</span><h3>${escapeHtml(t(group.title))}</h3></header>
      <dl>${group.fields.map((field) => `
        <div class="review-row">
          <dt>${escapeHtml(t(field))}</dt>
          <dd class="${['phone', 'email'].includes(field) ? 'ltr-value' : ''}">${escapeHtml(fieldDisplayValue(field))}</dd>
        </div>`).join('')}</dl>
    </section>`;
  }

  function showReview() {
    state.data = readForm();
    state.documentTypes = readDocumentTypes();
    state.submittedAt = new Date().toISOString();
    const recruiter = recruiterById();
    if (!recruiter) {
      renderRecruiterScreen();
      showScreen('recruiterScreen');
      return;
    }

    $('reviewTitle').textContent = t('reviewTitle');
    $('reviewSubtitle').textContent = t('reviewSubtitle');
    $('reviewIdChip').textContent = state.id;
    $('reviewLanguageChip').textContent = `${I18N.languages[state.language].flag} ${I18N.languages[state.language].native}`;
    $('recipientLabel').textContent = t('recipient');
    $('recipientName').textContent = recruiter.name;
    $('recipientEmail').textContent = recruiter.email;
    $('recipientInfo').textContent = t('recruiterEmail');
    $('reviewChangeRecruiter').textContent = t('changeRecruiter');
    $('reviewList').innerHTML = reviewGroups.map(reviewSection).join('');

    $('reviewDocumentsTitle').textContent = dt('reviewDocumentsTitle');
    $('reviewDocumentTypes').innerHTML = state.documentTypes
      .map((id) => `<span class="chip">${escapeHtml(documentTypeLabel(id))}</span>`)
      .join('');
    $('reviewFileList').innerHTML = selectedFiles.length
      ? selectedFiles.map((file) => `<li class="ltr-value">📎 ${escapeHtml(file.name)} · ${escapeHtml(formatBytes(file.size))}</li>`).join('')
      : `<li>${escapeHtml(dt('noFilesSelected'))}</li>`;

    $('reviewSla').textContent = `SLA: ${formatWarsawDate(slaIso())}`;
    $('reviewLocation').textContent = polishValue('workLocation', state.data.workLocation);
    $('deliveryTitle').textContent = dt('deliveryTitle');
    $('deliverySubtitle').textContent = dt('deliverySubtitle');
    $('recommendedBadge').textContent = dt('recommended');
    $('emlTitle').textContent = dt('emlTitle');
    $('emlDescription').textContent = dt('emlDescription');
    $('emlSteps').innerHTML = (deliveryLocale().emlSteps || DELIVERY.locales.en.emlSteps).map((step) => `<li>${escapeHtml(step)}</li>`).join('');
    $('prepareEmlButton').textContent = `📎 ${dt('prepareEml')}`;
    $('mailtoTitle').textContent = dt('mailtoTitle');
    $('mailtoDescription').textContent = dt('mailtoDescription');
    $('mailtoSteps').innerHTML = (deliveryLocale().mailtoSteps || DELIVERY.locales.en.mailtoSteps).map((step) => `<li>${escapeHtml(step)}</li>`).join('');
    $('mailButton').textContent = `✉️ ${dt('openEmail')}`;
    $('editButton').textContent = t('edit');
    $('newButton').textContent = t('newApplication');

    const mailtoLength = buildMailto().length;
    $('mailNotice').textContent = mailtoLength > CFG.maxMailtoLength ? dt('mailLong') : dt('mailtoDescription');
    $('mailNotice').className = mailtoLength > CFG.maxMailtoLength ? 'notice warning' : 'notice';
    $('resultMessage').classList.add('hidden');
    [1, 2, 3, 4, 5].forEach((number) => {
      $(`progress${number}`).classList.add('active');
      $(`progressLabel${number}`)?.classList.toggle('active', number === 5);
    });
    saveDraft();
    showScreen('reviewScreen');
  }

  function resetApplication() {
    clearDraft();
    selectedFiles = [];
    filesLostAfterResume = false;
    state = newState();
    $('languageSearch').value = '';
    applyDocumentLanguage();
    renderLanguages();
    showScreen('languageScreen');
  }

  function resumeDraft(draft) {
    selectedFiles = [];
    filesLostAfterResume = Boolean(draft.hadFiles);
    state = {
      ...newState(),
      ...draft,
      data: { ...emptyData(), ...draft.data, documentConsent: false },
      documentTypes: draft.documentTypes || [],
      hadFiles: Boolean(draft.hadFiles),
      submittedAt: ''
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
    const initialDelivery = DELIVERY.locales.en;
    $('languageTitle').textContent = initialLocale.languageTitle;
    $('languageSubtitle').textContent = initialLocale.languageSubtitle;
    $('languageSearch').placeholder = initialLocale.languageSearch;
    $('trustPrivate').textContent = `🔒 ${initialDelivery.trustPrivate}`;
    $('trustMobile').textContent = `📱 ${initialLocale.trustMobile}`;
    $('trustControl').textContent = `📨 ${initialLocale.trustControl}`;
    renderFooter();
  }

  function updateLanguageScreenText() {
    const L = locale(state.language || 'en');
    $('languageTitle').textContent = L.languageTitle;
    $('languageSubtitle').textContent = L.languageSubtitle;
    $('languageSearch').placeholder = L.languageSearch;
    $('trustPrivate').textContent = `🔒 ${dt('trustPrivate')}`;
    $('trustMobile').textContent = `📱 ${L.trustMobile}`;
    $('trustControl').textContent = `📨 ${L.trustControl}`;
    renderFooter();
  }

  function bindEvents() {
    $('languageSearch').addEventListener('input', (event) => renderLanguages(event.target.value));
    $('recruiterBackLanguage').addEventListener('click', () => {
      updateLanguageScreenText();
      showScreen('languageScreen');
    });
    $('changeLanguage').addEventListener('click', () => {
      state.data = readForm();
      state.documentTypes = readDocumentTypes();
      updateLanguageScreenText();
      showScreen('languageScreen');
      saveDraft();
    });
    $('changeRecruiter').addEventListener('click', () => {
      state.data = readForm();
      state.documentTypes = readDocumentTypes();
      renderRecruiterScreen();
      showScreen('recruiterScreen');
      saveDraft();
    });
    $('reviewChangeRecruiter').addEventListener('click', () => {
      renderRecruiterScreen();
      showScreen('recruiterScreen');
    });
    $('backButton').addEventListener('click', () => {
      if (state.step > 1) {
        state.data = readForm();
        state.documentTypes = readDocumentTypes();
        state.step -= 1;
        renderStep();
        saveDraft();
      }
    });
    $('nextButton').addEventListener('click', () => {
      if (!validateStep(state.step)) return;
      if (state.step < 4) {
        state.step += 1;
        renderStep();
        saveDraft();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showReview();
      }
    });
    $('editButton').addEventListener('click', () => {
      state.step = 3;
      renderFormText();
      writeForm(state.data);
      renderStep();
      showScreen('formScreen');
    });
    $('prepareEmlButton').addEventListener('click', prepareEml);
    $('mailButton').addEventListener('click', openEmail);
    $('newButton').addEventListener('click', resetApplication);
    $('documentFiles').addEventListener('change', (event) => addFiles(event.target.files));
    $('candidateForm').addEventListener('input', (event) => {
      if (event.target?.type === 'file') return;
      state.data = readForm();
      saveDraft();
    });
    $('candidateForm').addEventListener('change', (event) => {
      if (event.target?.type === 'file') return;
      state.data = readForm();
      state.documentTypes = readDocumentTypes();
      saveDraft();
    });
    $('resumeButton').addEventListener('click', () => {
      const draft = loadDraft();
      if (draft) resumeDraft(draft);
    });
    $('discardButton').addEventListener('click', () => {
      $('resumeBanner').classList.add('hidden');
      resetApplication();
    });
  }

  function initialize() {
    renderInitialStaticText();
    renderLanguages();
    bindEvents();
    applyDocumentLanguage();
    const draft = loadDraft();
    if (draft) {
      const draftLocale = deepMerge(I18N.locales.en, I18N.locales[draft.language || 'en'] || {});
      $('resumeText').textContent = draftLocale.draftFound;
      $('resumeButton').textContent = draftLocale.resumeDraft;
      $('discardButton').textContent = draftLocale.discardDraft;
      $('resumeBanner').classList.remove('hidden');
    }
  }

  initialize();
})();
