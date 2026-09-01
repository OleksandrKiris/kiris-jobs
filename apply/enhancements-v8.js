(() => {
  'use strict';

  const CFG = window.RECRUITMENT_CONFIG;
  if (!CFG) return;

  const MAX_FILES = 8;
  const MAX_FILE_BYTES = 8 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
  const ALLOWED = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'doc', 'docx']);
  const SESSION_FLAG = 'kiris_apply_documents_selected_v8';
  let selectedFiles = [];
  let observerQueued = false;

  const TEXT = {
    en: {
      documentsTitle: 'Documents for the recruiter',
      documentsHint: 'Optional. Select files now. They stay on your device and are not uploaded to GitHub.',
      chooseFiles: 'Choose documents',
      formats: 'PDF, JPG, PNG, HEIC, DOC or DOCX · up to 8 files · 8 MB each · 20 MB total',
      noFiles: 'No documents selected.',
      remove: 'Remove',
      manualTitle: 'Before sending the email',
      manualText: 'After your email app opens, tap the paperclip, attach the same documents, check the recipient and tap Send.',
      emlTitle: 'Ready email with attachments',
      emlText: 'Creates an .eml draft with the questionnaire, Excel row and selected documents already attached. Open the downloaded file in your email app and send it.',
      emlButton: 'Prepare email with attachments',
      emlWorking: 'Preparing email…',
      emlReady: 'The email draft has been prepared. Open the downloaded .eml file and send it.',
      emlError: 'The email draft could not be created. Use the regular email button and attach documents manually.',
      fileTooLarge: 'This file is larger than 8 MB:',
      totalTooLarge: 'The total file size may not exceed 20 MB.',
      tooMany: 'You can select no more than 8 files.',
      invalidType: 'Unsupported file type:',
      filesLost: 'For privacy reasons, files are not restored after a page reload. Select them again.',
      features: ['6 work locations', 'Direct email to recruiter', '24-hour response SLA']
    },
    pl: {
      documentsTitle: 'Dokumenty dla rekrutera',
      documentsHint: 'Opcjonalnie. Wybierz pliki teraz. Pozostają na Twoim urządzeniu i nie są przesyłane do GitHub.',
      chooseFiles: 'Wybierz dokumenty',
      formats: 'PDF, JPG, PNG, HEIC, DOC lub DOCX · maks. 8 plików · 8 MB każdy · 20 MB łącznie',
      noFiles: 'Nie wybrano dokumentów.',
      remove: 'Usuń',
      manualTitle: 'Przed wysłaniem wiadomości',
      manualText: 'Po otwarciu poczty naciśnij spinacz, dołącz te same dokumenty, sprawdź odbiorcę i naciśnij „Wyślij”.',
      emlTitle: 'Gotowy e-mail z załącznikami',
      emlText: 'Tworzy szkic .eml z ankietą, wierszem do Excela i wybranymi dokumentami. Otwórz pobrany plik w poczcie i wyślij.',
      emlButton: 'Przygotuj e-mail z załącznikami',
      emlWorking: 'Przygotowywanie wiadomości…',
      emlReady: 'Szkic wiadomości jest gotowy. Otwórz pobrany plik .eml i wyślij go.',
      emlError: 'Nie udało się przygotować szkicu. Użyj zwykłego przycisku e-mail i dodaj dokumenty ręcznie.',
      fileTooLarge: 'Plik jest większy niż 8 MB:',
      totalTooLarge: 'Łączny rozmiar plików nie może przekroczyć 20 MB.',
      tooMany: 'Możesz wybrać maksymalnie 8 plików.',
      invalidType: 'Niedozwolony typ pliku:',
      filesLost: 'Ze względów bezpieczeństwa pliki nie są przywracane po odświeżeniu strony. Wybierz je ponownie.',
      features: ['6 lokalizacji pracy', 'E-mail bezpośrednio do rekrutera', 'SLA odpowiedzi 24 godziny']
    },
    ru: {
      documentsTitle: 'Документы для рекрутера',
      documentsHint: 'Необязательно. Выберите файлы сейчас. Они остаются на вашем устройстве и не загружаются в GitHub.',
      chooseFiles: 'Выбрать документы',
      formats: 'PDF, JPG, PNG, HEIC, DOC или DOCX · до 8 файлов · 8 МБ каждый · 20 МБ всего',
      noFiles: 'Документы не выбраны.',
      remove: 'Удалить',
      manualTitle: 'Перед отправкой письма',
      manualText: 'Когда откроется почта, нажмите скрепку, прикрепите те же документы, проверьте получателя и нажмите «Отправить».',
      emlTitle: 'Готовое письмо с вложениями',
      emlText: 'Создаёт черновик .eml с анкетой, строкой Excel и выбранными документами. Откройте скачанный файл в почте и отправьте.',
      emlButton: 'Подготовить письмо с вложениями',
      emlWorking: 'Подготовка письма…',
      emlReady: 'Черновик готов. Откройте скачанный файл .eml и отправьте его.',
      emlError: 'Не удалось создать черновик. Откройте обычное письмо и прикрепите документы вручную.',
      fileTooLarge: 'Файл больше 8 МБ:',
      totalTooLarge: 'Общий размер файлов не должен превышать 20 МБ.',
      tooMany: 'Можно выбрать не более 8 файлов.',
      invalidType: 'Недопустимый тип файла:',
      filesLost: 'Из соображений безопасности файлы не восстанавливаются после обновления страницы. Выберите их повторно.',
      features: ['6 локаций работы', 'Письмо напрямую рекрутеру', 'SLA ответа 24 часа']
    },
    uk: {
      documentsTitle: 'Документи для рекрутера',
      documentsHint: 'Необов’язково. Виберіть файли зараз. Вони залишаються на вашому пристрої та не завантажуються в GitHub.',
      chooseFiles: 'Вибрати документи',
      formats: 'PDF, JPG, PNG, HEIC, DOC або DOCX · до 8 файлів · 8 МБ кожен · 20 МБ загалом',
      noFiles: 'Документи не вибрано.',
      remove: 'Видалити',
      manualTitle: 'Перед надсиланням листа',
      manualText: 'Коли відкриється пошта, натисніть скріпку, додайте ті самі документи, перевірте одержувача та натисніть «Надіслати».',
      emlTitle: 'Готовий лист із вкладеннями',
      emlText: 'Створює чернетку .eml з анкетою, рядком Excel і вибраними документами. Відкрийте завантажений файл у пошті та надішліть.',
      emlButton: 'Підготувати лист із вкладеннями',
      emlWorking: 'Підготовка листа…',
      emlReady: 'Чернетка готова. Відкрийте завантажений файл .eml і надішліть його.',
      emlError: 'Не вдалося створити чернетку. Відкрийте звичайний лист і додайте документи вручну.',
      fileTooLarge: 'Файл більший за 8 МБ:',
      totalTooLarge: 'Загальний розмір файлів не може перевищувати 20 МБ.',
      tooMany: 'Можна вибрати не більше 8 файлів.',
      invalidType: 'Недозволений тип файлу:',
      filesLost: 'З міркувань безпеки файли не відновлюються після оновлення сторінки. Виберіть їх повторно.',
      features: ['6 локацій роботи', 'Лист безпосередньо рекрутеру', 'SLA відповіді 24 години']
    },
    ka: { documentsTitle:'დოკუმენტები რეკრუტერისთვის', documentsHint:'არასავალდებულო. ფაილები რჩება თქვენს მოწყობილობაზე და GitHub-ზე არ იტვირთება.', chooseFiles:'დოკუმენტების არჩევა', formats:'PDF, JPG, PNG, HEIC, DOC ან DOCX · მაქს. 8 ფაილი · 8 მბ თითოეული · 20 მბ სულ', noFiles:'დოკუმენტები არ არის არჩეული.', remove:'წაშლა', manualTitle:'წერილის გაგზავნამდე', manualText:'ფოსტის გახსნის შემდეგ დააჭირეთ სამაგრს, დაურთეთ იგივე დოკუმენტები, შეამოწმეთ მიმღები და გაგზავნეთ.', emlTitle:'მზა წერილი დანართებით', emlText:'ქმნის .eml მონახაზს კითხვარით, Excel-ის სტრიქონით და არჩეული ფაილებით.', emlButton:'წერილის მომზადება დანართებით', emlWorking:'წერილის მომზადება…', emlReady:'მონახაზი მზადაა. გახსენით .eml ფაილი და გაგზავნეთ.', emlError:'მონახაზის შექმნა ვერ მოხერხდა. გამოიყენეთ ჩვეულებრივი ელფოსტა.', fileTooLarge:'ფაილი 8 მბ-ზე მეტია:', totalTooLarge:'ფაილების საერთო ზომა არ უნდა აღემატებოდეს 20 მბ-ს.', tooMany:'შესაძლებელია მაქსიმუმ 8 ფაილის არჩევა.', invalidType:'ფაილის ტიპი არ არის მხარდაჭერილი:', filesLost:'გვერდის განახლების შემდეგ ფაილები არ აღდგება. აირჩიეთ ხელახლა.' },
    az: { documentsTitle:'Rekruter üçün sənədlər', documentsHint:'İstəyə bağlıdır. Fayllar cihazınızda qalır və GitHub-a yüklənmir.', chooseFiles:'Sənədləri seçin', formats:'PDF, JPG, PNG, HEIC, DOC və ya DOCX · maksimum 8 fayl · hər biri 8 MB · cəmi 20 MB', noFiles:'Sənəd seçilməyib.', remove:'Sil', manualTitle:'E-poçtu göndərməzdən əvvəl', manualText:'Poçt açıldıqda kağız sancağına toxunun, eyni sənədləri əlavə edin, alıcını yoxlayın və göndərin.', emlTitle:'Əlavələri olan hazır e-poçt', emlText:'Anket, Excel sətri və seçilmiş sənədlərlə .eml qaralama yaradır.', emlButton:'Əlavəli e-poçt hazırla', emlWorking:'E-poçt hazırlanır…', emlReady:'Qaralama hazırdır. .eml faylını açın və göndərin.', emlError:'Qaralama yaradıla bilmədi. Adi e-poçtdan istifadə edin.', fileTooLarge:'Fayl 8 MB-dan böyükdür:', totalTooLarge:'Ümumi ölçü 20 MB-dan çox ola bilməz.', tooMany:'Maksimum 8 fayl seçə bilərsiniz.', invalidType:'Dəstəklənməyən fayl növü:', filesLost:'Səhifə yeniləndikdən sonra fayllar bərpa edilmir. Yenidən seçin.' },
    hy: { documentsTitle:'Փաստաթղթեր հավաքագրողի համար', documentsHint:'Ընտրովի։ Ֆայլերը մնում են ձեր սարքում և չեն բեռնվում GitHub։', chooseFiles:'Ընտրել փաստաթղթեր', formats:'PDF, JPG, PNG, HEIC, DOC կամ DOCX · առավելագույնը 8 ֆայլ · յուրաքանչյուրը 8 ՄԲ · ընդհանուր 20 ՄԲ', noFiles:'Փաստաթղթեր չեն ընտրվել։', remove:'Հեռացնել', manualTitle:'Նամակն ուղարկելուց առաջ', manualText:'Փոստը բացվելուց հետո սեղմեք կցորդի նշանը, կցեք նույն փաստաթղթերը, ստուգեք ստացողին և ուղարկեք։', emlTitle:'Պատրաստ նամակ կցորդներով', emlText:'Ստեղծում է .eml սևագիր՝ հարցաթերթով, Excel տողով և ընտրված ֆայլերով։', emlButton:'Պատրաստել նամակ կցորդներով', emlWorking:'Նամակը պատրաստվում է…', emlReady:'Սևագիրը պատրաստ է։ Բացեք .eml ֆայլը և ուղարկեք։', emlError:'Սևագիրը չստեղծվեց։ Օգտագործեք սովորական էլ. փոստը։', fileTooLarge:'Ֆայլը մեծ է 8 ՄԲ-ից՝', totalTooLarge:'Ընդհանուր չափը չի կարող գերազանցել 20 ՄԲ։', tooMany:'Կարելի է ընտրել առավելագույնը 8 ֆայլ։', invalidType:'Չաջակցվող ֆայլի տեսակ՝', filesLost:'Էջը թարմացնելուց հետո ֆայլերը չեն վերականգնվում։ Ընտրեք կրկին։' },
    tr: { documentsTitle:'İşe alım uzmanı için belgeler', documentsHint:'İsteğe bağlı. Dosyalar cihazınızda kalır ve GitHub’a yüklenmez.', chooseFiles:'Belgeleri seç', formats:'PDF, JPG, PNG, HEIC, DOC veya DOCX · en fazla 8 dosya · dosya başına 8 MB · toplam 20 MB', noFiles:'Belge seçilmedi.', remove:'Kaldır', manualTitle:'E-postayı göndermeden önce', manualText:'E-posta açıldığında ataç simgesine dokunun, aynı belgeleri ekleyin, alıcıyı kontrol edin ve gönderin.', emlTitle:'Ekleri hazır e-posta', emlText:'Anket, Excel satırı ve seçilen belgelerle bir .eml taslağı oluşturur.', emlButton:'Ekli e-posta hazırla', emlWorking:'E-posta hazırlanıyor…', emlReady:'Taslak hazır. .eml dosyasını açın ve gönderin.', emlError:'Taslak oluşturulamadı. Normal e-posta düğmesini kullanın.', fileTooLarge:'Dosya 8 MB’dan büyük:', totalTooLarge:'Toplam dosya boyutu 20 MB’ı aşamaz.', tooMany:'En fazla 8 dosya seçebilirsiniz.', invalidType:'Desteklenmeyen dosya türü:', filesLost:'Sayfa yenilendiğinde dosyalar geri yüklenmez. Tekrar seçin.' },
    uz: { documentsTitle:'Rekruter uchun hujjatlar', documentsHint:'Ixtiyoriy. Fayllar qurilmangizda qoladi va GitHub’ga yuklanmaydi.', chooseFiles:'Hujjatlarni tanlang', formats:'PDF, JPG, PNG, HEIC, DOC yoki DOCX · 8 tagacha fayl · har biri 8 MB · jami 20 MB', noFiles:'Hujjat tanlanmagan.', remove:'O‘chirish', manualTitle:'Xatni yuborishdan oldin', manualText:'Pochta ochilganda skrepka belgisini bosing, shu hujjatlarni ilova qiling, qabul qiluvchini tekshiring va yuboring.', emlTitle:'Ilovalari tayyor xat', emlText:'Anketa, Excel qatori va tanlangan fayllar bilan .eml qoralamasini yaratadi.', emlButton:'Ilovali xat tayyorlash', emlWorking:'Xat tayyorlanmoqda…', emlReady:'Qoralama tayyor. .eml faylini oching va yuboring.', emlError:'Qoralama yaratilmadi. Oddiy xat tugmasidan foydalaning.', fileTooLarge:'Fayl 8 MB dan katta:', totalTooLarge:'Jami hajm 20 MB dan oshmasligi kerak.', tooMany:'8 tagacha fayl tanlash mumkin.', invalidType:'Qo‘llab-quvvatlanmaydigan fayl:', filesLost:'Sahifa yangilanganda fayllar tiklanmaydi. Qayta tanlang.' },
    ky: { documentsTitle:'Рекрутер үчүн документтер', documentsHint:'Милдеттүү эмес. Файлдар түзмөгүңүздө калат жана GitHub’га жүктөлбөйт.', chooseFiles:'Документтерди тандоо', formats:'PDF, JPG, PNG, HEIC, DOC же DOCX · 8 файлга чейин · ар бири 8 МБ · жалпы 20 МБ', noFiles:'Документ тандалган жок.', remove:'Өчүрүү', manualTitle:'Кат жөнөтүүдөн мурун', manualText:'Почта ачылганда кыстыргычты басып, ошол документтерди тиркеп, алуучуну текшерип, жөнөтүңүз.', emlTitle:'Тиркемелери даяр кат', emlText:'Анкета, Excel сабы жана тандалган файлдар менен .eml долбоорун түзөт.', emlButton:'Тиркемелүү кат даярдоо', emlWorking:'Кат даярдалууда…', emlReady:'Долбоор даяр. .eml файлын ачып жөнөтүңүз.', emlError:'Долбоор түзүлгөн жок. Кадимки катты колдонуңуз.', fileTooLarge:'Файл 8 МБдан чоң:', totalTooLarge:'Жалпы көлөм 20 МБдан ашпашы керек.', tooMany:'8 файлга чейин тандай аласыз.', invalidType:'Колдоого алынбаган файл:', filesLost:'Барак жаңыртылгандан кийин файлдар калыбына келбейт. Кайра тандаңыз.' },
    tg: { documentsTitle:'Ҳуҷҷатҳо барои рекрутер', documentsHint:'Ихтиёрӣ. Файлҳо дар дастгоҳи шумо мемонанд ва ба GitHub бор намешаванд.', chooseFiles:'Интихоби ҳуҷҷатҳо', formats:'PDF, JPG, PNG, HEIC, DOC ё DOCX · то 8 файл · ҳар кадом 8 МБ · ҳамагӣ 20 МБ', noFiles:'Ҳуҷҷат интихоб нашудааст.', remove:'Нест кардан', manualTitle:'Пеш аз фиристодани нома', manualText:'Пас аз кушодани почта нишонаи замимаро пахш кунед, ҳамон ҳуҷҷатҳоро замима карда, қабулкунандаро санҷед ва фиристед.', emlTitle:'Номаи тайёр бо замимаҳо', emlText:'Лоиҳаи .eml-ро бо анкета, сатри Excel ва файлҳои интихобшуда месозад.', emlButton:'Омода кардани нома бо замимаҳо', emlWorking:'Нома омода мешавад…', emlReady:'Лоиҳа тайёр. Файли .eml-ро кушоед ва фиристед.', emlError:'Лоиҳа сохта нашуд. Почтаи оддиро истифода баред.', fileTooLarge:'Файл аз 8 МБ калон аст:', totalTooLarge:'Ҳаҷми умумӣ набояд аз 20 МБ зиёд бошад.', tooMany:'То 8 файл интихоб кардан мумкин аст.', invalidType:'Навъи файл дастгирӣ намешавад:', filesLost:'Пас аз навсозии саҳифа файлҳо барқарор намешаванд. Аз нав интихоб кунед.' },
    kk: { documentsTitle:'Рекрутерге арналған құжаттар', documentsHint:'Міндетті емес. Файлдар құрылғыңызда қалады және GitHub-қа жүктелмейді.', chooseFiles:'Құжаттарды таңдау', formats:'PDF, JPG, PNG, HEIC, DOC немесе DOCX · 8 файлға дейін · әрқайсысы 8 МБ · барлығы 20 МБ', noFiles:'Құжат таңдалмады.', remove:'Жою', manualTitle:'Хатты жібермес бұрын', manualText:'Пошта ашылғанда қыстырғышты басып, сол құжаттарды тіркеп, алушыны тексеріп, жіберіңіз.', emlTitle:'Тіркемелері дайын хат', emlText:'Сауалнама, Excel жолы және таңдалған файлдары бар .eml жобасын жасайды.', emlButton:'Тіркемелі хат дайындау', emlWorking:'Хат дайындалуда…', emlReady:'Жоба дайын. .eml файлын ашып жіберіңіз.', emlError:'Жоба жасалмады. Қарапайым пошта батырмасын пайдаланыңыз.', fileTooLarge:'Файл 8 МБ-тан үлкен:', totalTooLarge:'Жалпы көлем 20 МБ-тан аспауы керек.', tooMany:'8 файлға дейін таңдауға болады.', invalidType:'Қолдау көрсетілмейтін файл:', filesLost:'Бет жаңартылғаннан кейін файлдар қалпына келмейді. Қайта таңдаңыз.' },
    hi: { documentsTitle:'रिक्रूटर के लिए दस्तावेज़', documentsHint:'वैकल्पिक। फ़ाइलें आपके डिवाइस पर रहती हैं और GitHub पर अपलोड नहीं होतीं।', chooseFiles:'दस्तावेज़ चुनें', formats:'PDF, JPG, PNG, HEIC, DOC या DOCX · अधिकतम 8 फ़ाइलें · प्रत्येक 8 MB · कुल 20 MB', noFiles:'कोई दस्तावेज़ नहीं चुना गया।', remove:'हटाएँ', manualTitle:'ईमेल भेजने से पहले', manualText:'ईमेल खुलने पर पेपरक्लिप दबाएँ, वही दस्तावेज़ जोड़ें, प्राप्तकर्ता जाँचें और भेजें।', emlTitle:'संलग्नकों वाला तैयार ईमेल', emlText:'प्रश्नावली, Excel पंक्ति और चुनी हुई फ़ाइलों के साथ .eml ड्राफ्ट बनाता है।', emlButton:'संलग्नकों वाला ईमेल तैयार करें', emlWorking:'ईमेल तैयार हो रहा है…', emlReady:'ड्राफ्ट तैयार है। .eml फ़ाइल खोलें और भेजें।', emlError:'ड्राफ्ट नहीं बना। सामान्य ईमेल बटन का उपयोग करें।', fileTooLarge:'फ़ाइल 8 MB से बड़ी है:', totalTooLarge:'कुल आकार 20 MB से अधिक नहीं हो सकता।', tooMany:'अधिकतम 8 फ़ाइलें चुन सकते हैं।', invalidType:'असमर्थित फ़ाइल प्रकार:', filesLost:'पेज रीफ़्रेश के बाद फ़ाइलें वापस नहीं आतीं। फिर से चुनें।' },
    bn: { documentsTitle:'রিক্রুটারের জন্য নথি', documentsHint:'ঐচ্ছিক। ফাইল আপনার ডিভাইসে থাকে এবং GitHub-এ আপলোড হয় না।', chooseFiles:'নথি নির্বাচন করুন', formats:'PDF, JPG, PNG, HEIC, DOC বা DOCX · সর্বোচ্চ 8 ফাইল · প্রতিটি 8 MB · মোট 20 MB', noFiles:'কোনো নথি নির্বাচন করা হয়নি।', remove:'সরান', manualTitle:'ইমেইল পাঠানোর আগে', manualText:'ইমেইল খুললে পেপারক্লিপ চাপুন, একই নথি যুক্ত করুন, প্রাপক যাচাই করে পাঠান।', emlTitle:'সংযুক্তিসহ প্রস্তুত ইমেইল', emlText:'ফর্ম, Excel সারি এবং নির্বাচিত ফাইলসহ .eml খসড়া তৈরি করে।', emlButton:'সংযুক্তিসহ ইমেইল প্রস্তুত করুন', emlWorking:'ইমেইল প্রস্তুত হচ্ছে…', emlReady:'খসড়া প্রস্তুত। .eml ফাইল খুলে পাঠান।', emlError:'খসড়া তৈরি হয়নি। সাধারণ ইমেইল ব্যবহার করুন।', fileTooLarge:'ফাইল 8 MB-এর বেশি:', totalTooLarge:'মোট আকার 20 MB-এর বেশি হতে পারবে না।', tooMany:'সর্বোচ্চ 8 ফাইল নির্বাচন করা যাবে।', invalidType:'অসমর্থিত ফাইল প্রকার:', filesLost:'পেজ রিফ্রেশের পরে ফাইল পুনরুদ্ধার হয় না। আবার নির্বাচন করুন।' },
    ne: { documentsTitle:'रिक्रुटरका लागि कागजात', documentsHint:'वैकल्पिक। फाइलहरू तपाईंको उपकरणमै रहन्छन् र GitHub मा अपलोड हुँदैनन्।', chooseFiles:'कागजात छान्नुहोस्', formats:'PDF, JPG, PNG, HEIC, DOC वा DOCX · बढीमा 8 फाइल · प्रत्येक 8 MB · जम्मा 20 MB', noFiles:'कागजात छानिएको छैन।', remove:'हटाउनुहोस्', manualTitle:'इमेल पठाउनुअघि', manualText:'इमेल खुलेपछि पेपरक्लिप थिच्नुहोस्, उही कागजात जोड्नुहोस्, प्राप्तकर्ता जाँचेर पठाउनुहोस्।', emlTitle:'संलग्नकसहित तयार इमेल', emlText:'फाराम, Excel पङ्क्ति र छानिएका फाइलसहित .eml ड्राफ्ट बनाउँछ।', emlButton:'संलग्नकसहित इमेल तयार गर्नुहोस्', emlWorking:'इमेल तयार हुँदैछ…', emlReady:'ड्राफ्ट तयार छ। .eml फाइल खोलेर पठाउनुहोस्।', emlError:'ड्राफ्ट बनाउन सकिएन। सामान्य इमेल प्रयोग गर्नुहोस्।', fileTooLarge:'फाइल 8 MB भन्दा ठूलो छ:', totalTooLarge:'कुल आकार 20 MB भन्दा बढी हुन सक्दैन।', tooMany:'बढीमा 8 फाइल छान्न सकिन्छ।', invalidType:'समर्थन नभएको फाइल प्रकार:', filesLost:'पृष्ठ रिफ्रेसपछि फाइल पुनःस्थापित हुँदैन। फेरि छान्नुहोस्।' },
    ur: { documentsTitle:'ریکروٹر کے لیے دستاویزات', documentsHint:'اختیاری۔ فائلیں آپ کے آلے پر رہتی ہیں اور GitHub پر اپ لوڈ نہیں ہوتیں۔', chooseFiles:'دستاویزات منتخب کریں', formats:'PDF، JPG، PNG، HEIC، DOC یا DOCX · زیادہ سے زیادہ 8 فائلیں · ہر ایک 8 MB · کل 20 MB', noFiles:'کوئی دستاویز منتخب نہیں ہوئی۔', remove:'حذف کریں', manualTitle:'ای میل بھیجنے سے پہلے', manualText:'ای میل کھلنے پر پیپر کلپ دبائیں، وہی دستاویزات منسلک کریں، وصول کنندہ چیک کریں اور بھیجیں۔', emlTitle:'منسلکات کے ساتھ تیار ای میل', emlText:'فارم، Excel قطار اور منتخب فائلوں کے ساتھ .eml ڈرافٹ بناتا ہے۔', emlButton:'منسلکات والی ای میل تیار کریں', emlWorking:'ای میل تیار ہو رہی ہے…', emlReady:'ڈرافٹ تیار ہے۔ .eml فائل کھول کر بھیجیں۔', emlError:'ڈرافٹ نہیں بن سکا۔ عام ای میل بٹن استعمال کریں۔', fileTooLarge:'فائل 8 MB سے بڑی ہے:', totalTooLarge:'کل حجم 20 MB سے زیادہ نہیں ہو سکتا۔', tooMany:'زیادہ سے زیادہ 8 فائلیں منتخب کی جا سکتی ہیں۔', invalidType:'غیر معاون فائل قسم:', filesLost:'صفحہ ریفریش ہونے کے بعد فائلیں بحال نہیں ہوتیں۔ دوبارہ منتخب کریں۔' },
    si: { documentsTitle:'බඳවාගැනීමේ නිලධාරියා සඳහා ලේඛන', documentsHint:'විකල්පයි. ගොනු ඔබගේ උපාංගයේ පවතින අතර GitHub වෙත උඩුගත නොවේ.', chooseFiles:'ලේඛන තෝරන්න', formats:'PDF, JPG, PNG, HEIC, DOC හෝ DOCX · ගොනු 8 දක්වා · එක් ගොනුවකට 8 MB · මුළු 20 MB', noFiles:'ලේඛන තෝරා නැත.', remove:'ඉවත් කරන්න', manualTitle:'ඊමේල් යැවීමට පෙර', manualText:'ඊමේල් විවෘත වූ විට paperclip සලකුණ ඔබා එම ලේඛන අමුණා, ලබන්නා පරීක්ෂා කර යවන්න.', emlTitle:'අමුණා ඇති ගොනු සමඟ සූදානම් ඊමේල්', emlText:'අයදුම්පත, Excel පේළිය සහ තෝරාගත් ගොනු සමඟ .eml කෙටුම්පතක් සාදයි.', emlButton:'අමුණා ඇති ඊමේල් සූදානම් කරන්න', emlWorking:'ඊමේල් සූදානම් වෙමින්…', emlReady:'කෙටුම්පත සූදානම්. .eml ගොනුව විවෘත කර යවන්න.', emlError:'කෙටුම්පත සෑදිය නොහැකි විය. සාමාන්‍ය ඊමේල් භාවිත කරන්න.', fileTooLarge:'ගොනුව 8 MB ට වඩා විශාලයි:', totalTooLarge:'මුළු ප්‍රමාණය 20 MB ඉක්මවිය නොහැක.', tooMany:'ගොනු 8 දක්වා තෝරාගත හැක.', invalidType:'සහාය නොදක්වන ගොනු වර්ගය:', filesLost:'පිටුව නැවුම් කළ පසු ගොනු ප්‍රතිසාධනය නොවේ. නැවත තෝරන්න.' },
    fil: { documentsTitle:'Mga dokumento para sa recruiter', documentsHint:'Opsyonal. Nananatili ang mga file sa iyong device at hindi ina-upload sa GitHub.', chooseFiles:'Pumili ng mga dokumento', formats:'PDF, JPG, PNG, HEIC, DOC o DOCX · hanggang 8 file · 8 MB bawat isa · 20 MB kabuuan', noFiles:'Walang napiling dokumento.', remove:'Alisin', manualTitle:'Bago ipadala ang email', manualText:'Kapag bumukas ang email, pindutin ang paperclip, ilakip ang parehong dokumento, tingnan ang recipient at ipadala.', emlTitle:'Handang email na may attachments', emlText:'Gumagawa ng .eml draft na may form, Excel row at mga napiling file.', emlButton:'Ihanda ang email na may attachments', emlWorking:'Inihahanda ang email…', emlReady:'Handa na ang draft. Buksan ang .eml file at ipadala.', emlError:'Hindi nagawa ang draft. Gamitin ang karaniwang email button.', fileTooLarge:'Mas malaki sa 8 MB ang file:', totalTooLarge:'Hindi maaaring lumampas sa 20 MB ang kabuuang laki.', tooMany:'Hanggang 8 file lamang.', invalidType:'Hindi suportadong uri ng file:', filesLost:'Hindi maibabalik ang mga file pagkatapos i-refresh. Piliin muli.' },
    id: { documentsTitle:'Dokumen untuk perekrut', documentsHint:'Opsional. File tetap di perangkat Anda dan tidak diunggah ke GitHub.', chooseFiles:'Pilih dokumen', formats:'PDF, JPG, PNG, HEIC, DOC atau DOCX · maksimal 8 file · 8 MB per file · total 20 MB', noFiles:'Tidak ada dokumen yang dipilih.', remove:'Hapus', manualTitle:'Sebelum mengirim email', manualText:'Setelah email terbuka, tekan ikon penjepit, lampirkan dokumen yang sama, periksa penerima lalu kirim.', emlTitle:'Email siap dengan lampiran', emlText:'Membuat draft .eml dengan formulir, baris Excel dan file yang dipilih.', emlButton:'Siapkan email dengan lampiran', emlWorking:'Menyiapkan email…', emlReady:'Draft siap. Buka file .eml lalu kirim.', emlError:'Draft gagal dibuat. Gunakan tombol email biasa.', fileTooLarge:'File lebih besar dari 8 MB:', totalTooLarge:'Total ukuran tidak boleh lebih dari 20 MB.', tooMany:'Maksimal 8 file.', invalidType:'Jenis file tidak didukung:', filesLost:'File tidak dipulihkan setelah halaman dimuat ulang. Pilih lagi.' },
    vi: { documentsTitle:'Tài liệu cho chuyên viên tuyển dụng', documentsHint:'Không bắt buộc. Tệp vẫn ở trên thiết bị và không được tải lên GitHub.', chooseFiles:'Chọn tài liệu', formats:'PDF, JPG, PNG, HEIC, DOC hoặc DOCX · tối đa 8 tệp · 8 MB mỗi tệp · tổng 20 MB', noFiles:'Chưa chọn tài liệu.', remove:'Xóa', manualTitle:'Trước khi gửi email', manualText:'Khi email mở, nhấn biểu tượng kẹp giấy, đính kèm lại các tài liệu, kiểm tra người nhận rồi gửi.', emlTitle:'Email sẵn có tệp đính kèm', emlText:'Tạo bản nháp .eml với biểu mẫu, dòng Excel và các tệp đã chọn.', emlButton:'Chuẩn bị email có tệp đính kèm', emlWorking:'Đang chuẩn bị email…', emlReady:'Bản nháp đã sẵn sàng. Mở tệp .eml và gửi.', emlError:'Không thể tạo bản nháp. Hãy dùng nút email thông thường.', fileTooLarge:'Tệp lớn hơn 8 MB:', totalTooLarge:'Tổng dung lượng không được quá 20 MB.', tooMany:'Chỉ được chọn tối đa 8 tệp.', invalidType:'Loại tệp không được hỗ trợ:', filesLost:'Tệp không được khôi phục sau khi tải lại trang. Hãy chọn lại.' }
  };

  function languageCode() {
    const code = (document.documentElement.lang || 'en').toLowerCase();
    return TEXT[code] ? code : 'en';
  }

  function L() {
    return { ...TEXT.en, ...(TEXT[languageCode()] || {}) };
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  function extension(name) {
    return String(name || '').toLowerCase().split('.').pop();
  }

  function totalBytes() {
    return selectedFiles.reduce((sum, file) => sum + file.size, 0);
  }

  function installStyles() {
    if (document.getElementById('enhancementsV8Styles')) return;
    const style = document.createElement('style');
    style.id = 'enhancementsV8Styles';
    style.textContent = `
      .brand-icon.brand-icon--official{width:118px;min-width:118px;height:48px;border-radius:13px;background:#fff;padding:5px 8px;border:1px solid #dce8e1;box-shadow:0 8px 22px rgba(5,68,43,.12)}
      .brand-icon--official img{display:block;width:100%;height:100%;object-fit:contain;border-radius:7px}
      .operational-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:-4px 0 18px}
      .operational-strip span{display:flex;align-items:center;justify-content:center;min-height:42px;padding:8px 10px;border:1px solid #d9e7df;border-radius:13px;background:#f7fbf9;color:#486157;font-size:12px;font-weight:750;text-align:center}
      .document-upload-addon,.document-review-addon{border:1px solid #b7d9c8;border-radius:20px;background:linear-gradient(180deg,#f2fbf6,#fff);padding:18px;margin:18px 0}
      .document-upload-addon h2,.document-review-addon h2{margin:0 0 6px;color:#075c39;font-size:20px}
      .document-upload-addon p,.document-review-addon p{margin:0;color:#5a6c63;line-height:1.52}
      .document-picker{position:relative;display:grid;place-items:center;min-height:112px;margin-top:14px;border:2px dashed #8abfa3;border-radius:17px;background:#fff;text-align:center;padding:18px;transition:.16s ease}
      .document-picker:hover,.document-picker:focus-within{border-color:#08724b;background:#f5fcf8}
      .document-picker input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
      .document-picker strong{display:block;color:#075c39;font-size:17px}.document-picker small{display:block;color:#6a7b72;margin-top:7px;line-height:1.45}
      .document-file-list{display:grid;gap:8px;margin:13px 0 0;padding:0;list-style:none}
      .document-file-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 12px;border:1px solid #dbe7e1;border-radius:13px;background:#fff}
      .document-file-item strong{display:block;overflow-wrap:anywhere;font-size:13px}.document-file-item small{display:block;color:#708078;margin-top:3px}
      .document-remove{border:0;border-radius:10px;background:#fff0ee;color:#a52a20;padding:8px 10px;font-weight:800}
      .document-error{min-height:20px;margin-top:8px;color:#b42318;font-size:12px;font-weight:750}
      .document-empty{margin-top:12px!important;padding:10px 12px;border-radius:12px;background:#f7f9f8;color:#708078!important;font-size:13px}
      .document-manual{margin-top:12px;padding:12px 14px;border-radius:13px;background:#fff7e8;color:#844a00;line-height:1.52}
      .document-manual strong{display:block;margin-bottom:4px}
      .eml-action{background:linear-gradient(135deg,#075c39,#0b8053)!important;color:#fff!important;border-color:#075c39!important}
      .eml-help{display:block;margin-top:8px;color:#66786f;font-size:12px;line-height:1.45}
      .enhancement-result{margin-top:10px;padding:11px 13px;border-radius:12px;background:#ecfdf3;color:#067647;font-size:13px;font-weight:700}
      @media(max-width:680px){.brand-icon.brand-icon--official{width:96px;min-width:96px;height:42px}.operational-strip{grid-template-columns:1fr}.operational-strip span{justify-content:flex-start}.document-upload-addon,.document-review-addon{padding:15px;border-radius:17px}}
    `;
    document.head.appendChild(style);
  }

  function upgradeBrand() {
    const icon = document.querySelector('.brand-icon');
    if (icon && !icon.classList.contains('brand-icon--official')) {
      icon.classList.add('brand-icon--official');
      icon.innerHTML = '<img src="../assets/citronex-logo.jpg" alt="Citronex">';
    }
    const badge = document.querySelector('.version-badge');
    if (badge) badge.textContent = 'Kandydat 8.0';
    const brandbar = document.querySelector('.brandbar');
    if (brandbar && !document.querySelector('.operational-strip')) {
      const features = L().features || TEXT.en.features;
      const strip = document.createElement('div');
      strip.className = 'operational-strip';
      strip.innerHTML = `<span>📍 ${escapeHtml(features[0])}</span><span>✉️ ${escapeHtml(features[1])}</span><span>⏱ ${escapeHtml(features[2])}</span>`;
      brandbar.insertAdjacentElement('afterend', strip);
    }
  }

  function showError(message) {
    const node = document.getElementById('documentAddonError');
    if (node) node.textContent = message || '';
  }

  function addFiles(fileList) {
    showError('');
    const incoming = Array.from(fileList || []);
    const keys = new Set(selectedFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
    for (const file of incoming) {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (keys.has(key)) continue;
      if (!ALLOWED.has(extension(file.name))) {
        showError(`${L().invalidType} ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        showError(`${L().fileTooLarge} ${file.name}`);
        continue;
      }
      selectedFiles.push(file);
      keys.add(key);
    }
    if (selectedFiles.length > MAX_FILES) {
      selectedFiles = selectedFiles.slice(0, MAX_FILES);
      showError(L().tooMany);
    }
    while (totalBytes() > MAX_TOTAL_BYTES && selectedFiles.length) {
      selectedFiles.pop();
      showError(L().totalTooLarge);
    }
    try { sessionStorage.setItem(SESSION_FLAG, selectedFiles.length ? '1' : ''); } catch { /* no-op */ }
    renderFileLists();
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);
    try { sessionStorage.setItem(SESSION_FLAG, selectedFiles.length ? '1' : ''); } catch { /* no-op */ }
    renderFileLists();
  }

  function renderFileItems() {
    if (!selectedFiles.length) return `<p class="document-empty">${escapeHtml(L().noFiles)}</p>`;
    return `<ul class="document-file-list">${selectedFiles.map((file, index) => `
      <li class="document-file-item"><span><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(formatBytes(file.size))}</small></span><button class="document-remove" type="button" data-document-remove="${index}">${escapeHtml(L().remove)}</button></li>`).join('')}</ul>`;
  }

  function renderFileLists() {
    document.querySelectorAll('[data-document-list]').forEach((node) => { node.innerHTML = renderFileItems(); });
    document.querySelectorAll('[data-document-remove]').forEach((button) => {
      button.onclick = () => removeFile(Number(button.dataset.documentRemove));
    });
    const count = document.querySelector('[data-document-count]');
    if (count) count.textContent = selectedFiles.length ? `${selectedFiles.length} · ${formatBytes(totalBytes())}` : '';
  }

  function workStepVisible() {
    const segments = Array.from(document.querySelectorAll('.progress-segment'));
    return segments.findIndex((item) => item.classList.contains('current')) === 2;
  }

  function injectUploadSection() {
    if (!workStepVisible()) return;
    const shell = document.querySelector('.form-shell');
    const grid = shell?.querySelector('.field-grid');
    if (!shell || !grid || document.getElementById('documentUploadAddon')) return;
    const section = document.createElement('section');
    section.id = 'documentUploadAddon';
    section.className = 'document-upload-addon';
    let restoredWarning = '';
    try { if (sessionStorage.getItem(SESSION_FLAG) && !selectedFiles.length) restoredWarning = `<p class="document-empty">${escapeHtml(L().filesLost)}</p>`; } catch { /* no-op */ }
    section.innerHTML = `
      <h2>${escapeHtml(L().documentsTitle)}</h2>
      <p>${escapeHtml(L().documentsHint)}</p>
      <label class="document-picker">
        <input id="documentAddonInput" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document">
        <span><strong>📎 ${escapeHtml(L().chooseFiles)}</strong><small>${escapeHtml(L().formats)}</small></span>
      </label>
      <div data-document-list>${renderFileItems()}</div>
      <div id="documentAddonError" class="document-error" aria-live="polite"></div>
      ${restoredWarning}
    `;
    grid.insertAdjacentElement('afterend', section);
    section.querySelector('#documentAddonInput').addEventListener('change', (event) => {
      addFiles(event.target.files);
      event.target.value = '';
    });
    renderFileLists();
  }

  function getExcelRow() {
    const boxes = Array.from(document.querySelectorAll('.monospace'));
    return boxes.map((node) => node.textContent.trim()).find((value) => value.includes('\t')) || '';
  }

  function recordFromReview() {
    const row = getExcelRow();
    const values = row.split('\t');
    const record = {};
    CFG.excelColumns.forEach((column, index) => { record[column] = values[index] || ''; });
    return { row, record };
  }

  function selectedRecruiterEmail(record) {
    return record['E-mail rekrutera'] || document.querySelector('.recruiter-card.selected .recruiter-email')?.textContent.trim() || '';
  }

  function cleanHeader(value) {
    return String(value || '').replace(/[\r\n]+/g, ' ').trim();
  }

  function attachmentSummary() {
    return selectedFiles.length
      ? selectedFiles.map((file, index) => `${index + 1}. ${file.name} — ${formatBytes(file.size)}`).join('\n')
      : 'brak wybranych plików';
  }

  function importantRows(record) {
    const names = [
      'ID zgłoszenia','Data zgłoszenia','SLA do','Status SLA','Status','Rekruter','E-mail rekrutera',
      'Imię','Nazwisko','Telefon','Komunikator','E-mail kandydata','Obywatelstwo','Kraj pobytu','Miasto','Wiek',
      'Stanowisko','Preferowana lokalizacja','Doświadczenie','W Polsce','Deklarowany status dokumentów',
      'Gotowość','Praca zmianowa','Zakwaterowanie','Źródło deklarowane','Źródło linku','Kampania','Wakacja / oferta',
      'Wypełnia ankietę','Osoba wypełniająca / kontakt','Relacja z kandydatem','Partner / agencja','Kod grupy','Telefon partnera / agencji','Komentarz'
    ];
    return names.filter((name) => record[name]).map((name) => [name, record[name]]);
  }

  function buildEnhancedMessage() {
    const { row, record } = recordFromReview();
    const candidateInstruction = L().manualText;
    const table = importantRows(record).map(([label, value]) => `${label}\t${String(value).replace(/[\t\r\n]+/g, ' ')}`).join('\n');
    return [
      'CITRONEX / PPO SIECHNICE — NOWE ZGŁOSZENIE KANDYDATA',
      '',
      `STATUS: ${record.Status || 'NOWY'}`,
      `SLA DO: ${record['SLA do'] || ''}`,
      `LOKALIZACJA: ${record['Preferowana lokalizacja'] || ''}`,
      '',
      `INSTRUKCJA DLA KANDYDATA (${languageCode().toUpperCase()}):`,
      candidateInstruction,
      '',
      'TABELA KANDYDATA — 2 KOLUMNY (TSV)',
      'Pole\tWartość',
      table,
      '',
      'DOKUMENTY / ZAŁĄCZNIKI',
      attachmentSummary(),
      '',
      'DANE DO EXCEL — SKOPIUJ TYLKO NASTĘPNY WIERSZ',
      row,
      '',
      'Po wklejeniu w Excel ustaw kolejne działania: Status, Pierwszy kontakt, Następny kontakt, Wynik kontaktu, Decyzja i Uwagi rekrutera.'
    ].join('\n');
  }

  function emailSubject(record) {
    const name = `${record.Imię || ''} ${record.Nazwisko || ''}`.trim();
    return cleanHeader(`[NOWY KANDYDAT] ${record['ID zgłoszenia'] || ''} | ${name} | ${record.Obywatelstwo || ''} | ${record.Stanowisko || ''} | ${record['Preferowana lokalizacja'] || ''}`).slice(0, 220);
  }

  function openEnhancedMailto() {
    const { record } = recordFromReview();
    const recipient = selectedRecruiterEmail(record);
    if (!recipient) return;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(emailSubject(record))}&body=${encodeURIComponent(buildEnhancedMessage())}`;
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const size = 0x8000;
    for (let i = 0; i < bytes.length; i += size) binary += String.fromCharCode(...bytes.subarray(i, i + size));
    return btoa(binary);
  }

  function textToBase64(value) {
    return bytesToBase64(new TextEncoder().encode(String(value)));
  }

  function wrapBase64(value) {
    return String(value).replace(/.{1,76}/g, '$&\r\n').trimEnd();
  }

  function encodedHeader(value) {
    return `=?UTF-8?B?${textToBase64(cleanHeader(value))}?=`;
  }

  function safeFilename(value) {
    return String(value || 'attachment').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'attachment';
  }

  function mimeType(file) {
    const ext = extension(file.name);
    return ({ pdf:'application/pdf', jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', heic:'image/heic', heif:'image/heif', doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })[ext] || 'application/octet-stream';
  }

  function htmlEmail(record) {
    const rows = importantRows(record).map(([label, value]) => `<tr><th style="padding:8px 10px;border:1px solid #dbe6e0;background:#f3f8f5;text-align:left;width:34%;font:600 13px Arial;color:#53675d">${escapeHtml(label)}</th><td style="padding:8px 10px;border:1px solid #dbe6e0;font:14px Arial;color:#17231d">${escapeHtml(value)}</td></tr>`).join('');
    return `<!doctype html><html><body style="margin:0;padding:24px;background:#f2f7f4"><div style="max-width:840px;margin:auto;background:#fff;border:1px solid #dbe6e0;border-radius:18px;padding:24px;font-family:Arial,sans-serif"><div style="background:#075c39;color:#fff;padding:16px 18px;border-radius:13px"><strong style="font-size:12px;letter-spacing:.08em">CITRONEX / PPO SIECHNICE</strong><h1 style="margin:6px 0 0;font-size:24px">Nowe zgłoszenie kandydata</h1></div><p style="color:#52645b">Status: <strong>${escapeHtml(record.Status || 'NOWY')}</strong> · SLA do: <strong>${escapeHtml(record['SLA do'] || '')}</strong></p><table style="width:100%;border-collapse:collapse">${rows}</table><div style="margin-top:16px;padding:14px;border-radius:12px;background:#fff7e8;color:#7a4700"><strong>Dokumenty:</strong><pre style="white-space:pre-wrap;font:13px Arial">${escapeHtml(attachmentSummary())}</pre></div></div></body></html>`;
  }

  async function buildEml() {
    const { row, record } = recordFromReview();
    const recipient = selectedRecruiterEmail(record);
    const subject = emailSubject(record);
    const mixed = `mixed_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const alt = `alt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const lines = [
      `To: ${recipient}`,
      `Subject: ${encodedHeader(subject)}`,
      'MIME-Version: 1.0',
      'X-Unsent: 1',
      `Content-Type: multipart/mixed; boundary="${mixed}"`,
      '',
      `--${mixed}`,
      `Content-Type: multipart/alternative; boundary="${alt}"`,
      '',
      `--${alt}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(textToBase64(buildEnhancedMessage())),
      '',
      `--${alt}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      wrapBase64(textToBase64(htmlEmail(record))),
      '',
      `--${alt}--`,
      '',
      `--${mixed}`,
      `Content-Type: text/tab-separated-values; charset="UTF-8"; name="${safeFilename(record['ID zgłoszenia'] || 'kandydat')}.tsv"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${safeFilename(record['ID zgłoszenia'] || 'kandydat')}.tsv"`,
      '',
      wrapBase64(textToBase64(`${CFG.excelColumns.join('\t')}\r\n${row}\r\n`)),
      ''
    ];
    for (const file of selectedFiles) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const fallback = safeFilename(file.name);
      lines.push(
        `--${mixed}`,
        `Content-Type: ${mimeType(file)}; name="${fallback}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        '',
        wrapBase64(bytesToBase64(bytes)),
        ''
      );
    }
    lines.push(`--${mixed}--`, '');
    return lines.join('\r\n');
  }

  function showEnhancementResult(message, error = false) {
    let node = document.getElementById('enhancementResult');
    if (!node) {
      node = document.createElement('div');
      node.id = 'enhancementResult';
      node.className = 'enhancement-result';
      document.querySelector('.mail-panel')?.appendChild(node);
    }
    node.textContent = message;
    node.style.background = error ? '#fff0ee' : '#ecfdf3';
    node.style.color = error ? '#b42318' : '#067647';
  }

  async function prepareEml() {
    const button = document.querySelector('[data-enhancement-eml]');
    if (!button) return;
    button.disabled = true;
    button.textContent = L().emlWorking;
    try {
      const { record } = recordFromReview();
      const eml = await buildEml();
      const blob = new Blob([eml], { type: 'message/rfc822;charset=utf-8' });
      const anchor = document.createElement('a');
      anchor.href = URL.createObjectURL(blob);
      anchor.download = `${safeFilename(record['ID zgłoszenia'] || 'kandydat')}.eml`;
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => { URL.revokeObjectURL(anchor.href); anchor.remove(); }, 1500);
      showEnhancementResult(L().emlReady);
    } catch (error) {
      console.error(error);
      showEnhancementResult(L().emlError, true);
    } finally {
      button.disabled = false;
      button.textContent = `📎 ${L().emlButton}`;
    }
  }

  function injectReviewSection() {
    const review = document.querySelector('.review-card');
    const panel = document.querySelector('.mail-panel');
    if (!review || !panel) return;
    if (!document.getElementById('documentReviewAddon')) {
      const section = document.createElement('section');
      section.id = 'documentReviewAddon';
      section.className = 'document-review-addon';
      section.innerHTML = `<h2>${escapeHtml(L().documentsTitle)} <span data-document-count style="float:right;font-size:12px;color:#66786f"></span></h2><p>${escapeHtml(L().documentsHint)}</p><div data-document-list>${renderFileItems()}</div><div class="document-manual"><strong>${escapeHtml(L().manualTitle)}</strong>${escapeHtml(L().manualText)}</div>`;
      panel.insertAdjacentElement('beforebegin', section);
    }
    const actions = panel.querySelector('.mail-actions');
    if (actions && !actions.querySelector('[data-enhancement-eml]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button eml-action';
      button.dataset.enhancementEml = 'true';
      button.textContent = `📎 ${L().emlButton}`;
      button.addEventListener('click', prepareEml);
      actions.prepend(button);
      const help = document.createElement('small');
      help.className = 'eml-help';
      help.textContent = L().emlText;
      actions.insertAdjacentElement('afterend', help);
    }
    renderFileLists();
  }

  function refreshEnhancements() {
    installStyles();
    upgradeBrand();
    injectUploadSection();
    injectReviewSection();
  }

  function queueRefresh() {
    if (observerQueued) return;
    observerQueued = true;
    requestAnimationFrame(() => {
      observerQueued = false;
      refreshEnhancements();
    });
  }

  document.addEventListener('click', (event) => {
    const send = event.target.closest('[data-action="send"]');
    if (send) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openEnhancedMailto();
      return;
    }
    const fresh = event.target.closest('[data-action="new"]');
    if (fresh) {
      selectedFiles = [];
      try { sessionStorage.removeItem(SESSION_FLAG); } catch { /* no-op */ }
    }
  }, true);

  const observer = new MutationObserver(queueRefresh);
  observer.observe(document.getElementById('app'), { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshEnhancements, { once: true });
  else refreshEnhancements();
})();