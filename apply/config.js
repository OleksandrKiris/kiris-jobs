(() => {
  'use strict';

  window.CITRONEX_SIMPLE_CONFIG = Object.freeze({
    version: '16.0.0',
    brand: 'Citronex / PPO Siechnice',
    privacyUrl: 'https://pposiechnice.pl/?lang=en&page_id=981',
    pdfGeneratorUrl: './pdf/',
    timeZone: 'Europe/Warsaw',
    storageKey: 'citronex_simple_application_v16',
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
    locations: Object.freeze(['siechnice', 'ryczywol', 'bogatynia', 'zgorzelec', 'pruszcz', 'any']),
    queryParams: Object.freeze({
      language: 'lang', recruiter: 'recruiter', source: 'src', campaign: 'campaign', vacancy: 'vacancy',
      location: 'location', partner: 'partner', group: 'group'
    }),
    excelColumns: Object.freeze([
      'ID zgłoszenia', 'Data zgłoszenia', 'SLA do', 'Język', 'Rekruter', 'E-mail rekrutera',
      'Ankietę wypełnia', 'Osoba / partner wypełniający', 'Kod grupy / partnera',
      'Preferowana lokalizacja', 'Imię', 'Nazwisko', 'Telefon', 'Komunikator', 'E-mail kandydata',
      'Obywatelstwo', 'Kraj pobytu', 'Miasto', 'Wiek', 'W Polsce', 'Dokument pobytowy',
      'Stanowisko', 'Doświadczenie', 'Gotowość', 'Praca zmianowa', 'Zakwaterowanie',
      'Źródło deklarowane', 'Szczegóły źródła / polecający', 'Źródło linku', 'Kampania', 'Wakacja / oferta',
      'Komentarz', 'Status', 'Data pierwszego kontaktu', 'Liczba prób kontaktu', 'Następny kontakt',
      'Wynik rozmowy', 'Decyzja', 'Powód odmowy', 'Uwagi rekrutera'
    ])
  });
})();
