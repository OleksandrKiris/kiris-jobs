(() => {
  'use strict';

  const en = Object.freeze({
    self: 'I am filling in my own application',
    representative: 'I am filling in for a candidate / group',
    step1Subtitle: 'Choose who is completing the form, then enter the candidate’s contact details.',
    step4Title: 'How did the candidate find us?',
    step4Subtitle: 'Choose the channel and enter the exact person, partner, page, group or profile.',
    sourceDetails: 'Who sent the candidate / exact source',
    sourceDetailsHint: 'Enter a person, recruiter, partner, agency, Facebook group, page, TikTok profile or campaign. If unknown, write “I do not know”.',
    sourceDetailsPlaceholder: 'For example: Giorgi Beridze, TikTok Oleksandr, Facebook group…',
    emailInstruction: 'Your email app will open with the recipient, subject, candidate table and Excel row already filled in. Check it and press Send.',
    partnerPanelTitle: 'Partner / group details',
    sourcePanelTitle: 'Candidate source',
    nextCandidate: 'Next candidate from this group',
    nextCandidateHint: 'The recruiter, partner, group code, source, job and location will stay selected. Personal data will be cleared.'
  });

  window.RECRUITMENT_MOBILE_I18N = Object.freeze({
    en,
    pl: Object.freeze({
      self: 'Wypełniam swoją ankietę',
      representative: 'Wypełniam za kandydata / grupę',
      step1Subtitle: 'Wybierz, kto wypełnia formularz, a następnie podaj dane kontaktowe kandydata.',
      step4Title: 'Skąd trafił do nas kandydat?',
      step4Subtitle: 'Wybierz kanał i wpisz konkretną osobę, partnera, stronę, grupę albo profil.',
      sourceDetails: 'Kto przekazał kandydata / dokładne źródło',
      sourceDetailsHint: 'Wpisz osobę, rekrutera, partnera, agencję, grupę Facebook, stronę, profil TikTok lub kampanię. Jeżeli nie wiesz, wpisz „nie wiem”.',
      sourceDetailsPlaceholder: 'Np. Giorgi Beridze, TikTok Oleksandr, grupa Facebook…',
      emailInstruction: 'Otworzy się poczta z wpisanym odbiorcą, tematem, tabelą kandydata i wierszem do Excela. Sprawdź wiadomość i naciśnij „Wyślij”.',
      partnerPanelTitle: 'Dane partnera / grupy', sourcePanelTitle: 'Źródło kandydata',
      nextCandidate: 'Następny kandydat z tej grupy',
      nextCandidateHint: 'Rekruter, partner, kod grupy, źródło, stanowisko i lokalizacja pozostaną wybrane. Dane osobowe zostaną wyczyszczone.'
    }),
    ru: Object.freeze({
      self: 'Заполняю свою анкету', representative: 'Заполняю за кандидата / группу',
      step1Subtitle: 'Выберите, кто заполняет анкету, затем укажите контакты кандидата.',
      step4Title: 'Откуда пришёл кандидат?', step4Subtitle: 'Выберите канал и укажите конкретного человека, партнёра, страницу, группу или профиль.',
      sourceDetails: 'Кто передал кандидата / точный источник',
      sourceDetailsHint: 'Укажите человека, рекрутера, партнёра, агентство, группу Facebook, страницу, TikTok-профиль или кампанию. Если не знаете, напишите «не знаю».',
      sourceDetailsPlaceholder: 'Например: Giorgi Beridze, TikTok Oleksandr, группа Facebook…',
      emailInstruction: 'Откроется почта с готовым получателем, темой, таблицей кандидата и строкой для Excel. Проверьте письмо и нажмите «Отправить».',
      partnerPanelTitle: 'Данные партнёра / группы', sourcePanelTitle: 'Источник кандидата',
      nextCandidate: 'Следующий кандидат из этой группы',
      nextCandidateHint: 'Рекрутер, партнёр, код группы, источник, вакансия и локация сохранятся. Личные данные будут очищены.'
    }),
    uk: Object.freeze({
      self: 'Заповнюю власну анкету', representative: 'Заповнюю за кандидата / групу',
      step1Subtitle: 'Оберіть, хто заповнює анкету, потім вкажіть контакти кандидата.',
      step4Title: 'Звідки прийшов кандидат?', step4Subtitle: 'Оберіть канал і вкажіть конкретну людину, партнера, сторінку, групу або профіль.',
      sourceDetails: 'Хто передав кандидата / точне джерело',
      sourceDetailsHint: 'Вкажіть людину, рекрутера, партнера, агенцію, групу Facebook, сторінку, TikTok-профіль або кампанію. Якщо не знаєте, напишіть «не знаю».',
      sourceDetailsPlaceholder: 'Наприклад: Giorgi Beridze, TikTok Oleksandr, група Facebook…',
      emailInstruction: 'Відкриється пошта з готовим отримувачем, темою, таблицею кандидата та рядком для Excel. Перевірте лист і натисніть «Надіслати».',
      partnerPanelTitle: 'Дані партнера / групи', sourcePanelTitle: 'Джерело кандидата',
      nextCandidate: 'Наступний кандидат із цієї групи',
      nextCandidateHint: 'Рекрутер, партнер, код групи, джерело, вакансія та локація збережуться. Особисті дані буде очищено.'
    }),
    ka: Object.freeze({
      self: 'ჩემს განაცხადს თავად ვავსებ', representative: 'კანდიდატის / ჯგუფის ნაცვლად ვავსებ',
      step1Subtitle: 'აირჩიეთ ვინ ავსებს ფორმას და შემდეგ შეიყვანეთ კანდიდატის საკონტაქტო მონაცემები.',
      step4Title: 'საიდან მოვიდა კანდიდატი?', step4Subtitle: 'აირჩიეთ არხი და მიუთითეთ კონკრეტული პირი, პარტნიორი, გვერდი, ჯგუფი ან პროფილი.',
      sourceDetails: 'ვინ გამოგზავნა კანდიდატი / ზუსტი წყარო',
      sourceDetailsHint: 'მიუთითეთ პირი, რეკრუტერი, პარტნიორი, სააგენტო, Facebook ჯგუფი, გვერდი, TikTok პროფილი ან კამპანია.',
      sourceDetailsPlaceholder: 'მაგ.: Giorgi Beridze, TikTok Oleksandr, Facebook ჯგუფი…',
      emailInstruction: 'გაიხსნება ელფოსტა უკვე შევსებული მიმღებით, თემით, კანდიდატის ცხრილით და Excel-ის სტრიქონით. შეამოწმეთ და გაგზავნეთ.',
      partnerPanelTitle: 'პარტნიორის / ჯგუფის მონაცემები', sourcePanelTitle: 'კანდიდატის წყარო',
      nextCandidate: 'ამ ჯგუფის შემდეგი კანდიდატი',
      nextCandidateHint: 'რეკრუტერი, პარტნიორი, ჯგუფის კოდი, წყარო, სამუშაო და ლოკაცია დარჩება არჩეული. პირადი მონაცემები გასუფთავდება.'
    }),
    az: Object.freeze({
      self: 'Öz müraciətimi doldururam', representative: 'Namizəd / qrup üçün doldururam',
      step1Subtitle: 'Formanı kimin doldurduğunu seçin, sonra namizədin əlaqə məlumatlarını daxil edin.',
      step4Title: 'Namizəd bizi haradan tapdı?', step4Subtitle: 'Kanalı seçin və konkret şəxsi, tərəfdaşı, səhifəni, qrupu və ya profili yazın.',
      sourceDetails: 'Namizədi kim göndərdi / dəqiq mənbə', sourceDetailsHint: 'Şəxs, rekruter, tərəfdaş, agentlik, Facebook qrupu, səhifə, TikTok profili və ya kampaniya yazın.',
      sourceDetailsPlaceholder: 'Məs.: Giorgi Beridze, TikTok Oleksandr, Facebook qrupu…',
      emailInstruction: 'E-poçt tətbiqi alıcı, mövzu, namizəd cədvəli və Excel sətri ilə hazır açılacaq. Yoxlayın və Göndər düyməsini basın.',
      partnerPanelTitle: 'Tərəfdaş / qrup məlumatları', sourcePanelTitle: 'Namizədin mənbəyi',
      nextCandidate: 'Bu qrupdan növbəti namizəd',
      nextCandidateHint: 'Rekruter, tərəfdaş, qrup kodu, mənbə, iş və lokasiya saxlanacaq. Şəxsi məlumatlar silinəcək.'
    }),
    hy: Object.freeze({
      self: 'Լրացնում եմ իմ դիմումը', representative: 'Լրացնում եմ թեկնածուի / խմբի համար',
      step1Subtitle: 'Ընտրեք, թե ով է լրացնում ձևը, ապա մուտքագրեք թեկնածուի կապի տվյալները։',
      step4Title: 'Որտեղի՞ց եկավ թեկնածուն', step4Subtitle: 'Ընտրեք ալիքը և նշեք կոնկրետ անձին, գործընկերոջը, էջը, խումբը կամ պրոֆիլը։',
      sourceDetails: 'Ով է ուղարկել թեկնածուին / ճշգրիտ աղբյուր', sourceDetailsHint: 'Նշեք անձին, հավաքագրողին, գործընկերոջը, գործակալությանը, Facebook խմբին, էջին, TikTok պրոֆիլին կամ արշավին։',
      sourceDetailsPlaceholder: 'Օր․ Giorgi Beridze, TikTok Oleksandr, Facebook խումբ…',
      emailInstruction: 'Էլ․ փոստը կբացվի պատրաստ ստացողի, թեմայի, թեկնածուի աղյուսակի և Excel տողի հետ։ Ստուգեք և սեղմեք Ուղարկել։',
      partnerPanelTitle: 'Գործընկերոջ / խմբի տվյալներ', sourcePanelTitle: 'Թեկնածուի աղբյուր',
      nextCandidate: 'Այս խմբի հաջորդ թեկնածուն', nextCandidateHint: 'Հավաքագրողը, գործընկերը, խմբի կոդը, աղբյուրը, աշխատանքը և վայրը կպահպանվեն։ Անձնական տվյալները կմաքրվեն։'
    }),
    tr: Object.freeze({
      self: 'Kendi başvurumu dolduruyorum', representative: 'Aday / grup için dolduruyorum',
      step1Subtitle: 'Formu kimin doldurduğunu seçin, ardından adayın iletişim bilgilerini girin.',
      step4Title: 'Aday bizi nereden buldu?', step4Subtitle: 'Kanalı seçin ve belirli kişiyi, ortağı, sayfayı, grubu veya profili yazın.',
      sourceDetails: 'Adayı kim gönderdi / kesin kaynak', sourceDetailsHint: 'Kişi, işe alım uzmanı, ortak, ajans, Facebook grubu, sayfa, TikTok profili veya kampanya yazın.',
      sourceDetailsPlaceholder: 'Örn. Giorgi Beridze, TikTok Oleksandr, Facebook grubu…',
      emailInstruction: 'E-posta uygulaması alıcı, konu, aday tablosu ve Excel satırı hazır olarak açılır. Kontrol edip Gönder’e basın.',
      partnerPanelTitle: 'Ortak / grup bilgileri', sourcePanelTitle: 'Aday kaynağı',
      nextCandidate: 'Bu gruptaki sonraki aday', nextCandidateHint: 'İşe alım uzmanı, ortak, grup kodu, kaynak, iş ve konum korunur. Kişisel veriler temizlenir.'
    }),
    uz: Object.freeze({
      self: 'O‘z arizamni to‘ldiryapman', representative: 'Nomzod / guruh uchun to‘ldiryapman',
      step1Subtitle: 'Anketani kim to‘ldirayotganini tanlang, so‘ng nomzodning aloqa ma’lumotlarini kiriting.',
      step4Title: 'Nomzod bizni qayerdan topdi?', step4Subtitle: 'Kanalni tanlang va aniq shaxs, hamkor, sahifa, guruh yoki profilni yozing.',
      sourceDetails: 'Nomzodni kim yubordi / aniq manba', sourceDetailsHint: 'Shaxs, rekruter, hamkor, agentlik, Facebook guruhi, sahifa, TikTok profili yoki kampaniyani yozing.',
      sourceDetailsPlaceholder: 'Masalan: Giorgi Beridze, TikTok Oleksandr, Facebook guruhi…',
      emailInstruction: 'E-pochta ilovasi qabul qiluvchi, mavzu, nomzod jadvali va Excel qatori bilan tayyor ochiladi. Tekshirib, Yuborish tugmasini bosing.',
      partnerPanelTitle: 'Hamkor / guruh ma’lumotlari', sourcePanelTitle: 'Nomzod manbasi',
      nextCandidate: 'Ushbu guruhdagi keyingi nomzod', nextCandidateHint: 'Rekruter, hamkor, guruh kodi, manba, ish va lokatsiya saqlanadi. Shaxsiy ma’lumotlar tozalanadi.'
    })
  });
})();
