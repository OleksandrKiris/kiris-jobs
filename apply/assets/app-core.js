'use strict';

const CFG = window.RECRUITMENT_CONFIG;
const CORE = window.RECRUITMENT_I18N;
const DELIVERY = window.RECRUITMENT_DELIVERY_I18N;
const app = document.getElementById('app');
if (!CFG || !CORE || !DELIVERY || !app) throw new Error('Recruitment application dependencies are missing.');
const EXTRA = window.RECRUITMENT_EXTRA_I18N || {};
const URL_OBJECT = new URL(window.location.href);
const route = {
  source: sanitizeRoute(URL_OBJECT.searchParams.get(CFG.queryParams.source)),
  campaign: sanitizeRoute(URL_OBJECT.searchParams.get(CFG.queryParams.campaign)),
  vacancy: sanitizeRoute(URL_OBJECT.searchParams.get(CFG.queryParams.vacancy))
};
const suggestedLanguage = validLanguage(URL_OBJECT.searchParams.get(CFG.queryParams.language));
const suggestedRecruiter = validRecruiter(URL_OBJECT.searchParams.get(CFG.queryParams.recruiter));
const suggestedLocation = validLocation(URL_OBJECT.searchParams.get(CFG.queryParams.location));
let files = [];
let screen = 'language';
let state = freshState();
let draft = readDraft();

function freshState() {
  return {
    id: makeApplicationId(), createdAt: new Date().toISOString(), language: null, recruiterId: null, step: 1,
    data: {
      firstName: '', lastName: '', phone: '', messenger: '', email: '', citizenship: '', country: '', city: '', age: '', inPoland: '', documents: '',
      preferredLocation: suggestedLocation || '', job: '', experience: '', start: '', shift: '', housing: '', source: '', comment: '',
      documentTypes: [], applicantConsent: false, documentConsent: false
    }
  };
}
function deepMerge(base, patch) {
  const result = Array.isArray(base) ? [...base] : { ...base };
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) result[key] = deepMerge(base?.[key] || {}, value);
    else result[key] = value;
  });
  return result;
}
function coreLocale(code = state.language || 'en') { return deepMerge(CORE.locales.en, CORE.locales[code] || {}); }
function deliveryLocale(code = state.language || 'en') { return deepMerge(DELIVERY.locales.en, DELIVERY.locales[code] || {}); }
function extraLocale(code = state.language || 'en') { return deepMerge(EXTRA.en, EXTRA[code] || {}); }
function t(key) { return coreLocale()[key] ?? key; }
function d(key) { return deliveryLocale()[key] ?? key; }
function x(key) { return extraLocale()[key] ?? key; }
function validLanguage(value) { const code = String(value || '').toLowerCase(); return CORE.languages[code] ? code : null; }
function validRecruiter(value) { const id = String(value || '').toLowerCase(); return CFG.recruiters.some((item) => item.id === id) ? id : null; }
function validLocation(value) { const id = String(value || '').toLowerCase(); return CFG.locations.some((item) => item.id === id) ? id : null; }
function recruiter() { return CFG.recruiters.find((item) => item.id === state.recruiterId) || null; }
function location() { return CFG.locations.find((item) => item.id === state.data.preferredLocation) || null; }
function sanitizeRoute(value) { return String(value || '').trim().replace(/[^\p{L}\p{N}_.+\- /]/gu, '').slice(0, 100); }
function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function normalizePhone(value) { const raw = String(value || '').trim(); const digits = raw.replace(/\D/g, ''); return `${raw.startsWith('+') ? '+' : ''}${digits}`; }
function cleanCell(value) { return String(value ?? '').replace(/[\t\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim(); }
function spreadsheetSafe(value) { const safe = cleanCell(value); return /^[=+\-@]/.test(safe) ? `'${safe}` : safe; }
function warsawParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: CFG.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  return Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}
function makeApplicationId() {
  const p = warsawParts();
  const bytes = window.crypto?.getRandomValues ? window.crypto.getRandomValues(new Uint8Array(2)) : [Math.random() * 255, Math.random() * 255];
  const suffix = Array.from(bytes, (n) => Math.floor(n).toString(16).padStart(2, '0')).join('').toUpperCase();
  return `KAND-${p.year}${p.month}${p.day}-${p.hour}${p.minute}${p.second}-${suffix}`;
}
function isoWarsawDate(date) { const p = warsawParts(date); return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`; }
function formatBytes(bytes) { if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`; return `${(bytes / 1024 / 1024).toFixed(2)} MB`; }
function saveDraft() {
  try { localStorage.setItem(CFG.storageKey, JSON.stringify({ ...state, savedAt: Date.now(), filesRemoved: true })); }
  catch (error) { console.warn('Draft save failed.', error); }
}
function readDraft() {
  try {
    const value = JSON.parse(localStorage.getItem(CFG.storageKey));
    if (!value || !value.id || !value.savedAt || Date.now() - value.savedAt > CFG.draftMaxAgeMs) { localStorage.removeItem(CFG.storageKey); return null; }
    value.language = validLanguage(value.language);
    value.recruiterId = validRecruiter(value.recruiterId);
    value.step = Math.max(1, Math.min(4, Number(value.step) || 1));
    value.data = { ...freshState().data, ...(value.data || {}), documentTypes: Array.isArray(value.data?.documentTypes) ? value.data.documentTypes : [] };
    return value;
  } catch { return null; }
}
function clearDraft() { try { localStorage.removeItem(CFG.storageKey); } catch {} draft = null; }
function applyLanguage() {
  const code = state.language || 'en';
  const meta = CORE.languages[code] || CORE.languages.en;
  document.documentElement.lang = code;
  document.documentElement.dir = meta.direction || 'ltr';
  document.getElementById('headerSubtitle').textContent = x('headerSubtitle');
  document.getElementById('privacyBadgeText').textContent = x('privacyBadge');
  document.getElementById('footerText').textContent = d('footerPrivacy');
  document.getElementById('footerPrivacyLink').textContent = d('footerPrivacyLink');
  document.title = `${CFG.brand} — ${x('headerSubtitle')}`;
}
function languageEntries(search = '') {
  const query = search.trim().toLocaleLowerCase();
  const preferred = suggestedLanguage || draft?.language;
  return Object.entries(CORE.languages).filter(([code, meta]) => !query || `${code} ${meta.native} ${meta.english}`.toLocaleLowerCase().includes(query)).sort(([a], [b]) => (a === preferred ? -1 : b === preferred ? 1 : 0));
}
function renderLanguage(search = '') {
  screen = 'language';
  const entries = languageEntries(search);
  app.innerHTML = `<section class="card landing-card" aria-labelledby="languageTitle"><div class="hero"><span class="hero-icon" aria-hidden="true">🌍</span><h1 id="languageTitle">${escapeHtml(CORE.locales.en.languageTitle)}</h1><p>${escapeHtml(CORE.locales.en.languageSubtitle)}</p><p class="hero-intro">${escapeHtml(x('heroIntro'))}</p></div>${draft ? `<div class="resume-card"><strong>${escapeHtml(x('resumeTitle'))}</strong><p>${escapeHtml(x('resumeText'))}</p><div class="compact-actions"><button class="button primary" type="button" id="resumeDraft">${escapeHtml(x('resume'))}</button><button class="button secondary" type="button" id="discardDraft">${escapeHtml(x('discard'))}</button></div></div>` : ''}<div class="trust-row"><div class="trust-item">🔒 ${escapeHtml(d('trustPrivate'))}</div><div class="trust-item">📱 ${escapeHtml(CORE.locales.en.trustMobile)}</div><div class="trust-item">✉️ ${escapeHtml(CORE.locales.en.trustControl)}</div></div><label class="sr-only" for="languageSearch">${escapeHtml(CORE.locales.en.languageSearch)}</label><input class="search-input" id="languageSearch" type="search" autocomplete="off" placeholder="${escapeHtml(CORE.locales.en.languageSearch)}" value="${escapeHtml(search)}"><div class="language-grid" id="languageGrid">${entries.map(([code, meta]) => `<button class="choice-card" type="button" data-language="${code}"><span class="choice-flag" aria-hidden="true">${meta.flag}</span><span class="choice-main"><span class="choice-title">${escapeHtml(meta.native)}</span><span class="choice-subtitle">${escapeHtml(meta.english)} · ${code.toUpperCase()}</span></span><span class="choice-arrow" aria-hidden="true">›</span></button>`).join('') || `<div class="empty-state">${escapeHtml(CORE.locales.en.noLanguages)}</div>`}</div></section>`;
  document.getElementById('languageSearch').addEventListener('input', (event) => renderLanguage(event.target.value));
  document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => { state.language = validLanguage(button.dataset.language) || 'en'; applyLanguage(); renderRecruiters(); saveDraft(); }));
  document.getElementById('resumeDraft')?.addEventListener('click', () => { state = draft; files = []; applyLanguage(); if (!state.language) renderLanguage(); else if (!state.recruiterId) renderRecruiters(); else renderForm(); });
  document.getElementById('discardDraft')?.addEventListener('click', () => { clearDraft(); state = freshState(); files = []; renderLanguage(); });
}
function renderRecruiters() {
  screen = 'recruiter'; applyLanguage();
  const preferred = suggestedRecruiter || draft?.recruiterId;
  const people = [...CFG.recruiters].sort((a, b) => (a.id === preferred ? -1 : b.id === preferred ? 1 : 0));
  app.innerHTML = `<section class="card landing-card" aria-labelledby="recruiterTitle"><button class="link-button back-link" type="button" id="backLanguage">← ${escapeHtml(t('changeLanguage'))}</button><div class="hero compact-hero"><span class="hero-icon" aria-hidden="true">👤</span><h1 id="recruiterTitle">${escapeHtml(t('recruiterTitle'))}</h1><p>${escapeHtml(t('recruiterSubtitle'))}</p></div><div class="notice info">${escapeHtml(t('recruiterRequired'))}</div><div class="recruiter-grid">${people.map((person) => `<button class="choice-card recruiter-choice ${person.id === suggestedRecruiter ? 'recommended' : ''}" type="button" data-recruiter="${person.id}"><span class="choice-avatar" aria-hidden="true">${escapeHtml(person.initials)}</span><span class="choice-main"><span class="choice-title">${escapeHtml(person.name)}</span><span class="choice-subtitle ltr-value">${escapeHtml(person.email)}</span>${person.id === suggestedRecruiter ? `<span class="recommendation">${escapeHtml(t('suggested'))}</span>` : ''}</span><span class="choice-arrow" aria-hidden="true">›</span></button>`).join('')}</div></section>`;
  document.getElementById('backLanguage').addEventListener('click', () => renderLanguage());
  document.querySelectorAll('[data-recruiter]').forEach((button) => button.addEventListener('click', () => { state.recruiterId = validRecruiter(button.dataset.recruiter); state.step = Math.max(1, state.step || 1); saveDraft(); renderForm(); }));
}
function stepLabels() { return [x('contactStep'), x('personalStep'), x('workStep'), x('documentsStep'), x('reviewStep')]; }
function progressHtml() {
  const labels = stepLabels(); const current = Math.min(5, state.step); const percent = current === 5 ? 100 : (current / 5) * 100;
  return `<div class="stepper"><div class="stepper-head"><span class="step-counter">${escapeHtml(x('currentStep'))} ${current} ${escapeHtml(x('of'))} 5</span><span class="step-percent">${Math.round(percent)}%</span></div><div class="progress"><span class="progress-fill" style="width:${percent}%"></span></div><div class="stepper-labels">${labels.map((label, index) => `<span class="${index + 1 <= current ? 'active' : ''}">${escapeHtml(label)}</span>`).join('')}</div></div>`;
}
function selectedRecruiterHtml() { const person = recruiter(); return person ? `<div class="selected-recruiter"><span class="choice-avatar" aria-hidden="true">${escapeHtml(person.initials)}</span><span><span class="selected-label">${escapeHtml(t('selectedRecruiter'))}</span><strong>${escapeHtml(person.name)}</strong><small class="ltr-value">${escapeHtml(person.email)}</small></span></div>` : ''; }
function fieldText(id, label, options = {}) {
  const value = state.data[id] || ''; const type = options.type || 'text';
  return `<div class="field ${options.full ? 'full' : ''}"><label for="${id}">${escapeHtml(label)}${options.optional ? ` <span class="optional">(${escapeHtml(x('optional'))})</span>` : ' <span class="required-mark">*</span>'}</label><input id="${id}" data-field="${id}" type="${type}" value="${escapeHtml(value)}" ${options.autocomplete ? `autocomplete="${options.autocomplete}"` : ''} ${options.inputmode ? `inputmode="${options.inputmode}"` : ''} maxlength="${options.maxlength || 120}" placeholder="${escapeHtml(options.placeholder || '')}"><div class="hint">${escapeHtml(options.hint || '')}</div><div class="error" data-error="${id}"></div></div>`;
}
function fieldTextarea(id, label, optional = true, hint = '') { return `<div class="field full"><label for="${id}">${escapeHtml(label)}${optional ? ` <span class="optional">(${escapeHtml(x('optional'))})</span>` : ' <span class="required-mark">*</span>'}</label><textarea id="${id}" data-field="${id}" maxlength="900">${escapeHtml(state.data[id] || '')}</textarea>${hint ? `<div class="hint">${escapeHtml(hint)}</div>` : ''}<div class="error" data-error="${id}"></div></div>`; }
function fieldSelect(id, label, group) {
  const options = coreLocale().options?.[group] || CORE.locales.en.options[group] || {};
  return `<div class="field"><label for="${id}">${escapeHtml(label)} <span class="required-mark">*</span></label><select id="${id}" data-field="${id}"><option value="">${escapeHtml(t('selectOption'))}</option>${Object.entries(options).map(([value, text]) => `<option value="${escapeHtml(value)}" ${state.data[id] === value ? 'selected' : ''}>${escapeHtml(text)}</option>`).join('')}</select><div class="error" data-error="${id}"></div></div>`;
}
function renderLocationCards() { return `<div class="field full"><span class="field-label">${escapeHtml(x('locationLabel'))} <span class="required-mark">*</span></span><div class="location-grid">${CFG.locations.map((item) => `<button class="location-card ${state.data.preferredLocation === item.id ? 'selected' : ''} ${item.id === suggestedLocation ? 'recommended' : ''}" type="button" data-location="${item.id}" aria-pressed="${state.data.preferredLocation === item.id}"><span class="location-pin" aria-hidden="true">${item.id === 'any' ? '✨' : '📍'}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(x(item.detailKey))}</small><em>${escapeHtml(item.address)}</em>${item.id === suggestedLocation ? `<span class="recommendation">${escapeHtml(x('locationFromLink'))}</span>` : ''}</span><span class="location-check" aria-hidden="true">${state.data.preferredLocation === item.id ? '✓' : '›'}</span></button>`).join('')}</div><div class="error" data-error="preferredLocation"></div></div>`; }
function renderDocumentTypes() {
  const labels = deliveryLocale().documentTypes || DELIVERY.locales.en.documentTypes;
  return `<div class="field full"><span class="field-label">${escapeHtml(d('documentTypesLabel'))} <span class="required-mark">*</span></span><div class="hint top-hint">${escapeHtml(d('documentTypesHint'))}</div><div class="document-grid">${CFG.documentTypes.map((item) => `<label class="document-option ${state.data.documentTypes.includes(item.id) ? 'selected' : ''}"><input type="checkbox" data-document-type="${item.id}" ${state.data.documentTypes.includes(item.id) ? 'checked' : ''}><span class="document-icon" aria-hidden="true">${documentIcon(item.id)}</span><span>${escapeHtml(labels[item.id] || item.id)}</span></label>`).join('')}</div><div class="error" data-error="documentTypes"></div></div>`;
}
function documentIcon(id) { return ({ passport: '🪪', visaResidence: '📄', peselUkr: '🇵🇱', workPermit: '✅', driver: '🚛', qualification: '🎓', cv: '📑', other: '📎', noneYet: '⏳' })[id] || '📄'; }
