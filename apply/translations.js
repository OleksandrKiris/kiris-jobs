(() => {
  'use strict';
  const I = window.RECRUITMENT_I18N;
  const E = window.RECRUITMENT_EXTRA_I18N;
  const M = window.RECRUITMENT_MOBILE_I18N || {};
  if (!I || !E) throw new Error('Translation sources are missing.');
const priority = ['pl','uk','ru','en','ka','az','hy','tr','uz'];
const custom = {
  en: {
    moreLanguages:'More languages', lessLanguages:'Show fewer languages', optional:'optional',
    rowOnlyTitle:'Simple application', rowOnlyLead:'Complete the form and send one Excel-ready row to the selected recruiter.',
    reviewLead:'Check the most important data before opening your email app.',
    sendRow:'Open email and send the row', sendHint:'The email will contain one Excel-ready TSV row only. No CV, PDF or document files are sent from this form.',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'Need a PDF?', pdfLead:'Use the separate PDF generator only when a recruiter asks for it.', pdfOpen:'Open PDF generator',
    formSaved:'Your draft is saved on this phone.', emailOpened:'Your email app has been opened. Check the recipient and press Send.',
    sectionSubmission:'Application source', sectionCandidate:'Candidate', sectionContact:'Contact', sectionWork:'Work',
    noValue:'Not provided', statusNew:'NEW', firstContact:'First contact within 24 hours',
    chooseOneRecruiter:'Choose one recruiter. The row will be sent only to this person.'
  },
  pl: {
    moreLanguages:'Więcej języków', lessLanguages:'Pokaż mniej języków', optional:'opcjonalnie',
    rowOnlyTitle:'Prosta ankieta', rowOnlyLead:'Wypełnij formularz i wyślij jeden gotowy wiersz do Excela wybranemu rekruterowi.',
    reviewLead:'Sprawdź najważniejsze dane przed otwarciem aplikacji pocztowej.',
    sendRow:'Otwórz e-mail i wyślij wiersz', sendHint:'W wiadomości znajdzie się tylko jeden gotowy wiersz TSV do Excela. Ten formularz nie wysyła CV, PDF ani dokumentów.',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'Potrzebujesz PDF?', pdfLead:'Użyj osobnego generatora PDF tylko wtedy, gdy poprosi o to rekruter.', pdfOpen:'Otwórz generator PDF',
    formSaved:'Wersja robocza jest zapisana na tym telefonie.', emailOpened:'Aplikacja pocztowa została otwarta. Sprawdź odbiorcę i naciśnij „Wyślij”.',
    sectionSubmission:'Źródło zgłoszenia', sectionCandidate:'Kandydat', sectionContact:'Kontakt', sectionWork:'Praca',
    noValue:'Nie podano', statusNew:'NOWY', firstContact:'Pierwszy kontakt do 24 godzin',
    chooseOneRecruiter:'Wybierz jednego rekrutera. Wiersz zostanie wysłany tylko do tej osoby.'
  },
  ru: {
    moreLanguages:'Другие языки', lessLanguages:'Скрыть дополнительные языки', optional:'необязательно',
    rowOnlyTitle:'Простая анкета', rowOnlyLead:'Заполните анкету и отправьте одну готовую строку для Excel выбранному рекрутеру.',
    reviewLead:'Проверьте основные данные перед открытием почты.',
    sendRow:'Открыть email и отправить строку', sendHint:'В письме будет только одна готовая TSV-строка для Excel. Эта анкета не отправляет CV, PDF или документы.',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'Нужен PDF?', pdfLead:'Откройте отдельный генератор PDF только тогда, когда это попросит рекрутер.', pdfOpen:'Открыть генератор PDF',
    formSaved:'Черновик сохранён на этом телефоне.', emailOpened:'Почта открыта. Проверьте получателя и нажмите «Отправить».',
    sectionSubmission:'Источник заявки', sectionCandidate:'Кандидат', sectionContact:'Контакты', sectionWork:'Работа',
    noValue:'Не указано', statusNew:'НОВЫЙ', firstContact:'Первый контакт в течение 24 часов',
    chooseOneRecruiter:'Выберите одного рекрутера. Строка будет отправлена только ему.'
  },
  uk: {
    moreLanguages:'Інші мови', lessLanguages:'Сховати додаткові мови', optional:'необов’язково',
    rowOnlyTitle:'Проста анкета', rowOnlyLead:'Заповніть анкету та надішліть один готовий рядок для Excel обраному рекрутеру.',
    reviewLead:'Перевірте основні дані перед відкриттям пошти.',
    sendRow:'Відкрити email і надіслати рядок', sendHint:'У листі буде лише один готовий TSV-рядок для Excel. Ця анкета не надсилає CV, PDF або документи.',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'Потрібен PDF?', pdfLead:'Використовуйте окремий генератор PDF лише тоді, коли про це попросить рекрутер.', pdfOpen:'Відкрити генератор PDF',
    formSaved:'Чернетку збережено на цьому телефоні.', emailOpened:'Пошту відкрито. Перевірте одержувача та натисніть «Надіслати».',
    sectionSubmission:'Джерело заявки', sectionCandidate:'Кандидат', sectionContact:'Контакти', sectionWork:'Робота',
    noValue:'Не вказано', statusNew:'НОВИЙ', firstContact:'Перший контакт протягом 24 годин',
    chooseOneRecruiter:'Оберіть одного рекрутера. Рядок буде надіслано лише йому.'
  },
  ka: {
    moreLanguages:'სხვა ენები', lessLanguages:'დამატებითი ენების დამალვა', optional:'სურვილისამებრ',
    rowOnlyTitle:'მარტივი განაცხადი', rowOnlyLead:'შეავსეთ ფორმა და გაუგზავნეთ Excel-ისთვის მზად ერთი სტრიქონი არჩეულ რეკრუტერს.',
    reviewLead:'ელფოსტის გახსნამდე გადაამოწმეთ მთავარი მონაცემები.',
    sendRow:'ელფოსტის გახსნა და სტრიქონის გაგზავნა', sendHint:'წერილში იქნება მხოლოდ Excel-ისთვის მზად ერთი TSV სტრიქონი. ეს ფორმა არ აგზავნის CV-ს, PDF-ს ან დოკუმენტებს.',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'გჭირდებათ PDF?', pdfLead:'გამოიყენეთ ცალკე PDF გენერატორი მხოლოდ რეკრუტერის მოთხოვნის შემთხვევაში.', pdfOpen:'PDF გენერატორის გახსნა',
    formSaved:'შავი ვერსია შენახულია ამ ტელეფონზე.', emailOpened:'ელფოსტა გაიხსნა. შეამოწმეთ მიმღები და დააჭირეთ გაგზავნას.',
    sectionSubmission:'განაცხადის წყარო', sectionCandidate:'კანდიდატი', sectionContact:'კონტაქტი', sectionWork:'სამუშაო',
    noValue:'არ არის მითითებული', statusNew:'ახალი', firstContact:'პირველი კონტაქტი 24 საათში',
    chooseOneRecruiter:'აირჩიეთ ერთი რეკრუტერი. სტრიქონი მხოლოდ მას გაეგზავნება.'
  },
  az: {
    moreLanguages:'Digər dillər', lessLanguages:'Əlavə dilləri gizlət', optional:'isteğe bağlı',
    rowOnlyTitle:'Sadə ərizə', rowOnlyLead:'Formanı doldurun və Excel üçün hazır bir sətri seçilmiş rekruterə göndərin.',
    reviewLead:'E-poçtu açmazdan əvvəl əsas məlumatları yoxlayın.',
    sendRow:'E-poçtu açın və sətri göndərin', sendHint:'Məktubda yalnız Excel üçün hazır bir TSV sətri olacaq. Bu forma CV, PDF və ya sənəd göndərmir.',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'PDF lazımdır?', pdfLead:'Ayrı PDF generatorundan yalnız rekruter istədikdə istifadə edin.', pdfOpen:'PDF generatorunu açın',
    formSaved:'Qaralama bu telefonda saxlanıldı.', emailOpened:'E-poçt tətbiqi açıldı. Alıcını yoxlayın və Göndər düyməsini basın.',
    sectionSubmission:'Müraciət mənbəyi', sectionCandidate:'Namizəd', sectionContact:'Əlaqə', sectionWork:'İş',
    noValue:'Göstərilməyib', statusNew:'YENİ', firstContact:'İlk əlaqə 24 saat ərzində',
    chooseOneRecruiter:'Bir rekruter seçin. Sətir yalnız ona göndəriləcək.'
  },
  hy: {
    moreLanguages:'Այլ լեզուներ', lessLanguages:'Թաքցնել լրացուցիչ լեզուները', optional:'ըստ ցանկության',
    rowOnlyTitle:'Պարզ հայտ', rowOnlyLead:'Լրացրեք ձևը և ընտրված հավաքագրողին ուղարկեք Excel-ի համար պատրաստ մեկ տող։',
    reviewLead:'Էլ․ փոստը բացելուց առաջ ստուգեք հիմնական տվյալները։',
    sendRow:'Բացել էլ․ փոստը և ուղարկել տողը', sendHint:'Նամակում կլինի միայն Excel-ի համար պատրաստ մեկ TSV տող։ Այս ձևը չի ուղարկում CV, PDF կամ փաստաթղթեր։',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'PDF պե՞տք է', pdfLead:'Օգտագործեք առանձին PDF գեներատորը միայն հավաքագրողի խնդրանքով։', pdfOpen:'Բացել PDF գեներատորը',
    formSaved:'Սևագիրը պահվել է այս հեռախոսում։', emailOpened:'Էլ․ փոստը բացվել է։ Ստուգեք ստացողին և սեղմեք Ուղարկել։',
    sectionSubmission:'Հայտի աղբյուր', sectionCandidate:'Թեկնածու', sectionContact:'Կապ', sectionWork:'Աշխատանք',
    noValue:'Նշված չէ', statusNew:'ՆՈՐ', firstContact:'Առաջին կապը 24 ժամվա ընթացքում',
    chooseOneRecruiter:'Ընտրեք մեկ հավաքագրող։ Տողը կուղարկվի միայն նրան։'
  },
  tr: {
    moreLanguages:'Diğer diller', lessLanguages:'Ek dilleri gizle', optional:'isteğe bağlı',
    rowOnlyTitle:'Basit başvuru', rowOnlyLead:'Formu doldurun ve Excel için hazır tek satırı seçilen işe alım uzmanına gönderin.',
    reviewLead:'E-posta uygulamasını açmadan önce temel bilgileri kontrol edin.',
    sendRow:'E-postayı aç ve satırı gönder', sendHint:'E-postada yalnızca Excel için hazır tek bir TSV satırı bulunur. Bu form CV, PDF veya belge göndermez.',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'PDF gerekiyor mu?', pdfLead:'Ayrı PDF oluşturucuyu yalnızca işe alım uzmanı istediğinde kullanın.', pdfOpen:'PDF oluşturucuyu aç',
    formSaved:'Taslak bu telefonda kaydedildi.', emailOpened:'E-posta uygulaması açıldı. Alıcıyı kontrol edin ve Gönder’e basın.',
    sectionSubmission:'Başvuru kaynağı', sectionCandidate:'Aday', sectionContact:'İletişim', sectionWork:'İş',
    noValue:'Belirtilmedi', statusNew:'YENİ', firstContact:'İlk iletişim 24 saat içinde',
    chooseOneRecruiter:'Bir işe alım uzmanı seçin. Satır yalnızca ona gönderilecektir.'
  },
  uz: {
    moreLanguages:'Boshqa tillar', lessLanguages:'Qo‘shimcha tillarni yashirish', optional:'ixtiyoriy',
    rowOnlyTitle:'Oddiy ariza', rowOnlyLead:'Formani to‘ldiring va Excel uchun tayyor bitta qatorni tanlangan rekruterga yuboring.',
    reviewLead:'Emailni ochishdan oldin asosiy ma’lumotlarni tekshiring.',
    sendRow:'Emailni ochish va qatorni yuborish', sendHint:'Xatda faqat Excel uchun tayyor bitta TSV qatori bo‘ladi. Bu forma CV, PDF yoki hujjat yubormaydi.',
    rowInstruction:'DANE DO EXCEL — WKLEJ PONIŻSZY WIERSZ DO PIERWSZEJ PUSTEJ KOMÓRKI A',
    pdfTitle:'PDF kerakmi?', pdfLead:'Alohida PDF generatoridan faqat rekruter so‘raganda foydalaning.', pdfOpen:'PDF generatorini ochish',
    formSaved:'Qoralama ushbu telefonda saqlandi.', emailOpened:'Email ilovasi ochildi. Qabul qiluvchini tekshiring va Yuborish tugmasini bosing.',
    sectionSubmission:'Ariza manbasi', sectionCandidate:'Nomzod', sectionContact:'Aloqa', sectionWork:'Ish',
    noValue:'Ko‘rsatilmagan', statusNew:'YANGI', firstContact:'Birinchi aloqa 24 soat ichida',
    chooseOneRecruiter:'Bitta rekruterni tanlang. Qator faqat unga yuboriladi.'
  }
};
const enCustom = custom.en;
const locales = {};
for (const [code, meta] of Object.entries(I.languages)) {
  const core = I.locales[code] || I.locales.en;
  const extra = (E.locales && E.locales[code]) || (E.locales && E.locales.en) || {};
  const mobile = M[code] || M.en || {};
  const c = { ...enCustom, ...(custom[code] || {}) };
  locales[code] = {
    chooseLanguage: core.languageTitle || I.locales.en.languageTitle,
    languageLead: extra.languageIntro || core.languageSubtitle || I.locales.en.languageSubtitle,
    languageSearch: core.languageSearch || I.locales.en.languageSearch,
    moreLanguages: c.moreLanguages,
    lessLanguages: c.lessLanguages,
    chooseRecruiter: core.recruiterTitle || I.locales.en.recruiterTitle,
    recruiterLead: extra.recruiterIntro || core.recruiterSubtitle || I.locales.en.recruiterSubtitle,
    chooseOneRecruiter: c.chooseOneRecruiter,
    selectedRecruiter: core.selectedRecruiter || I.locales.en.selectedRecruiter,
    changeLanguage: core.changeLanguage || I.locales.en.changeLanguage,
    changeRecruiter: core.changeRecruiter || I.locales.en.changeRecruiter,
    rowOnlyTitle: c.rowOnlyTitle,
    rowOnlyLead: c.rowOnlyLead,
    step1Title: extra.step1Title || core.stepContactTitle || I.locales.en.stepContactTitle,
    step1Lead: mobile.step1Subtitle || extra.step1Subtitle || core.stepContactSubtitle || I.locales.en.stepContactSubtitle,
    step2Title: extra.step2Title || core.stepLocationTitle || I.locales.en.stepLocationTitle,
    step2Lead: extra.step2Subtitle || core.stepLocationSubtitle || I.locales.en.stepLocationSubtitle,
    step3Title: extra.step3Title || core.stepWorkTitle || I.locales.en.stepWorkTitle,
    step3Lead: extra.step3Subtitle || core.stepWorkSubtitle || I.locales.en.stepWorkSubtitle,
    step4Title: mobile.step4Title || extra.step4Title || core.source || I.locales.en.source,
    step4Lead: mobile.step4Subtitle || extra.step4Subtitle || '',
    filledBy: extra.filledBy || mobile.filledBy || 'Who is completing the form?',
    self: mobile.self || extra.self || 'Candidate',
    representative: mobile.representative || extra.representative || 'Representative / partner',
    representativeName: extra.representativeName || 'Representative / partner name',
    representativeHint: extra.representativeNameHint || '',
    groupCode: extra.groupCode || 'Group / partner code',
    groupHint: extra.groupCodeHint || '',
    firstName: core.firstName,
    lastName: core.lastName,
    phone: core.phone,
    phoneHint: core.phoneHint,
    messenger: core.messenger,
    email: core.email,
    citizenship: core.citizenship,
    country: core.country,
    city: core.city,
    age: core.age,
    inPoland: core.inPoland,
    documents: core.documents,
    location: core.workLocation || extra.preferredLocation || 'Work location',
    locationHint: core.workLocationHint || extra.preferredLocationHint || '',
    job: core.job,
    start: core.start,
    shift: core.shift,
    housing: core.housing,
    source: core.source,
    sourceDetails: mobile.sourceDetails || extra.sourceDetails || 'Exact source / referrer',
    sourceDetailsHint: mobile.sourceDetailsHint || extra.sourceDetailsHint || '',
    sourceDetailsPlaceholder: mobile.sourceDetailsPlaceholder || extra.sourceDetailsPlaceholder || '',
    comment: core.comment,
    consent: core.consentBefore,
    privacyLink: core.privacyLink,
    optional: c.optional,
    back: core.back,
    next: core.continue,
    review: core.checkApplication,
    edit: core.edit,
    reviewTitle: core.reviewTitle,
    reviewLead: c.reviewLead,
    sendRow: c.sendRow,
    sendHint: c.sendHint,
    rowInstruction: c.rowInstruction,
    emailOpened: c.emailOpened,
    newApplication: core.newApplication,
    draftFound: core.draftFound,
    resumeDraft: core.resumeDraft,
    discardDraft: core.discardDraft,
    formSaved: c.formSaved,
    pdfTitle: c.pdfTitle,
    pdfLead: c.pdfLead,
    pdfOpen: c.pdfOpen,
    required: core.required,
    invalidPhone: core.invalidPhone,
    invalidEmail: core.invalidEmail,
    invalidAge: core.invalidAge,
    selectOption: core.selectOption,
    sectionSubmission: c.sectionSubmission,
    sectionCandidate: c.sectionCandidate,
    sectionContact: c.sectionContact,
    sectionWork: c.sectionWork,
    noValue: c.noValue,
    statusNew: c.statusNew,
    firstContact: c.firstContact,
    options: {
      messenger: core.options?.messenger || I.locales.en.options.messenger,
      yesNo: core.options?.yesNo || I.locales.en.options.yesNo,
      documents: core.options?.documents || I.locales.en.options.documents,
      jobs: core.options?.jobs || I.locales.en.options.jobs,
      starts: core.options?.starts || I.locales.en.options.starts,
      shifts: core.options?.shifts || I.locales.en.options.shifts,
      sources: core.options?.sources || I.locales.en.options.sources,
      locations: core.options?.locations || I.locales.en.options.locations
    }
  };
}
const internal = {
  messenger: I.internal?.messenger || I.locales.pl.options.messenger,
  yesNo: I.internal?.yesNo || I.locales.pl.options.yesNo,
  documents: I.internal?.documents || I.locales.pl.options.documents,
  jobs: I.internal?.jobs || I.locales.pl.options.jobs,
  starts: I.internal?.starts || I.locales.pl.options.starts,
  shifts: I.internal?.shifts || I.locales.pl.options.shifts,
  sources: I.internal?.sources || I.locales.pl.options.sources,
  locations: I.internal?.locations || I.locales.pl.options.locations
};

  window.CITRONEX_SIMPLE_I18N = Object.freeze({ version:'16.0.0', priority, languages:I.languages, locales, internal });
})();
