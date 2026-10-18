(() => {
  'use strict';
  const routeKeys = ['recruiter', 'location', 'src', 'campaign', 'vacancy', 'partner', 'group'];
  const language = value => /^[a-z]{2,3}$/.test(value || '') ? value : 'en';

  function copyRoute(source, target) {
    for (const key of routeKeys) {
      const raw = source.searchParams.get(key);
      const value = ['src', 'campaign', 'vacancy'].includes(key)
        ? String(raw || '').trim().replace(/[^\p{L}\p{N}_.+\- /]/gu, '').slice(0, 120) : raw;
      if (value && value.length <= 120) target.searchParams.set(key, value);
    }
  }

  function toPdf(applicationHref, pdfPath, selectedLanguage) {
    const source = new URL(applicationHref);
    const back = new URL('./', source);
    copyRoute(source, back);
    back.searchParams.set('lang', language(selectedLanguage));
    const pdf = new URL(pdfPath, source);
    if (pdf.origin !== source.origin) throw new Error('PDF must stay on the application origin.');
    pdf.search = '';
    pdf.hash = '';
    pdf.searchParams.set('lang', language(selectedLanguage));
    pdf.searchParams.set('returnTo', back.pathname + back.search);
    return pdf.href;
  }

  function toApplication(pdfHref, selectedLanguage) {
    const source = new URL(pdfHref);
    const back = new URL('../', source);
    back.searchParams.set('lang', language(selectedLanguage));
    const requested = source.searchParams.get('returnTo');
    if (requested) {
      try {
        const candidate = new URL(requested, back);
        if (candidate.origin === back.origin && candidate.pathname === back.pathname
            && !candidate.username && !candidate.password) {
          copyRoute(candidate, back);
          back.searchParams.set('lang', language(candidate.searchParams.get('lang') || selectedLanguage));
        }
      } catch { /* An invalid return destination uses the known application route. */ }
    }
    return back.href;
  }

  window.PRIMSERV_PDF_NAVIGATION = Object.freeze({ toPdf, toApplication });
})();
