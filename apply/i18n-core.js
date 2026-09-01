(() => {
  'use strict';

  const languages = Object.freeze({
    pl: { flag: '🇵🇱', native: 'Polski', english: 'Polish', direction: 'ltr' },
    uk: { flag: '🇺🇦', native: 'Українська', english: 'Ukrainian', direction: 'ltr' },
    ru: { flag: '🇷🇺', native: 'Русский', english: 'Russian', direction: 'ltr' },
    en: { flag: '🇬🇧', native: 'English', english: 'English', direction: 'ltr' },
    ka: { flag: '🇬🇪', native: 'ქართული', english: 'Georgian', direction: 'ltr' },
    az: { flag: '🇦🇿', native: 'Azərbaycan dili', english: 'Azerbaijani', direction: 'ltr' },
    hy: { flag: '🇦🇲', native: 'Հայերեն', english: 'Armenian', direction: 'ltr' },
    tr: { flag: '🇹🇷', native: 'Türkçe', english: 'Turkish', direction: 'ltr' },
    uz: { flag: '🇺🇿', native: 'O‘zbekcha', english: 'Uzbek', direction: 'ltr' },
    ky: { flag: '🇰🇬', native: 'Кыргызча', english: 'Kyrgyz', direction: 'ltr' },
    tg: { flag: '🇹🇯', native: 'Тоҷикӣ', english: 'Tajik', direction: 'ltr' },
    kk: { flag: '🇰🇿', native: 'Қазақша', english: 'Kazakh', direction: 'ltr' },
    hi: { flag: '🇮🇳', native: 'हिन्दी', english: 'Hindi', direction: 'ltr' },
    bn: { flag: '🇧🇩', native: 'বাংলা', english: 'Bengali', direction: 'ltr' },
    ne: { flag: '🇳🇵', native: 'नेपाली', english: 'Nepali', direction: 'ltr' },
    ur: { flag: '🇵🇰', native: 'اردو', english: 'Urdu', direction: 'rtl' },
    si: { flag: '🇱🇰', native: 'සිංහල', english: 'Sinhala', direction: 'ltr' },
    fil: { flag: '🇵🇭', native: 'Filipino', english: 'Filipino', direction: 'ltr' },
    id: { flag: '🇮🇩', native: 'Bahasa Indonesia', english: 'Indonesian', direction: 'ltr' },
    vi: { flag: '🇻🇳', native: 'Tiếng Việt', english: 'Vietnamese', direction: 'ltr' }
  });

  const en = {
    languageTitle: 'Choose your language',
    languageSubtitle: 'The whole application will be displayed in the selected language.',
    languageSearch: 'Search by language name or code…',
    trustPrivate: 'No passport scans',
    trustMobile: 'Works on a phone',
    trustControl: 'You confirm sending',
    recruiterTitle: 'Choose your recruiter',
    recruiterSubtitle: 'Select the person who sent you this link or the recruiter you want to contact.',
    recruiterRequired: 'A recruiter must be selected before the application can be completed.',
    suggested: 'Suggested by the link',
    selectedRecruiter: 'Selected recruiter',
    changeLanguage: 'Change language',
    changeRecruiter: 'Change recruiter',
    recruiterEmail: 'The completed email will be addressed to this person.',
    stepContactTitle: 'Contact details',
    stepContactSubtitle: 'How can the recruiter contact you?',
    stepLocationTitle: 'Location and documents',
    stepLocationSubtitle: 'Tell us where you are now and what documents you have.',
    stepWorkTitle: 'Work preferences',
    stepWorkSubtitle: 'Tell us what kind of work you are looking for.',
    reviewTitle: 'Check your application',
    reviewSubtitle: 'Review the data and selected recruiter before opening your email app.',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone number with country code',
    phoneHint: 'Use an international format, for example +380…, +995…, +998….',
    messenger: 'Preferred messenger',
    email: 'Your email (optional)',
    citizenship: 'Citizenship',
    country: 'Current country',
    city: 'Current city',
    age: 'Age',
    inPoland: 'Are you currently in Poland?',
    documents: 'Documents for stay or work in Poland',
    job: 'What kind of work are you interested in?',
    experience: 'Work experience (optional)',
    experienceHint: 'Briefly describe your previous work, duties and how long you worked.',
    start: 'When can you start?',
    shift: 'Can you work shifts?',
    housing: 'Do you need accommodation?',
    source: 'Where did you hear about the vacancy?',
    comment: 'Additional comment (optional)',
    safety: 'Do not enter or send passport scans, PESEL, banking details, passwords or medical documents in this form.',
    consentBefore: 'I confirm that the information is correct, I agree to be contacted about employment and I have read the',
    privacyLink: 'privacy information',
    required: 'Required field',
    invalidPhone: 'Enter a valid international phone number containing at least 7 digits.',
    invalidEmail: 'Enter a valid email address or leave the field empty.',
    invalidAge: 'The application is available only to people aged 18 or over.',
    selectOption: 'Select an option',
    back: 'Back',
    continue: 'Continue',
    checkApplication: 'Check application',
    edit: 'Edit data',
    sendEmail: 'Open email and send',
    copyApplication: 'Copy application',
    shareApplication: 'Share application',
    downloadTxt: 'Download TXT',
    newApplication: 'New application',
    copied: 'The application has been copied.',
    shared: 'The system sharing window has been opened.',
    shareUnavailable: 'Sharing is not available on this device. The application has been copied instead.',
    downloadReady: 'The TXT file has been prepared.',
    mailInfo: 'Your email application will open with a prepared message addressed to the selected recruiter. The website cannot press Send for you.',
    mailLong: 'The message is long. Some email applications may truncate it. If anything is missing, use “Copy application” or download the TXT file.',
    mailOpened: 'The email application has been opened. Return here if you need to copy the application or select another recruiter.',
    draftFound: 'An unfinished application was found on this device.',
    resumeDraft: 'Continue application',
    discardDraft: 'Start again',
    noLanguages: 'No matching language was found.',
    formId: 'Application ID',
    recipient: 'Recipient',
    sourceFromLink: 'Campaign source',
    otherOptions: 'Other sending options',
    requiredMark: 'required',
    options: {
      messenger: { whatsapp: 'WhatsApp', viber: 'Viber', telegram: 'Telegram', phone: 'Phone calls only', other: 'Other' },
      yesNo: { yes: 'Yes', no: 'No' },
      documents: { none: 'No Polish documents', visa: 'Polish visa', residence: 'Residence card / permit', pesel: 'PESEL UKR / temporary protection', other: 'Other document', unknown: 'I do not know' },
      jobs: { greenhouse: 'Greenhouse work', packing: 'Sorting and packing', warehouse: 'Warehouse and logistics', production: 'Production', cleaning: 'Cleaning', driver: 'Driver', technical: 'Technical work', other: 'Other work' },
      starts: { now: 'Immediately', d7: 'Within 7 days', d14: 'Within 14 days', d30: 'Within 30 days', later: 'Later' },
      shifts: { yes: 'Yes', no: 'No', depends: 'Depends on the schedule' },
      sources: { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', telegram: 'Telegram', whatsapp: 'WhatsApp', viber: 'Viber', referral: 'Friend / recommendation', recruiter: 'Recruiter / agency', other: 'Other' }
    }
  };

  const pl = {
    languageTitle: 'Wybierz język', languageSubtitle: 'Cały formularz zostanie wyświetlony w wybranym języku.', languageSearch: 'Wyszukaj język lub kod…',
    trustPrivate: 'Bez skanów paszportu', trustMobile: 'Wygodne na telefonie', trustControl: 'Ty potwierdzasz wysłanie',
    recruiterTitle: 'Wybierz rekrutera', recruiterSubtitle: 'Wybierz osobę, która wysłała Ci ten link, albo rekrutera, z którym chcesz się skontaktować.', recruiterRequired: 'Przed wypełnieniem zgłoszenia trzeba wybrać rekrutera.', suggested: 'Polecany przez link', selectedRecruiter: 'Wybrany rekruter', changeLanguage: 'Zmień język', changeRecruiter: 'Zmień rekrutera', recruiterEmail: 'Gotowa wiadomość e-mail zostanie zaadresowana do tej osoby.',
    stepContactTitle: 'Dane kontaktowe', stepContactSubtitle: 'Jak rekruter może się z Tobą skontaktować?', stepLocationTitle: 'Miejsce i dokumenty', stepLocationSubtitle: 'Podaj, gdzie obecnie przebywasz i jakie masz dokumenty.', stepWorkTitle: 'Preferencje dotyczące pracy', stepWorkSubtitle: 'Powiedz nam, jakiej pracy szukasz.', reviewTitle: 'Sprawdź zgłoszenie', reviewSubtitle: 'Sprawdź dane i wybranego rekrutera przed otwarciem poczty.',
    firstName: 'Imię', lastName: 'Nazwisko', phone: 'Telefon z kodem kraju', phoneHint: 'Użyj formatu międzynarodowego, np. +380…, +995…, +998….', messenger: 'Preferowany komunikator', email: 'Twój e-mail (opcjonalnie)', citizenship: 'Obywatelstwo', country: 'Kraj aktualnego pobytu', city: 'Miasto', age: 'Wiek', inPoland: 'Czy obecnie jesteś w Polsce?', documents: 'Dokumenty dotyczące pobytu lub pracy w Polsce', job: 'Jakiego rodzaju pracy szukasz?', experience: 'Doświadczenie zawodowe (opcjonalnie)', experienceHint: 'Krótko opisz poprzednią pracę, obowiązki i okres zatrudnienia.', start: 'Kiedy możesz rozpocząć pracę?', shift: 'Czy możesz pracować zmianowo?', housing: 'Czy potrzebujesz zakwaterowania?', source: 'Skąd wiesz o ofercie?', comment: 'Dodatkowy komentarz (opcjonalnie)',
    safety: 'Nie wpisuj i nie wysyłaj przez formularz skanów paszportu, numeru PESEL, danych bankowych, haseł ani dokumentacji medycznej.', consentBefore: 'Potwierdzam poprawność danych, wyrażam zgodę na kontakt w sprawie zatrudnienia i zapoznałem/-am się z', privacyLink: 'informacją o prywatności',
    required: 'Pole wymagane', invalidPhone: 'Podaj poprawny międzynarodowy numer telefonu zawierający co najmniej 7 cyfr.', invalidEmail: 'Podaj poprawny adres e-mail albo pozostaw pole puste.', invalidAge: 'Zgłoszenie jest dostępne wyłącznie dla osób, które ukończyły 18 lat.', selectOption: 'Wybierz opcję', back: 'Wstecz', continue: 'Dalej', checkApplication: 'Sprawdź zgłoszenie', edit: 'Edytuj dane', sendEmail: 'Otwórz pocztę i wyślij', copyApplication: 'Kopiuj zgłoszenie', shareApplication: 'Udostępnij zgłoszenie', downloadTxt: 'Pobierz TXT', newApplication: 'Nowe zgłoszenie', copied: 'Zgłoszenie zostało skopiowane.', shared: 'Otwarto systemowe okno udostępniania.', shareUnavailable: 'Udostępnianie nie jest dostępne. Zgłoszenie zostało skopiowane.', downloadReady: 'Plik TXT został przygotowany.', mailInfo: 'Otworzy się aplikacja pocztowa z gotową wiadomością do wybranego rekrutera. Strona nie może nacisnąć „Wyślij” za Ciebie.', mailLong: 'Wiadomość jest długa. Niektóre aplikacje pocztowe mogą ją skrócić. W razie problemu skopiuj zgłoszenie albo pobierz TXT.', mailOpened: 'Aplikacja pocztowa została otwarta. Wróć tutaj, jeżeli chcesz skopiować zgłoszenie lub zmienić rekrutera.', draftFound: 'Na tym urządzeniu znaleziono niedokończone zgłoszenie.', resumeDraft: 'Kontynuuj zgłoszenie', discardDraft: 'Zacznij od nowa', noLanguages: 'Nie znaleziono języka.', formId: 'ID zgłoszenia', recipient: 'Odbiorca', sourceFromLink: 'Źródło kampanii', otherOptions: 'Inne opcje wysłania', requiredMark: 'wymagane',
    options: {
      messenger: { whatsapp: 'WhatsApp', viber: 'Viber', telegram: 'Telegram', phone: 'Tylko rozmowy telefoniczne', other: 'Inny' },
      yesNo: { yes: 'Tak', no: 'Nie' },
      documents: { none: 'Brak polskich dokumentów', visa: 'Polska wiza', residence: 'Karta pobytu / zezwolenie na pobyt', pesel: 'PESEL UKR / ochrona czasowa', other: 'Inny dokument', unknown: 'Nie wiem' },
      jobs: { greenhouse: 'Praca w szklarni', packing: 'Sortowanie i pakowanie', warehouse: 'Magazyn i logistyka', production: 'Produkcja', cleaning: 'Sprzątanie', driver: 'Kierowca', technical: 'Praca techniczna', other: 'Inna praca' },
      starts: { now: 'Natychmiast', d7: 'W ciągu 7 dni', d14: 'W ciągu 14 dni', d30: 'W ciągu 30 dni', later: 'Później' },
      shifts: { yes: 'Tak', no: 'Nie', depends: 'Zależy od grafiku' },
      sources: { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', telegram: 'Telegram', whatsapp: 'WhatsApp', viber: 'Viber', referral: 'Znajomy / polecenie', recruiter: 'Rekruter / agencja', other: 'Inne' }
    }
  };

  const ru = {
    languageTitle: 'Выберите язык', languageSubtitle: 'Вся анкета будет показана на выбранном языке.', languageSearch: 'Найти язык по названию или коду…',
    trustPrivate: 'Без сканов паспорта', trustMobile: 'Удобно на телефоне', trustControl: 'Отправку подтверждаете вы',
    recruiterTitle: 'Выберите рекрутера', recruiterSubtitle: 'Выберите человека, который отправил вам ссылку, или рекрутера, с которым хотите связаться.', recruiterRequired: 'Перед заполнением анкеты необходимо выбрать рекрутера.', suggested: 'Рекомендован ссылкой', selectedRecruiter: 'Выбранный рекрутер', changeLanguage: 'Изменить язык', changeRecruiter: 'Изменить рекрутера', recruiterEmail: 'Готовое письмо будет адресовано этому человеку.',
    stepContactTitle: 'Контактные данные', stepContactSubtitle: 'Как рекрутер может с вами связаться?', stepLocationTitle: 'Место и документы', stepLocationSubtitle: 'Укажите, где вы сейчас находитесь и какие у вас документы.', stepWorkTitle: 'Предпочтения по работе', stepWorkSubtitle: 'Расскажите, какую работу вы ищете.', reviewTitle: 'Проверьте анкету', reviewSubtitle: 'Проверьте данные и выбранного рекрутера перед открытием почты.',
    firstName: 'Имя', lastName: 'Фамилия', phone: 'Телефон с кодом страны', phoneHint: 'Используйте международный формат, например +380…, +995…, +998….', messenger: 'Предпочитаемый мессенджер', email: 'Ваш email (необязательно)', citizenship: 'Гражданство', country: 'Страна текущего проживания', city: 'Город', age: 'Возраст', inPoland: 'Вы сейчас находитесь в Польше?', documents: 'Документы для пребывания или работы в Польше', job: 'Какая работа вас интересует?', experience: 'Опыт работы (необязательно)', experienceHint: 'Кратко опишите прошлую работу, обязанности и продолжительность.', start: 'Когда вы готовы начать работу?', shift: 'Готовы работать посменно?', housing: 'Нужно жильё?', source: 'Откуда вы узнали о вакансии?', comment: 'Дополнительный комментарий (необязательно)',
    safety: 'Не вводите и не отправляйте через форму сканы паспорта, PESEL, банковские данные, пароли или медицинские документы.', consentBefore: 'Подтверждаю правильность данных, согласен(на) на контакт по поводу работы и ознакомился(-ась) с', privacyLink: 'информацией о конфиденциальности',
    required: 'Обязательное поле', invalidPhone: 'Введите корректный международный номер телефона, содержащий не менее 7 цифр.', invalidEmail: 'Введите корректный email или оставьте поле пустым.', invalidAge: 'Анкету могут отправлять только лица старше 18 лет.', selectOption: 'Выберите вариант', back: 'Назад', continue: 'Продолжить', checkApplication: 'Проверить анкету', edit: 'Изменить данные', sendEmail: 'Открыть почту и отправить', copyApplication: 'Скопировать анкету', shareApplication: 'Поделиться анкетой', downloadTxt: 'Скачать TXT', newApplication: 'Новая анкета', copied: 'Анкета скопирована.', shared: 'Открыто системное окно отправки.', shareUnavailable: 'Функция отправки недоступна. Анкета скопирована.', downloadReady: 'TXT-файл подготовлен.', mailInfo: 'Откроется почтовое приложение с готовым письмом выбранному рекрутеру. Сайт не может нажать «Отправить» вместо вас.', mailLong: 'Письмо получилось длинным. Некоторые почтовые приложения могут его обрезать. Используйте копирование анкеты или TXT.', mailOpened: 'Почтовое приложение открыто. Вернитесь сюда, если нужно скопировать анкету или изменить рекрутера.', draftFound: 'На устройстве найдена незавершённая анкета.', resumeDraft: 'Продолжить анкету', discardDraft: 'Начать заново', noLanguages: 'Язык не найден.', formId: 'ID анкеты', recipient: 'Получатель', sourceFromLink: 'Источник кампании', otherOptions: 'Другие способы отправки', requiredMark: 'обязательно',
    options: {
      messenger: { whatsapp: 'WhatsApp', viber: 'Viber', telegram: 'Telegram', phone: 'Только телефонные звонки', other: 'Другой' },
      yesNo: { yes: 'Да', no: 'Нет' },
      documents: { none: 'Нет польских документов', visa: 'Польская виза', residence: 'Карта побыту / разрешение на проживание', pesel: 'PESEL UKR / временная защита', other: 'Другой документ', unknown: 'Не знаю' },
      jobs: { greenhouse: 'Работа в теплице', packing: 'Сортировка и упаковка', warehouse: 'Склад и логистика', production: 'Производство', cleaning: 'Уборка', driver: 'Водитель', technical: 'Техническая работа', other: 'Другая работа' },
      starts: { now: 'Сразу', d7: 'В течение 7 дней', d14: 'В течение 14 дней', d30: 'В течение 30 дней', later: 'Позже' },
      shifts: { yes: 'Да', no: 'Нет', depends: 'Зависит от графика' },
      sources: { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', telegram: 'Telegram', whatsapp: 'WhatsApp', viber: 'Viber', referral: 'Знакомый / рекомендация', recruiter: 'Рекрутер / агентство', other: 'Другое' }
    }
  };

  const uk = {
    languageTitle: 'Оберіть мову', languageSubtitle: 'Уся анкета буде показана обраною мовою.', languageSearch: 'Знайти мову за назвою або кодом…',
    trustPrivate: 'Без сканів паспорта', trustMobile: 'Зручно на телефоні', trustControl: 'Відправлення підтверджуєте ви',
    recruiterTitle: 'Оберіть рекрутера', recruiterSubtitle: 'Оберіть людину, яка надіслала вам посилання, або рекрутера, з яким хочете зв’язатися.', recruiterRequired: 'Перед заповненням анкети потрібно обрати рекрутера.', suggested: 'Рекомендований посиланням', selectedRecruiter: 'Обраний рекрутер', changeLanguage: 'Змінити мову', changeRecruiter: 'Змінити рекрутера', recruiterEmail: 'Готовий лист буде адресовано цій людині.',
    stepContactTitle: 'Контактні дані', stepContactSubtitle: 'Як рекрутер може з вами зв’язатися?', stepLocationTitle: 'Місце та документи', stepLocationSubtitle: 'Вкажіть, де ви зараз перебуваєте та які маєте документи.', stepWorkTitle: 'Побажання щодо роботи', stepWorkSubtitle: 'Розкажіть, яку роботу ви шукаєте.', reviewTitle: 'Перевірте анкету', reviewSubtitle: 'Перевірте дані та обраного рекрутера перед відкриттям пошти.',
    firstName: 'Ім’я', lastName: 'Прізвище', phone: 'Телефон із кодом країни', phoneHint: 'Використовуйте міжнародний формат, наприклад +380…, +995…, +998….', messenger: 'Бажаний месенджер', email: 'Ваш email (необов’язково)', citizenship: 'Громадянство', country: 'Країна поточного перебування', city: 'Місто', age: 'Вік', inPoland: 'Ви зараз перебуваєте в Польщі?', documents: 'Документи для перебування або роботи в Польщі', job: 'Яка робота вас цікавить?', experience: 'Досвід роботи (необов’язково)', experienceHint: 'Коротко опишіть попередню роботу, обов’язки та тривалість.', start: 'Коли готові почати роботу?', shift: 'Готові працювати позмінно?', housing: 'Потрібне житло?', source: 'Звідки ви дізналися про вакансію?', comment: 'Додатковий коментар (необов’язково)',
    safety: 'Не вводьте і не надсилайте через форму скани паспорта, PESEL, банківські дані, паролі або медичні документи.', consentBefore: 'Підтверджую правильність даних, погоджуюся на контакт щодо роботи та ознайомився(-лася) з', privacyLink: 'інформацією про конфіденційність',
    required: 'Обов’язкове поле', invalidPhone: 'Введіть правильний міжнародний номер телефону, що містить щонайменше 7 цифр.', invalidEmail: 'Введіть правильний email або залиште поле порожнім.', invalidAge: 'Анкету можуть надсилати лише особи віком від 18 років.', selectOption: 'Оберіть варіант', back: 'Назад', continue: 'Продовжити', checkApplication: 'Перевірити анкету', edit: 'Змінити дані', sendEmail: 'Відкрити пошту й надіслати', copyApplication: 'Скопіювати анкету', shareApplication: 'Поділитися анкетою', downloadTxt: 'Завантажити TXT', newApplication: 'Нова анкета', copied: 'Анкету скопійовано.', shared: 'Відкрито системне вікно надсилання.', shareUnavailable: 'Функція надсилання недоступна. Анкету скопійовано.', downloadReady: 'TXT-файл підготовлено.', mailInfo: 'Відкриється поштова програма з готовим листом обраному рекрутеру. Сайт не може натиснути «Надіслати» замість вас.', mailLong: 'Лист вийшов довгим. Деякі поштові програми можуть його скоротити. Скористайтеся копіюванням анкети або TXT.', mailOpened: 'Поштову програму відкрито. Поверніться сюди, якщо треба скопіювати анкету або змінити рекрутера.', draftFound: 'На пристрої знайдено незавершену анкету.', resumeDraft: 'Продовжити анкету', discardDraft: 'Почати заново', noLanguages: 'Мову не знайдено.', formId: 'ID анкети', recipient: 'Одержувач', sourceFromLink: 'Джерело кампанії', otherOptions: 'Інші способи надсилання', requiredMark: 'обов’язково',
    options: {
      messenger: { whatsapp: 'WhatsApp', viber: 'Viber', telegram: 'Telegram', phone: 'Лише телефонні дзвінки', other: 'Інший' },
      yesNo: { yes: 'Так', no: 'Ні' },
      documents: { none: 'Немає польських документів', visa: 'Польська віза', residence: 'Карта побиту / дозвіл на проживання', pesel: 'PESEL UKR / тимчасовий захист', other: 'Інший документ', unknown: 'Не знаю' },
      jobs: { greenhouse: 'Робота в теплиці', packing: 'Сортування та пакування', warehouse: 'Склад і логістика', production: 'Виробництво', cleaning: 'Прибирання', driver: 'Водій', technical: 'Технічна робота', other: 'Інша робота' },
      starts: { now: 'Одразу', d7: 'Протягом 7 днів', d14: 'Протягом 14 днів', d30: 'Протягом 30 днів', later: 'Пізніше' },
      shifts: { yes: 'Так', no: 'Ні', depends: 'Залежить від графіка' },
      sources: { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', telegram: 'Telegram', whatsapp: 'WhatsApp', viber: 'Viber', referral: 'Знайомий / рекомендація', recruiter: 'Рекрутер / агенція', other: 'Інше' }
    }
  };

  window.RECRUITMENT_I18N = {
    languages,
    locales: { en, pl, ru, uk },
    internal: Object.freeze({
      messenger: { whatsapp: 'WhatsApp', viber: 'Viber', telegram: 'Telegram', phone: 'Tylko telefon', other: 'Inny' },
      yesNo: { yes: 'Tak', no: 'Nie' },
      documents: { none: 'Brak polskich dokumentów', visa: 'Polska wiza', residence: 'Karta pobytu / zezwolenie na pobyt', pesel: 'PESEL UKR / ochrona czasowa', other: 'Inny dokument', unknown: 'Nie wiem' },
      jobs: { greenhouse: 'Praca w szklarni', packing: 'Sortowanie i pakowanie', warehouse: 'Magazyn i logistyka', production: 'Produkcja', cleaning: 'Sprzątanie', driver: 'Kierowca', technical: 'Praca techniczna', other: 'Inna praca' },
      starts: { now: 'Natychmiast', d7: 'W ciągu 7 dni', d14: 'W ciągu 14 dni', d30: 'W ciągu 30 dni', later: 'Później' },
      shifts: { yes: 'Tak', no: 'Nie', depends: 'Zależy od grafiku' },
      sources: { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', telegram: 'Telegram', whatsapp: 'WhatsApp', viber: 'Viber', referral: 'Znajomy / polecenie', recruiter: 'Rekruter / agencja', other: 'Inne' }
    })
  };
})();
