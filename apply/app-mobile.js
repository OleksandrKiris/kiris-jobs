(() => {
  'use strict';

  const CFG = window.RECRUITMENT_CONFIG;
  const I18N = window.RECRUITMENT_I18N;
  const EXTRA = window.RECRUITMENT_EXTRA_I18N;
  const MOBILE = window.RECRUITMENT_MOBILE_I18N || {};
  const app = document.getElementById('app');

  if (!CFG || !I18N || !EXTRA || !app) {
    throw new Error('Recruitment application dependencies are missing.');
  }

  const pageUrl = new URL(window.location.href);
  const params = CFG.queryParams;
  const route = Object.freeze({
    source: sanitizeRoute(pageUrl.searchParams.get(params.source)),
    campaign: sanitizeRoute(pageUrl.searchParams.get(params.campaign)),
    vacancy: sanitizeRoute(pageUrl.searchParams.get(params.vacancy)),
    partner: sanitizeRoute(pageUrl.searchParams.get(params.partner)),
    group: sanitizeRoute(pageUrl.searchParams.get(params.group))
  });

  const suggestedLanguage = validLanguage(pageUrl.searchParams.get(params.language));
  const suggestedRecruiter = validRecruiter(pageUrl.searchParams.get(params.recruiter));
  const suggestedLocation = validLocation(pageUrl.searchParams.get(params.location));
  const suggestedSource = normalizeSource(route.source);
  const routeContextKey = [
    suggestedRecruiter || '', suggestedLocation || '', suggestedSource || '',
    route.partner, route.group, route.campaign, route.vacancy
  ].join('|');

  const fieldNames = [
    'filledBy', 'representativeName', 'groupCode',
    'firstName', 'lastName', 'phone', 'messenger', 'email',
    'citizenship', 'country', 'city', 'age', 'inPoland', 'documents',
    'location', 'job', 'experience', 'start', 'shift', 'housing',
    'source', 'sourceDetails', 'comment', 'consent'
  ];

  let errors = {};
  let view = 'language';
  let savedDraft = loadDraft();
  let state = createState();

  initializeEntryPoint();

  function sanitizeRoute(value) {
    return String(value || '')
      .trim()
      .replace(/[^\p{L}\p{N}_.+\- /]/gu, '')
      .slice(0, 120);
  }

  function validLanguage(code) {
    const normalized = String(code || '').toLowerCase();
    return I18N.languages[normalized] ? normalized : null;
  }

  function validRecruiter(id) {
    const normalized = String(id || '').toLowerCase();
    return CFG.recruiters.some((item) => item.id === normalized) ? normalized : null;
  }

  function validLocation(id) {
    const normalized = String(id || '').toLowerCase();
    return CFG.locations.some((item) => item.id === normalized) ? normalized : null;
  }

  function normalizeSource(value) {
    const normalized = String(value || '').toLowerCase();
    const supported = ['facebook', 'instagram', 'tiktok', 'telegram', 'whatsapp', 'viber', 'referral', 'recruiter', 'other'];
    return supported.includes(normalized) ? normalized : '';
  }

  function blankData() {
    return Object.fromEntries(fieldNames.map((field) => [field, field === 'consent' ? false : '']));
  }

  function routeDefaults() {
    const data = blankData();
    const partnerMode = Boolean(route.partner || route.group);
    data.filledBy = partnerMode ? 'representative' : '';
    data.representativeName = route.partner;
    data.groupCode = route.group;
    data.location = suggestedLocation || '';
    data.source = suggestedSource || (partnerMode ? 'referral' : '');
    data.sourceDetails = route.partner || route.campaign || '';
    return data;
  }

  function createState() {
    return {
      version: CFG.version,
      contextKey: routeContextKey,
      id: createApplicationId(),
      createdAt: new Date().toISOString(),
      language: suggestedLanguage || null,
      recruiterId: suggestedRecruiter || null,
      step: 1,
      data: routeDefaults()
    };
  }

  function initializeEntryPoint() {
    if (savedDraft) {
      state = savedDraft;
      view = 'language';
      return;
    }
    if (state.language && state.recruiterId) view = 'form';
    else if (state.language) view = 'recruiter';
  }

  function merge(base, patch) {
    const result = Array.isArray(base) ? [...base] : { ...base };
    Object.entries(patch || {}).forEach(([key, value]) => {
      result[key] = value && typeof value === 'object' && !Array.isArray(value)
        ? merge(base?.[key] || {}, value)
        : value;
    });
    return result;
  }

  function coreLocale(code = state.language || 'en') {
    return merge(I18N.locales.en, I18N.locales[code] || {});
  }

  function extraLocale(code = state.language || 'en') {
    const extra = merge(EXTRA.locales.en || {}, EXTRA.locales[code] || {});
    const mobile = merge(MOBILE.en || {}, MOBILE[code] || {});
    return merge(extra, mobile);
  }

  function t(key) {
    return coreLocale()[key] ?? I18N.locales.en[key] ?? key;
  }

  function x(key) {
    return extraLocale()[key] ?? key;
  }

  function recruiter() {
    return CFG.recruiters.find((item) => item.id === state.recruiterId) || null;
  }

  function selectedLocation() {
    return CFG.locations.find((item) => item.id === state.data.location) || null;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function attr(value) {
    return escapeHtml(value);
  }

  function cleanText(value) {
    return String(value ?? '').replace(/\r\n?/g, '\n').trim();
  }

  function cleanCell(value, limit = 500) {
    const text = cleanText(value)
      .replace(/[\t\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, limit);
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
  }

  function normalizePhone(value) {
    const raw = String(value || '').trim();
    const digits = raw.replace(/\D/g, '');
    return `${raw.startsWith('+') ? '+' : ''}${digits}`;
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
    const parts = warsawParts();
    const random = window.crypto?.getRandomValues
      ? Array.from(window.crypto.getRandomValues(new Uint8Array(2)), (number) => number.toString(16).padStart(2, '0')).join('').toUpperCase()
      : Math.random().toString(16).slice(2, 6).toUpperCase();
    return `KAND-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}-${random}`;
  }

  function formatDate(value = state.createdAt) {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: CFG.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(value));
  }

  function slaDate() {
    const deadline = new Date(new Date(state.createdAt).getTime() + 24 * 60 * 60 * 1000);
    return formatDate(deadline.toISOString());
  }

  function saveDraft() {
    try {
      localStorage.setItem(CFG.storageKey, JSON.stringify({ ...state, savedAt: Date.now() }));
    } catch (error) {
      console.warn('Draft could not be saved.', error);
    }
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(CFG.storageKey));
      if (!draft || draft.version !== CFG.version || !draft.savedAt || !draft.id || !draft.data) return null;
      if (Date.now() - draft.savedAt > CFG.draftMaxAgeMs) {
        localStorage.removeItem(CFG.storageKey);
        return null;
      }
      if ((draft.contextKey || '') !== routeContextKey) return null;
      draft.language = validLanguage(draft.language);
      draft.recruiterId = validRecruiter(draft.recruiterId);
      draft.step = Math.min(4, Math.max(1, Number(draft.step) || 1));
      draft.data = { ...routeDefaults(), ...draft.data };
      draft.data.location = validLocation(draft.data.location) || '';
      draft.data.source = normalizeSource(draft.data.source);
      return draft;
    } catch {
      return null;
    }
  }

  function clearDraft() {
    try { localStorage.removeItem(CFG.storageKey); } catch { /* no-op */ }
    savedDraft = null;
  }

  function updateDocumentLanguage() {
    const code = state.language || 'en';
    const metadata = I18N.languages[code] || I18N.languages.en;
    document.documentElement.lang = code;
    document.documentElement.dir = metadata.direction || 'ltr';
    document.title = `${CFG.brand} — ${t('languageTitle')}`;
    document.getElementById('headerSubtitle').textContent = x('headerSubtitle');
    document.getElementById('privacyBadgeText').textContent = x('privacyBadge');
    document.getElementById('footerText').textContent = x('footerText');
    document.getElementById('footerPrivacyLink').textContent = t('privacyLink');
  }

  function render() {
    updateDocumentLanguage();
    if (view === 'language') renderLanguage();
    else if (view === 'recruiter') renderRecruiter();
    else if (view === 'form') renderForm();
    else renderReview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderLanguage(search = '') {
    const searchText = String(search).trim().toLocaleLowerCase();
    const preferred = suggestedLanguage || savedDraft?.language;
    const languages = Object.entries(I18N.languages)
      .filter(([code, meta]) => `${code} ${meta.native} ${meta.english}`.toLocaleLowerCase().includes(searchText))
      .sort(([a], [b]) => (a === preferred ? -1 : b === preferred ? 1 : 0));

    app.innerHTML = `
      <section class="card">
        <div class="hero compact-mobile-hero">
          <div class="hero-icon" aria-hidden="true">🌍</div>
          <h1>${escapeHtml(t('languageTitle'))}</h1>
          <p>${escapeHtml(x('languageIntro'))}</p>
        </div>
        <div class="trust-row compact-trust-row">
          <div class="trust-item">📱 ${escapeHtml(t('trustMobile'))}</div>
          <div class="trust-item">✉️ ${escapeHtml(t('trustControl'))}</div>
        </div>
        ${savedDraft ? `
          <div class="resume">
            <strong>${escapeHtml(x('resumeTitle'))}</strong>
            <div class="resume-actions">
              <button class="button small primary" type="button" data-action="resume">${escapeHtml(x('resume'))}</button>
              <button class="button small" type="button" data-action="discard">${escapeHtml(x('discard'))}</button>
            </div>
          </div>` : ''}
        <input class="search" id="languageSearch" type="search" autocomplete="off" enterkeyhint="search" placeholder="${attr(t('languageSearch'))}" value="${attr(search)}">
        <div class="language-grid fast-language-grid">
          ${languages.length ? languages.map(([code, meta]) => `
            <button class="language-card" type="button" data-language="${code}">
              <span class="language-flag" aria-hidden="true">${meta.flag}</span>
              <span><strong>${escapeHtml(meta.native)}</strong><small>${escapeHtml(meta.english)}</small></span>
              <span class="arrow" aria-hidden="true">›</span>
            </button>`).join('') : `<div class="empty-state">${escapeHtml(t('noLanguages'))}</div>`}
        </div>
      </section>`;

    document.getElementById('languageSearch').addEventListener('input', (event) => renderLanguage(event.target.value));
    app.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => {
      state.language = validLanguage(button.dataset.language) || 'en';
      view = state.recruiterId ? 'form' : 'recruiter';
      errors = {};
      saveDraft();
      render();
    }));
    app.querySelector('[data-action="resume"]')?.addEventListener('click', () => {
      state = savedDraft;
      view = state.language && state.recruiterId ? 'form' : state.language ? 'recruiter' : 'language';
      render();
    });
    app.querySelector('[data-action="discard"]')?.addEventListener('click', () => {
      clearDraft();
      state = createState();
      view = state.language && state.recruiterId ? 'form' : state.language ? 'recruiter' : 'language';
      render();
    });
  }

  function renderRecruiter() {
    const preferred = suggestedRecruiter || savedDraft?.recruiterId;
    const people = [...CFG.recruiters].sort((a, b) => (a.id === preferred ? -1 : b.id === preferred ? 1 : 0));

    app.innerHTML = `
      <section class="card">
        <button class="link-button" type="button" data-action="language">← ${escapeHtml(t('changeLanguage'))}</button>
        <div class="hero compact-mobile-hero">
          <div class="hero-icon" aria-hidden="true">👤</div>
          <h1>${escapeHtml(t('recruiterTitle'))}</h1>
          <p>${escapeHtml(x('recruiterIntro'))}</p>
        </div>
        <div class="recruiter-grid">
          ${people.map((person) => `
            <button class="recruiter-card" type="button" data-recruiter="${person.id}">
              ${person.id === suggestedRecruiter ? `<span class="suggested">${escapeHtml(t('suggested'))}</span>` : ''}
              <span class="avatar" aria-hidden="true">${escapeHtml(person.initials)}</span>
              <span><strong>${escapeHtml(person.name)}</strong><small class="ltr">${escapeHtml(person.email)}</small></span>
              <span class="arrow" aria-hidden="true">›</span>
            </button>`).join('')}
        </div>
      </section>`;

    app.querySelector('[data-action="language"]').addEventListener('click', () => { view = 'language'; render(); });
    app.querySelectorAll('[data-recruiter]').forEach((button) => button.addEventListener('click', () => {
      state.recruiterId = validRecruiter(button.dataset.recruiter);
      view = 'form';
      errors = {};
      saveDraft();
      render();
    }));
  }

  function optionLabel(group, value, language = state.language) {
    const locale = merge(I18N.locales.en, I18N.locales[language] || {});
    return locale.options?.[group]?.[value] || I18N.locales.en.options?.[group]?.[value] || value;
  }

  function polishOption(group, value) {
    return I18N.internal?.[group]?.[value] || I18N.locales.pl?.options?.[group]?.[value] || value;
  }

  function errorHtml(field) {
    return errors[field] ? `<div class="error" role="alert">${escapeHtml(errors[field])}</div>` : '';
  }

  function textField({ id, label, type = 'text', hint = '', placeholder = '', required = true, max = 120, autocomplete = '', full = false, inputmode = '', min = '', maxValue = '' }) {
    return `
      <div class="field ${full ? 'full' : ''}">
        <label for="${id}">${escapeHtml(label)}${required ? ' <span class="required">*</span>' : ''}</label>
        <input id="${id}" data-field="${id}" class="${errors[id] ? 'invalid' : ''} ${id === 'phone' || id === 'email' ? 'ltr' : ''}" type="${type}" maxlength="${max}" value="${attr(state.data[id])}" ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${inputmode ? `inputmode="${inputmode}"` : ''} ${placeholder ? `placeholder="${attr(placeholder)}"` : ''} ${min !== '' ? `min="${min}"` : ''} ${maxValue !== '' ? `max="${maxValue}"` : ''}>
        ${hint ? `<div class="hint">${escapeHtml(hint)}</div>` : ''}
        ${errorHtml(id)}
      </div>`;
  }

  function textareaField({ id, label, hint = '', max = 360 }) {
    return `
      <div class="field full">
        <label for="${id}">${escapeHtml(label)}</label>
        <textarea id="${id}" data-field="${id}" maxlength="${max}" class="${errors[id] ? 'invalid' : ''}">${escapeHtml(state.data[id])}</textarea>
        ${hint ? `<div class="hint">${escapeHtml(hint)}</div>` : ''}
        ${errorHtml(id)}
      </div>`;
  }

  function selectHtml(field, group) {
    const options = coreLocale().options?.[group] || I18N.locales.en.options[group];
    return `
      <select id="${field}" data-field="${field}" class="${errors[field] ? 'invalid' : ''}">
        <option value="">${escapeHtml(t('selectOption'))}</option>
        ${Object.entries(options).map(([value, label]) => `<option value="${attr(value)}" ${state.data[field] === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}
      </select>
      ${errorHtml(field)}`;
  }

  function choiceCard(field, value, icon, label) {
    const selected = state.data[field] === value;
    return `
      <label class="choice-card ${selected ? 'selected' : ''}">
        <input type="radio" name="${field}" data-field="${field}" value="${value}" ${selected ? 'checked' : ''}>
        <span class="choice-icon" aria-hidden="true">${icon}</span>
        <span>${escapeHtml(label)}</span>
      </label>`;
  }

  function partnerBadge() {
    if (state.data.filledBy !== 'representative') return '';
    const label = state.data.groupCode || state.data.representativeName || x('representative');
    return `<span class="chip partner-chip">🤝 ${escapeHtml(label)}</span>`;
  }

  function locationCards() {
    const items = [...CFG.locations].sort((a, b) => (a.id === suggestedLocation ? -1 : b.id === suggestedLocation ? 1 : 0));
    return `
      <div class="field full">
        <span class="fieldset-title">${escapeHtml(x('preferredLocation'))} <span class="required">*</span></span>
        <div class="hint">${escapeHtml(x('preferredLocationHint'))}</div>
        <div class="location-grid" style="margin-top:10px">
          ${items.map((item) => `
            <label class="location-card ${state.data.location === item.id ? 'selected' : ''}">
              <input type="radio" name="location" data-field="location" value="${item.id}" ${state.data.location === item.id ? 'checked' : ''}>
              ${item.id === suggestedLocation ? `<span class="suggested">${escapeHtml(x('suggestedLocation'))}</span>` : ''}
              <span class="location-check" aria-hidden="true">✓</span>
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(item.subtitle)} · ${escapeHtml(item.address)}</small>
            </label>`).join('')}
        </div>
        ${errorHtml('location')}
      </div>`;
  }

  function stepContent() {
    if (state.step === 1) {
      return `
        <div class="field full">
          <span class="fieldset-title">${escapeHtml(x('filledBy'))} <span class="required">*</span></span>
          <div class="choice-grid">
            ${choiceCard('filledBy', 'self', '👤', x('self'))}
            ${choiceCard('filledBy', 'representative', '🤝', x('representative'))}
          </div>
          ${errorHtml('filledBy')}
        </div>
        ${state.data.filledBy === 'representative' ? `
          <div class="partner-panel">
            <div class="panel-heading"><span aria-hidden="true">🤝</span><strong>${escapeHtml(x('partnerPanelTitle'))}</strong></div>
            ${textField({ id: 'representativeName', label: x('representativeName'), hint: x('representativeNameHint'), required: true, full: true, max: 160 })}
            ${textField({ id: 'groupCode', label: x('groupCode'), hint: x('groupCodeHint'), required: false, full: true, max: 80 })}
          </div>` : ''}
        <div class="form-grid">
          ${textField({ id: 'firstName', label: t('firstName'), autocomplete: 'given-name' })}
          ${textField({ id: 'lastName', label: t('lastName'), autocomplete: 'family-name' })}
          ${textField({ id: 'phone', label: t('phone'), hint: t('phoneHint'), placeholder: '+48… / +380… / +995…', type: 'tel', autocomplete: 'tel', inputmode: 'tel', max: 32 })}
          <div class="field"><label for="messenger">${escapeHtml(t('messenger'))} <span class="required">*</span></label>${selectHtml('messenger', 'messenger')}</div>
          ${textField({ id: 'email', label: t('email'), type: 'email', autocomplete: 'email', inputmode: 'email', required: false, full: true, max: 160 })}
        </div>`;
    }

    if (state.step === 2) {
      return `
        <div class="form-grid">
          ${textField({ id: 'citizenship', label: t('citizenship'), autocomplete: 'country-name' })}
          ${textField({ id: 'country', label: t('country'), autocomplete: 'country-name' })}
          ${textField({ id: 'city', label: t('city'), autocomplete: 'address-level2' })}
          ${textField({ id: 'age', label: t('age'), type: 'number', inputmode: 'numeric', max: 3, min: 18, maxValue: 75 })}
          <div class="field"><label for="inPoland">${escapeHtml(t('inPoland'))} <span class="required">*</span></label>${selectHtml('inPoland', 'yesNo')}</div>
          <div class="field"><label for="documents">${escapeHtml(t('documents'))} <span class="required">*</span></label>${selectHtml('documents', 'documents')}</div>
        </div>`;
    }

    if (state.step === 3) {
      return `
        ${locationCards()}
        <div class="form-grid" style="margin-top:15px">
          <div class="field full"><label for="job">${escapeHtml(t('job'))} <span class="required">*</span></label>${selectHtml('job', 'jobs')}</div>
          ${textareaField({ id: 'experience', label: t('experience'), hint: t('experienceHint'), max: 320 })}
          <div class="field"><label for="start">${escapeHtml(t('start'))} <span class="required">*</span></label>${selectHtml('start', 'starts')}</div>
          <div class="field"><label for="shift">${escapeHtml(t('shift'))} <span class="required">*</span></label>${selectHtml('shift', 'shifts')}</div>
          <div class="field full"><label for="housing">${escapeHtml(t('housing'))} <span class="required">*</span></label>${selectHtml('housing', 'yesNo')}</div>
        </div>`;
    }

    return `
      <div class="source-panel">
        <div class="panel-heading"><span aria-hidden="true">📣</span><strong>${escapeHtml(x('sourcePanelTitle'))}</strong></div>
        <div class="field full">
          <label for="source">${escapeHtml(t('source'))} <span class="required">*</span></label>
          ${selectHtml('source', 'sources')}
        </div>
        ${textField({ id: 'sourceDetails', label: x('sourceDetails'), hint: x('sourceDetailsHint'), placeholder: x('sourceDetailsPlaceholder'), required: true, full: true, max: 180 })}
      </div>
      <div class="form-grid">
        ${textareaField({ id: 'comment', label: t('comment'), max: 220 })}
        <div class="field full">
          <div class="checkbox-row">
            <input id="consent" data-field="consent" type="checkbox" ${state.data.consent ? 'checked' : ''}>
            <label for="consent">${escapeHtml(t('consentBefore'))} <a href="${attr(CFG.privacyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('privacyLink'))}</a>. <span class="required">*</span></label>
          </div>
          ${errorHtml('consent')}
        </div>
      </div>`;
  }

  function renderForm() {
    const person = recruiter();
    if (!state.language) { view = 'language'; render(); return; }
    if (!person) { view = 'recruiter'; render(); return; }

    const titles = [x('step1Title'), x('step2Title'), x('step3Title'), x('step4Title')];
    const subtitles = [x('step1Subtitle'), x('step2Subtitle'), x('step3Subtitle'), x('step4Subtitle')];
    const progress = state.step * 25;

    app.innerHTML = `
      <section class="card">
        <div class="topbar">
          <div class="chips">
            <span class="chip">${I18N.languages[state.language].flag} ${state.language.toUpperCase()}</span>
            ${partnerBadge()}
          </div>
          <div>
            <button class="link-button" type="button" data-action="language">🌍 ${escapeHtml(t('changeLanguage'))}</button>
            <button class="link-button" type="button" data-action="recruiter">👤 ${escapeHtml(t('changeRecruiter'))}</button>
          </div>
        </div>
        <div class="selected-recruiter">
          <span class="avatar">${escapeHtml(person.initials)}</span>
          <span><span class="selected-label">${escapeHtml(t('selectedRecruiter'))}</span><strong>${escapeHtml(person.name)}</strong><small class="ltr">${escapeHtml(person.email)}</small></span>
        </div>
        <div class="stepper">
          <div class="stepper-meta"><strong>${state.step} / 4</strong><span>${progress}%</span></div>
          <div class="progress"><div class="progress-fill" style="width:${progress}%"></div></div>
          <div class="step-labels">${titles.map((title, index) => `<span class="${index < state.step ? 'active' : ''}">${escapeHtml(title)}</span>`).join('')}</div>
        </div>
        <h1 class="screen-title">${escapeHtml(titles[state.step - 1])}</h1>
        <p class="screen-subtitle">${escapeHtml(subtitles[state.step - 1])}</p>
        <form id="candidateForm" novalidate>${stepContent()}</form>
        <div class="actions">
          <button class="button soft ${state.step === 1 ? 'hidden' : ''}" type="button" data-action="back">← ${escapeHtml(t('back'))}</button>
          <button class="button primary" type="button" data-action="next">${escapeHtml(state.step === 4 ? t('checkApplication') : t('continue'))} →</button>
        </div>
      </section>`;

    app.querySelector('[data-action="language"]').addEventListener('click', () => { view = 'language'; saveDraft(); render(); });
    app.querySelector('[data-action="recruiter"]').addEventListener('click', () => { view = 'recruiter'; saveDraft(); render(); });
    app.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      state.step = Math.max(1, state.step - 1);
      errors = {};
      saveDraft();
      render();
    });
    app.querySelector('[data-action="next"]').addEventListener('click', () => {
      if (!validateStep()) return;
      if (state.step < 4) {
        state.step += 1;
        errors = {};
        saveDraft();
        render();
      } else {
        view = 'review';
        errors = {};
        saveDraft();
        render();
      }
    });

    app.querySelectorAll('[data-field]').forEach((element) => {
      const eventName = element.type === 'radio' || element.type === 'checkbox' || element.tagName === 'SELECT' ? 'change' : 'input';
      element.addEventListener(eventName, () => {
        const field = element.dataset.field;
        state.data[field] = element.type === 'checkbox' ? element.checked : element.value;
        if (field === 'filledBy' && state.data.filledBy === 'self') {
          state.data.representativeName = '';
          state.data.groupCode = '';
        }
        delete errors[field];
        saveDraft();
        if (['filledBy', 'location'].includes(field)) renderForm();
      });
    });
  }

  function validateStep() {
    errors = {};
    const data = state.data;
    const requiredByStep = {
      1: ['filledBy', 'firstName', 'lastName', 'phone', 'messenger'],
      2: ['citizenship', 'country', 'city', 'age', 'inPoland', 'documents'],
      3: ['location', 'job', 'start', 'shift', 'housing'],
      4: ['source', 'sourceDetails', 'consent']
    };

    requiredByStep[state.step].forEach((field) => {
      const empty = field === 'consent' ? !data.consent : !cleanText(data[field]);
      if (empty) errors[field] = t('required');
    });

    if (state.step === 1) {
      if (data.filledBy === 'representative' && !cleanText(data.representativeName)) {
        errors.representativeName = t('required');
      }
      const normalized = normalizePhone(data.phone);
      if (!/^\+\d{7,15}$/.test(normalized)) errors.phone = t('invalidPhone');
      else data.phone = normalized;
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(data.email)) errors.email = t('invalidEmail');
    }

    if (state.step === 2) {
      const age = Number(data.age);
      if (!Number.isInteger(age) || age < 18 || age > 75) errors.age = t('invalidAge');
    }

    if (Object.keys(errors).length) {
      renderForm();
      const first = Object.keys(errors)[0];
      const target = app.querySelector(`[data-field="${first}"]`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    saveDraft();
    return true;
  }

  function display(field) {
    const value = state.data[field];
    if (!value && value !== false) return x('summaryEmpty');
    const groups = {
      messenger: 'messenger', inPoland: 'yesNo', documents: 'documents',
      job: 'jobs', start: 'starts', shift: 'shifts', housing: 'yesNo', source: 'sources'
    };
    if (field === 'filledBy') return value === 'representative' ? x('fillingRepresentative') : x('fillingSelf');
    if (field === 'location') return selectedLocation()?.name || value;
    if (field === 'consent') return value ? optionLabel('yesNo', 'yes') : optionLabel('yesNo', 'no');
    return groups[field] ? optionLabel(groups[field], value) : value;
  }

  function reviewItem(label, value) {
    return `<div class="review-item"><span class="review-label">${escapeHtml(label)}</span><span class="review-value">${escapeHtml(value || x('summaryEmpty'))}</span></div>`;
  }

  function reviewSection(title, items) {
    return `<section class="review-section"><h2>${escapeHtml(title)}</h2><div class="review-grid">${items.map(([label, value]) => reviewItem(label, value)).join('')}</div></section>`;
  }

  function renderReview() {
    const person = recruiter();
    if (!person) { view = 'recruiter'; render(); return; }

    const submission = [[x('filledBy'), display('filledBy')]];
    if (state.data.filledBy === 'representative') {
      submission.push([x('representativeName'), state.data.representativeName]);
      submission.push([x('groupCode'), state.data.groupCode || x('summaryEmpty')]);
    }
    submission.push([t('source'), display('source')]);
    submission.push([x('sourceDetails'), state.data.sourceDetails]);

    const candidate = [
      [t('firstName'), state.data.firstName], [t('lastName'), state.data.lastName],
      [t('citizenship'), state.data.citizenship], [t('country'), state.data.country],
      [t('city'), state.data.city], [t('age'), state.data.age],
      [t('inPoland'), display('inPoland')], [t('documents'), display('documents')]
    ];
    const contact = [
      [t('phone'), state.data.phone], [t('messenger'), display('messenger')],
      [t('email'), state.data.email || x('summaryEmpty')]
    ];
    const work = [
      [x('preferredLocation'), display('location')], [t('job'), display('job')],
      [t('experience'), state.data.experience || x('summaryEmpty')], [t('start'), display('start')],
      [t('shift'), display('shift')], [t('housing'), display('housing')],
      [t('comment'), state.data.comment || x('summaryEmpty')]
    ];

    app.innerHTML = `
      <section class="card">
        <div class="review-header">
          <div class="hero-icon" aria-hidden="true">✓</div>
          <h1 class="screen-title">${escapeHtml(t('reviewTitle'))}</h1>
          <p class="screen-subtitle">${escapeHtml(x('reviewIntro'))}</p>
        </div>
        <div class="recipient">
          <span class="avatar">${escapeHtml(person.initials)}</span>
          <span><strong>${escapeHtml(person.name)}</strong><small class="ltr">${escapeHtml(person.email)}</small></span>
          <span class="recipient-check" aria-hidden="true">✓</span>
        </div>
        <div class="review-sections">
          ${reviewSection(x('sectionSubmission'), submission)}
          ${reviewSection(x('sectionCandidate'), candidate)}
          ${reviewSection(x('sectionContact'), contact)}
          ${reviewSection(x('sectionWork'), work)}
        </div>
        <div class="email-guide"><strong>✉️ ${escapeHtml(x('sendButton'))}</strong><p>${escapeHtml(x('emailInstruction'))}</p></div>
        <div id="result" class="notice success hidden" style="margin-top:12px" aria-live="polite"></div>
        <div class="review-actions">
          <button class="button soft" type="button" data-action="edit">← ${escapeHtml(t('edit'))}</button>
          <button class="button primary send-button" type="button" data-action="send">${escapeHtml(x('sendButton'))}</button>
        </div>
        ${state.data.filledBy === 'representative' ? `
          <button class="button batch-button" type="button" data-action="next-candidate">＋ ${escapeHtml(x('nextCandidate'))}</button>
          <p class="batch-hint">${escapeHtml(x('nextCandidateHint'))}</p>` : ''}
        <div class="new-application-row"><button class="link-button" type="button" data-action="new">${escapeHtml(t('newApplication'))}</button></div>
      </section>`;

    app.querySelector('[data-action="edit"]').addEventListener('click', () => { view = 'form'; state.step = 4; render(); });
    app.querySelector('[data-action="new"]').addEventListener('click', startNew);
    app.querySelector('[data-action="send"]').addEventListener('click', openEmail);
    app.querySelector('[data-action="next-candidate"]')?.addEventListener('click', nextCandidateInGroup);
  }

  function filledByPolish() {
    return state.data.filledBy === 'representative' ? 'Przedstawiciel / partner' : 'Kandydat';
  }

  function locationPolish() {
    const item = selectedLocation();
    return item ? `${item.name} (${item.subtitle})` : '';
  }

  function excelValues(level = 'full') {
    const person = recruiter();
    const data = state.data;
    const limits = level === 'full'
      ? { representative: 120, group: 60, experience: 220, source: 160, comment: 180 }
      : level === 'compact'
        ? { representative: 80, group: 40, experience: 100, source: 90, comment: 80 }
        : { representative: 50, group: 30, experience: 45, source: 55, comment: 40 };

    const row = [
      state.id, formatDate(), slaDate(), (state.language || '').toUpperCase(), person?.name || '', person?.email || '',
      filledByPolish(), cleanCell(data.representativeName, limits.representative), cleanCell(data.groupCode, limits.group), locationPolish(),
      data.firstName, data.lastName, data.phone, polishOption('messenger', data.messenger), level === 'minimal' ? '' : data.email,
      data.citizenship, data.country, data.city, data.age, polishOption('yesNo', data.inPoland),
      polishOption('documents', data.documents), polishOption('jobs', data.job), cleanCell(data.experience, limits.experience),
      polishOption('starts', data.start), polishOption('shifts', data.shift), polishOption('yesNo', data.housing),
      polishOption('sources', data.source), cleanCell(data.sourceDetails, limits.source), route.source || '', route.campaign || '',
      route.vacancy || '', cleanCell(data.comment, limits.comment), 'NOWY', '', '0', '', '', '', '', ''
    ].map((value) => cleanCell(value));
    if (row.length !== CFG.excelColumns.length) throw new Error('Excel row does not match configured columns.');
    return row;
  }

  function emailRows(level = 'full') {
    const person = recruiter();
    const data = state.data;
    const optionalLimit = level === 'full' ? 180 : level === 'compact' ? 90 : 45;
    const rows = [
      ['ID zgłoszenia', state.id], ['Data zgłoszenia', formatDate()], ['SLA do', slaDate()],
      ['Rekruter', person?.name || ''], ['Preferowana lokalizacja', locationPolish()],
      ['Ankietę wypełnia', filledByPolish()]
    ];
    if (data.filledBy === 'representative') {
      rows.push(['Osoba / partner wypełniający', cleanCell(data.representativeName, optionalLimit)]);
      rows.push(['Kod grupy / partnera', cleanCell(data.groupCode, 45) || 'brak']);
    }
    rows.push(
      ['Imię i nazwisko', `${data.firstName} ${data.lastName}`], ['Telefon', data.phone],
      ['Komunikator', polishOption('messenger', data.messenger)],
      ['Obywatelstwo', data.citizenship], ['Kraj i miasto pobytu', `${data.country}, ${data.city}`], ['Wiek', data.age],
      ['Obecnie w Polsce', polishOption('yesNo', data.inPoland)], ['Dokument pobytowy', polishOption('documents', data.documents)],
      ['Stanowisko', polishOption('jobs', data.job)], ['Gotowość', polishOption('starts', data.start)],
      ['Praca zmianowa', polishOption('shifts', data.shift)], ['Zakwaterowanie', polishOption('yesNo', data.housing)],
      ['Źródło', polishOption('sources', data.source)], ['Kto polecił / dokładne źródło', cleanCell(data.sourceDetails, optionalLimit)]
    );
    if (level === 'full') {
      rows.push(['E-mail kandydata', data.email || 'brak']);
      rows.push(['Doświadczenie', cleanCell(data.experience, 180) || 'brak']);
      rows.push(['Komentarz', cleanCell(data.comment, 160) || 'brak']);
    }
    return rows;
  }

  function buildEmailBody(level = 'full') {
    const table = emailRows(level)
      .map(([label, value]) => `${cleanCell(label)}\t${cleanCell(value)}`)
      .join('\n');
    const values = excelValues(level).join('\t');
    return [
      'CITRONEX / PPO SIECHNICE — NOWE ZGŁOSZENIE KANDYDATA',
      '',
      'TABELA KANDYDATA',
      'Pole\tWartość',
      table,
      '',
      'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
      values,
      '',
      'Status początkowy: NOWY',
      `Wersja formularza: ${CFG.version}`
    ].join('\n');
  }

  function emailSubject() {
    const data = state.data;
    const partnerTag = data.filledBy === 'representative'
      ? `[PARTNER${data.groupCode ? ` ${cleanCell(data.groupCode, 24)}` : ''}]`
      : '';
    return `[NOWY KANDYDAT][${selectedLocation()?.name || 'LOKALIZACJA'}]${partnerTag} ${cleanCell(data.firstName, 40)} ${cleanCell(data.lastName, 50)} | ${cleanCell(data.citizenship, 45)} | ${recruiter()?.name || ''}`.slice(0, 220);
  }

  function mailtoFor(level) {
    const person = recruiter();
    return `mailto:${person?.email || ''}?subject=${encodeURIComponent(emailSubject())}&body=${encodeURIComponent(buildEmailBody(level))}`;
  }

  function buildMailto() {
    for (const level of ['full', 'compact', 'minimal']) {
      const url = mailtoFor(level);
      if (url.length <= CFG.maxMailtoLength || level === 'minimal') return url;
    }
    return mailtoFor('minimal');
  }

  function openEmail() {
    if (!recruiter()) { view = 'recruiter'; render(); return; }
    const result = document.getElementById('result');
    result.textContent = x('emailOpened');
    result.classList.remove('hidden');
    saveDraft();
    window.location.href = buildMailto();
  }

  function nextCandidateInGroup() {
    const previous = state;
    const next = createState();
    next.language = previous.language;
    next.recruiterId = previous.recruiterId;
    next.data.filledBy = 'representative';
    next.data.representativeName = previous.data.representativeName;
    next.data.groupCode = previous.data.groupCode;
    next.data.location = previous.data.location;
    next.data.job = previous.data.job;
    next.data.source = previous.data.source;
    next.data.sourceDetails = previous.data.sourceDetails;
    state = next;
    errors = {};
    view = 'form';
    clearDraft();
    saveDraft();
    render();
  }

  function startNew() {
    clearDraft();
    state = createState();
    errors = {};
    view = state.language && state.recruiterId ? 'form' : state.language ? 'recruiter' : 'language';
    render();
  }

  window.addEventListener('pagehide', saveDraft);
  updateDocumentLanguage();
  render();
})();
