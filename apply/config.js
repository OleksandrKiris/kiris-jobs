(() => {
  'use strict';

  window.RECRUITMENT_CONFIG = Object.freeze({
    version: '3.0.0',
    brand: 'Rekrutacja PPO Siechnice',
    company: 'Przedsiębiorstwo Produkcji Ogrodniczej „Siechnice” Sp. z o.o.',
    storageKey: 'ppo_recruitment_application_v3',
    languageKey: 'ppo_recruitment_language_v3',
    recruiterKey: 'ppo_recruitment_recruiter_v3',
    privacyUrl: 'https://pposiechnice.pl/?lang=en&page_id=981',
    timeZone: 'Europe/Warsaw',
    maxMailtoLength: 7200,
    recruiters: Object.freeze([
      Object.freeze({ id: 'yana', name: 'Yana Radushynska', email: 'yana.radushynska@pposiechnice.pl', initials: 'YR' }),
      Object.freeze({ id: 'yuliia', name: 'Yuliia Korniienko', email: 'yuliia.korniienko@pposiechnice.pl', initials: 'YK' }),
      Object.freeze({ id: 'fariz', name: 'Fariz Injaev', email: 'fariz.injaev@pposiechnice.pl', initials: 'FI' }),
      Object.freeze({ id: 'oleksandr', name: 'Oleksandr Kiris', email: 'oleksandr.kiris@pposiechnice.pl', initials: 'OK' }),
      Object.freeze({ id: 'maksym', name: 'Maksym Saliuk', email: 'maksym.saliuk@pposiechnice.pl', initials: 'MS' }),
      Object.freeze({ id: 'anastasiia', name: 'Anastasiia Derepa', email: 'anastasiia.derepa@citronex.pl', initials: 'AD' })
    ]),
    queryParams: Object.freeze({
      language: 'lang',
      recruiter: 'recruiter',
      source: 'src',
      campaign: 'campaign',
      vacancy: 'vacancy'
    }),
    limits: Object.freeze({
      shortText: 100,
      email: 160,
      phone: 32,
      longText: 900
    }),
    excelColumns: Object.freeze([
      'ID zgłoszenia',
      'Data zgłoszenia',
      'Język',
      'Rekruter',
      'E-mail rekrutera',
      'Imię',
      'Nazwisko',
      'Telefon',
      'Komunikator',
      'E-mail kandydata',
      'Obywatelstwo',
      'Kraj pobytu',
      'Miasto',
      'Wiek',
      'Stanowisko',
      'Doświadczenie',
      'W Polsce',
      'Dokumenty',
      'Gotowość',
      'Praca zmianowa',
      'Zakwaterowanie',
      'Źródło deklarowane',
      'Źródło linku',
      'Kampania',
      'Wakacja / oferta',
      'Komentarz',
      'Status',
      'Pierwszy kontakt',
      'Następny kontakt',
      'Decyzja',
      'Uwagi rekrutera'
    ])
  });
})();
