(() => {
  'use strict';

  const CFG = window.RECRUITMENT_CONFIG;
  const I18N = window.RECRUITMENT_I18N;
  const DELIVERY_I18N = window.RECRUITMENT_DELIVERY_V10_I18N || {};
  const app = document.getElementById('app');
  if (!CFG || !I18N || !app) return;

  const deliveryConfig = CFG.delivery || {};
  const MAX_FILES = Number(deliveryConfig.maxFiles) || 30;
  const MAX_FILE_BYTES = Number(deliveryConfig.maxFileBytes) || 12 * 1024 * 1024;
  const MAX_TOTAL_BYTES = Number(deliveryConfig.maxTotalFileBytes) || 80 * 1024 * 1024;
  const ALLOWED_EXTENSIONS = new Set(deliveryConfig.allowedExtensions || ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'doc', 'docx']);
  const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]);
  const DOCUMENT_CATEGORIES = Object.freeze([
    ['passport-main', 'categoryPassportMain'],
    ['passport-pages', 'categoryPassportPages'],
    ['identity-card', 'categoryIdentityCard'],
    ['visa', 'categoryVisa'],
    ['residence-front', 'categoryResidenceFront'],
    ['residence-back', 'categoryResidenceBack'],
    ['driver-license', 'categoryDriverLicense'],
    ['cv', 'categoryCv'],
    ['other', 'categoryOther']
  ]);
  const MAX_IMAGE_EDGE = 2200;
  const IMAGE_QUALITY = 0.84;
  const MIN_READABLE_EDGE = 900;
  const routeUrl = new URL(window.location.href);
  const route = Object.freeze({
    source: cleanRoute(routeUrl.searchParams.get(CFG.queryParams.source)),
    campaign: cleanRoute(routeUrl.searchParams.get(CFG.queryParams.campaign)),
    vacancy: cleanRoute(routeUrl.searchParams.get(CFG.queryParams.vacancy))
  });

  let selectedFiles = [];
  let fileCategories = [];
  let fileNotes = [];
  let activeApplicationId = '';
  let scheduled = false;

  function locale() {
    const code = String(document.documentElement.lang || 'en').toLowerCase().split('-')[0];
    return { ...(DELIVERY_I18N.en || {}), ...(DELIVERY_I18N[code] || {}) };
  }

  function text(key) {
    return locale()[key] || DELIVERY_I18N.en?.[key] || key;
  }

  function interpolate(value, replacements) {
    return Object.entries(replacements).reduce((result, [key, replacement]) => result.replaceAll(`{${key}}`, String(replacement)), String(value));
  }

  function categoryLabel(category) {
    const entry = DOCUMENT_CATEGORIES.find(([value]) => value === category) || DOCUMENT_CATEGORIES.at(-1);
    return text(entry[1]);
  }

  function categoryOptions(selected = 'passport-main') {
    return DOCUMENT_CATEGORIES.map(([value, labelKey]) =>
      `<option value="${value}"${value === selected ? ' selected' : ''}>${escapeHtml(text(labelKey))}</option>`
    ).join('');
  }

  function cleanRoute(value) {
    return String(value || '').trim().replace(/[^\p{L}\p{N}_.+\- /]/gu, '').slice(0, 120);
  }

  function cleanCell(value, limit = 500) {
    const result = String(value ?? '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\t\n]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .slice(0, limit);
    return /^[=+\-@]/.test(result) ? `'${result}` : result;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function readState() {
    try {
      const state = JSON.parse(localStorage.getItem(CFG.storageKey));
      if (!state?.id || !state?.data) return null;
      if (activeApplicationId && activeApplicationId !== state.id) {
        selectedFiles = [];
        fileCategories = [];
        fileNotes = [];
      }
      activeApplicationId = state.id;
      return state;
    } catch {
      return null;
    }
  }

  function recruiterFor(state) {
    return CFG.recruiters.find((item) => item.id === state?.recruiterId) || null;
  }

  function locationFor(state) {
    return CFG.locations.find((item) => item.id === state?.data?.location) || null;
  }

  function normalizePhone(person) {
    return person?.phoneDigits || String(person?.phone || '').replace(/\D/g, '');
  }

  function internationalPhone(person) {
    const digits = normalizePhone(person);
    return digits ? `+${digits}` : '';
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  function totalBytes() {
    return selectedFiles.reduce((sum, file) => sum + file.size, 0);
  }

  function fileNames(limit = 400) {
    return cleanCell(selectedFiles.map((file, index) => `${categoryLabel(fileCategories[index])}: ${file.name}`).join('; '), limit);
  }

  function safeFilePart(value, fallback) {
    const cleaned = String(value || '').trim().normalize('NFKD')
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50);
    return cleaned || fallback;
  }

  function filesForSharing(state) {
    const candidate = `${safeFilePart(state?.data?.lastName, 'Candidate')}_${safeFilePart(state?.data?.firstName, '')}`.replace(/_+$/g, '');
    return selectedFiles.map((file, index) => {
      const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'bin';
      const category = safeFilePart(fileCategories[index], 'document');
      const name = `${candidate}_${safeFilePart(state?.id, 'application')}_${category}_${String(index + 1).padStart(2, '0')}.${extension}`;
      return new File([file], name, { type: file.type, lastModified: file.lastModified });
    });
  }

  function warsawParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: CFG.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    return Object.fromEntries(formatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]));
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat('pl-PL', {
      timeZone: CFG.timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(value));
  }

  function slaDate(state) {
    return formatDate(new Date(new Date(state.createdAt).getTime() + 24 * 60 * 60 * 1000));
  }

  function polishOption(group, value) {
    return I18N.internal?.[group]?.[value]
      || I18N.locales?.pl?.options?.[group]?.[value]
      || I18N.locales?.en?.options?.[group]?.[value]
      || value
      || '';
  }

  function filledByPolish(state) {
    return state.data.filledBy === 'representative' ? 'Przedstawiciel / partner' : 'Kandydat';
  }

  function locationPolish(state) {
    const location = locationFor(state);
    return location ? `${location.name} (${location.subtitle})` : '';
  }

  function excelValues(state, level = 'full') {
    const person = recruiterFor(state);
    const data = state.data;
    const limits = level === 'full'
      ? { representative: 120, group: 60, experience: 220, source: 160, comment: 180, files: 300 }
      : level === 'compact'
        ? { representative: 80, group: 40, experience: 100, source: 90, comment: 80, files: 160 }
        : { representative: 50, group: 30, experience: 45, source: 55, comment: 40, files: 80 };
    const fileNote = selectedFiles.length ? `Pliki: ${fileNames(limits.files)}` : '';
    const comment = [cleanCell(data.comment, limits.comment), fileNote].filter(Boolean).join(' | ');

    const row = [
      state.id, formatDate(state.createdAt), slaDate(state), String(state.language || '').toUpperCase(), person?.name || '', person?.email || '',
      filledByPolish(state), cleanCell(data.representativeName, limits.representative), cleanCell(data.groupCode, limits.group), locationPolish(state),
      data.firstName, data.lastName, data.phone, polishOption('messenger', data.messenger), level === 'minimal' ? '' : data.email,
      data.citizenship, data.country, data.city, data.age, polishOption('yesNo', data.inPoland),
      polishOption('documents', data.documents), polishOption('jobs', data.job), cleanCell(data.experience, limits.experience),
      polishOption('starts', data.start), polishOption('shifts', data.shift), polishOption('yesNo', data.housing),
      polishOption('sources', data.source), cleanCell(data.sourceDetails, limits.source), route.source, route.campaign, route.vacancy,
      comment, 'NOWY', '', '0', '', '', '', '', ''
    ].map((value) => cleanCell(value));

    if (row.length !== CFG.excelColumns.length) throw new Error('Delivery Excel row does not match configured columns.');
    return row;
  }

  function summaryRows(state, level = 'full') {
    const data = state.data;
    const person = recruiterFor(state);
    const optionalLimit = level === 'full' ? 180 : level === 'compact' ? 90 : 45;
    const rows = [
      ['ID zgłoszenia', state.id], ['Data zgłoszenia', formatDate(state.createdAt)], ['SLA do', slaDate(state)],
      ['Rekruter', person?.name || ''], ['E-mail rekrutera', person?.email || ''], ['Telefon rekrutera', person?.phone || ''],
      ['Preferowana lokalizacja', locationPolish(state)], ['Ankietę wypełnia', filledByPolish(state)]
    ];
    if (data.filledBy === 'representative') {
      rows.push(['Osoba / partner wypełniający', cleanCell(data.representativeName, optionalLimit)]);
      rows.push(['Kod grupy / partnera', cleanCell(data.groupCode, 45) || 'brak']);
    }
    rows.push(
      ['Imię i nazwisko', `${data.firstName || ''} ${data.lastName || ''}`.trim()], ['Telefon kandydata', data.phone],
      ['Komunikator', polishOption('messenger', data.messenger)], ['E-mail kandydata', data.email || 'brak'],
      ['Obywatelstwo', data.citizenship], ['Kraj i miasto pobytu', `${data.country || ''}, ${data.city || ''}`], ['Wiek', data.age],
      ['Obecnie w Polsce', polishOption('yesNo', data.inPoland)], ['Dokument pobytowy', polishOption('documents', data.documents)],
      ['Stanowisko', polishOption('jobs', data.job)], ['Doświadczenie', cleanCell(data.experience, optionalLimit) || 'brak'],
      ['Gotowość', polishOption('starts', data.start)], ['Praca zmianowa', polishOption('shifts', data.shift)],
      ['Zakwaterowanie', polishOption('yesNo', data.housing)], ['Źródło', polishOption('sources', data.source)],
      ['Kto polecił / dokładne źródło', cleanCell(data.sourceDetails, optionalLimit)],
      ['Komentarz', cleanCell(data.comment, optionalLimit) || 'brak'],
      ['Wybrane pliki', selectedFiles.length ? fileNames(500) : 'brak']
    );
    return rows;
  }

  function subject(state) {
    const data = state.data;
    const location = locationFor(state)?.name || 'LOKALIZACJA';
    const partner = data.filledBy === 'representative'
      ? `[PARTNER${data.groupCode ? ` ${cleanCell(data.groupCode, 24)}` : ''}]`
      : '';
    return `[NOWY KANDYDAT][SLA 24H][${location}]${partner} ${cleanCell(data.firstName, 40)} ${cleanCell(data.lastName, 50)} | ${cleanCell(data.citizenship, 45)} | ${recruiterFor(state)?.name || ''}`.slice(0, 220);
  }

  function fullMessage(state, level = 'full') {
    const person = recruiterFor(state);
    const rows = summaryRows(state, level).map(([label, value]) => `${cleanCell(label)}\t${cleanCell(value)}`).join('\n');
    const values = excelValues(state, level).join('\t');
    const headers = CFG.excelColumns.map((value) => cleanCell(value)).join('\t');
    const documents = selectedFiles.length
      ? selectedFiles.map((file, index) => `${index + 1}. ${cleanCell(file.name)} — ${formatBytes(file.size)}`).join('\n')
      : 'Nie wybrano plików.';
    return [
      'CITRONEX / PPO SIECHNICE — NOWE ZGŁOSZENIE KANDYDATA', '',
      'PRIORYTET — PIERWSZY KONTAKT DO 24 GODZIN',
      `ID\t${state.id}`, `SLA do\t${slaDate(state)}`,
      `Rekruter\t${person?.name || ''}`, `E-mail\t${person?.email || ''}`, `Telefon\t${person?.phone || ''}`, '',
      'SZCZEGÓŁY KANDYDATA', 'Pole\tWartość', rows, '',
      'CV / DOKUMENTY WYBRANE PRZEZ KANDYDATA', documents, '',
      'DANE DO EXCEL — NAGŁÓWKI TSV', headers, '',
      'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A', values, '',
      'Status początkowy: NOWY', `Wersja formularza: ${CFG.version}`
    ].join('\n');
  }

  function compactMessage(state) {
    const person = recruiterFor(state);
    const data = state.data;
    return [
      'CITRONEX / PPO — NOWY KANDYDAT',
      `ID: ${state.id}`,
      `SLA: ${slaDate(state)}`,
      `Rekruter: ${person?.name || ''}`,
      `Kandydat: ${cleanCell(data.firstName, 40)} ${cleanCell(data.lastName, 50)}`,
      `Telefon: ${cleanCell(data.phone)}`,
      `Obywatelstwo: ${cleanCell(data.citizenship, 45)}`,
      `Lokalizacja: ${locationPolish(state)}`,
      `Praca: ${polishOption('jobs', data.job)}`,
      `Źródło: ${polishOption('sources', data.source)} — ${cleanCell(data.sourceDetails, 90)}`,
      `Pliki: ${selectedFiles.length ? fileNames(160) : 'brak'}`,
      '',
      'WIERSZ DO EXCEL:',
      excelValues(state, 'compact').join('\t')
    ].join('\n');
  }

  function buildMailto(state) {
    const person = recruiterFor(state);
    for (const level of ['full', 'compact', 'minimal']) {
      const url = `mailto:${person?.email || ''}?subject=${encodeURIComponent(subject(state))}&body=${encodeURIComponent(fullMessage(state, level))}`;
      if (url.length <= CFG.maxMailtoLength || level === 'minimal') return url;
    }
    return `mailto:${person?.email || ''}`;
  }

  function createGeneratedFiles(state) {
    const summary = new File(
      [fullMessage(state, 'full')],
      `${state.id}-ankieta.txt`,
      { type: 'text/plain;charset=utf-8' }
    );
    const tsv = new File(
      [`\uFEFF${CFG.excelColumns.join('\t')}\r\n${excelValues(state, 'full').join('\t')}\r\n`],
      `${state.id}-excel.tsv`,
      { type: 'text/tab-separated-values;charset=utf-8' }
    );
    return [summary, tsv];
  }

  function showResult(message, kind = 'success') {
    const result = document.getElementById('result');
    if (!result) return;
    result.textContent = message;
    result.classList.remove('hidden', 'warning', 'success');
    result.classList.add(kind);
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function copyMessage(message) {
    if (!navigator.clipboard?.writeText) return false;
    try {
      await navigator.clipboard.writeText(message);
      return true;
    } catch {
      return false;
    }
  }

  function openUrl(url, message = text('directOpening')) {
    showResult(message);
    window.setTimeout(() => window.location.assign(url), 40);
  }

  async function shareApplication() {
    const state = readState();
    const person = recruiterFor(state);
    if (!state || !person) return;
    if (!navigator.share) {
      showResult(text('shareUnsupported'), 'warning');
      return;
    }

    const generated = createGeneratedFiles(state);
    const allFiles = [...generated, ...filesForSharing(state)];
    const baseData = { title: subject(state), text: `${text('recipientLine')}: ${person.name} · ${person.email} · ${person.phone}\n\n${compactMessage(state)}` };
    try {
      if (navigator.canShare?.({ files: allFiles })) {
        await navigator.share({ ...baseData, files: allFiles });
        showResult(text('shareDone'));
        return;
      }
      if (navigator.canShare?.({ files: generated })) {
        showResult(text('shareUnsupported'), 'warning');
        await navigator.share({ ...baseData, files: generated });
        return;
      }
      await navigator.share(baseData);
      showResult(text('shareUnsupported'), 'warning');
    } catch (error) {
      if (error?.name === 'AbortError') showResult(text('shareCancelled'), 'warning');
      else showResult(text('shareUnsupported'), 'warning');
    }
  }

  function openEmail() {
    const state = readState();
    if (!state || !recruiterFor(state)) return;
    openUrl(buildMailto(state), text('emailOpening'));
  }

  function openWhatsApp() {
    const state = readState();
    const person = recruiterFor(state);
    const digits = normalizePhone(person);
    if (!state || !digits) return;
    openUrl(`https://wa.me/${digits}?text=${encodeURIComponent(compactMessage(state))}`);
  }

  function openTelegram() {
    const state = readState();
    const person = recruiterFor(state);
    const digits = normalizePhone(person);
    if (!state || !digits) return;
    openUrl(`https://t.me/+${digits}?text=${encodeURIComponent(compactMessage(state))}`);
  }

  async function openViber() {
    const state = readState();
    const person = recruiterFor(state);
    if (!state || !person) return;
    const copied = await copyMessage(compactMessage(state));
    showResult(copied ? text('messageCopied') : text('copyFailed'), copied ? 'success' : 'warning');
    window.setTimeout(() => window.location.assign(`viber://chat?number=${encodeURIComponent(internationalPhone(person))}`), 70);
  }

  function callRecruiter() {
    const state = readState();
    const person = recruiterFor(state);
    if (!person) return;
    openUrl(`tel:${internationalPhone(person)}`);
  }

  function validateFile(file) {
    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    const supportedMime = String(file.type || '').startsWith('image/') || ALLOWED_MIME_TYPES.has(file.type);
    if (!ALLOWED_EXTENSIONS.has(extension) && !supportedMime) return `${text('unsupported')} ${file.name}`;
    if (file.size > MAX_FILE_BYTES) return `${text('tooLarge')} ${file.name}`;
    return '';
  }

  function isImageFile(file) {
    return String(file.type || '').startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif)$/i.test(file.name);
  }

  async function optimizeImageFile(file) {
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type) || !window.createImageBitmap) {
      return { file, note: '' };
    }
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const largestEdge = Math.max(bitmap.width, bitmap.height);
      const smallestEdge = Math.min(bitmap.width, bitmap.height);
      const scale = Math.min(1, MAX_IMAGE_EDGE / largestEdge);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const qualityWarning = smallestEdge < MIN_READABLE_EDGE ? text('lowResolution') : '';

      if (scale === 1 && file.size <= 2.5 * 1024 * 1024) {
        bitmap.close();
        return { file, note: qualityWarning };
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = '#fff';
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY));
      if (!blob || blob.size >= file.size) return { file, note: qualityWarning };

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'document-photo';
      const optimized = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
      const optimizedNote = interpolate(text('optimizedPhoto'), { before: formatBytes(file.size), after: formatBytes(optimized.size) });
      return { file: optimized, note: [optimizedNote, qualityWarning].filter(Boolean).join(' ') };
    } catch {
      return { file, note: '' };
    }
  }

  async function addFiles(files, panel) {
    const errors = [];
    const defaultCategory = panel.querySelector('[data-delivery-default-category]')?.value || 'passport-main';
    const inputs = panel.querySelectorAll('[data-delivery-file-input]');
    inputs.forEach((input) => { input.disabled = true; });
    renderFileList(panel, text('optimizingPhotos'));

    for (const sourceFile of files) {
      if (selectedFiles.length >= MAX_FILES) { errors.push(text('tooMany')); break; }
      const unsupported = validateFile(sourceFile).startsWith(text('unsupported'));
      if (unsupported) { errors.push(`${text('unsupported')} ${sourceFile.name}`); continue; }
      const optimized = await optimizeImageFile(sourceFile);
      const file = optimized.file;
      const validation = validateFile(file);
      if (validation) { errors.push(validation); continue; }
      if (selectedFiles.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) continue;
      if (totalBytes() + file.size > MAX_TOTAL_BYTES) { errors.push(text('totalTooLarge')); continue; }
      selectedFiles.push(file);
      fileCategories.push(defaultCategory);
      fileNotes.push(optimized.note);
    }
    inputs.forEach((input) => { input.disabled = false; });
    renderFileList(panel, errors.join(' '));
  }

  function renderFileList(panel, errorMessage = '') {
    const list = panel.querySelector('[data-delivery-file-list]');
    const error = panel.querySelector('[data-delivery-file-error]');
    const count = panel.querySelector('[data-delivery-file-count]');
    if (!list || !error || !count) return;

    error.textContent = errorMessage;
    count.textContent = selectedFiles.length ? `${selectedFiles.length} · ${formatBytes(totalBytes())}` : '';
    list.innerHTML = selectedFiles.length
      ? selectedFiles.map((file, index) => `
          <div class="delivery-file-item">
            <span class="delivery-file-icon delivery-file-preview" data-delivery-file-preview="${index}" aria-hidden="true">${isImageFile(file) ? 'IMG' : /\.pdf$/i.test(file.name) ? 'PDF' : 'DOC'}</span>
            <span class="delivery-file-meta"><strong>${escapeHtml(file.name)}</strong><small>${formatBytes(file.size)}</small>${fileNotes[index] ? `<em>${escapeHtml(fileNotes[index])}</em>` : ''}</span>
            <button type="button" data-remove-delivery-file="${index}">${escapeHtml(text('remove'))}</button>
            <label class="delivery-file-category"><span>${escapeHtml(text('documentType'))}</span><select data-delivery-file-category="${index}">${categoryOptions(fileCategories[index])}</select></label>
          </div>`).join('')
      : `<div class="delivery-empty-files">${escapeHtml(text('noFiles'))}</div>`;

    list.querySelectorAll('[data-delivery-file-preview]').forEach((preview) => {
      const file = selectedFiles[Number(preview.dataset.deliveryFilePreview)];
      if (!file || !isImageFile(file)) return;
      const previewUrl = URL.createObjectURL(file);
      const image = new Image();
      image.alt = '';
      image.onload = () => URL.revokeObjectURL(previewUrl);
      image.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        image.remove();
      };
      image.src = previewUrl;
      preview.replaceChildren(image);
    });

    list.querySelectorAll('[data-remove-delivery-file]').forEach((button) => button.addEventListener('click', () => {
      const index = Number(button.dataset.removeDeliveryFile);
      selectedFiles.splice(index, 1);
      fileCategories.splice(index, 1);
      fileNotes.splice(index, 1);
      renderFileList(panel);
    }));
    list.querySelectorAll('[data-delivery-file-category]').forEach((select) => select.addEventListener('change', () => {
      fileCategories[Number(select.dataset.deliveryFileCategory)] = select.value;
    }));
  }

  function injectFilePanel() {
    const sourcePanel = app.querySelector('.source-panel');
    if (!sourcePanel || app.querySelector('.delivery-files-panel')) return;
    const panel = document.createElement('section');
    panel.className = 'delivery-files-panel';
    panel.innerHTML = `
      <div class="delivery-files-heading">
        <span aria-hidden="true">▣</span>
        <span><strong>${escapeHtml(text('documentsTitle'))}</strong><small>${escapeHtml(text('documentsText'))}</small></span>
      </div>
      <label class="delivery-default-category">
        <span>${escapeHtml(text('chooseDocumentType'))}</span>
        <select data-delivery-default-category>${categoryOptions()}</select>
      </label>
      <div class="delivery-file-actions">
        <label class="delivery-file-picker delivery-camera-picker">
          <input type="file" multiple accept="image/*" capture="environment" data-delivery-file-input>
          <span class="delivery-picker-icon" aria-hidden="true">CAM</span>
          <span><strong>${escapeHtml(text('takePhoto'))}</strong><small>${escapeHtml(text('takePhotoHint'))}</small></span>
        </label>
        <label class="delivery-file-picker delivery-gallery-picker">
          <input type="file" multiple accept="image/*,.pdf,.doc,.docx" data-delivery-file-input>
          <span class="delivery-picker-icon" aria-hidden="true">＋</span>
          <span><strong>${escapeHtml(text('chooseFiles'))}</strong><small>${escapeHtml(text('chooseFilesHint'))}</small></span>
        </label>
      </div>
      <p class="delivery-photo-tip">${escapeHtml(text('photoTip'))}</p>
      <p class="delivery-file-rules">${escapeHtml(interpolate(text('fileRules'), { maxFiles: MAX_FILES, maxEach: Math.round(MAX_FILE_BYTES / 1024 / 1024), maxTotal: Math.round(MAX_TOTAL_BYTES / 1024 / 1024) }))}</p>
      <div class="delivery-selected-heading"><strong>${escapeHtml(text('selectedFiles'))}</strong><span data-delivery-file-count></span></div>
      <div data-delivery-file-list></div>
      <div class="delivery-file-error" data-delivery-file-error role="alert"></div>`;
    sourcePanel.insertAdjacentElement('afterend', panel);
    panel.querySelectorAll('[data-delivery-file-input]').forEach((input) => input.addEventListener('change', async (event) => {
      const files = [...event.target.files];
      event.target.value = '';
      await addFiles(files, panel);
    }));
    renderFileList(panel);
  }

  function enhanceRecruiterContacts() {
    app.querySelectorAll('.recruiter-card[data-recruiter]').forEach((card) => {
      const person = CFG.recruiters.find((item) => item.id === card.dataset.recruiter);
      const small = card.querySelector('small');
      if (person && small && small.dataset.deliveryContact !== 'true') {
        small.dataset.deliveryContact = 'true';
        small.textContent = `${person.email} · ${person.phone}`;
      }
    });

    const state = readState();
    const person = recruiterFor(state);
    if (!person) return;
    app.querySelectorAll('.selected-recruiter small, .recipient small').forEach((small) => {
      if (small.dataset.deliveryContact === 'true') return;
      small.dataset.deliveryContact = 'true';
      small.textContent = `${person.email} · ${person.phone}`;
    });
  }

  function documentsReviewSection() {
    const files = selectedFiles.length
      ? selectedFiles.map((file, index) => `<li><strong>${escapeHtml(categoryLabel(fileCategories[index]))}<small>${escapeHtml(file.name)}</small></strong><span>${formatBytes(file.size)}</span></li>`).join('')
      : `<li class="delivery-no-review-files">${escapeHtml(text('noFiles'))}</li>`;
    return `
      <section class="review-section delivery-document-review">
        <h2>${escapeHtml(text('reviewDocuments'))}</h2>
        <div class="delivery-review-files"><ul>${files}</ul><p>${escapeHtml(text('generatedFiles'))}</p></div>
      </section>`;
  }

  function channelButton(channel, icon, label, hint) {
    return `
      <button class="delivery-channel" type="button" data-delivery-channel="${channel}">
        <span class="delivery-channel-icon" aria-hidden="true">${icon}</span>
        <span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(hint)}</small></span>
        <span class="delivery-channel-arrow" aria-hidden="true">›</span>
      </button>`;
  }

  function enhanceReview() {
    const reviewSections = app.querySelector('.review-sections');
    const guide = app.querySelector('.email-guide');
    const actions = app.querySelector('.review-actions');
    if (!reviewSections || !guide || !actions || actions.dataset.deliveryV10 === 'true') return;
    const state = readState();
    const person = recruiterFor(state);
    if (!state || !person) return;

    actions.dataset.deliveryV10 = 'true';
    if (!reviewSections.querySelector('.delivery-document-review')) {
      reviewSections.insertAdjacentHTML('beforeend', documentsReviewSection());
    }

    const panel = document.createElement('section');
    panel.className = 'delivery-panel';
    panel.innerHTML = `
      <div class="delivery-panel-heading">
        <span class="delivery-panel-icon" aria-hidden="true">↗</span>
        <span><h2>${escapeHtml(text('sendTitle'))}</h2><p>${escapeHtml(text('sendText'))}</p></span>
      </div>
      <div class="delivery-recipient-card">
        <span class="avatar" aria-hidden="true">${escapeHtml(person.initials)}</span>
        <span><small>${escapeHtml(text('recipientLine'))}</small><strong>${escapeHtml(person.name)}</strong><em>${escapeHtml(person.email)} · ${escapeHtml(person.phone)}</em></span>
      </div>
      <button class="delivery-share-primary" type="button" data-delivery-channel="share">
        <span class="delivery-share-icon" aria-hidden="true">▣</span>
        <span><strong>${escapeHtml(text('shareAll'))}</strong><small>${escapeHtml(text('shareAllHint'))}</small></span>
        <span aria-hidden="true">→</span>
      </button>
      <p class="delivery-share-target-hint">${escapeHtml(text('shareTargetHint'))}</p>
      <div class="delivery-channel-grid">
        ${channelButton('email', '✉', text('email'), text('emailHint'))}
        ${channelButton('whatsapp', 'WA', text('whatsapp'), text('whatsappHint'))}
        ${channelButton('telegram', 'TG', text('telegram'), text('telegramHint'))}
        ${channelButton('viber', 'VI', text('viber'), text('viberHint'))}
        ${channelButton('call', '☎', text('call'), text('callHint'))}
      </div>
      <div class="delivery-manual-note"><span aria-hidden="true">!</span><p>${escapeHtml(text('filesManual'))}</p></div>`;
    guide.replaceWith(panel);

    const originalSend = actions.querySelector('[data-action="send"]');
    originalSend?.classList.add('delivery-original-send');
    actions.classList.add('delivery-edit-only');

    panel.querySelectorAll('[data-delivery-channel]').forEach((button) => button.addEventListener('click', () => {
      const channel = button.dataset.deliveryChannel;
      if (channel === 'share') shareApplication();
      else if (channel === 'email') openEmail();
      else if (channel === 'whatsapp') openWhatsApp();
      else if (channel === 'telegram') openTelegram();
      else if (channel === 'viber') openViber();
      else if (channel === 'call') callRecruiter();
    }));
  }

  function enhance() {
    readState();
    injectFilePanel();
    enhanceRecruiterContacts();
    enhanceReview();
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(app, { childList: true, subtree: true });
  enhance();
})();
