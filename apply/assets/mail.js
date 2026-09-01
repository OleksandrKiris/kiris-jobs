(() => {
  'use strict';

  function create(ctx) {
    const {
      CFG, state, files, route, recruiter, location, CORE, DELIVERY, EXTRA,
      coreLocale, deliveryLocale, cleanCell, spreadsheetSafe, warsawParts,
      isoWarsawDate, formatBytes, escapeHtml
    } = ctx;

    function polishOption(group, value) {
      return CORE.internal?.[group]?.[value] || value || '';
    }

    function polishDocumentTypes() {
      const pl = DELIVERY.locales.pl?.documentTypes || DELIVERY.locales.en.documentTypes;
      return state.data.documentTypes.map((id) => pl[id] || id).join('; ');
    }

    function emailRecord() {
      const person = recruiter();
      const place = location();
      const created = new Date(state.createdAt);
      const sla = new Date(created.getTime() + 24 * 60 * 60 * 1000);
      const attachmentNames = files.map((file) => file.name).join('; ');
      const values = {
        'ID zgłoszenia': state.id,
        'Data zgłoszenia': isoWarsawDate(created),
        'SLA do': isoWarsawDate(sla),
        'Język': (state.language || 'en').toUpperCase(),
        'Rekruter': person.name,
        'E-mail rekrutera': person.email,
        'Preferowana lokalizacja': `${place?.name || ''}${place ? ` — ${EXTRA.pl[place.detailKey] || place.detailKey}` : ''}`,
        'Imię': state.data.firstName,
        'Nazwisko': state.data.lastName,
        'Telefon': state.data.phone,
        'Komunikator': polishOption('messenger', state.data.messenger),
        'E-mail kandydata': state.data.email,
        'Obywatelstwo': state.data.citizenship,
        'Kraj pobytu': state.data.country,
        'Miasto': state.data.city,
        'Wiek': state.data.age,
        'W Polsce': polishOption('yesNo', state.data.inPoland),
        'Dokument pobytowy': polishOption('documents', state.data.documents),
        'Stanowisko': polishOption('jobs', state.data.job),
        'Doświadczenie': state.data.experience,
        'Gotowość': polishOption('starts', state.data.start),
        'Praca zmianowa': polishOption('shifts', state.data.shift),
        'Zakwaterowanie': polishOption('yesNo', state.data.housing),
        'Źródło deklarowane': polishOption('sources', state.data.source),
        'Źródło linku': route.source,
        'Kampania': route.campaign,
        'Wakacja / oferta': route.vacancy,
        'Typy dokumentów': polishDocumentTypes(),
        'Nazwy załączników': attachmentNames,
        'Liczba załączników': files.length,
        'Komentarz': state.data.comment,
        'Status': 'NOWY',
        'Data pierwszego kontaktu': '',
        'Liczba prób kontaktu': '0',
        'Następny kontakt': '',
        'Wynik rozmowy': '',
        'Decyzja': '',
        'Powód odmowy': '',
        'Uwagi rekrutera': ''
      };
      return { person, place, created, sla, values };
    }

    function excelRows() {
      const { values } = emailRecord();
      const headers = CFG.excelColumns.map(spreadsheetSafe);
      const row = CFG.excelColumns.map((header) => spreadsheetSafe(values[header] ?? ''));
      return { headers, row };
    }

    function subjectLine() {
      const place = location()?.name || 'DO USTALENIA';
      const job = polishOption('jobs', state.data.job) || 'KANDYDAT';
      return `[NOWY KANDYDAT][${place}] ${state.id} | ${cleanCell(state.data.firstName)} ${cleanCell(state.data.lastName)} | ${cleanCell(state.data.citizenship)} | ${job}`.slice(0, 240);
    }

    function emailRows() {
      const { values } = emailRecord();
      return CFG.excelColumns.slice(0, 31).map((header) => [header, values[header] ?? '']);
    }

    function buildPlainText() {
      const { person } = emailRecord();
      const { headers, row } = excelRows();
      const rows = emailRows().map(([label, value]) => `${label}: ${cleanCell(value) || '—'}`).join('\n');
      const candidateInstruction = deliveryLocale().mailtoSteps.map((step, index) => `${index + 1}. ${step}`).join('\n');
      return `CITRONEX / PPO SIECHNICE — NOWE ZGŁOSZENIE KANDYDATA\n\nODBIORCA: ${person.name} <${person.email}>\n\nINSTRUKCJA DLA KANDYDATA (${(state.language || 'en').toUpperCase()}):\n${candidateInstruction}\n\nTABELA KANDYDATA\n${rows}\n\nDANE DO EXCEL — NAGŁÓWKI TSV\n${headers.join('\t')}\n\nDANE DO EXCEL — WIERSZ TSV\n${row.join('\t')}\n\nUwaga: kandydat musi sprawdzić odbiorcę, załączniki i samodzielnie nacisnąć „Wyślij”.`;
    }

    function buildHtmlMessage() {
      const { person } = emailRecord();
      const rows = emailRows().map(([label, value]) => `<tr><th style="text-align:left;padding:9px 10px;border:1px solid #d9e5df;background:#f4f8f6;width:34%">${escapeHtml(label)}</th><td style="padding:9px 10px;border:1px solid #d9e5df">${escapeHtml(cleanCell(value) || '—')}</td></tr>`).join('');
      const attachments = files.length ? `<ul>${files.map((file) => `<li>${escapeHtml(file.name)} — ${escapeHtml(formatBytes(file.size))}</li>`).join('')}</ul>` : '<p>Brak plików dokumentów.</p>';
      return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#17231d;line-height:1.45"><div style="max-width:820px;margin:auto"><div style="padding:18px 22px;background:#075c39;color:#fff;border-radius:14px 14px 0 0"><h1 style="font-size:22px;margin:0">Citronex / PPO Siechnice — nowy kandydat</h1><p style="margin:7px 0 0">${escapeHtml(state.id)}</p></div><div style="padding:20px;border:1px solid #d9e5df;border-top:0"><p><strong>Wybrany rekruter:</strong> ${escapeHtml(person.name)} &lt;${escapeHtml(person.email)}&gt;</p><table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table><h2 style="font-size:18px;color:#075c39;margin-top:22px">Załączniki kandydata</h2>${attachments}<p style="padding:12px;background:#fff7e8;border:1px solid #efd19a;border-radius:10px"><strong>Kontrola:</strong> przed rozpoczęciem pracy z kandydatem sprawdź załączniki, wstaw dane z dołączonego pliku CSV do kolejki Excel i ustaw status kontaktu.</p></div></div></body></html>`;
    }

    function csvCell(value) {
      return `"${spreadsheetSafe(value).replace(/"/g, '""')}"`;
    }

    function buildCsv() {
      const { headers, row } = excelRows();
      return `\uFEFFsep=;\r\n${headers.map(csvCell).join(';')}\r\n${row.map(csvCell).join(';')}\r\n`;
    }

    function utf8Base64(value) {
      const bytes = new TextEncoder().encode(String(value));
      let binary = '';
      const chunk = 0x8000;
      for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
      return btoa(binary);
    }

    function wrapBase64(value) { return String(value).replace(/.{1,76}/g, '$&\r\n').trim(); }
    function encodeHeader(value) { return `=?UTF-8?B?${utf8Base64(value)}?=`; }

    function fileBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error || new Error('File read failed.'));
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.readAsDataURL(file);
      });
    }

    function mimeType(file) {
      if (file.type) return file.type;
      const extension = file.name.split('.').pop().toLowerCase();
      return ({ pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })[extension] || 'application/octet-stream';
    }

    function asciiFilename(name) {
      const safe = cleanCell(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);
      return safe || 'attachment.bin';
    }

    async function buildEml() {
      const person = recruiter();
      const mixed = `=_Citronex_Mixed_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const alt = `=_Citronex_Alternative_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const lines = [
        `To: ${person.name} <${person.email}>`, `Subject: ${encodeHeader(subjectLine())}`,
        `Date: ${new Date().toUTCString()}`, 'MIME-Version: 1.0', 'X-Unsent: 1',
        `Content-Type: multipart/mixed; boundary="${mixed}"`, '', `--${mixed}`,
        `Content-Type: multipart/alternative; boundary="${alt}"`, '', `--${alt}`,
        'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '',
        wrapBase64(utf8Base64(buildPlainText())), '', `--${alt}`,
        'Content-Type: text/html; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '',
        wrapBase64(utf8Base64(buildHtmlMessage())), '', `--${alt}--`, '', `--${mixed}`,
        `Content-Type: text/csv; charset="UTF-8"; name="${state.id}-excel.csv"`,
        'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${state.id}-excel.csv"`, '',
        wrapBase64(utf8Base64(buildCsv())), ''
      ];
      for (const file of files) {
        const name = asciiFilename(file.name);
        lines.push(`--${mixed}`, `Content-Type: ${mimeType(file)}; name="${name}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
          '', wrapBase64(await fileBase64(file)), '');
      }
      lines.push(`--${mixed}--`, '');
      return lines.join('\r\n');
    }

    async function prepareEml() {
      const button = document.getElementById('prepareEmlButton');
      const result = document.getElementById('resultMessage');
      button.disabled = true;
      button.textContent = deliveryLocale().emlBuilding;
      try {
        const eml = await buildEml();
        const blob = new Blob([eml], { type: 'message/rfc822;charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${state.id}-${cleanCell(state.data.lastName || 'kandydat')}.eml`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 3000);
        result.textContent = deliveryLocale().emlReady;
        result.classList.remove('hidden');
      } catch (error) {
        console.error(error);
        result.textContent = deliveryLocale().emlError;
        result.classList.remove('hidden');
      } finally {
        button.disabled = false;
        button.textContent = `📎 ${deliveryLocale().prepareEml}`;
      }
    }

    function openMailto() {
      const person = recruiter();
      const body = buildPlainText();
      const url = `mailto:${encodeURIComponent(person.email)}?subject=${encodeURIComponent(subjectLine())}&body=${encodeURIComponent(body)}`;
      const result = document.getElementById('resultMessage');
      result.textContent = url.length > CFG.maxMailtoLength ? deliveryLocale().mailLong : deliveryLocale().mailOpened;
      result.classList.remove('hidden');
      window.location.href = url;
    }

    return Object.freeze({ prepareEml, openMailto, buildEml, buildCsv, buildHtmlMessage });
  }

  window.CITRONEX_MAIL = Object.freeze({ create });
})();
