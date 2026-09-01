'use strict';

function renderFilePicker() {
  const fileList = files.length ? `<div class="file-list">${files.map((file, index) => `<div class="file-item"><span><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)}</small></span><button class="file-remove" type="button" data-remove-file="${index}">${escapeHtml(d('removeFile'))}</button></div>`).join('')}</div>` : `<div class="empty-state">${escapeHtml(d('noFilesSelected'))}</div>`;
  return `<div class="field full"><span class="field-label">${escapeHtml(d('fileUploadLabel'))}</span><div class="file-picker"><input id="documentFiles" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx"><strong>＋ ${escapeHtml(d('fileUploadLabel'))}</strong><span>${escapeHtml(d('fileUploadHint'))}</span></div><div class="notice privacy"><strong>${escapeHtml(d('filePrivacyTitle'))}</strong><span>${escapeHtml(d('filePrivacyText'))}</span></div><h3 class="subheading">${escapeHtml(d('selectedFilesTitle'))}</h3>${fileList}<div class="hint">${escapeHtml(d('filesReloadNotice'))}</div><div class="error" data-error="files"></div></div>`;
}

function renderStepContent() {
  if (state.step === 1) {
    return `<h1 class="section-title">${escapeHtml(t('stepContactTitle'))}</h1><p class="section-subtitle">${escapeHtml(t('stepContactSubtitle'))}</p><div class="form-grid">${fieldText('firstName', t('firstName'), { autocomplete: 'given-name' })}${fieldText('lastName', t('lastName'), { autocomplete: 'family-name' })}${fieldText('phone', t('phone'), { type: 'tel', autocomplete: 'tel', inputmode: 'tel', placeholder: '+48… / +380… / +995…', hint: t('phoneHint') })}${fieldSelect('messenger', t('messenger'), 'messenger')}${fieldText('email', t('email'), { type: 'email', autocomplete: 'email', optional: true, full: true })}</div>`;
  }
  if (state.step === 2) {
    return `<h1 class="section-title">${escapeHtml(t('stepLocationTitle'))}</h1><p class="section-subtitle">${escapeHtml(t('stepLocationSubtitle'))}</p><div class="form-grid">${fieldText('citizenship', t('citizenship'), { autocomplete: 'country-name' })}${fieldText('country', t('country'), { autocomplete: 'country-name' })}${fieldText('city', t('city'), { autocomplete: 'address-level2' })}${fieldText('age', t('age'), { type: 'number', inputmode: 'numeric', maxlength: 3 })}${fieldSelect('inPoland', t('inPoland'), 'yesNo')}${fieldSelect('documents', t('documents'), 'documents')}</div>`;
  }
  if (state.step === 3) {
    return `<h1 class="section-title">${escapeHtml(x('locationTitle'))}</h1><p class="section-subtitle">${escapeHtml(x('locationSubtitle'))}</p><div class="form-grid">${renderLocationCards()}${fieldSelect('job', t('job'), 'jobs')}${fieldSelect('start', t('start'), 'starts')}${fieldSelect('shift', t('shift'), 'shifts')}${fieldSelect('housing', t('housing'), 'yesNo')}${fieldSelect('source', t('source'), 'sources')}${fieldTextarea('experience', t('experience'), true, t('experienceHint'))}${fieldTextarea('comment', t('comment'), true)}</div>`;
  }
  return `<h1 class="section-title">${escapeHtml(d('stepDocumentsTitle'))}</h1><p class="section-subtitle">${escapeHtml(d('stepDocumentsSubtitle'))}</p><div class="form-grid">${renderDocumentTypes()}${renderFilePicker()}<div class="field full"><label class="checkbox-row"><input type="checkbox" data-check="applicantConsent" ${state.data.applicantConsent ? 'checked' : ''}><span>${escapeHtml(x('applicantConsent'))} <a href="${escapeHtml(CFG.privacyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('privacyLink'))}</a>. <span class="required-mark">*</span></span></label><div class="error" data-error="applicantConsent"></div></div>${files.length ? `<div class="field full"><label class="checkbox-row"><input type="checkbox" data-check="documentConsent" ${state.data.documentConsent ? 'checked' : ''}><span>${escapeHtml(d('documentConsent'))} <span class="required-mark">*</span></span></label><div class="error" data-error="documentConsent"></div></div>` : ''}</div>`;
}

function renderForm() {
  screen = 'form';
  applyLanguage();
  app.innerHTML = `<section class="card form-card"><div class="topbar"><span class="chip ltr-value">${escapeHtml(state.id)}</span><span><button class="link-button" type="button" id="changeLanguage">🌍 ${escapeHtml(t('changeLanguage'))}</button><button class="link-button" type="button" id="changeRecruiter">👤 ${escapeHtml(t('changeRecruiter'))}</button></span></div>${selectedRecruiterHtml()}${progressHtml()}<form id="candidateForm" novalidate>${renderStepContent()}<div class="actions"><button class="button secondary ${state.step === 1 ? 'invisible' : ''}" type="button" id="backStep">← ${escapeHtml(t('back'))}</button><button class="button primary" type="button" id="nextStep">${escapeHtml(state.step === 4 ? t('checkApplication') : t('continue'))} →</button></div></form></section>`;
  bindFormEvents();
}

function bindFormEvents() {
  document.querySelectorAll('[data-field]').forEach((element) => {
    element.addEventListener('input', () => {
      state.data[element.dataset.field] = element.dataset.field === 'phone' ? normalizePhone(element.value) : element.value;
      saveDraft();
    });
    element.addEventListener('change', () => {
      state.data[element.dataset.field] = element.dataset.field === 'phone' ? normalizePhone(element.value) : element.value;
      saveDraft();
    });
  });
  document.querySelectorAll('[data-location]').forEach((button) => button.addEventListener('click', () => {
    state.data.preferredLocation = button.dataset.location;
    saveDraft();
    renderForm();
  }));
  document.querySelectorAll('[data-document-type]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const id = checkbox.dataset.documentType;
    let selected = new Set(state.data.documentTypes);
    if (checkbox.checked) selected.add(id); else selected.delete(id);
    if (id === 'noneYet' && checkbox.checked) selected = new Set(['noneYet']);
    if (id !== 'noneYet' && checkbox.checked) selected.delete('noneYet');
    state.data.documentTypes = [...selected];
    saveDraft();
    renderForm();
  }));
  document.querySelectorAll('[data-check]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    state.data[checkbox.dataset.check] = checkbox.checked;
    saveDraft();
  }));
  document.getElementById('documentFiles')?.addEventListener('change', (event) => addFiles([...event.target.files]));
  document.querySelectorAll('[data-remove-file]').forEach((button) => button.addEventListener('click', () => {
    files.splice(Number(button.dataset.removeFile), 1);
    if (!files.length) state.data.documentConsent = false;
    renderForm();
  }));
  document.getElementById('changeLanguage').addEventListener('click', () => renderLanguage());
  document.getElementById('changeRecruiter').addEventListener('click', () => renderRecruiters());
  document.getElementById('backStep').addEventListener('click', () => {
    if (state.step > 1) state.step -= 1;
    saveDraft();
    renderForm();
  });
  document.getElementById('nextStep').addEventListener('click', () => {
    if (!validateStep()) return;
    if (state.step < 4) {
      state.step += 1;
      saveDraft();
      renderForm();
    } else renderReview();
  });
}

function addFiles(incoming) {
  const errors = [];
  for (const file of incoming) {
    if (files.length >= CFG.maxFiles) { errors.push(d('tooManyFiles')); break; }
    const extension = file.name.split('.').pop().toLowerCase();
    if (!CFG.allowedExtensions.includes(extension)) { errors.push(`${d('unsupportedFile')} ${file.name}`); continue; }
    if (file.size > CFG.maxFileBytes) { errors.push(`${d('fileTooLarge')} ${file.name}`); continue; }
    if (files.some((existing) => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) continue;
    const total = files.reduce((sum, item) => sum + item.size, 0) + file.size;
    if (total > CFG.maxTotalFileBytes) { errors.push(d('totalTooLarge')); continue; }
    files.push(file);
  }
  state.data.documentConsent = false;
  renderForm();
  if (errors.length) {
    const errorBox = document.querySelector('[data-error="files"]');
    if (errorBox) errorBox.textContent = errors.join(' ');
  }
}

function setError(id, message) {
  const element = document.querySelector(`[data-error="${id}"]`);
  if (element) element.textContent = message;
  const input = document.getElementById(id);
  if (input) input.classList.add('invalid');
}

function validateStep() {
  document.querySelectorAll('.error').forEach((element) => { element.textContent = ''; });
  document.querySelectorAll('.invalid').forEach((element) => element.classList.remove('invalid'));
  let valid = true;
  const required = state.step === 1 ? ['firstName', 'lastName', 'phone', 'messenger']
    : state.step === 2 ? ['citizenship', 'country', 'city', 'age', 'inPoland', 'documents']
      : state.step === 3 ? ['preferredLocation', 'job', 'start', 'shift', 'housing', 'source'] : [];
  required.forEach((id) => {
    if (!String(state.data[id] || '').trim()) { setError(id, id === 'preferredLocation' ? x('locationRequired') : t('required')); valid = false; }
  });
  if (state.step === 1) {
    const phone = normalizePhone(state.data.phone);
    const digits = phone.replace(/\D/g, '');
    if (!phone.startsWith('+') || digits.length < 7 || digits.length > 15) { setError('phone', t('invalidPhone')); valid = false; }
    if (state.data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.data.email)) { setError('email', t('invalidEmail')); valid = false; }
  }
  if (state.step === 2) {
    const age = Number(state.data.age);
    if (!Number.isInteger(age) || age < 18 || age > 75) { setError('age', t('invalidAge')); valid = false; }
  }
  if (state.step === 4) {
    if (!state.data.documentTypes.length) { setError('documentTypes', d('selectDocumentType')); valid = false; }
    if (state.data.documentTypes.includes('noneYet') && state.data.documentTypes.length > 1) { setError('documentTypes', d('noneConflict')); valid = false; }
    if (!state.data.applicantConsent) { setError('applicantConsent', t('required')); valid = false; }
    if (files.length && !state.data.documentConsent) { setError('documentConsent', t('required')); valid = false; }
  }
  if (!valid) document.querySelector('.error:not(:empty)')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return valid;
}

function localizedOption(group, value) {
  return coreLocale().options?.[group]?.[value] || CORE.locales.en.options?.[group]?.[value] || value || '—';
}

function documentTypeLabel(id, code = state.language) {
  return deliveryLocale(code).documentTypes?.[id] || DELIVERY.locales.en.documentTypes[id] || id;
}

function reviewItem(label, value) {
  return `<div class="review-item"><span class="review-label">${escapeHtml(label)}</span><span class="review-value">${escapeHtml(value || '—')}</span></div>`;
}

function reviewSection(icon, title, step, items) {
  return `<section class="review-section"><header class="review-section-head"><span aria-hidden="true">${icon}</span><h2>${escapeHtml(title)}</h2><button class="link-button review-edit" type="button" data-edit-step="${step}">${escapeHtml(x('editSection'))}</button></header><div class="review-grid">${items.join('')}</div></section>`;
}

function renderReview() {
  screen = 'review';
  state.step = 5;
  saveDraft();
  applyLanguage();
  const person = recruiter();
  const place = location();
  const fileSummary = files.length ? files.map((file) => `<li><strong>${escapeHtml(file.name)}</strong> · ${formatBytes(file.size)}</li>`).join('') : `<li>${escapeHtml(x('noAttachments'))}</li>`;
  app.innerHTML = `<section class="card review-card">${progressHtml()}<div class="review-header"><span class="hero-icon small" aria-hidden="true">✓</span><h1 class="section-title">${escapeHtml(t('reviewTitle'))}</h1><p class="section-subtitle">${escapeHtml(t('reviewSubtitle'))}</p></div><div class="recipient-card"><span class="choice-avatar" aria-hidden="true">${escapeHtml(person.initials)}</span><span><small>${escapeHtml(t('recipient'))}</small><strong>${escapeHtml(person.name)}</strong><em class="ltr-value">${escapeHtml(person.email)}</em></span><span class="recipient-check" aria-hidden="true">✓</span></div><div class="review-sections">
    ${reviewSection('☎️', x('reviewContact'), 1, [reviewItem(t('firstName'), state.data.firstName), reviewItem(t('lastName'), state.data.lastName), reviewItem(t('phone'), state.data.phone), reviewItem(t('messenger'), localizedOption('messenger', state.data.messenger)), reviewItem(t('email'), state.data.email)])}
    ${reviewSection('🌍', x('reviewPersonal'), 2, [reviewItem(t('citizenship'), state.data.citizenship), reviewItem(t('country'), state.data.country), reviewItem(t('city'), state.data.city), reviewItem(t('age'), state.data.age), reviewItem(t('inPoland'), localizedOption('yesNo', state.data.inPoland)), reviewItem(t('documents'), localizedOption('documents', state.data.documents))])}
    ${reviewSection('🏭', x('reviewWork'), 3, [reviewItem(x('locationLabel'), `${place?.name || ''} — ${place ? x(place.detailKey) : ''}`), reviewItem(t('job'), localizedOption('jobs', state.data.job)), reviewItem(t('start'), localizedOption('starts', state.data.start)), reviewItem(t('shift'), localizedOption('shifts', state.data.shift)), reviewItem(t('housing'), localizedOption('yesNo', state.data.housing)), reviewItem(t('source'), localizedOption('sources', state.data.source)), reviewItem(t('experience'), state.data.experience), reviewItem(t('comment'), state.data.comment)])}
    ${reviewSection('📎', x('reviewDocuments'), 4, [reviewItem(d('documentTypesLabel'), state.data.documentTypes.map((id) => documentTypeLabel(id)).join('; ')), reviewItem(x('attachmentCount'), `${files.length} · ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))}`)])}
    <div class="attachment-summary"><ul class="attachment-list">${fileSummary}</ul></div>
    </div><div class="email-guide"><h2>${escapeHtml(x('readyTitle'))}</h2><p>${escapeHtml(x('readyText'))}</p><p class="send-reminder">⚠️ ${escapeHtml(x('generatedNotice'))}</p></div><div class="delivery-options"><article class="delivery-card recommended-delivery"><span class="delivery-badge">${escapeHtml(d('recommended'))}</span><h2>${escapeHtml(d('emlTitle'))}</h2><p>${escapeHtml(d('emlDescription'))}</p><ol>${d('emlSteps').map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><button class="button primary full-button" type="button" id="prepareEmlButton">📎 ${escapeHtml(d('prepareEml'))}</button></article><article class="delivery-card"><h2>${escapeHtml(d('mailtoTitle'))}</h2><p>${escapeHtml(d('mailtoDescription'))}</p><ol>${d('mailtoSteps').map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><button class="button secondary full-button" type="button" id="mailButton">✉️ ${escapeHtml(d('openEmail'))}</button></article></div><div id="resultMessage" class="notice success hidden" aria-live="polite"></div><div class="actions"><button class="button secondary" type="button" id="editApplication">← ${escapeHtml(t('edit'))}</button><button class="button ghost" type="button" id="newApplication">${escapeHtml(t('newApplication'))}</button></div></section>`;
  document.querySelectorAll('[data-edit-step]').forEach((button) => button.addEventListener('click', () => { state.step = Number(button.dataset.editStep); renderForm(); }));
  document.getElementById('editApplication').addEventListener('click', () => { state.step = 4; renderForm(); });
  document.getElementById('newApplication').addEventListener('click', resetApplication);
  const mailer = createMailer();
  document.getElementById('prepareEmlButton').addEventListener('click', mailer.prepareEml);
  document.getElementById('mailButton').addEventListener('click', mailer.openMailto);
}

function createMailer() {
  return window.CITRONEX_MAIL.create({
    CFG, state, files, route, recruiter, location, CORE, DELIVERY, EXTRA,
    coreLocale, deliveryLocale, cleanCell, spreadsheetSafe, warsawParts,
    isoWarsawDate, formatBytes, escapeHtml
  });
}

function resetApplication() {
  clearDraft();
  files = [];
  state = freshState();
  applyLanguage();
  renderLanguage();
}
