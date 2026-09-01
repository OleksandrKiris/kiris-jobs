(() => {
  'use strict';

  window.RECRUITMENT_CONFIG = Object.freeze({
    version: '8.3.0',
    brand: 'Citronex / PPO Siechnice',
    company: 'Przedsiębiorstwo Produkcji Ogrodniczej „Siechnice” Sp. z o.o.',
    privacyUrl: 'https://pposiechnice.pl/?lang=en&page_id=981',
    timeZone: 'Europe/Warsaw',
    storageKey: 'citronex_recruitment_application_v8_3',
    draftMaxAgeMs: 24 * 60 * 60 * 1000,
    maxMailtoLength: 6200,
    recruiters: Object.freeze([
      Object.freeze({ id: 'yana', name: 'Yana Radushynska', email: 'yana.radushynska@pposiechnice.pl', initials: 'YR' }),
      Object.freeze({ id: 'yuliia', name: 'Yuliia Korniienko', email: 'yuliia.korniienko@pposiechnice.pl', initials: 'YK' }),
      Object.freeze({ id: 'fariz', name: 'Fariz Injaev', email: 'fariz.injaev@pposiechnice.pl', initials: 'FI' }),
      Object.freeze({ id: 'oleksandr', name: 'Oleksandr Kiris', email: 'oleksandr.kiris@pposiechnice.pl', initials: 'OK' }),
      Object.freeze({ id: 'maksym', name: 'Maksym Saliuk', email: 'maksym.saliuk@pposiechnice.pl', initials: 'MS' }),
      Object.freeze({ id: 'anastasiia', name: 'Anastasiia Derepa', email: 'anastasiia.derepa@citronex.pl', initials: 'AD' })
    ]),
    locations: Object.freeze([
      Object.freeze({ id: 'siechnice', name: 'Siechnice', subtitle: 'Szklarnie · sortownia', address: 'ul. Opolska 30' }),
      Object.freeze({ id: 'ryczywol', name: 'Ryczywół / Kozienice', subtitle: 'Szklarnie', address: 'woj. mazowieckie' }),
      Object.freeze({ id: 'bogatynia', name: 'Bogatynia', subtitle: 'Szklarnie · sortownia', address: 'woj. dolnośląskie' }),
      Object.freeze({ id: 'zgorzelec', name: 'Zgorzelec', subtitle: 'Banany · sprzątanie', address: 'woj. dolnośląskie' }),
      Object.freeze({ id: 'pruszcz', name: 'Pruszcz Gdański', subtitle: 'Magazyn bananów', address: 'woj. pomorskie' }),
      Object.freeze({ id: 'any', name: 'Dowolna lokalizacja', subtitle: 'Rekruter dobierze ofertę', address: 'do ustalenia' })
    ]),
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
