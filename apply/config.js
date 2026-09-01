(() => {
  'use strict';

  window.RECRUITMENT_CONFIG = Object.freeze({
    version: '4.0.0',
    brand: 'Rekrutacja PPO Siechnice',
    company: 'Przedsiębiorstwo Produkcji Ogrodniczej „Siechnice” Sp. z o.o.',
    storageKey: 'ppo_recruitment_application_v4',
    languageKey: 'ppo_recruitment_language_v4',
    recruiterKey: 'ppo_recruitment_recruiter_v4',
    privacyUrl: 'https://pposiechnice.pl/?lang=en&page_id=981',
    timeZone: 'Europe/Warsaw',
    maxMailtoLength: 7600,
    maxFiles: 12,
    maxFileBytes: 8 * 1024 * 1024,
    maxTotalFileBytes: 12 * 1024 * 1024,
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
      vacancy: 'vacancy'
    }),
    limits: Object.freeze({
      shortText: 100,
      email: 160,
      phone: 32,
      longText: 900,
      mailLongText: 360
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
      'Deklarowany status dokumentów',
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
      'Status',
      'Pierwszy kontakt',
      'Następny kontakt',
      'Decyzja',
      'Uwagi rekrutera'
    ])
  });
})();
