(() => {
  'use strict';

  window.CITRONEX_SIMPLE_CONFIG = Object.freeze({
    version: '17.0.0',
    brand: 'Citronex / PPO Siechnice',
    privacyUrl: 'https://pposiechnice.pl/?lang=en&page_id=981',
    pdfGeneratorUrl: './pdf/',
    timeZone: 'Europe/Warsaw',
    storageKey: 'citronex_screening_application_v17',
    draftMaxAgeMs: 24 * 60 * 60 * 1000,
    maxMailtoLength: 7600,
    recruiters: Object.freeze([
      Object.freeze({ id: 'yana', name: 'Yana Radushynska', email: 'yana.radushynska@pposiechnice.pl', phone: '+48 797 066 987', initials: 'YR' }),
      Object.freeze({ id: 'yuliia', name: 'Yuliia Korniienko', email: 'yuliia.korniienko@pposiechnice.pl', phone: '+48 506 845 667', initials: 'YK' }),
      Object.freeze({ id: 'fariz', name: 'Fariz Injaev', email: 'fariz.injaev@pposiechnice.pl', phone: '+48 504 165 739', initials: 'FI' }),
      Object.freeze({ id: 'oleksandr', name: 'Oleksandr Kiris', email: 'oleksandr.kiris@pposiechnice.pl', phone: '+48 502 251 384', initials: 'OK' }),
      Object.freeze({ id: 'maksym', name: 'Maksym Saliuk', email: 'maksym.saliuk@pposiechnice.pl', phone: '+48 506 845 637', initials: 'MS' }),
      Object.freeze({ id: 'anastasiia', name: 'Anastasiia Derepa', email: 'anastasiia.derepa@citronex.pl', phone: '+48 797 684 159', initials: 'AD' })
    ]),
    locations: Object.freeze(['siechnice', 'ryczywol', 'bogatynia', 'any']),
    queryParams: Object.freeze({
      language: 'lang', recruiter: 'recruiter', source: 'src', campaign: 'campaign', vacancy: 'vacancy',
      location: 'location', partner: 'partner', group: 'group'
    }),
    excelColumns: Object.freeze([
      'Dane osobowe / telefon / komunikator',
      'Narodowość',
      'Płeć',
      'Wiek',
      'Lokalizacja',
      'Na ile przyjazd',
      'Czy pracował fizycznie? Gdzie, jak długo?',
      'Wskaźniki wydajności / jakość / szybkie tempo',
      'Filmy i zrozumienie warunków pracy',
      'Praca po 10–12 godzin',
      'Ocena rekrutera',
      'Decyzja'
    ])
  });
})();
