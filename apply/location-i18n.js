(() => {
  'use strict';

  const I18N = window.RECRUITMENT_I18N;
  if (!I18N) throw new Error('Core recruitment translations are missing.');

  const locationNames = {
    en: {
      workLocation: 'Preferred work location',
      workLocationHint: 'Choose the location you prefer. The recruiter will confirm current availability.',
      locationAvailability: 'The selected location is a preference, not a guarantee of an available place.',
      progressContact: 'Contact', progressLocation: 'Your location', progressWork: 'Work', progressDocuments: 'Documents', progressReview: 'Review',
      locations: {
        siechnice: 'Siechnice — greenhouse / sorting',
        ryczywol: 'Ryczywół / Kozienice — greenhouse',
        bogatynia: 'Bogatynia — greenhouse / sorting',
        zgorzelec: 'Zgorzelec — banana warehouse / cleaning',
        pruszcz: 'Pruszcz Gdański — banana warehouse',
        any: 'Any available location / to be agreed'
      }
    },
    pl: {
      workLocation: 'Preferowana lokalizacja pracy',
      workLocationHint: 'Wybierz preferowaną lokalizację. Rekruter potwierdzi aktualną dostępność miejsc.',
      locationAvailability: 'Wybrana lokalizacja jest preferencją, a nie gwarancją wolnego miejsca.',
      progressContact: 'Kontakt', progressLocation: 'Pobyt', progressWork: 'Praca', progressDocuments: 'Dokumenty', progressReview: 'Sprawdzenie',
      locations: {
        siechnice: 'Siechnice — szklarnie / sortownia',
        ryczywol: 'Ryczywół / Kozienice — szklarnie',
        bogatynia: 'Bogatynia — szklarnie / sortownia',
        zgorzelec: 'Zgorzelec — magazyn bananów / sprzątanie',
        pruszcz: 'Pruszcz Gdański — magazyn bananów',
        any: 'Dowolna dostępna lokalizacja / do uzgodnienia'
      }
    },
    ru: {
      workLocation: 'Предпочтительная локация работы',
      workLocationHint: 'Выберите желаемую локацию. Рекрутер подтвердит наличие мест.',
      locationAvailability: 'Выбранная локация является пожеланием, а не гарантией свободного места.',
      progressContact: 'Контакт', progressLocation: 'Место', progressWork: 'Работа', progressDocuments: 'Документы', progressReview: 'Проверка',
      locations: {
        siechnice: 'Сехнице — теплицы / сортировка',
        ryczywol: 'Рычивул / Козенице — теплицы',
        bogatynia: 'Богатыня — теплицы / сортировка',
        zgorzelec: 'Згожелец — склад бананов / уборка',
        pruszcz: 'Прущ-Гданьский — склад бананов',
        any: 'Любая доступная локация / по согласованию'
      }
    },
    uk: {
      workLocation: 'Бажана локація роботи',
      workLocationHint: 'Оберіть бажану локацію. Рекрутер підтвердить наявність місць.',
      locationAvailability: 'Обрана локація є побажанням, а не гарантією вільного місця.',
      progressContact: 'Контакт', progressLocation: 'Місце', progressWork: 'Робота', progressDocuments: 'Документи', progressReview: 'Перевірка',
      locations: {
        siechnice: 'Сехніце — теплиці / сортування',
        ryczywol: 'Ричивул / Козеніце — теплиці',
        bogatynia: 'Богатиня — теплиці / сортування',
        zgorzelec: 'Згожелець — склад бананів / прибирання',
        pruszcz: 'Прущ-Гданський — склад бананів',
        any: 'Будь-яка доступна локація / за погодженням'
      }
    },
    ka: {
      workLocation: 'სასურველი სამუშაო ადგილი',
      workLocationHint: 'აირჩიეთ სასურველი ადგილი. რეკრუტერი დაადასტურებს თავისუფალ ადგილებს.',
      locationAvailability: 'არჩეული ადგილი მხოლოდ სურვილია და თავისუფალი ადგილის გარანტია არ არის.',
      progressContact: 'კონტაქტი', progressLocation: 'ადგილმდებარეობა', progressWork: 'სამუშაო', progressDocuments: 'დოკუმენტები', progressReview: 'შემოწმება',
      locations: {
        siechnice: 'Siechnice — სათბური / დახარისხება', ryczywol: 'Ryczywół / Kozienice — სათბური', bogatynia: 'Bogatynia — სათბური / დახარისხება',
        zgorzelec: 'Zgorzelec — ბანანის საწყობი / დასუფთავება', pruszcz: 'Pruszcz Gdański — ბანანის საწყობი', any: 'ნებისმიერი ხელმისაწვდომი ადგილი / შეთანხმებით'
      }
    },
    az: {
      workLocation: 'Üstünlük verdiyiniz iş yeri', workLocationHint: 'İstədiyiniz yeri seçin. Rekruter mövcud yerləri təsdiqləyəcək.',
      locationAvailability: 'Seçilmiş yer üstünlükdür, boş yerə zəmanət deyil.', progressContact: 'Əlaqə', progressLocation: 'Məkan', progressWork: 'İş', progressDocuments: 'Sənədlər', progressReview: 'Yoxlama',
      locations: { siechnice: 'Siechnice — istixana / çeşidləmə', ryczywol: 'Ryczywół / Kozienice — istixana', bogatynia: 'Bogatynia — istixana / çeşidləmə', zgorzelec: 'Zgorzelec — banan anbarı / təmizlik', pruszcz: 'Pruszcz Gdański — banan anbarı', any: 'İstənilən mövcud yer / razılaşma ilə' }
    },
    hy: {
      workLocation: 'Նախընտրելի աշխատանքի վայրը', workLocationHint: 'Ընտրեք ցանկալի վայրը։ Հավաքագրողը կհաստատի ազատ տեղերը։',
      locationAvailability: 'Ընտրված վայրը նախընտրություն է, ոչ թե ազատ տեղի երաշխիք։', progressContact: 'Կապ', progressLocation: 'Վայր', progressWork: 'Աշխատանք', progressDocuments: 'Փաստաթղթեր', progressReview: 'Ստուգում',
      locations: { siechnice: 'Siechnice — ջերմոց / տեսակավորում', ryczywol: 'Ryczywół / Kozienice — ջերմոց', bogatynia: 'Bogatynia — ջերմոց / տեսակավորում', zgorzelec: 'Zgorzelec — բանանի պահեստ / մաքրում', pruszcz: 'Pruszcz Gdański — բանանի պահեստ', any: 'Ցանկացած հասանելի վայր / համաձայնությամբ' }
    },
    tr: {
      workLocation: 'Tercih edilen çalışma yeri', workLocationHint: 'Tercih ettiğiniz yeri seçin. İşe alım uzmanı müsaitliği doğrulayacaktır.',
      locationAvailability: 'Seçilen yer bir tercihtir; boş yer garantisi değildir.', progressContact: 'İletişim', progressLocation: 'Konum', progressWork: 'İş', progressDocuments: 'Belgeler', progressReview: 'Kontrol',
      locations: { siechnice: 'Siechnice — sera / ayıklama', ryczywol: 'Ryczywół / Kozienice — sera', bogatynia: 'Bogatynia — sera / ayıklama', zgorzelec: 'Zgorzelec — muz deposu / temizlik', pruszcz: 'Pruszcz Gdański — muz deposu', any: 'Herhangi bir uygun yer / görüşülecek' }
    },
    uz: {
      workLocation: 'Afzal ko‘rilgan ish joyi', workLocationHint: 'Istagan joyingizni tanlang. Rekruter bo‘sh o‘rinlarni tasdiqlaydi.',
      locationAvailability: 'Tanlangan joy istak hisoblanadi, bo‘sh joy kafolati emas.', progressContact: 'Aloqa', progressLocation: 'Joy', progressWork: 'Ish', progressDocuments: 'Hujjatlar', progressReview: 'Tekshiruv',
      locations: { siechnice: 'Siechnice — issiqxona / saralash', ryczywol: 'Ryczywół / Kozienice — issiqxona', bogatynia: 'Bogatynia — issiqxona / saralash', zgorzelec: 'Zgorzelec — banan ombori / tozalash', pruszcz: 'Pruszcz Gdański — banan ombori', any: 'Istalgan mavjud joy / kelishuv asosida' }
    },
    ky: {
      workLocation: 'Каалаган жумуш жайы', workLocationHint: 'Каалаган жерди тандаңыз. Рекрутер бош орундарды ырастайт.',
      locationAvailability: 'Тандалган жер каалоо гана, бош орундун кепилдиги эмес.', progressContact: 'Байланыш', progressLocation: 'Жер', progressWork: 'Жумуш', progressDocuments: 'Документтер', progressReview: 'Текшерүү',
      locations: { siechnice: 'Siechnice — күнөскана / сорттоо', ryczywol: 'Ryczywół / Kozienice — күнөскана', bogatynia: 'Bogatynia — күнөскана / сорттоо', zgorzelec: 'Zgorzelec — банан кампасы / тазалоо', pruszcz: 'Pruszcz Gdański — банан кампасы', any: 'Каалаган жеткиликтүү жер / макулдашуу боюнча' }
    },
    tg: {
      workLocation: 'Ҷойи кори дилхоҳ', workLocationHint: 'Ҷойи дилхоҳро интихоб кунед. Рекрутер ҷойҳои холиро тасдиқ мекунад.',
      locationAvailability: 'Ҷойи интихобшуда хоҳиш аст, на кафолати ҷойи холӣ.', progressContact: 'Тамос', progressLocation: 'Ҷой', progressWork: 'Кор', progressDocuments: 'Ҳуҷҷатҳо', progressReview: 'Санҷиш',
      locations: { siechnice: 'Siechnice — гармхона / ҷудокунӣ', ryczywol: 'Ryczywół / Kozienice — гармхона', bogatynia: 'Bogatynia — гармхона / ҷудокунӣ', zgorzelec: 'Zgorzelec — анбори банан / тозакунӣ', pruszcz: 'Pruszcz Gdański — анбори банан', any: 'Ҳар ҷойи дастрас / бо мувофиқа' }
    },
    kk: {
      workLocation: 'Қалаған жұмыс орны', workLocationHint: 'Қалаған орынды таңдаңыз. Рекрутер бос орындарды растайды.',
      locationAvailability: 'Таңдалған орын — қалау ғана, бос орын кепілдігі емес.', progressContact: 'Байланыс', progressLocation: 'Орналасу', progressWork: 'Жұмыс', progressDocuments: 'Құжаттар', progressReview: 'Тексеру',
      locations: { siechnice: 'Siechnice — жылыжай / сұрыптау', ryczywol: 'Ryczywół / Kozienice — жылыжай', bogatynia: 'Bogatynia — жылыжай / сұрыптау', zgorzelec: 'Zgorzelec — банан қоймасы / тазалау', pruszcz: 'Pruszcz Gdański — банан қоймасы', any: 'Кез келген қолжетімді орын / келісім бойынша' }
    },
    hi: {
      workLocation: 'पसंदीदा कार्य स्थान', workLocationHint: 'अपनी पसंद की जगह चुनें। रिक्रूटर उपलब्धता की पुष्टि करेगा।',
      locationAvailability: 'चुनी गई जगह केवल पसंद है, खाली स्थान की गारंटी नहीं।', progressContact: 'संपर्क', progressLocation: 'स्थान', progressWork: 'काम', progressDocuments: 'दस्तावेज़', progressReview: 'जाँच',
      locations: { siechnice: 'Siechnice — ग्रीनहाउस / छंटाई', ryczywol: 'Ryczywół / Kozienice — ग्रीनहाउस', bogatynia: 'Bogatynia — ग्रीनहाउस / छंटाई', zgorzelec: 'Zgorzelec — केला गोदाम / सफाई', pruszcz: 'Pruszcz Gdański — केला गोदाम', any: 'कोई भी उपलब्ध स्थान / सहमति से' }
    },
    bn: {
      workLocation: 'পছন্দের কাজের স্থান', workLocationHint: 'পছন্দের স্থান বেছে নিন। রিক্রুটার শূন্যপদ নিশ্চিত করবেন।',
      locationAvailability: 'নির্বাচিত স্থান একটি পছন্দ, খালি পদের নিশ্চয়তা নয়।', progressContact: 'যোগাযোগ', progressLocation: 'স্থান', progressWork: 'কাজ', progressDocuments: 'নথি', progressReview: 'পরীক্ষা',
      locations: { siechnice: 'Siechnice — গ্রিনহাউস / বাছাই', ryczywol: 'Ryczywół / Kozienice — গ্রিনহাউস', bogatynia: 'Bogatynia — গ্রিনহাউস / বাছাই', zgorzelec: 'Zgorzelec — কলার গুদাম / পরিষ্কার', pruszcz: 'Pruszcz Gdański — কলার গুদাম', any: 'যেকোনো উপলব্ধ স্থান / আলোচনাসাপেক্ষ' }
    },
    ne: {
      workLocation: 'रोजाइको काम स्थान', workLocationHint: 'आफूले चाहेको स्थान छान्नुहोस्। रिक्रुटरले उपलब्धता पुष्टि गर्नेछ।',
      locationAvailability: 'छानिएको स्थान प्राथमिकता हो, खाली ठाउँको ग्यारेन्टी होइन।', progressContact: 'सम्पर्क', progressLocation: 'स्थान', progressWork: 'काम', progressDocuments: 'कागजात', progressReview: 'जाँच',
      locations: { siechnice: 'Siechnice — ग्रीनहाउस / वर्गीकरण', ryczywol: 'Ryczywół / Kozienice — ग्रीनहाउस', bogatynia: 'Bogatynia — ग्रीनहाउस / वर्गीकरण', zgorzelec: 'Zgorzelec — केरा गोदाम / सरसफाइ', pruszcz: 'Pruszcz Gdański — केरा गोदाम', any: 'कुनै पनि उपलब्ध स्थान / सहमतिमा' }
    },
    ur: {
      workLocation: 'ترجیحی کام کی جگہ', workLocationHint: 'اپنی پسند کی جگہ منتخب کریں۔ ریکروٹر دستیابی کی تصدیق کرے گا۔',
      locationAvailability: 'منتخب جگہ صرف ترجیح ہے، خالی جگہ کی ضمانت نہیں۔', progressContact: 'رابطہ', progressLocation: 'مقام', progressWork: 'کام', progressDocuments: 'دستاویزات', progressReview: 'جائزہ',
      locations: { siechnice: 'Siechnice — گرین ہاؤس / چھانٹی', ryczywol: 'Ryczywół / Kozienice — گرین ہاؤس', bogatynia: 'Bogatynia — گرین ہاؤس / چھانٹی', zgorzelec: 'Zgorzelec — کیلے کا گودام / صفائی', pruszcz: 'Pruszcz Gdański — کیلے کا گودام', any: 'کوئی بھی دستیاب جگہ / باہمی رضامندی سے' }
    },
    si: {
      workLocation: 'කැමති රැකියා ස්ථානය', workLocationHint: 'ඔබ කැමති ස්ථානය තෝරන්න. රැකියා නිලධාරියා හිස් තැන් තහවුරු කරයි.',
      locationAvailability: 'තෝරාගත් ස්ථානය කැමැත්තක් පමණි; හිස් තැනක් සහතික නොවේ.', progressContact: 'සම්බන්ධතාව', progressLocation: 'ස්ථානය', progressWork: 'රැකියාව', progressDocuments: 'ලේඛන', progressReview: 'පරීක්ෂාව',
      locations: { siechnice: 'Siechnice — හරිතාගාර / වර්ග කිරීම', ryczywol: 'Ryczywół / Kozienice — හරිතාගාර', bogatynia: 'Bogatynia — හරිතාගාර / වර්ග කිරීම', zgorzelec: 'Zgorzelec — කෙසෙල් ගබඩාව / පිරිසිදු කිරීම', pruszcz: 'Pruszcz Gdański — කෙසෙල් ගබඩාව', any: 'ඕනෑම පවතින ස්ථානයක් / එකඟතාවෙන්' }
    },
    fil: {
      workLocation: 'Gustong lokasyon ng trabaho', workLocationHint: 'Piliin ang gusto mong lokasyon. Kukumpirmahin ng recruiter ang bakanteng lugar.',
      locationAvailability: 'Ang napiling lokasyon ay kagustuhan lamang at hindi garantiya ng bakante.', progressContact: 'Kontak', progressLocation: 'Lokasyon', progressWork: 'Trabaho', progressDocuments: 'Dokumento', progressReview: 'Suriin',
      locations: { siechnice: 'Siechnice — greenhouse / sorting', ryczywol: 'Ryczywół / Kozienice — greenhouse', bogatynia: 'Bogatynia — greenhouse / sorting', zgorzelec: 'Zgorzelec — banana warehouse / cleaning', pruszcz: 'Pruszcz Gdański — banana warehouse', any: 'Anumang available na lokasyon / pag-uusapan' }
    },
    id: {
      workLocation: 'Lokasi kerja pilihan', workLocationHint: 'Pilih lokasi yang Anda inginkan. Perekrut akan mengonfirmasi ketersediaan.',
      locationAvailability: 'Lokasi yang dipilih adalah preferensi, bukan jaminan tempat kosong.', progressContact: 'Kontak', progressLocation: 'Lokasi', progressWork: 'Pekerjaan', progressDocuments: 'Dokumen', progressReview: 'Periksa',
      locations: { siechnice: 'Siechnice — rumah kaca / penyortiran', ryczywol: 'Ryczywół / Kozienice — rumah kaca', bogatynia: 'Bogatynia — rumah kaca / penyortiran', zgorzelec: 'Zgorzelec — gudang pisang / kebersihan', pruszcz: 'Pruszcz Gdański — gudang pisang', any: 'Lokasi mana pun yang tersedia / disepakati' }
    },
    vi: {
      workLocation: 'Địa điểm làm việc mong muốn', workLocationHint: 'Chọn địa điểm bạn mong muốn. Nhà tuyển dụng sẽ xác nhận chỗ còn trống.',
      locationAvailability: 'Địa điểm đã chọn chỉ là nguyện vọng, không bảo đảm còn chỗ.', progressContact: 'Liên hệ', progressLocation: 'Địa điểm', progressWork: 'Công việc', progressDocuments: 'Giấy tờ', progressReview: 'Kiểm tra',
      locations: { siechnice: 'Siechnice — nhà kính / phân loại', ryczywol: 'Ryczywół / Kozienice — nhà kính', bogatynia: 'Bogatynia — nhà kính / phân loại', zgorzelec: 'Zgorzelec — kho chuối / vệ sinh', pruszcz: 'Pruszcz Gdański — kho chuối', any: 'Bất kỳ địa điểm nào còn chỗ / thỏa thuận' }
    }
  };

  Object.entries(locationNames).forEach(([code, patch]) => {
    const locale = I18N.locales[code];
    if (!locale) return;
    locale.workLocation = patch.workLocation;
    locale.workLocationHint = patch.workLocationHint;
    locale.locationAvailability = patch.locationAvailability;
    locale.progressContact = patch.progressContact;
    locale.progressLocation = patch.progressLocation;
    locale.progressWork = patch.progressWork;
    locale.progressDocuments = patch.progressDocuments;
    locale.progressReview = patch.progressReview;
    locale.options = locale.options || {};
    locale.options.locations = patch.locations;
  });

  I18N.internal = Object.freeze({
    ...I18N.internal,
    locations: Object.freeze({
      siechnice: 'Siechnice — szklarnie / sortownia',
      ryczywol: 'Ryczywół / Kozienice — szklarnie',
      bogatynia: 'Bogatynia — szklarnie / sortownia',
      zgorzelec: 'Zgorzelec — magazyn bananów / sprzątanie',
      pruszcz: 'Pruszcz Gdański — magazyn bananów',
      any: 'Dowolna dostępna lokalizacja / do uzgodnienia'
    })
  });
})();
