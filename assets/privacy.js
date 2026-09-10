(function () {
  "use strict";

  const i18n = window.PortalI18n;
  if (!i18n) return;

  const policy = {
    pl: {
      eyebrow: "Kiris Jobs · prywatność",
      title: "Polityka prywatności kandydatów",
      updated: "Ostatnia aktualizacja: 10 września 2026 r.",
      lead: "Ta informacja wyjaśnia, jakie dane są używane, gdy przeglądasz oferty lub wysyłasz ankietę rekrutacyjną w Kiris Jobs.",
      summary: "Najważniejsze: nie ma konta kandydata, reklamowych cookies ani analityki. Formularz nie przyjmuje plików, zdjęć dokumentów, numeru PESEL, numeru paszportu ani danych bankowych.",
      controllerTitle: "1. Administrator i kontakt",
      controller: "Administratorem danych zbieranych przez tę stronę na pierwszym etapie rekrutacji jest Oleksandr Kiris. W sprawach prywatności napisz na",
      employer: "Jeśli zgłoszenie zostanie przekazane pracodawcy wskazanemu w ofercie, pracodawca może stać się odrębnym administratorem i powinien przekazać własną informację o przetwarzaniu.",
      dataTitle: "2. Jakie dane są przetwarzane",
      data: [
        "dane kontaktowe i identyfikacyjne podane w ankiecie, w tym imię, nazwisko, data urodzenia, płeć, telefon i opcjonalny e-mail;",
        "obywatelstwo, aktualny kraj i miasto, ogólny status dokumentów i prawa do pracy oraz daty ważności — bez numerów dokumentów;",
        "preferencje pracy, termin rozpoczęcia, zakwaterowanie, doświadczenie, kwalifikacje i odpowiedzi związane z wymaganiami stanowiska;",
        "dobrowolne komentarze; nie wpisuj diagnoz medycznych, danych bankowych ani danych innych osób;",
        "minimalne dane techniczne: identyfikator zgłoszenia, oferta, język, znaczniki czasu, status dostarczenia i jednokierunkowy skrót adresu IP używany przeciw nadużyciom."
      ],
      purposeTitle: "3. Cele i podstawy prawne",
      purpose: "Dane z ankiety służą do obsługi zgłoszenia, kontaktu, wstępnej oceny dopasowania i podjęcia działań na Twoje żądanie przed ewentualnym zatrudnieniem (art. 6 ust. 1 lit. b RODO). Dobrowolne dane i zgoda na wysłanie są przetwarzane na podstawie zgody (lit. a). Zabezpieczenie formularza, ograniczanie nadużyć i dowód dostarczenia opierają się na uzasadnionym interesie (lit. f).",
      retentionTitle: "4. Jak długo dane są przechowywane",
      retention: [
        "Szkic formularza może być zapisany w Twojej przeglądarce do 7 dni. Imię, nazwisko, data urodzenia, telefon, e-mail, miasto, pola tekstowe i daty dokumentów nie są zapisywane w tym szkicu.",
        "Minimalny techniczny rejestr dostarczenia jest usuwany automatycznie po 90 dniach.",
        "Treść zgłoszenia i korespondencja w skrzynce rekrutera są usuwane najpóźniej 12 miesięcy po zakończeniu danej rekrutacji, chyba że wcześniej wycofasz zgodę albo dłuższe przechowanie jest konieczne do ustalenia, dochodzenia lub obrony roszczeń."
      ],
      recipientsTitle: "5. Odbiorcy i dostawcy",
      recipients: "Zgłoszenie trafia do chronionej skrzynki rekrutera. W zakresie koniecznym do działania serwisu dane mogą przetwarzać: GitHub Pages (hosting strony), Cloudflare Turnstile (ochrona przed botami), Lovable Cloud (bramka formularza i minimalny rejestr) oraz Resend i dostawca skrzynki (dostarczenie e-maila). Dane mogą zostać przekazane pracodawcy wybranemu w zgłoszeniu. Dostawcy działają na podstawie swoich umów i zabezpieczeń dotyczących ewentualnego transferu poza EOG.",
      rightsTitle: "6. Twoje prawa",
      rights: "Możesz zażądać dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania lub przeniesienia, a także wnieść sprzeciw wobec uzasadnionego interesu. Zgodę możesz wycofać w dowolnym momencie; nie wpływa to na zgodność wcześniejszego przetwarzania. Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO).",
      voluntaryTitle: "7. Dobrowolność i decyzje automatyczne",
      voluntary: "Podanie danych jest dobrowolne, ale bez pól wymaganych nie można wysłać zgłoszenia. Wstępne dopasowanie ofert jest jedynie podpowiedzią. Nie zapada żadna wyłącznie automatyczna decyzja o zatrudnieniu.",
      securityTitle: "8. Bezpieczeństwo",
      security: "Połączenia są szyfrowane HTTPS. Odbiorca e-maila jest ustalony po stronie serwera, formularz ma limit rozmiaru, walidację danych, ochronę przed powtórkami, honeypot i limit prób. Nie wysyłaj przez formularz zdjęć dokumentów, numerów dokumentów, danych bankowych ani haseł.",
      contactTitle: "Kontakt w sprawie danych",
      contact: "W tytule wiadomości wpisz „Prywatność Kiris Jobs” i, jeśli go masz, numer zgłoszenia."
    },
    en: {
      eyebrow: "Kiris Jobs · privacy",
      title: "Candidate privacy policy",
      updated: "Last updated: 10 September 2026",
      lead: "This notice explains how data is used when you browse vacancies or submit a recruitment application through Kiris Jobs.",
      summary: "In short: there are no candidate accounts, advertising cookies or analytics. The form does not accept files, document photos, PESEL numbers, passport numbers or bank details.",
      controllerTitle: "1. Controller and contact",
      controller: "The controller for data collected by this page at the first recruitment stage is Oleksandr Kiris. For privacy requests, email",
      employer: "If the application is passed to the employer named in the vacancy, that employer may become a separate controller and should provide its own processing notice.",
      dataTitle: "2. Data processed",
      data: [
        "contact and identity details entered in the application, including name, date of birth, gender, phone number and optional email;",
        "citizenship, current country and city, general document and work-right status, and validity dates — without document numbers;",
        "job preferences, availability, housing needs, experience, qualifications and role-related answers;",
        "optional comments; do not enter medical diagnoses, bank data or another person's data;",
        "minimal technical data: application ID, vacancy, language, timestamps, delivery status and a one-way IP hash used to prevent abuse."
      ],
      purposeTitle: "3. Purposes and legal bases",
      purpose: "Application data is used to handle your request, contact you, make an initial suitability check and take steps at your request before possible employment (GDPR Article 6(1)(b)). Optional data and submission consent rely on consent (Article 6(1)(a)). Form security, abuse prevention and delivery evidence rely on legitimate interests (Article 6(1)(f)).",
      retentionTitle: "4. Retention",
      retention: [
        "A draft may remain in your browser for up to 7 days. Name, date of birth, phone, email, city, free-text fields and document validity dates are not stored in that draft.",
        "The minimal technical delivery log is deleted automatically after 90 days.",
        "The application and recruiter correspondence are deleted no later than 12 months after that recruitment ends, unless you withdraw earlier or longer storage is necessary for legal claims."
      ],
      recipientsTitle: "5. Recipients and providers",
      recipients: "The application is delivered to the recruiter's protected mailbox. As necessary to operate the service, data may be processed by GitHub Pages (site hosting), Cloudflare Turnstile (bot protection), Lovable Cloud (form gateway and minimal log), Resend and the mailbox provider (email delivery). Data may be passed to the employer selected in the application. Providers use their contractual safeguards for any transfer outside the EEA.",
      rightsTitle: "6. Your rights",
      rights: "You may request access, correction, deletion, restriction or portability, and object to processing based on legitimate interests. You may withdraw consent at any time without affecting earlier lawful processing. You may also complain to the Polish data protection authority, UODO.",
      voluntaryTitle: "7. Optional data and automated decisions",
      voluntary: "Providing data is voluntary, but required fields are needed to submit an application. Vacancy matching is only guidance. No employment decision is made solely by automated means.",
      securityTitle: "8. Security",
      security: "Connections use HTTPS. The recipient is fixed on the server; the gateway enforces size limits, strict validation, duplicate protection, a honeypot and rate limiting. Never send document photos, document numbers, bank data or passwords through the form.",
      contactTitle: "Privacy contact",
      contact: "Use “Kiris Jobs privacy” as the subject and include your application ID if available."
    },
    ru: {
      eyebrow: "Kiris Jobs · приватность",
      title: "Политика конфиденциальности кандидатов",
      updated: "Последнее обновление: 10 сентября 2026 года",
      lead: "Здесь объясняется, как используются данные при просмотре вакансий и отправке анкеты через Kiris Jobs.",
      summary: "Коротко: нет аккаунтов кандидатов, рекламных cookies и аналитики. Форма не принимает файлы, фото документов, номера PESEL и паспорта или банковские данные.",
      controllerTitle: "1. Кто отвечает за данные",
      controller: "На первом этапе рекрутинга администратор данных, собранных через эту страницу, — Oleksandr Kiris. По вопросам приватности пишите на",
      employer: "Если анкета передана работодателю, указанному в вакансии, он может стать отдельным администратором и обязан предоставить собственную информацию об обработке.",
      dataTitle: "2. Какие данные обрабатываются",
      data: [
        "контактные и идентификационные данные из анкеты: имя, фамилия, дата рождения, пол, телефон и необязательный e-mail;",
        "гражданство, текущая страна и город, общий статус документов и права на работу, сроки действия — без номеров документов;",
        "предпочтения, дата готовности, жильё, опыт, квалификация и ответы, связанные с требованиями вакансии;",
        "необязательные комментарии; не указывайте диагнозы, банковские данные или данные других людей;",
        "минимальные технические данные: номер заявки, вакансия, язык, время, статус доставки и односторонний хеш IP для защиты от злоупотреблений."
      ],
      purposeTitle: "3. Цели и правовые основания",
      purpose: "Данные нужны для обработки заявки, контакта, первичной оценки и действий по вашему запросу до возможного трудоустройства (ст. 6(1)(b) GDPR). Необязательные данные и отправка основаны на согласии (ст. 6(1)(a)). Защита формы, ограничение злоупотреблений и подтверждение доставки — на законном интересе (ст. 6(1)(f)).",
      retentionTitle: "4. Сроки хранения",
      retention: [
        "Черновик может храниться в вашем браузере до 7 дней. Имя, дата рождения, телефон, e-mail, город, свободный текст и сроки документов в черновик не записываются.",
        "Минимальный технический журнал доставки автоматически удаляется через 90 дней.",
        "Анкета и переписка в почте рекрутера удаляются не позднее 12 месяцев после завершения конкретного набора, если вы не отзовёте согласие раньше или более долгий срок не нужен для юридических требований."
      ],
      recipientsTitle: "5. Получатели и сервисы",
      recipients: "Анкета доставляется в защищённый ящик рекрутера. Для работы сервиса данные могут обрабатывать GitHub Pages (хостинг), Cloudflare Turnstile (защита от ботов), Lovable Cloud (шлюз формы и минимальный журнал), Resend и провайдер почты (доставка письма). Данные могут быть переданы выбранному работодателю. Для передачи за пределы ЕЭЗ провайдеры используют договорные гарантии.",
      rightsTitle: "6. Ваши права",
      rights: "Вы можете запросить доступ, исправление, удаление, ограничение или перенос данных и возразить против обработки на основании законного интереса. Согласие можно отозвать в любой момент. Также можно подать жалобу в польский орган UODO.",
      voluntaryTitle: "7. Добровольность и автоматические решения",
      voluntary: "Данные предоставляются добровольно, но без обязательных полей отправка невозможна. Автоподбор — только подсказка. Решение о трудоустройстве не принимается исключительно автоматически.",
      securityTitle: "8. Безопасность",
      security: "Используется HTTPS. Получатель письма закреплён на сервере; действуют лимит размера, строгая проверка, защита от повторов, скрытое антибот-поле и лимит попыток. Не отправляйте фото и номера документов, банковские данные или пароли.",
      contactTitle: "Контакт по вопросам данных",
      contact: "Укажите тему «Приватность Kiris Jobs» и номер заявки, если он у вас есть."
    },
    uk: {
      eyebrow: "Kiris Jobs · приватність",
      title: "Політика конфіденційності кандидатів",
      updated: "Останнє оновлення: 10 вересня 2026 року",
      lead: "Тут пояснено, як використовуються дані під час перегляду вакансій і надсилання анкети через Kiris Jobs.",
      summary: "Коротко: немає акаунтів кандидатів, рекламних cookies та аналітики. Форма не приймає файли, фото документів, номери PESEL і паспорта або банківські дані.",
      controllerTitle: "1. Хто відповідає за дані",
      controller: "На першому етапі рекрутингу адміністратор даних, зібраних через цю сторінку, — Oleksandr Kiris. З питань приватності пишіть на",
      employer: "Якщо анкету передано роботодавцю з вакансії, він може стати окремим адміністратором і має надати власну інформацію про обробку.",
      dataTitle: "2. Які дані обробляються",
      data: [
        "контактні та ідентифікаційні дані з анкети: ім’я, прізвище, дата народження, стать, телефон і необов’язковий e-mail;",
        "громадянство, поточна країна й місто, загальний статус документів і права на роботу, строки дії — без номерів документів;",
        "побажання щодо роботи, дата готовності, житло, досвід, кваліфікація та відповіді за вимогами вакансії;",
        "необов’язкові коментарі; не вказуйте діагнози, банківські дані чи дані інших осіб;",
        "мінімальні технічні дані: номер заявки, вакансія, мова, час, статус доставки й односторонній хеш IP для захисту від зловживань."
      ],
      purposeTitle: "3. Цілі та правові підстави",
      purpose: "Дані потрібні для обробки заявки, контакту, первинної оцінки та дій на ваш запит до можливого працевлаштування (ст. 6(1)(b) GDPR). Необов’язкові дані й надсилання ґрунтуються на згоді (ст. 6(1)(a)). Захист форми та підтвердження доставки — на законному інтересі (ст. 6(1)(f)).",
      retentionTitle: "4. Строки зберігання",
      retention: [
        "Чернетка може залишатися у вашому браузері до 7 днів. Ім’я, дата народження, телефон, e-mail, місто, вільний текст і строки документів у чернетку не записуються.",
        "Мінімальний технічний журнал доставки автоматично видаляється через 90 днів.",
        "Анкета й листування у пошті рекрутера видаляються не пізніше 12 місяців після завершення конкретного набору, якщо ви не відкличете згоду раніше або довший строк не потрібен для юридичних вимог."
      ],
      recipientsTitle: "5. Одержувачі та сервіси",
      recipients: "Анкета надходить до захищеної скриньки рекрутера. Дані можуть обробляти GitHub Pages (хостинг), Cloudflare Turnstile (захист від ботів), Lovable Cloud (шлюз форми та мінімальний журнал), Resend і поштовий провайдер (доставка листа). Дані можуть передати вибраному роботодавцю. Для передачі за межі ЄЕЗ провайдери застосовують договірні гарантії.",
      rightsTitle: "6. Ваші права",
      rights: "Ви можете запросити доступ, виправлення, видалення, обмеження чи перенесення даних і заперечити проти законного інтересу. Згоду можна відкликати будь-коли. Також можна подати скаргу до польського органу UODO.",
      voluntaryTitle: "7. Добровільність та автоматичні рішення",
      voluntary: "Дані надаються добровільно, але без обов’язкових полів надіслати заявку неможливо. Автодобір — лише підказка. Рішення про працевлаштування не приймається виключно автоматично.",
      securityTitle: "8. Безпека",
      security: "Використовується HTTPS. Одержувач листа закріплений на сервері; діють ліміт розміру, сувора перевірка, захист від повторів, приховане антибот-поле та ліміт спроб. Не надсилайте фото й номери документів, банківські дані чи паролі.",
      contactTitle: "Контакт із питань даних",
      contact: "У темі напишіть «Приватність Kiris Jobs» і додайте номер заявки, якщо він у вас є."
    },
    az: {
      eyebrow: "Kiris Jobs · məxfilik",
      title: "Namizədlər üçün məxfilik siyasəti",
      updated: "Son yenilənmə: 10 sentyabr 2026",
      lead: "Bu bildiriş vakansiyalara baxarkən və Kiris Jobs vasitəsilə anket göndərərkən məlumatların necə istifadə edildiyini izah edir.",
      summary: "Qısa şəkildə: namizəd hesabı, reklam kukiləri və analitika yoxdur. Forma fayl, sənəd şəkli, PESEL və pasport nömrəsi və ya bank məlumatı qəbul etmir.",
      controllerTitle: "1. Məlumatlara cavabdeh şəxs",
      controller: "İşə qəbulun ilk mərhələsində bu səhifə vasitəsilə toplanan məlumatların administratoru Oleksandr Kirisdir. Məxfilik sorğuları üçün yazın:",
      employer: "Anket vakansiyada göstərilən işəgötürənə ötürülərsə, həmin işəgötürən ayrıca administrator ola və öz məlumatlandırmasını təqdim edə bilər.",
      dataTitle: "2. Emal olunan məlumatlar",
      data: [
        "ad, soyad, doğum tarixi, cins, telefon və istəyə bağlı e-poçt daxil olmaqla əlaqə və identifikasiya məlumatları;",
        "vətəndaşlıq, mövcud ölkə və şəhər, sənədlərin və iş hüququnun ümumi statusu, qüvvədəolma tarixləri — sənəd nömrələri olmadan;",
        "iş seçimi, başlama tarixi, yaşayış ehtiyacı, təcrübə, ixtisas və vakansiya ilə bağlı cavablar;",
        "istəyə bağlı şərhlər; tibbi diaqnoz, bank məlumatı və ya başqa şəxsin məlumatını yazmayın;",
        "minimal texniki məlumatlar: müraciət ID-si, vakansiya, dil, vaxt, çatdırılma statusu və sui-istifadəyə qarşı birtərəfli IP heşi."
      ],
      purposeTitle: "3. Məqsədlər və hüquqi əsaslar",
      purpose: "Məlumatlar müraciətin işlənməsi, əlaqə, ilkin uyğunluq yoxlaması və mümkün işə qəbuldan əvvəl sizin istəyinizlə addımlar üçün istifadə olunur (GDPR 6(1)(b)). İstəyə bağlı məlumat və göndərmə razılığa əsaslanır (6(1)(a)). Təhlükəsizlik, sui-istifadənin qarşısı və çatdırılma sübutu qanuni marağa əsaslanır (6(1)(f)).",
      retentionTitle: "4. Saxlanma müddəti",
      retention: [
        "Qaralama brauzerinizdə 7 günədək qala bilər. Ad, doğum tarixi, telefon, e-poçt, şəhər, sərbəst mətn və sənəd tarixləri qaralamada saxlanmır.",
        "Minimal texniki çatdırılma jurnalı 90 gündən sonra avtomatik silinir.",
        "Anket və işə qəbul üzrə yazışmalar müvafiq qəbul bitdikdən ən gec 12 ay sonra silinir; razılığı daha əvvəl geri götürməyiniz və ya hüquqi tələblər istisnadır."
      ],
      recipientsTitle: "5. Alıcılar və xidmətlər",
      recipients: "Anket işə qəbul üzrə mütəxəssisin qorunan poçt qutusuna çatdırılır. GitHub Pages (hostinq), Cloudflare Turnstile (botlardan qorunma), Lovable Cloud (forma şlüzü və minimal jurnal), Resend və poçt provayderi məlumatları zəruri həddə emal edə bilər. Məlumat seçilmiş işəgötürənə ötürülə bilər. AİA xaricinə ötürmə üçün provayderlər müqavilə təminatlarından istifadə edir.",
      rightsTitle: "6. Hüquqlarınız",
      rights: "Məlumatlara giriş, düzəliş, silinmə, emalın məhdudlaşdırılması və daşınmasını tələb edə, qanuni marağa etiraz edə bilərsiniz. Razılığı istənilən vaxt geri götürmək olar. Polşanın məlumatların qorunması orqanı UODO-ya şikayət etmək hüququnuz da var.",
      voluntaryTitle: "7. Könüllülük və avtomatik qərarlar",
      voluntary: "Məlumat vermək könüllüdür, lakin məcburi sahələr olmadan anket göndərilmir. Vakansiya uyğunluğu yalnız tövsiyədir. İşə qəbul qərarı yalnız avtomatik üsulla verilmir.",
      securityTitle: "8. Təhlükəsizlik",
      security: "HTTPS istifadə olunur. E-poçt alıcısı serverdə sabitdir; ölçü limiti, ciddi yoxlama, təkrar göndərmədən qorunma, gizli anti-bot sahəsi və cəhd limiti tətbiq edilir. Sənəd şəkli və nömrəsi, bank məlumatı və ya parol göndərməyin.",
      contactTitle: "Məlumatlarla bağlı əlaqə",
      contact: "Mövzu hissəsinə “Kiris Jobs məxfilik” yazın və varsa müraciət ID-sini əlavə edin."
    }
  };

  const escapeHTML = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function renderList(items) {
    return `<ul>${items.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`;
  }

  function render() {
    const locale = i18n.locale;
    const copy = policy[locale] || policy.en;
    const container = document.getElementById("privacy-policy");
    if (!container) return;
    const fallbackNote = policy[locale] ? "" : `<p class="privacy-language-note">This legal notice is currently shown in English. You can request an explanation in your preferred language by email.</p>`;
    container.innerHTML = `
      <p class="privacy-eyebrow">${escapeHTML(copy.eyebrow)}</p>
      <h1>${escapeHTML(copy.title)}</h1>
      <p class="privacy-updated">${escapeHTML(copy.updated)}</p>
      <p class="privacy-lead">${escapeHTML(copy.lead)}</p>
      ${fallbackNote}
      <p class="privacy-summary">${escapeHTML(copy.summary)}</p>
      <h2>${escapeHTML(copy.controllerTitle)}</h2>
      <p>${escapeHTML(copy.controller)} <a href="mailto:oleksandr.kiris@icloud.com">oleksandr.kiris@icloud.com</a>.</p>
      <p>${escapeHTML(copy.employer)}</p>
      <h2>${escapeHTML(copy.dataTitle)}</h2>
      ${renderList(copy.data)}
      <h2>${escapeHTML(copy.purposeTitle)}</h2>
      <p>${escapeHTML(copy.purpose)}</p>
      <h2>${escapeHTML(copy.retentionTitle)}</h2>
      ${renderList(copy.retention)}
      <h2>${escapeHTML(copy.recipientsTitle)}</h2>
      <p>${escapeHTML(copy.recipients)}</p>
      <h2>${escapeHTML(copy.rightsTitle)}</h2>
      <p>${escapeHTML(copy.rights)}</p>
      <h2>${escapeHTML(copy.voluntaryTitle)}</h2>
      <p>${escapeHTML(copy.voluntary)}</p>
      <h2>${escapeHTML(copy.securityTitle)}</h2>
      <p class="privacy-warning">${escapeHTML(copy.security)}</p>
      <section class="privacy-contact">
        <h2>${escapeHTML(copy.contactTitle)}</h2>
        <p>${escapeHTML(copy.contact)} <a href="mailto:oleksandr.kiris@icloud.com">oleksandr.kiris@icloud.com</a></p>
      </section>
    `;
    document.title = `${copy.title} · Kiris Jobs`;
    document.getElementById("privacy-back")?.setAttribute("href", `./?lang=${encodeURIComponent(locale)}`);
    document.getElementById("privacy-home-link")?.setAttribute("href", `./?lang=${encodeURIComponent(locale)}`);
  }

  i18n.init();
  i18n.subscribe(render);
  render();
})();
