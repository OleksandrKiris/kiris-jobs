(() => {
  'use strict';

  const CFG = window.CITRONEX_SIMPLE_CONFIG;
  const I18N = window.CITRONEX_SIMPLE_I18N;
  const app = document.getElementById('app');
  if (!CFG || !I18N || !app) throw new Error('Citronex form dependencies are missing.');

  const pageUrl = new URL(window.location.href);
  const qp = CFG.queryParams;
  const route = Object.freeze({
    source: cleanRoute(pageUrl.searchParams.get(qp.source)),
    campaign: cleanRoute(pageUrl.searchParams.get(qp.campaign)),
    vacancy: cleanRoute(pageUrl.searchParams.get(qp.vacancy)),
    partner: cleanRoute(pageUrl.searchParams.get(qp.partner)),
    group: cleanRoute(pageUrl.searchParams.get(qp.group))
  });
  const suggestedLanguage = validLanguage(pageUrl.searchParams.get(qp.language));
  const suggestedRecruiter = validRecruiter(pageUrl.searchParams.get(qp.recruiter));
  const suggestedLocation = validLocation(pageUrl.searchParams.get(qp.location));
  const suggestedSource = normalizeSource(route.source);
  const routeKey = [suggestedRecruiter, suggestedLocation, suggestedSource, route.partner, route.group, route.campaign, route.vacancy].join('|');

  const fieldNames = [
    'filledBy', 'representativeName', 'groupCode',
    'firstName', 'lastName', 'phone', 'messenger', 'email',
    'citizenship', 'country', 'city', 'age', 'inPoland', 'documents',
    'location', 'job', 'start', 'shift', 'housing',
    'source', 'sourceDetails', 'comment', 'consent'
  ];

  let view = 'language';
  let errors = {};
  let showAllLanguages = false;
  let savedDraft = loadDraft();
  let state = savedDraft || createState();
  let sending = false;

  cleanupLegacyServiceWorker();


  function cleanupLegacyServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    const rootPath = new URL('./', window.location.href).pathname;
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        const scopePath = new URL(registration.scope).pathname;
        if (scopePath === rootPath) registration.unregister().catch(() => {});
      }
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('citronex-recruitment-')).map((key) => caches.delete(key))
      )).catch(() => {});
    }
  }

  function blankData() {
    return Object.fromEntries(fieldNames.map((name) => [name, name === 'consent' ? false : '']));
  }

  function createState() {
    const data = blankData();
    const partnerMode = Boolean(route.partner || route.group);
    data.filledBy = partnerMode ? 'representative' : '';
    data.representativeName = route.partner;
    data.groupCode = route.group;
    data.location = suggestedLocation || '';
    data.source = suggestedSource || (partnerMode ? 'referral' : '');
    data.sourceDetails = route.partner || route.campaign || '';
    return {
      version: CFG.version,
      routeKey,
      id: createApplicationId(),
      language: suggestedLanguage || null,
      recruiterId: suggestedRecruiter || null,
      step: 1,
      data
    };
  }

  function locale(code = state.language || 'en') {
    return I18N.locales[code] || I18N.locales.en;
  }

  function t(key) {
    return locale()[key] ?? I18N.locales.en[key] ?? key;
  }

  function cleanRoute(value) {
    return String(value || '').trim().replace(/[^\p{L}\p{N}_.+\- /]/gu, '').slice(0, 120);
  }

  function cleanText(value) {
    return String(value ?? '').replace(/\r\n?/g, '\n').trim();
  }

  function cleanCell(value, limit = 240) {
    return cleanText(value).replace(/[\t\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, limit);
  }

  function excelCell(value, limit = 240) {
    const text = cleanCell(value, limit);
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
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

  function validLanguage(value) {
    const code = String(value || '').toLowerCase();
    return I18N.languages[code] ? code : null;
  }

  function validRecruiter(value) {
    const id = String(value || '').toLowerCase();
    return CFG.recruiters.some((person) => person.id === id) ? id : null;
  }

  function validLocation(value) {
    const id = String(value || '').toLowerCase();
    return CFG.locations.includes(id) ? id : null;
  }

  function normalizeSource(value) {
    const id = String(value || '').toLowerCase();
    return ['facebook', 'instagram', 'tiktok', 'telegram', 'whatsapp', 'viber', 'referral', 'recruiter', 'other'].includes(id) ? id : '';
  }

  function recruiter() {
    return CFG.recruiters.find((person) => person.id === state.recruiterId) || null;
  }

  function normalizePhone(value) {
    const source = String(value || '').trim();
    const digits = source.replace(/\D/g, '');
    return `${source.startsWith('+') ? '+' : ''}${digits}`;
  }

  function createApplicationId() {
    const parts = warsawParts(new Date());
    const random = window.crypto?.getRandomValues
      ? Array.from(window.crypto.getRandomValues(new Uint8Array(2)), (number) => number.toString(16).padStart(2, '0')).join('').toUpperCase()
      : Math.random().toString(16).slice(2, 6).toUpperCase();
    return `KAND-${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}-${random}`;
  }

  function warsawParts(date) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: CFG.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    return Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  }

  function formatDate(date) {
    const p = warsawParts(date);
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
  }

  function saveDraft() {
    try {
      localStorage.setItem(CFG.storageKey, JSON.stringify({ ...state, savedAt: Date.now() }));
    } catch (error) {
      console.warn('Draft save failed.', error);
    }
  }

  function loadDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(CFG.storageKey));
      if (!draft || draft.version !== CFG.version || !draft.id || !draft.data || !draft.savedAt) return null;
      if (Date.now() - draft.savedAt > CFG.draftMaxAgeMs || (draft.routeKey || '') !== routeKey) {
        localStorage.removeItem(CFG.storageKey);
        return null;
      }
      draft.language = validLanguage(draft.language);
      draft.recruiterId = validRecruiter(draft.recruiterId);
      draft.step = Math.max(1, Math.min(4, Number(draft.step) || 1));
      draft.data = { ...blankData(), ...draft.data };
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

  function updateDocument() {
    const code = state.language || 'en';
    const metadata = I18N.languages[code] || I18N.languages.en;
    document.documentElement.lang = code;
    document.documentElement.dir = metadata.direction || 'ltr';
    document.title = `${CFG.brand} — ${t('rowOnlyTitle')}`;
    document.getElementById('headerSubtitle').textContent = t('rowOnlyTitle');
    document.getElementById('headerNote').textContent = t('firstContact');
    document.getElementById('footerPdf').textContent = t('pdfOpen');
  }

  function render() {
    updateDocument();
    if (view === 'language') renderLanguage();
    else if (view === 'recruiter') renderRecruiter();
    else if (view === 'form') renderForm();
    else renderReview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function languageList(search = '') {
    const query = String(search).trim().toLocaleLowerCase();
    const entries = Object.entries(I18N.languages)
      .filter(([code, meta]) => !query || `${code} ${meta.native} ${meta.english}`.toLocaleLowerCase().includes(query));
    if (query || showAllLanguages) return entries.sort(([a], [b]) => {
      const ai = I18N.priority.includes(a) ? I18N.priority.indexOf(a) : 999;
      const bi = I18N.priority.includes(b) ? I18N.priority.indexOf(b) : 999;
      return ai - bi || a.localeCompare(b);
    });
    return entries.filter(([code]) => I18N.priority.includes(code));
  }

  function renderLanguage(search = '') {
    const entries = languageList(search);
    app.innerHTML = `
      <section class="panel opening-panel">
        <div class="opening-copy">
          <span class="eyebrow">CITRONEX · PPO SIECHNICE</span>
          <div class="opening-icon" aria-hidden="true">🌍</div>
          <h1>${escapeHtml(t('chooseLanguage'))}</h1>
          <p>${escapeHtml(t('languageLead'))}</p>
        </div>
        ${savedDraft ? `
          <div class="draft-box">
            <strong>${escapeHtml(t('draftFound'))}</strong>
            <div class="inline-actions">
              <button type="button" class="button small primary" data-action="resume">${escapeHtml(t('resumeDraft'))}</button>
              <button type="button" class="button small secondary" data-action="discard">${escapeHtml(t('discardDraft'))}</button>
            </div>
          </div>` : ''}
        <label class="sr-only" for="languageSearch">${escapeHtml(t('languageSearch'))}</label>
        <input id="languageSearch" class="search-input" type="search" autocomplete="off" enterkeyhint="search" placeholder="${attr(t('languageSearch'))}" value="${attr(search)}">
        <div class="language-grid">
          ${entries.map(([code, meta]) => `
            <button type="button" class="language-card ${code === suggestedLanguage ? 'suggested-card' : ''}" data-language="${code}">
              <span class="language-flag" aria-hidden="true">${meta.flag}</span>
              <span class="language-name"><strong>${escapeHtml(meta.native)}</strong><small>${escapeHtml(meta.english)}</small></span>
              <span class="language-code">${code.toUpperCase()}</span>
            </button>`).join('')}
        </div>
        ${!search ? `<button type="button" class="more-button" data-action="toggle-languages">${escapeHtml(showAllLanguages ? t('lessLanguages') : t('moreLanguages'))}</button>` : ''}
      </section>`;

    document.getElementById('languageSearch').addEventListener('input', (event) => renderLanguage(event.target.value));
    app.querySelector('[data-action="toggle-languages"]')?.addEventListener('click', () => {
      showAllLanguages = !showAllLanguages;
      renderLanguage();
    });
    app.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => {
      state.language = validLanguage(button.dataset.language) || 'en';
      errors = {};
      view = 'recruiter';
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
      render();
    });
  }

  function renderRecruiter() {
    const people = [...CFG.recruiters].sort((a, b) => (a.id === suggestedRecruiter ? -1 : b.id === suggestedRecruiter ? 1 : 0));
    app.innerHTML = `
      <section class="panel opening-panel">
        <button type="button" class="text-button back-top" data-action="language">← ${escapeHtml(t('changeLanguage'))}</button>
        <div class="opening-copy compact">
          <div class="opening-icon" aria-hidden="true">👤</div>
          <h1>${escapeHtml(t('chooseRecruiter'))}</h1>
          <p>${escapeHtml(t('recruiterLead'))}</p>
        </div>
        <div class="info-strip">${escapeHtml(t('chooseOneRecruiter'))}</div>
        <div class="recruiter-list">
          ${people.map((person) => `
            <button type="button" class="recruiter-card ${person.id === suggestedRecruiter ? 'suggested-card' : ''}" data-recruiter="${person.id}">
              <span class="avatar" aria-hidden="true">${escapeHtml(person.initials)}</span>
              <span class="recruiter-copy">
                <strong>${escapeHtml(person.name)}</strong>
                <small class="ltr">${escapeHtml(person.email)}</small>
                <small class="phone ltr">${escapeHtml(person.phone)}</small>
              </span>
              <span class="card-arrow" aria-hidden="true">›</span>
            </button>`).join('')}
        </div>
      </section>`;
    app.querySelector('[data-action="language"]').addEventListener('click', () => { view = 'language'; render(); });
    app.querySelectorAll('[data-recruiter]').forEach((button) => button.addEventListener('click', () => {
      state.recruiterId = validRecruiter(button.dataset.recruiter);
      state.step = Math.max(1, state.step || 1);
      errors = {};
      view = 'form';
      saveDraft();
      render();
    }));
  }

  function selectedRecruiterHtml() {
    const person = recruiter();
    if (!person) return '';
    return `
      <div class="selected-recruiter">
        <span class="avatar compact-avatar">${escapeHtml(person.initials)}</span>
        <span class="selected-copy"><small>${escapeHtml(t('selectedRecruiter'))}</small><strong>${escapeHtml(person.name)}</strong><span class="ltr">${escapeHtml(person.phone)}</span></span>
      </div>`;
  }

  function textField({ id, label, type = 'text', required = true, hint = '', placeholder = '', autocomplete = '', inputmode = '', full = false, max = 120, min = '', maxValue = '' }) {
    return `
      <div class="field ${full ? 'full' : ''}">
        <label for="${id}">${escapeHtml(label)}${required ? ' <span class="required">*</span>' : ` <span class="optional">(${escapeHtml(t('optional'))})</span>`}</label>
        <input id="${id}" data-field="${id}" class="${errors[id] ? 'invalid' : ''} ${['phone', 'email'].includes(id) ? 'ltr' : ''}" type="${type}" value="${attr(state.data[id])}" maxlength="${max}" enterkeyhint="next" ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${inputmode ? `inputmode="${inputmode}"` : ''} ${placeholder ? `placeholder="${attr(placeholder)}"` : ''} ${min !== '' ? `min="${min}"` : ''} ${maxValue !== '' ? `max="${maxValue}"` : ''}>
        ${hint ? `<small class="field-hint">${escapeHtml(hint)}</small>` : ''}
        ${errorHtml(id)}
      </div>`;
  }

  function textareaField(id, label, max = 220) {
    return `
      <div class="field full">
        <label for="${id}">${escapeHtml(label)} <span class="optional">(${escapeHtml(t('optional'))})</span></label>
        <textarea id="${id}" data-field="${id}" maxlength="${max}" class="${errors[id] ? 'invalid' : ''}">${escapeHtml(state.data[id])}</textarea>
        ${errorHtml(id)}
      </div>`;
  }

  function selectField(id, label, group, full = false) {
    const options = locale().options[group] || I18N.locales.en.options[group];
    return `
      <div class="field ${full ? 'full' : ''}">
        <label for="${id}">${escapeHtml(label)} <span class="required">*</span></label>
        <select id="${id}" data-field="${id}" class="${errors[id] ? 'invalid' : ''}">
          <option value="">${escapeHtml(t('selectOption'))}</option>
          ${Object.entries(options).map(([value, labelText]) => `<option value="${attr(value)}" ${state.data[id] === value ? 'selected' : ''}>${escapeHtml(labelText)}</option>`).join('')}
        </select>
        ${errorHtml(id)}
      </div>`;
  }

  function choiceCards(field, options, icons, columns = 'two') {
    return `
      <div class="choice-grid ${columns}">
        ${Object.entries(options).map(([value, label]) => `
          <label class="choice-card ${state.data[field] === value ? 'selected' : ''}">
            <input type="radio" name="${field}" data-field="${field}" value="${attr(value)}" ${state.data[field] === value ? 'checked' : ''}>
            <span class="choice-icon" aria-hidden="true">${icons[value] || '•'}</span>
            <span>${escapeHtml(label)}</span>
            <span class="choice-check" aria-hidden="true">✓</span>
          </label>`).join('')}
      </div>
      ${errorHtml(field)}`;
  }

  function errorHtml(id) {
    return errors[id] ? `<div class="field-error" role="alert">${escapeHtml(errors[id])}</div>` : '';
  }

  function stepContent() {
    const options = locale().options;
    if (state.step === 1) {
      return `
        <div class="field full">
          <span class="field-label">${escapeHtml(t('filledBy'))} <span class="required">*</span></span>
          ${choiceCards('filledBy', { self: t('self'), representative: t('representative') }, { self: '👤', representative: '🤝' })}
        </div>
        ${state.data.filledBy === 'representative' ? `
          <div class="partner-box">
            ${textField({ id: 'representativeName', label: t('representativeName'), hint: t('representativeHint'), full: true, max: 160 })}
            ${textField({ id: 'groupCode', label: t('groupCode'), hint: t('groupHint'), required: false, full: true, max: 80 })}
          </div>` : ''}
        <div class="form-grid">
          ${textField({ id: 'firstName', label: t('firstName'), autocomplete: 'given-name' })}
          ${textField({ id: 'lastName', label: t('lastName'), autocomplete: 'family-name' })}
          ${textField({ id: 'phone', label: t('phone'), hint: t('phoneHint'), type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '+48… / +380… / +995…', max: 32 })}
          ${selectField('messenger', t('messenger'), 'messenger')}
          ${textField({ id: 'email', label: t('email'), type: 'email', inputmode: 'email', autocomplete: 'email', required: false, full: true, max: 160 })}
        </div>`;
    }
    if (state.step === 2) {
      return `
        <div class="form-grid">
          ${textField({ id: 'citizenship', label: t('citizenship'), autocomplete: 'country-name' })}
          ${textField({ id: 'country', label: t('country'), autocomplete: 'country-name' })}
          ${textField({ id: 'city', label: t('city'), autocomplete: 'address-level2' })}
          ${textField({ id: 'age', label: t('age'), type: 'number', inputmode: 'numeric', min: 18, maxValue: 75, max: 3 })}
          <div class="field full"><span class="field-label">${escapeHtml(t('inPoland'))} <span class="required">*</span></span>${choiceCards('inPoland', options.yesNo, { yes: '✓', no: '×' })}</div>
          ${selectField('documents', t('documents'), 'documents', true)}
        </div>`;
    }
    if (state.step === 3) {
      return `
        <div class="form-grid">
          ${selectField('location', t('location'), 'locations', true)}
          ${selectField('job', t('job'), 'jobs', true)}
          ${selectField('start', t('start'), 'starts')}
          <div class="field"><span class="field-label">${escapeHtml(t('shift'))} <span class="required">*</span></span>${choiceCards('shift', options.shifts, { yes: '✓', no: '×', depends: '≈' }, 'one')}</div>
          <div class="field full"><span class="field-label">${escapeHtml(t('housing'))} <span class="required">*</span></span>${choiceCards('housing', options.yesNo, { yes: '⌂', no: '—' })}</div>
        </div>`;
    }
    return `
      <div class="field full">
        <span class="field-label">${escapeHtml(t('source'))} <span class="required">*</span></span>
        ${choiceCards('source', options.sources, { facebook: 'f', instagram: '◎', tiktok: '♪', telegram: '➤', whatsapp: 'WA', viber: 'VI', referral: '🤝', recruiter: '👤', other: '+' }, 'three')}
      </div>
      <div class="form-grid">
        ${textField({ id: 'sourceDetails', label: t('sourceDetails'), hint: t('sourceDetailsHint'), placeholder: t('sourceDetailsPlaceholder'), full: true, max: 180 })}
        ${textareaField('comment', t('comment'))}
        <div class="field full">
          <label class="consent-box" for="consent">
            <input id="consent" data-field="consent" type="checkbox" ${state.data.consent ? 'checked' : ''}>
            <span>${escapeHtml(t('consent'))} <a href="${attr(CFG.privacyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('privacyLink'))}</a>. <span class="required">*</span></span>
          </label>
          ${errorHtml('consent')}
        </div>
      </div>`;
  }

  function renderForm() {
    if (!state.language) { view = 'language'; render(); return; }
    if (!recruiter()) { view = 'recruiter'; render(); return; }
    const titles = [t('step1Title'), t('step2Title'), t('step3Title'), t('step4Title')];
    const leads = [t('step1Lead'), t('step2Lead'), t('step3Lead'), t('step4Lead')];
    app.innerHTML = `
      <section class="panel form-panel">
        <div class="form-topbar">
          <span class="language-pill">${I18N.languages[state.language].flag} ${state.language.toUpperCase()}</span>
          <div><button type="button" class="text-button" data-action="language">${escapeHtml(t('changeLanguage'))}</button><button type="button" class="text-button" data-action="recruiter">${escapeHtml(t('changeRecruiter'))}</button></div>
        </div>
        ${selectedRecruiterHtml()}
        <div class="progress-box">
          <div class="progress-meta"><strong>${state.step} / 4</strong><span>${escapeHtml(titles[state.step - 1])}</span></div>
          <div class="progress-track"><span class="progress-fill progress-${state.step}"></span></div>
        </div>
        <div class="step-heading"><span class="step-number">${state.step}</span><div><h1>${escapeHtml(titles[state.step - 1])}</h1><p>${escapeHtml(leads[state.step - 1])}</p></div></div>
        <form id="candidateForm" novalidate>${stepContent()}</form>
        <div class="sticky-actions">
          <button type="button" class="button secondary ${state.step === 1 ? 'invisible' : ''}" data-action="back">← ${escapeHtml(t('back'))}</button>
          <button type="button" class="button primary" data-action="next">${escapeHtml(state.step === 4 ? t('review') : t('next'))} →</button>
        </div>
      </section>`;

    app.querySelector('[data-action="language"]').addEventListener('click', () => { view = 'language'; saveDraft(); render(); });
    app.querySelector('[data-action="recruiter"]').addEventListener('click', () => { view = 'recruiter'; saveDraft(); render(); });
    app.querySelector('[data-action="back"]')?.addEventListener('click', () => { state.step = Math.max(1, state.step - 1); errors = {}; saveDraft(); render(); });
    app.querySelector('[data-action="next"]').addEventListener('click', () => {
      if (!validateStep()) return;
      if (state.step < 4) { state.step += 1; errors = {}; saveDraft(); render(); }
      else { view = 'review'; errors = {}; saveDraft(); render(); }
    });
    app.querySelectorAll('[data-field]').forEach((element) => {
      const eventName = ['radio', 'checkbox'].includes(element.type) || element.tagName === 'SELECT' ? 'change' : 'input';
      element.addEventListener(eventName, () => {
        const field = element.dataset.field;
        state.data[field] = element.type === 'checkbox' ? element.checked : element.value;
        if (field === 'filledBy' && state.data.filledBy === 'self') {
          state.data.representativeName = '';
          state.data.groupCode = '';
        }
        delete errors[field];
        saveDraft();
        if (field === 'filledBy') renderForm();
      });
    });
  }

  function validateStep() {
    errors = {};
    const requiredByStep = {
      1: ['filledBy', 'firstName', 'lastName', 'phone', 'messenger'],
      2: ['citizenship', 'country', 'city', 'age', 'inPoland', 'documents'],
      3: ['location', 'job', 'start', 'shift', 'housing'],
      4: ['source', 'sourceDetails', 'consent']
    };
    requiredByStep[state.step].forEach((field) => {
      const empty = field === 'consent' ? !state.data.consent : !cleanText(state.data[field]);
      if (empty) errors[field] = t('required');
    });
    if (state.step === 1) {
      if (state.data.filledBy === 'representative' && !cleanText(state.data.representativeName)) errors.representativeName = t('required');
      const phone = normalizePhone(state.data.phone);
      if (!/^\+\d{7,15}$/.test(phone)) errors.phone = t('invalidPhone');
      else state.data.phone = phone;
      if (state.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(state.data.email)) errors.email = t('invalidEmail');
    }
    if (state.step === 2) {
      const age = Number(state.data.age);
      if (!Number.isInteger(age) || age < 18 || age > 75) errors.age = t('invalidAge');
    }
    if (Object.keys(errors).length) {
      renderForm();
      const first = Object.keys(errors)[0];
      app.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    saveDraft();
    return true;
  }

  function display(field) {
    const value = state.data[field];
    if (!value && value !== false) return t('noValue');
    const groups = { messenger: 'messenger', inPoland: 'yesNo', documents: 'documents', location: 'locations', job: 'jobs', start: 'starts', shift: 'shifts', housing: 'yesNo', source: 'sources' };
    if (field === 'filledBy') return value === 'representative' ? t('representative') : t('self');
    return groups[field] ? locale().options[groups[field]]?.[value] || value : value;
  }

  function reviewSection(title, items) {
    return `<section class="review-section"><h2>${escapeHtml(title)}</h2><div class="review-grid">${items.map(([label, value]) => `<div class="review-item"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value || t('noValue'))}</strong></div>`).join('')}</div></section>`;
  }

  function renderReview() {
    const person = recruiter();
    if (!person) { view = 'recruiter'; render(); return; }
    const submission = [[t('filledBy'), display('filledBy')]];
    if (state.data.filledBy === 'representative') {
      submission.push([t('representativeName'), state.data.representativeName]);
      submission.push([t('groupCode'), state.data.groupCode || t('noValue')]);
    }
    submission.push([t('source'), display('source')], [t('sourceDetails'), state.data.sourceDetails]);
    const candidate = [[t('firstName'), state.data.firstName], [t('lastName'), state.data.lastName], [t('citizenship'), state.data.citizenship], [t('country'), state.data.country], [t('city'), state.data.city], [t('age'), state.data.age], [t('inPoland'), display('inPoland')], [t('documents'), display('documents')]];
    const contact = [[t('phone'), state.data.phone], [t('messenger'), display('messenger')], [t('email'), state.data.email || t('noValue')]];
    const work = [[t('location'), display('location')], [t('job'), display('job')], [t('start'), display('start')], [t('shift'), display('shift')], [t('housing'), display('housing')], [t('comment'), state.data.comment || t('noValue')]];
    app.innerHTML = `
      <section class="panel review-panel">
        <div class="review-heading"><span class="success-icon" aria-hidden="true">✓</span><div><h1>${escapeHtml(t('reviewTitle'))}</h1><p>${escapeHtml(t('reviewLead'))}</p></div></div>
        <div class="recipient-card"><span class="avatar">${escapeHtml(person.initials)}</span><span><small>${escapeHtml(t('selectedRecruiter'))}</small><strong>${escapeHtml(person.name)}</strong><em class="ltr">${escapeHtml(person.email)} · ${escapeHtml(person.phone)}</em></span></div>
        <div class="review-sections">
          ${reviewSection(t('sectionSubmission'), submission)}
          ${reviewSection(t('sectionCandidate'), candidate)}
          ${reviewSection(t('sectionContact'), contact)}
          ${reviewSection(t('sectionWork'), work)}
        </div>
        <div class="send-box">
          <div class="send-icon" aria-hidden="true">✉</div>
          <div><h2>${escapeHtml(t('sendRow'))}</h2><p>${escapeHtml(t('sendHint'))}</p></div>
          <button type="button" class="button primary send-button" data-action="send">${escapeHtml(t('sendRow'))}</button>
          <div id="sendResult" class="send-result hidden" aria-live="polite"></div>
        </div>
        <a class="pdf-card" href="${attr(CFG.pdfGeneratorUrl)}" target="_blank" rel="noopener noreferrer">
          <span class="pdf-icon" aria-hidden="true">PDF</span><span><strong>${escapeHtml(t('pdfTitle'))}</strong><small>${escapeHtml(t('pdfLead'))}</small></span><b>${escapeHtml(t('pdfOpen'))} →</b>
        </a>
        <div class="review-actions"><button type="button" class="button secondary" data-action="edit">← ${escapeHtml(t('edit'))}</button><button type="button" class="text-button" data-action="new">${escapeHtml(t('newApplication'))}</button></div>
      </section>`;
    app.querySelector('[data-action="edit"]').addEventListener('click', () => { state.step = 4; view = 'form'; render(); });
    app.querySelector('[data-action="new"]').addEventListener('click', startNew);
    app.querySelector('[data-action="send"]').addEventListener('click', sendRow);
  }

  function polishOption(group, value) {
    return I18N.internal[group]?.[value] || value || '';
  }

  function filledByPolish() {
    return state.data.filledBy === 'representative' ? 'Przedstawiciel / partner' : 'Kandydat';
  }

  function rowValues(sentAt, level = 'full') {
    const person = recruiter();
    const data = state.data;
    const deadline = new Date(sentAt.getTime() + 24 * 60 * 60 * 1000);
    const limits = level === 'full'
      ? { partner: 100, group: 60, source: 140, comment: 120 }
      : level === 'compact'
        ? { partner: 60, group: 35, source: 80, comment: 60 }
        : { partner: 35, group: 24, source: 45, comment: 30 };
    const values = [
      state.id, formatDate(sentAt), formatDate(deadline), (state.language || 'en').toUpperCase(), person.name, person.email,
      filledByPolish(), cleanCell(data.representativeName, limits.partner), cleanCell(data.groupCode, limits.group),
      polishOption('locations', data.location), data.firstName, data.lastName, data.phone, polishOption('messenger', data.messenger), data.email,
      data.citizenship, data.country, data.city, data.age, polishOption('yesNo', data.inPoland), polishOption('documents', data.documents),
      polishOption('jobs', data.job), '', polishOption('starts', data.start), polishOption('shifts', data.shift), polishOption('yesNo', data.housing),
      polishOption('sources', data.source), cleanCell(data.sourceDetails, limits.source), route.source, route.campaign, route.vacancy,
      cleanCell(data.comment, limits.comment), 'NOWY', '', '0', '', '', '', '', ''
    ].map((value) => excelCell(value));
    if (values.length !== CFG.excelColumns.length) throw new Error(`Excel row mismatch: ${values.length}/${CFG.excelColumns.length}`);
    return values;
  }

  function mailtoFor(sentAt, level) {
    const person = recruiter();
    const row = rowValues(sentAt, level).join('\t');
    const subject = `[NOWY KANDYDAT] ${cleanCell(state.data.firstName, 35)} ${cleanCell(state.data.lastName, 45)} | ${polishOption('locations', state.data.location)} | ${person.name}`.slice(0, 220);
    const body = `DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A\n\n${row}`;
    return `mailto:${encodeURIComponent(person.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function sendRow() {
    if (sending || !recruiter()) return;
    sending = true;
    const button = app.querySelector('[data-action="send"]');
    button.disabled = true;
    const sentAt = new Date();
    let mailto = mailtoFor(sentAt, 'full');
    if (mailto.length > CFG.maxMailtoLength) mailto = mailtoFor(sentAt, 'compact');
    if (mailto.length > CFG.maxMailtoLength) mailto = mailtoFor(sentAt, 'minimal');
    const result = document.getElementById('sendResult');
    result.textContent = t('emailOpened');
    result.classList.remove('hidden');
    saveDraft();
    window.setTimeout(() => { sending = false; button.disabled = false; }, 2500);
    window.location.assign(mailto);
  }

  function startNew() {
    clearDraft();
    state = createState();
    errors = {};
    view = 'language';
    render();
  }

  window.addEventListener('pagehide', saveDraft);
  render();
})();
