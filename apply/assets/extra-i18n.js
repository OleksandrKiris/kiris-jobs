(() => {
  'use strict';
  const locales = {
    en: {
      headerSubtitle: 'Candidate application', privacyBadge: 'Your data stays on this device until you send the email',
      heroIntro: 'Complete the application in a few simple steps. No account is required.',
      contactStep: 'Contact', personalStep: 'Location', workStep: 'Work', documentsStep: 'Documents', reviewStep: 'Review',
      currentStep: 'Step', of: 'of', locationTitle: 'Choose a work location', locationSubtitle: 'Select the Citronex / PPO site you prefer. Choose “Any location” when the recruiter may match the best offer.',
      locationLabel: 'Preferred work location', locationRequired: 'Choose one work location.', selectedLocation: 'Selected location',
      greenhouseSorting: 'Greenhouses / sorting plant', greenhouse: 'Greenhouses', bananaCleaning: 'Banana warehouse / cleaning', bananaWarehouse: 'Banana warehouse', recruiterChoice: 'The recruiter will match an offer',
      reviewContact: 'Contact details', reviewPersonal: 'Current situation', reviewWork: 'Work preferences', reviewDocuments: 'Documents and attachments',
      attachmentCount: 'Attachments', noAttachments: 'No document files selected', editSection: 'Edit',
      readyTitle: 'Application ready to send', readyText: 'Choose the recommended .eml method when you want the document files and Excel CSV to be included automatically.',
      applicantConsent: 'I confirm that the data is correct and agree to be contacted about recruitment.',
      resumeTitle: 'Unfinished application found', resumeText: 'You can continue the application saved on this device. Selected files must be added again.', resume: 'Continue', discard: 'Start again',
      generatedNotice: 'The email must still be opened and sent by the candidate.', locationFromLink: 'Suggested by the link', optional: 'optional'
    },
    pl: {
      headerSubtitle: 'Formularz kandydata', privacyBadge: 'Dane pozostają na urządzeniu do czasu wysłania e-maila',
      heroIntro: 'Wypełnij zgłoszenie w kilku prostych krokach. Konto nie jest potrzebne.',
      contactStep: 'Kontakt', personalStep: 'Miejsce', workStep: 'Praca', documentsStep: 'Dokumenty', reviewStep: 'Sprawdzenie',
      currentStep: 'Krok', of: 'z', locationTitle: 'Wybierz lokalizację pracy', locationSubtitle: 'Wybierz preferowany obiekt Citronex / PPO. Zaznacz „Dowolna lokalizacja”, jeżeli rekruter ma dobrać najlepszą ofertę.',
      locationLabel: 'Preferowana lokalizacja pracy', locationRequired: 'Wybierz jedną lokalizację pracy.', selectedLocation: 'Wybrana lokalizacja',
      greenhouseSorting: 'Szklarnie / sortownia', greenhouse: 'Szklarnie', bananaCleaning: 'Magazyn bananów / sprzątanie', bananaWarehouse: 'Magazyn bananów', recruiterChoice: 'Rekruter dobierze ofertę',
      reviewContact: 'Dane kontaktowe', reviewPersonal: 'Aktualna sytuacja', reviewWork: 'Preferencje pracy', reviewDocuments: 'Dokumenty i załączniki',
      attachmentCount: 'Załączniki', noAttachments: 'Nie wybrano plików dokumentów', editSection: 'Edytuj',
      readyTitle: 'Zgłoszenie jest gotowe do wysłania', readyText: 'Wybierz polecaną metodę .eml, jeżeli dokumenty i plik CSV do Excela mają zostać dodane automatycznie.',
      applicantConsent: 'Potwierdzam poprawność danych i wyrażam zgodę na kontakt w sprawie rekrutacji.',
      resumeTitle: 'Znaleziono niedokończone zgłoszenie', resumeText: 'Możesz kontynuować zgłoszenie zapisane na tym urządzeniu. Pliki trzeba wybrać ponownie.', resume: 'Kontynuuj', discard: 'Zacznij od nowa',
      generatedNotice: 'Wiadomość musi zostać otwarta i wysłana przez kandydata.', locationFromLink: 'Polecana przez link', optional: 'opcjonalnie'
    },
    ru: {
      headerSubtitle: 'Анкета кандидата', privacyBadge: 'Данные остаются на устройстве до отправки письма',
      heroIntro: 'Заполните анкету за несколько простых шагов. Регистрация не требуется.',
      contactStep: 'Контакты', personalStep: 'Место', workStep: 'Работа', documentsStep: 'Документы', reviewStep: 'Проверка',
      currentStep: 'Шаг', of: 'из', locationTitle: 'Выберите место работы', locationSubtitle: 'Выберите предпочтительный объект Citronex / PPO. Выберите «Любая локация», если рекрутер может подобрать лучший вариант.',
      locationLabel: 'Предпочтительная локация работы', locationRequired: 'Выберите одну локацию работы.', selectedLocation: 'Выбранная локация',
      greenhouseSorting: 'Теплицы / сортировка', greenhouse: 'Теплицы', bananaCleaning: 'Банановый склад / уборка', bananaWarehouse: 'Банановый склад', recruiterChoice: 'Рекрутер подберёт вакансию',
      reviewContact: 'Контактные данные', reviewPersonal: 'Текущая ситуация', reviewWork: 'Предпочтения по работе', reviewDocuments: 'Документы и вложения',
      attachmentCount: 'Вложения', noAttachments: 'Файлы документов не выбраны', editSection: 'Изменить',
      readyTitle: 'Анкета готова к отправке', readyText: 'Используйте рекомендуемый способ .eml, чтобы документы и CSV для Excel добавились автоматически.',
      applicantConsent: 'Подтверждаю правильность данных и согласен(на) на контакт по поводу трудоустройства.',
      resumeTitle: 'Найдена незавершённая анкета', resumeText: 'Можно продолжить анкету, сохранённую на этом устройстве. Файлы нужно выбрать повторно.', resume: 'Продолжить', discard: 'Начать заново',
      generatedNotice: 'Кандидат должен самостоятельно открыть и отправить письмо.', locationFromLink: 'Рекомендована ссылкой', optional: 'необязательно'
    },
    uk: {
      headerSubtitle: 'Анкета кандидата', privacyBadge: 'Дані залишаються на пристрої до надсилання листа',
      heroIntro: 'Заповніть анкету за кілька простих кроків. Реєстрація не потрібна.',
      contactStep: 'Контакти', personalStep: 'Місце', workStep: 'Робота', documentsStep: 'Документи', reviewStep: 'Перевірка',
      currentStep: 'Крок', of: 'з', locationTitle: 'Оберіть місце роботи', locationSubtitle: 'Оберіть бажаний об’єкт Citronex / PPO. Оберіть «Будь-яка локація», якщо рекрутер може підібрати найкращу пропозицію.',
      locationLabel: 'Бажана локація роботи', locationRequired: 'Оберіть одну локацію роботи.', selectedLocation: 'Обрана локація',
      greenhouseSorting: 'Теплиці / сортування', greenhouse: 'Теплиці', bananaCleaning: 'Банановий склад / прибирання', bananaWarehouse: 'Банановий склад', recruiterChoice: 'Рекрутер підбере вакансію',
      reviewContact: 'Контактні дані', reviewPersonal: 'Поточна ситуація', reviewWork: 'Побажання щодо роботи', reviewDocuments: 'Документи та вкладення',
      attachmentCount: 'Вкладення', noAttachments: 'Файли документів не обрано', editSection: 'Змінити',
      readyTitle: 'Анкета готова до надсилання', readyText: 'Скористайтеся рекомендованим способом .eml, щоб документи та CSV для Excel додалися автоматично.',
      applicantConsent: 'Підтверджую правильність даних і погоджуюся на контакт щодо працевлаштування.',
      resumeTitle: 'Знайдено незавершену анкету', resumeText: 'Можна продовжити анкету, збережену на цьому пристрої. Файли потрібно обрати повторно.', resume: 'Продовжити', discard: 'Почати знову',
      generatedNotice: 'Кандидат повинен самостійно відкрити та надіслати лист.', locationFromLink: 'Рекомендована посиланням', optional: 'необов’язково'
    },
    ka: { locationTitle: 'აირჩიეთ სამუშაო ადგილი', locationSubtitle: 'აირჩიეთ სასურველი Citronex / PPO ობიექტი ან ნებისმიერი ადგილი.', locationLabel: 'სასურველი სამუშაო ადგილი', locationRequired: 'აირჩიეთ ერთი სამუშაო ადგილი.', contactStep: 'კონტაქტი', personalStep: 'ადგილმდებარეობა', workStep: 'სამუშაო', documentsStep: 'დოკუმენტები', reviewStep: 'შემოწმება', greenhouseSorting: 'სათბურები / დახარისხება', greenhouse: 'სათბურები', bananaCleaning: 'ბანანის საწყობი / დასუფთავება', bananaWarehouse: 'ბანანის საწყობი', recruiterChoice: 'რეკრუტერი შეარჩევს შეთავაზებას' },
    az: { locationTitle: 'İş yerini seçin', locationSubtitle: 'İstədiyiniz Citronex / PPO obyektini və ya istənilən yeri seçin.', locationLabel: 'Üstünlük verilən iş yeri', locationRequired: 'Bir iş yeri seçin.', contactStep: 'Əlaqə', personalStep: 'Yer', workStep: 'İş', documentsStep: 'Sənədlər', reviewStep: 'Yoxlama', greenhouseSorting: 'İstixanalar / çeşidləmə', greenhouse: 'İstixanalar', bananaCleaning: 'Banan anbarı / təmizlik', bananaWarehouse: 'Banan anbarı', recruiterChoice: 'Rekruter təklif seçəcək' },
    hy: { locationTitle: 'Ընտրեք աշխատանքի վայրը', locationSubtitle: 'Ընտրեք նախընտրելի Citronex / PPO օբյեկտը կամ ցանկացած վայր։', locationLabel: 'Նախընտրելի աշխատանքի վայր', locationRequired: 'Ընտրեք մեկ վայր։', contactStep: 'Կապ', personalStep: 'Վայր', workStep: 'Աշխատանք', documentsStep: 'Փաստաթղթեր', reviewStep: 'Ստուգում', greenhouseSorting: 'Ջերմոցներ / տեսակավորում', greenhouse: 'Ջերմոցներ', bananaCleaning: 'Բանանի պահեստ / մաքրում', bananaWarehouse: 'Բանանի պահեստ', recruiterChoice: 'Հավաքագրողը կընտրի առաջարկը' },
    tr: { locationTitle: 'Çalışma yerini seçin', locationSubtitle: 'Tercih ettiğiniz Citronex / PPO tesisini veya herhangi bir konumu seçin.', locationLabel: 'Tercih edilen çalışma yeri', locationRequired: 'Bir çalışma yeri seçin.', contactStep: 'İletişim', personalStep: 'Konum', workStep: 'İş', documentsStep: 'Belgeler', reviewStep: 'Kontrol', greenhouseSorting: 'Seralar / tasnif', greenhouse: 'Seralar', bananaCleaning: 'Muz deposu / temizlik', bananaWarehouse: 'Muz deposu', recruiterChoice: 'İşe alım uzmanı teklif seçecek' },
    uz: { locationTitle: 'Ish joyini tanlang', locationSubtitle: 'Citronex / PPO obyektini yoki istalgan joyni tanlang.', locationLabel: 'Afzal ish joyi', locationRequired: 'Bitta ish joyini tanlang.', contactStep: 'Aloqa', personalStep: 'Joylashuv', workStep: 'Ish', documentsStep: 'Hujjatlar', reviewStep: 'Tekshirish', greenhouseSorting: 'Issiqxonalar / saralash', greenhouse: 'Issiqxonalar', bananaCleaning: 'Banan ombori / tozalash', bananaWarehouse: 'Banan ombori', recruiterChoice: 'Rekruter taklifni tanlaydi' },
    ky: { locationTitle: 'Иштөө жерин тандаңыз', locationSubtitle: 'Каалаган Citronex / PPO объектисин же каалаган жерди тандаңыз.', locationLabel: 'Каалаган иш жери', locationRequired: 'Бир иш жерин тандаңыз.', contactStep: 'Байланыш', personalStep: 'Жайгашуу', workStep: 'Иш', documentsStep: 'Документтер', reviewStep: 'Текшерүү', greenhouseSorting: 'Күнөсканалар / сорттоо', greenhouse: 'Күнөсканалар', bananaCleaning: 'Банан кампасы / тазалоо', bananaWarehouse: 'Банан кампасы', recruiterChoice: 'Рекрутер сунушту тандайт' },
    tg: { locationTitle: 'Ҷои корро интихоб кунед', locationSubtitle: 'Объекти Citronex / PPO ё ҷойи дилхоҳро интихоб кунед.', locationLabel: 'Ҷои кори афзал', locationRequired: 'Як ҷои корро интихоб кунед.', contactStep: 'Тамос', personalStep: 'Ҷой', workStep: 'Кор', documentsStep: 'Ҳуҷҷатҳо', reviewStep: 'Санҷиш', greenhouseSorting: 'Гармхонаҳо / ҷудокунӣ', greenhouse: 'Гармхонаҳо', bananaCleaning: 'Анбори банан / тозакунӣ', bananaWarehouse: 'Анбори банан', recruiterChoice: 'Рекрутер пешниҳодро интихоб мекунад' },
    kk: { locationTitle: 'Жұмыс орнын таңдаңыз', locationSubtitle: 'Қалаған Citronex / PPO нысанын немесе кез келген орынды таңдаңыз.', locationLabel: 'Қалаулы жұмыс орны', locationRequired: 'Бір жұмыс орнын таңдаңыз.', contactStep: 'Байланыс', personalStep: 'Орналасу', workStep: 'Жұмыс', documentsStep: 'Құжаттар', reviewStep: 'Тексеру', greenhouseSorting: 'Жылыжайлар / сұрыптау', greenhouse: 'Жылыжайлар', bananaCleaning: 'Банан қоймасы / тазалау', bananaWarehouse: 'Банан қоймасы', recruiterChoice: 'Рекрутер ұсынысты таңдайды' },
    hi: { locationTitle: 'काम की जगह चुनें', locationSubtitle: 'अपना पसंदीदा Citronex / PPO स्थान या कोई भी स्थान चुनें।', locationLabel: 'पसंदीदा कार्य स्थान', locationRequired: 'एक कार्य स्थान चुनें।', contactStep: 'संपर्क', personalStep: 'स्थान', workStep: 'काम', documentsStep: 'दस्तावेज़', reviewStep: 'जाँच', greenhouseSorting: 'ग्रीनहाउस / छँटाई', greenhouse: 'ग्रीनहाउस', bananaCleaning: 'केला गोदाम / सफाई', bananaWarehouse: 'केला गोदाम', recruiterChoice: 'रिक्रूटर प्रस्ताव चुनेगा' },
    bn: { locationTitle: 'কাজের স্থান নির্বাচন করুন', locationSubtitle: 'পছন্দের Citronex / PPO স্থান বা যেকোনো স্থান নির্বাচন করুন।', locationLabel: 'পছন্দের কাজের স্থান', locationRequired: 'একটি কাজের স্থান নির্বাচন করুন।', contactStep: 'যোগাযোগ', personalStep: 'অবস্থান', workStep: 'কাজ', documentsStep: 'নথি', reviewStep: 'যাচাই', greenhouseSorting: 'গ্রিনহাউস / বাছাই', greenhouse: 'গ্রিনহাউস', bananaCleaning: 'কলা গুদাম / পরিষ্কার', bananaWarehouse: 'কলা গুদাম', recruiterChoice: 'রিক্রুটার অফার নির্বাচন করবেন' },
    ne: { locationTitle: 'काम गर्ने स्थान छान्नुहोस्', locationSubtitle: 'मनपर्ने Citronex / PPO स्थान वा कुनै पनि स्थान छान्नुहोस्।', locationLabel: 'रुचाइएको काम स्थान', locationRequired: 'एउटा काम स्थान छान्नुहोस्।', contactStep: 'सम्पर्क', personalStep: 'स्थान', workStep: 'काम', documentsStep: 'कागजात', reviewStep: 'जाँच', greenhouseSorting: 'ग्रीनहाउस / छानाइ', greenhouse: 'ग्रीनहाउस', bananaCleaning: 'केरा गोदाम / सफाइ', bananaWarehouse: 'केरा गोदाम', recruiterChoice: 'रिक्रुटरले प्रस्ताव छान्नेछन्' },
    ur: { locationTitle: 'کام کی جگہ منتخب کریں', locationSubtitle: 'اپنی پسندیدہ Citronex / PPO جگہ یا کوئی بھی جگہ منتخب کریں۔', locationLabel: 'پسندیدہ کام کی جگہ', locationRequired: 'ایک کام کی جگہ منتخب کریں۔', contactStep: 'رابطہ', personalStep: 'مقام', workStep: 'کام', documentsStep: 'دستاویزات', reviewStep: 'جانچ', greenhouseSorting: 'گرین ہاؤس / چھانٹی', greenhouse: 'گرین ہاؤس', bananaCleaning: 'کیلے کا گودام / صفائی', bananaWarehouse: 'کیلے کا گودام', recruiterChoice: 'ریکروٹر پیشکش منتخب کرے گا' },
    si: { locationTitle: 'වැඩ කරන ස්ථානය තෝරන්න', locationSubtitle: 'ඔබ කැමති Citronex / PPO ස්ථානය හෝ ඕනෑම ස්ථානයක් තෝරන්න.', locationLabel: 'කැමති වැඩ ස්ථානය', locationRequired: 'එක් ස්ථානයක් තෝරන්න.', contactStep: 'සම්බන්ධතා', personalStep: 'ස්ථානය', workStep: 'වැඩ', documentsStep: 'ලේඛන', reviewStep: 'පරීක්ෂාව', greenhouseSorting: 'හරිතාගාර / වර්ග කිරීම', greenhouse: 'හරිතාගාර', bananaCleaning: 'කෙසෙල් ගබඩාව / පිරිසිදු කිරීම', bananaWarehouse: 'කෙසෙල් ගබඩාව', recruiterChoice: 'බඳවාගන්නා නිලධාරියා යෝජනාව තෝරයි' },
    fil: { locationTitle: 'Piliin ang lugar ng trabaho', locationSubtitle: 'Piliin ang gustong Citronex / PPO site o anumang lokasyon.', locationLabel: 'Gustong lokasyon ng trabaho', locationRequired: 'Pumili ng isang lokasyon.', contactStep: 'Kontak', personalStep: 'Lokasyon', workStep: 'Trabaho', documentsStep: 'Dokumento', reviewStep: 'Suriin', greenhouseSorting: 'Greenhouse / sorting', greenhouse: 'Greenhouse', bananaCleaning: 'Bodega ng saging / paglilinis', bananaWarehouse: 'Bodega ng saging', recruiterChoice: 'Pipili ang recruiter ng alok' },
    id: { locationTitle: 'Pilih lokasi kerja', locationSubtitle: 'Pilih lokasi Citronex / PPO yang Anda inginkan atau lokasi apa pun.', locationLabel: 'Lokasi kerja pilihan', locationRequired: 'Pilih satu lokasi kerja.', contactStep: 'Kontak', personalStep: 'Lokasi', workStep: 'Pekerjaan', documentsStep: 'Dokumen', reviewStep: 'Periksa', greenhouseSorting: 'Rumah kaca / penyortiran', greenhouse: 'Rumah kaca', bananaCleaning: 'Gudang pisang / pembersihan', bananaWarehouse: 'Gudang pisang', recruiterChoice: 'Perekrut akan memilih tawaran' },
    vi: { locationTitle: 'Chọn địa điểm làm việc', locationSubtitle: 'Chọn cơ sở Citronex / PPO bạn muốn hoặc bất kỳ địa điểm nào.', locationLabel: 'Địa điểm làm việc mong muốn', locationRequired: 'Chọn một địa điểm làm việc.', contactStep: 'Liên hệ', personalStep: 'Địa điểm', workStep: 'Công việc', documentsStep: 'Tài liệu', reviewStep: 'Kiểm tra', greenhouseSorting: 'Nhà kính / phân loại', greenhouse: 'Nhà kính', bananaCleaning: 'Kho chuối / vệ sinh', bananaWarehouse: 'Kho chuối', recruiterChoice: 'Nhà tuyển dụng sẽ chọn đề nghị' }
  };

  window.RECRUITMENT_EXTRA_I18N = Object.freeze(locales);
})();
