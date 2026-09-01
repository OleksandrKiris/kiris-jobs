(() => {
  'use strict';

  window.RECRUITMENT_CONFIG = Object.freeze({
    version: '6.0.0',
    brand: 'Citronex / PPO Siechnice',
    company: 'Przedsiębiorstwo Produkcji Ogrodniczej „Siechnice” Sp. z o.o.',
    privacyUrl: './privacy.html',
    timeZone: 'Europe/Warsaw',
    storageKey: 'citronex_recruitment_application_v6',
    draftMaxAgeMs: 24 * 60 * 60 * 1000,
    maxFiles: 12,
    maxFileBytes: 8 * 1024 * 1024,
    maxTotalFileBytes: 12 * 1024 * 1024,
    maxMailtoLength: 7000,
    allowedExtensions: Object.freeze(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'doc', 'docx']),
    recruiters: Object.freeze([
      Object.freeze({ id: 'yana', name: 'Yana Radushynska', email: 'yana.radushynska@pposiechnice.pl', initials: 'YR' }),
      Object.freeze({ id: 'yuliia', name: 'Yuliia Korniienko', email: 'yuliia.korniienko@pposiechnice.pl', initials: 'YK' }),
      Object.freeze({ id: 'fariz', name: 'Fariz Injaev', email: 'fariz.injaev@pposiechnice.pl', initials: 'FI' }),
      Object.freeze({ id: 'oleksandr', name: 'Oleksandr Kiris', email: 'oleksandr.kiris@pposiechnice.pl', initials: 'OK' }),
      Object.freeze({ id: 'maksym', name: 'Maksym Saliuk', email: 'maksym.saliuk@pposiechnice.pl', initials: 'MS' }),
      Object.freeze({ id: 'anastasiia', name: 'Anastasiia Derepa', email: 'anastasiia.derepa@citronex.pl', initials: 'AD' })
    ]),
    locations: Object.freeze([
      Object.freeze({ id: 'siechnice', name: 'Siechnice', detailKey: 'greenhouseSorting', address: 'ul. Opolska 30, Siechnice' }),
      Object.freeze({ id: 'ryczywol', name: 'Ryczywół / Kozienice', detailKey: 'greenhouse', address: 'woj. mazowieckie' }),
      Object.freeze({ id: 'bogatynia', name: 'Bogatynia', detailKey: 'greenhouseSorting', address: 'woj. dolnośląskie' }),
      Object.freeze({ id: 'zgorzelec', name: 'Zgorzelec', detailKey: 'bananaCleaning', address: 'woj. dolnośląskie' }),
      Object.freeze({ id: 'pruszcz', name: 'Pruszcz Gdański', detailKey: 'bananaWarehouse', address: 'woj. pomorskie' }),
      Object.freeze({ id: 'any', name: 'Dowolna lokalizacja', detailKey: 'recruiterChoice', address: 'do ustalenia' })
    ]),
    documentTypes: Object.freeze([
      Object.freeze({ id: 'passport' }),
      Object.freeze({ id: 'visaResidence' }),
      Object.freeze({ id: 'peselUkr' }),
      Object.freeze({ id: 'workPermit' }),
      Object.freeze({ id: 'driver' }),
      Object.freeze({ id: 'qualification' }),
      Object.freeze({ id: 'cv' }),
      Object.freeze({ id: 'other' }),
      Object.freeze({ id: 'noneYet' })
    ]),
    queryParams: Object.freeze({
      language: 'lang', recruiter: 'recruiter', source: 'src', campaign: 'campaign', vacancy: 'vacancy', location: 'location'
    }),
    excelColumns: Object.freeze([
      'ID zgłoszenia', 'Data zgłoszenia', 'SLA do', 'Język', 'Rekruter', 'E-mail rekrutera',
      'Preferowana lokalizacja', 'Imię', 'Nazwisko', 'Telefon', 'Komunikator', 'E-mail kandydata',
      'Obywatelstwo', 'Kraj pobytu', 'Miasto', 'Wiek', 'W Polsce', 'Dokument pobytowy',
      'Stanowisko', 'Doświadczenie', 'Gotowość', 'Praca zmianowa', 'Zakwaterowanie',
      'Źródło deklarowane', 'Źródło linku', 'Kampania', 'Wakacja / oferta',
      'Typy dokumentów', 'Nazwy załączników', 'Liczba załączników', 'Komentarz',
      'Status', 'Data pierwszego kontaktu', 'Liczba prób kontaktu', 'Następny kontakt',
      'Wynik rozmowy', 'Decyzja', 'Powód odmowy', 'Uwagi rekrutera'
    ])
  });
})();
