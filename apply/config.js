(() => {
  'use strict';

  const MB = 1024 * 1024;

  window.RECRUITMENT_CONFIG = Object.freeze({
    version: '5.0.0',
    brand: 'Citronex / PPO Siechnice — Rekrutacja',
    company: 'Przedsiębiorstwo Produkcji Ogrodniczej „Siechnice” Sp. z o.o.',
    storageKey: 'ppo_recruitment_application_v5',
    languageKey: 'ppo_recruitment_language_v5',
    recruiterKey: 'ppo_recruitment_recruiter_v5',
    privacyUrl: 'https://pposiechnice.pl/?lang=en&page_id=981',
    timeZone: 'Europe/Warsaw',
    draftMaxAgeMs: 24 * 60 * 60 * 1000,
    slaHours: 24,
    maxMailtoLength: 7600,
    maxFiles: 8,
    maxFileBytes: 8 * MB,
    maxTotalFileBytes: 20 * MB,
    allowedExtensions: Object.freeze([
      'pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'doc', 'docx'
    ]),
    recruiters: Object.freeze([
      Object.freeze({ id: 'yana', name: 'Yana Radushynska', email: 'yana.radushynska@pposiechnice.pl', initials: 'YR' }),
      Object.freeze({ id: 'yuliia', name: 'Yuliia Korniienko', email: 'yuliia.korniienko@pposiechnice.pl', initials: 'YK' }),
      Object.freeze({ id: 'fariz', name: 'Fariz Injaev', email: 'fariz.injaev@pposiechnice.pl', initials: 'FI' }),
      Object.freeze({ id: 'oleksandr', name: 'Oleksandr Kiris', email: 'oleksandr.kiris@pposiechnice.pl', initials: 'OK' }),
      Object.freeze({ id: 'maksym', name: 'Maksym Saliuk', email: 'maksym.saliuk@pposiechnice.pl', initials: 'MS' }),
      Object.freeze({ id: 'anastasiia', name: 'Anastasiia Derepa', email: 'anastasiia.derepa@citronex.pl', initials: 'AD' })
    ]),
    locations: Object.freeze([
      Object.freeze({ id: 'siechnice', internal: 'Siechnice — szklarnie / sortownia' }),
      Object.freeze({ id: 'ryczywol', internal: 'Ryczywół / Kozienice — szklarnie' }),
      Object.freeze({ id: 'bogatynia', internal: 'Bogatynia — szklarnie / sortownia' }),
      Object.freeze({ id: 'zgorzelec', internal: 'Zgorzelec — magazyn bananów / sprzątanie' }),
      Object.freeze({ id: 'pruszcz', internal: 'Pruszcz Gdański — magazyn bananów' }),
      Object.freeze({ id: 'any', internal: 'Dowolna dostępna lokalizacja / do uzgodnienia' })
    ]),
    documentTypes: Object.freeze([
      Object.freeze({ id: 'passport', internal: 'Paszport / dokument tożsamości' }),
      Object.freeze({ id: 'visaResidence', internal: 'Wiza / karta pobytu / dokument pobytowy' }),
      Object.freeze({ id: 'peselUkr', internal: 'PESEL UKR / ochrona czasowa' }),
      Object.freeze({ id: 'workPermit', internal: 'Zezwolenie na pracę / oświadczenie / decyzja' }),
      Object.freeze({ id: 'driver', internal: 'Prawo jazdy / karta kierowcy / Code 95' }),
      Object.freeze({ id: 'qualification', internal: 'Uprawnienia / certyfikaty / dyplomy' }),
      Object.freeze({ id: 'cv', internal: 'CV / życiorys' }),
      Object.freeze({ id: 'other', internal: 'Inny dokument' }),
      Object.freeze({ id: 'noneYet', internal: 'Brak dokumentów do załączenia na tym etapie' })
    ]),
    queryParams: Object.freeze({
      language: 'lang',
      recruiter: 'recruiter',
      source: 'src',
      campaign: 'campaign',
      vacancy: 'vacancy',
      location: 'location'
    }),
    limits: Object.freeze({
      shortText: 100,
      email: 160,
      phone: 32,
      longText: 900,
      mailLongText: 320
    }),
    excelColumns: Object.freeze([
      'ID zgłoszenia',
      'Data zgłoszenia',
      'SLA do',
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
      'W Polsce',
      'Deklarowany status dokumentów',
      'Stanowisko',
      'Preferowana lokalizacja',
      'Doświadczenie',
      'Gotowość',
      'Praca zmianowa',
      'Zakwaterowanie',
      'Źródło deklarowane',
      'Źródło linku',
      'Kampania',
      'Wakacja / oferta',
      'Komentarz',
      'Rodzaje dokumentów dołączonych',
      'Nazwy załączników',
      'Liczba załączników',
      'Rozmiar załączników MB',
      'Status',
      'Data pierwszego kontaktu',
      'Próba kontaktu nr',
      'Wynik kontaktu',
      'Następny kontakt',
      'Decyzja',
      'Powód odmowy',
      'Dokumenty zweryfikowane',
      'Uwagi rekrutera'
    ])
  });
})();
