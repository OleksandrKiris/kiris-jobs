(function () {
  'use strict';
  const M = window.CoordinatorDemo;
  const copy = {
    en: {
      title:'Coordinator demo', notice:'Fictional tasks only. No employee records, bookings or messages. Do not use this demo as a real work register.', language:'Language', filter:'Status', all:'All tasks', todo:'To do', doing:'In progress', done:'Done', stage:'Demo stage', tasks:'Demonstration tasks', empty:'No tasks match this status. Choose another filter.', summary:'Done: {done} / {total} · Shown: {shown}', reset:'Reset demo progress', question:'Delete only this demo’s saved statuses? Other applications are not affected.', confirm:'Reset', cancel:'Cancel', ready:'Statuses are saved on this device when changed.', saved:'Demo statuses saved on this device.', blocked:'Storage is unavailable. Changes work in this tab only; reload may lose them. Reset cannot guarantee removal of saved data.', invalid:'Saved data has an unknown or damaged format. It is preserved, not overwritten. Changes work only in this tab. Reset requires confirmation.', offline:'Local prototype: download the complete folder first. No network is needed for the task board; external links require internet. Local saving depends on your browser. Not connected to production.', links:'External PrimServ links (internet required)', company:'Company PrimServ', jobs:'Vacancies', training:'Training / HYDRA', bot:'Telegram bot', fallback:'This language is not available in this demo. English is shown.',
      items:[['Preparation','Review a fictional arrival checklist','DEMO-01: check the sample preparation stage. No real arrival is being scheduled.'],['Arrival','Review a fictional handover','DEMO-02: mark the sample handover as in progress or done. No employee is assigned.'],['Open question','Review a fictional unresolved question','DEMO-03: demonstrate tracking a question. This does not send a request or provide an official answer.']]
    },
    ru: {
      title:'Кабинет координатора · демо', notice:'Только вымышленные задачи. Нет записей работников, бронирований и сообщений. Не используйте демо как реальный рабочий журнал.', language:'Язык', filter:'Статус', all:'Все задачи', todo:'К выполнению', doing:'В работе', done:'Готово', stage:'Демо-этап', tasks:'Демонстрационные задачи', empty:'Задач с этим статусом нет. Выберите другой фильтр.', summary:'Готово: {done} / {total} · Показано: {shown}', reset:'Сбросить демо-прогресс', question:'Удалить только сохранённые статусы этого демо? Другие приложения не затрагиваются.', confirm:'Сбросить', cancel:'Отмена', ready:'Статусы сохраняются на этом устройстве при изменении.', saved:'Демо-статусы сохранены на этом устройстве.', blocked:'Хранилище недоступно. Изменения работают только в этой вкладке и могут потеряться при перезагрузке. Сброс не гарантирует удаление сохранённых данных.', invalid:'Сохранённые данные повреждены или имеют неизвестный формат. Они сохранены без перезаписи. Изменения работают только в этой вкладке. Сброс требует подтверждения.', offline:'Локальный прототип: сначала скачайте всю папку. Доске задач сеть не нужна; внешним ссылкам нужен интернет. Сохранение зависит от браузера. С рабочей системой не связан.', links:'Внешние ссылки PrimServ (нужен интернет)', company:'Компания PrimServ', jobs:'Вакансии', training:'Обучение / HYDRA', bot:'Telegram-бот', fallback:'Этот язык пока не поддерживается в демо. Показан английский.',
      items:[['Подготовка','Проверить вымышленный список подготовки','DEMO-01: проверьте пример этапа подготовки. Реальный приезд не планируется.'],['Приезд','Проверить вымышленную передачу задачи','DEMO-02: отметьте пример передачи как «В работе» или «Готово». Работник не назначается.'],['Открытый вопрос','Проверить вымышленный нерешённый вопрос','DEMO-03: пример учёта вопроса. Запрос не отправляется, официальный ответ не формируется.']]
    },
    uk: {
      title:'Кабінет координатора · демо', notice:'Лише вигадані завдання. Немає записів працівників, бронювань і повідомлень. Не використовуйте демо як справжній робочий журнал.', language:'Мова', filter:'Статус', all:'Усі завдання', todo:'До виконання', doing:'У роботі', done:'Готово', stage:'Демо-етап', tasks:'Демонстраційні завдання', empty:'Завдань із цим статусом немає. Виберіть інший фільтр.', summary:'Готово: {done} / {total} · Показано: {shown}', reset:'Скинути демо-прогрес', question:'Видалити лише збережені статуси цього демо? Інші програми не зміняться.', confirm:'Скинути', cancel:'Скасувати', ready:'Статуси зберігаються на цьому пристрої після зміни.', saved:'Демо-статуси збережено на цьому пристрої.', blocked:'Сховище недоступне. Зміни працюють лише в цій вкладці й можуть зникнути після перезавантаження. Скидання не гарантує видалення збережених даних.', invalid:'Збережені дані пошкоджені або мають невідомий формат. Їх не перезаписано. Зміни працюють лише в цій вкладці. Скидання потребує підтвердження.', offline:'Локальний прототип: спочатку завантажте всю папку. Дошці завдань мережа не потрібна; зовнішнім посиланням потрібен інтернет. Збереження залежить від браузера. З робочою системою не пов’язаний.', links:'Зовнішні посилання PrimServ (потрібен інтернет)', company:'Компанія PrimServ', jobs:'Вакансії', training:'Навчання / HYDRA', bot:'Telegram-бот', fallback:'Ця мова поки недоступна в демо. Показано англійську.',
      items:[['Підготовка','Перевірити вигаданий список підготовки','DEMO-01: перевірте приклад етапу підготовки. Справжній приїзд не планується.'],['Приїзд','Перевірити вигадану передачу завдання','DEMO-02: позначте приклад передачі як «У роботі» або «Готово». Працівник не призначається.'],['Відкрите питання','Перевірити вигадане невирішене питання','DEMO-03: приклад обліку питання. Запит не надсилається, офіційна відповідь не формується.']]
    },
    pl: {
      title:'Panel koordynatora · demo', notice:'Wyłącznie fikcyjne zadania. Bez danych pracowników, rezerwacji i wiadomości. Nie używaj demo jako rzeczywistego rejestru pracy.', language:'Język', filter:'Status', all:'Wszystkie zadania', todo:'Do zrobienia', doing:'W toku', done:'Gotowe', stage:'Etap demo', tasks:'Zadania demonstracyjne', empty:'Brak zadań z tym statusem. Wybierz inny filtr.', summary:'Gotowe: {done} / {total} · Widoczne: {shown}', reset:'Zresetuj postęp demo', question:'Usunąć tylko zapisane statusy tego demo? Inne aplikacje nie zostaną zmienione.', confirm:'Zresetuj', cancel:'Anuluj', ready:'Statusy są zapisywane na tym urządzeniu po zmianie.', saved:'Statusy demo zapisano na tym urządzeniu.', blocked:'Pamięć jest niedostępna. Zmiany działają tylko w tej karcie i mogą zniknąć po odświeżeniu. Reset nie gwarantuje usunięcia zapisanych danych.', invalid:'Zapis ma nieznany lub uszkodzony format. Zachowano go bez nadpisania. Zmiany działają tylko w tej karcie. Reset wymaga potwierdzenia.', offline:'Lokalny prototyp: najpierw pobierz cały folder. Tablica zadań nie wymaga sieci; linki zewnętrzne wymagają internetu. Zapis zależy od przeglądarki. Brak połączenia z systemem produkcyjnym.', links:'Linki zewnętrzne PrimServ (wymagają internetu)', company:'Firma PrimServ', jobs:'Oferty pracy', training:'Szkolenie / HYDRA', bot:'Bot Telegram', fallback:'Ten język nie jest dostępny w demo. Wyświetlono angielski.',
      items:[['Przygotowanie','Sprawdź fikcyjną listę przygotowania','DEMO-01: sprawdź przykładowy etap przygotowania. Nie planujesz prawdziwego przyjazdu.'],['Przyjazd','Sprawdź fikcyjne przekazanie zadania','DEMO-02: oznacz przykład jako „W toku” lub „Gotowe”. Nie przypisujesz pracownika.'],['Otwarte pytanie','Sprawdź fikcyjne nierozwiązane pytanie','DEMO-03: przykład śledzenia pytania. Nie wysyłasz zgłoszenia ani oficjalnej odpowiedzi.']]
    }
  };
  const $ = id => document.getElementById(id);
  const materialCopy={
    en:{dates:'Source date: {source} · Repository check: {verified}',title:'Source materials',search:'Search source text',notice:'Local read-only snapshot · online off. Repository checks: 2026-10-17/18; each card shows its source dates. This does not confirm current working conditions.',fallback:'Requested: {requested} · Shown: ru. No translation is available for this material.',empty:'No confirmed material matches. No answer is inferred.',source:'Original source (internet required)'},
    ru:{dates:'Дата источника: {source} · Проверка репозитория: {verified}',title:'Материалы с источником',search:'Поиск по тексту источника',notice:'Локальный снимок только для чтения · онлайн выключен. Проверки репозитория: 2026-10-17/18; даты источника указаны в каждой карточке. Это не подтверждение текущих условий работы.',fallback:'Запрошен язык: {requested} · Показан: ru. Перевода этого материала нет.',empty:'Подтверждённый материал не найден. Ответ не придумывается.',source:'Исходный материал (нужен интернет)'},
    uk:{dates:'Дата джерела: {source} · Перевірка репозиторію: {verified}',title:'Матеріали з джерелом',search:'Пошук у тексті джерела',notice:'Локальний знімок лише для читання · онлайн вимкнено. Перевірки репозиторію: 2026-10-17/18; дати джерела вказані в кожній картці. Це не підтвердження поточних умов роботи.',fallback:'Запитана мова: {requested} · Показано: ru. Перекладу цього матеріалу немає.',empty:'Підтверджений матеріал не знайдено. Відповідь не вигадується.',source:'Джерело (потрібен інтернет)'},
    pl:{dates:'Data źródła: {source} · Sprawdzenie repozytorium: {verified}',title:'Materiały ze źródłem',search:'Szukaj w tekście źródłowym',notice:'Lokalna kopia tylko do odczytu · tryb online wyłączony. Sprawdzenie repozytorium: 2026-10-17/18; daty źródła podano na każdej karcie. Nie potwierdza to aktualnych warunków pracy.',fallback:'Wybrany język: {requested} · Wyświetlono: ru. Brak tłumaczenia tego materiału.',empty:'Nie znaleziono potwierdzonego materiału. Odpowiedź nie jest wymyślana.',source:'Źródło (wymaga internetu)'}
  };
  let materialMode='snapshot', reader=M.materialReader(), selectedMaterial=null;
  const recentCopy={
    en:{read:'Read material',back:'Return to last material',clear:'Clear last material',none:'No last material saved.',saved:'Last material saved on this device. Use Return to open it.',blocked:'Last-material storage is unavailable. This choice works only on this page; reload may lose it. Clearing could not be guaranteed.',invalid:'The last-material record is damaged or has an unknown version. It is preserved. New choices work only on this page until you clear it.',stale:'The saved material is no longer available. Choose a current material or clear the saved record. New choices work only on this page until cleared.',cleared:'Last-material choice cleared. Task statuses are unchanged.'},
    ru:{read:'Читать материал',back:'Вернуться к последнему материалу',clear:'Очистить последний материал',none:'Последний материал не сохранён.',saved:'Последний материал сохранён на этом устройстве. Чтобы открыть его, нажмите «Вернуться».',blocked:'Хранилище последнего материала недоступно. Выбор работает только на этой странице и может потеряться при перезагрузке. Удаление записи не гарантировано.',invalid:'Запись последнего материала повреждена или имеет неизвестную версию. Она сохранена без перезаписи. Новый выбор работает только на этой странице до очистки.',stale:'Сохранённый материал больше недоступен. Выберите текущий материал или очистите запись. Новый выбор работает только на этой странице до очистки.',cleared:'Выбор последнего материала очищен. Статусы задач не изменены.'},
    uk:{read:'Читати матеріал',back:'Повернутися до останнього матеріалу',clear:'Очистити останній матеріал',none:'Останній матеріал не збережено.',saved:'Останній матеріал збережено на цьому пристрої. Щоб відкрити його, натисніть «Повернутися».',blocked:'Сховище останнього матеріалу недоступне. Вибір працює лише на цій сторінці й може зникнути після перезавантаження. Видалення запису не гарантовано.',invalid:'Запис останнього матеріалу пошкоджено або має невідому версію. Його не перезаписано. Новий вибір працює лише на цій сторінці до очищення.',stale:'Збережений матеріал більше недоступний. Виберіть поточний матеріал або очистіть запис. Новий вибір працює лише на цій сторінці до очищення.',cleared:'Вибір останнього матеріалу очищено. Статуси завдань не змінено.'},
    pl:{read:'Czytaj materiał',back:'Wróć do ostatniego materiału',clear:'Wyczyść ostatni materiał',none:'Nie zapisano ostatniego materiału.',saved:'Ostatni materiał zapisano na tym urządzeniu. Otwórz go przyciskiem Wróć.',blocked:'Pamięć ostatniego materiału jest niedostępna. Wybór działa tylko na tej stronie i może zniknąć po odświeżeniu. Nie można zagwarantować usunięcia zapisu.',invalid:'Zapis ostatniego materiału jest uszkodzony lub ma nieznaną wersję. Zachowano go bez nadpisania. Nowy wybór działa tylko na tej stronie do wyczyszczenia.',stale:'Zapisany materiał nie jest już dostępny. Wybierz aktualny materiał lub wyczyść zapis. Nowy wybór działa tylko na tej stronie do wyczyszczenia.',cleared:'Wybór ostatniego materiału wyczyszczono. Statusy zadań są niezmienione.'}
  };
  function requestedMaterialLanguage() {
    const code=String(requested).toLowerCase();
    return ['ru','ua','uk','pl','en','ka','tr','hy'].includes(code)?code:'en';
  }
  function openMaterial(id,requestedLanguage,remember=true,taskContext=null) {
    const item=reader.read({language:requestedLanguage}).items.find(x=>x.id===id);
    if(!item){selectedMaterial=null;renderMaterials();return;}
    selectedMaterial={id,language:requestedLanguage,taskContext};
    if(remember)recent.remember(id,requestedLanguage);
    renderMaterials();$('reading-title').focus();
  }
  function renderRecent() {
    const state=recent.snapshot(),t=recentCopy[lang];
    $('lastMaterialReturn').textContent=t.back;$('lastMaterialClear').textContent=t.clear;
    $('lastMaterialReturn').disabled=!state.entry;
    $('lastMaterialClear').disabled=!state.entry&&['ready','cleared'].includes(state.persistence);
    $('lastMaterialNotice').textContent=t[['blocked','invalid','stale','cleared'].includes(state.persistence)?state.persistence:state.entry?'saved':'none'];
    const reading=$('materialReading');reading.hidden=!selectedMaterial;
    if(!selectedMaterial){reading.replaceChildren();return;}
    const response=reader.read({language:selectedMaterial.language}),item=response.items.find(x=>x.id===selectedMaterial.id);
    if(!item){selectedMaterial=null;reading.hidden=true;reading.replaceChildren();return;}
    const heading=node('h3',item.title);heading.id='reading-title';heading.tabIndex=-1;heading.lang=item.language;
    const text=node('p',item.text);text.lang=item.language;
    const badge=node('p',response.fallback?materialCopy[lang].fallback.replace('{requested}',response.requested_language):'ru · Zgorzelec','muted');
    reading.replaceChildren(heading,badge,text);
    if(selectedMaterial.taskContext){
      const context=selectedMaterial.taskContext,back=node('button',taskLinkCopy[lang].back);back.id='taskMaterialBack';back.type='button';
      back.addEventListener('click',()=>{
        requested=context.requested;lang=context.lang;filter=context.filter;$('materialQuery').value=context.query;materialMode=context.mode;
        reader=M.materialReader(materialMode==='mock'?{mode:'mock',mock:q=>JSON.stringify(M.materialSnapshot(q))}:{});
        selectedMaterial=null;syncURL();render();($(context.task_id+'-title')||$('filter')).focus();
      });reading.append(back);
    }
  }
  const favouriteCopy={
    en:{title:'Pinned materials',pin:'Pin material',open:'Open pinned material',remove:'Remove pin',clear:'Clear pinned-material record',help:'A pin keeps its requested language. To change it, remove the pin and pin again.',none:'No pinned materials.',saved:'Pinned choice saved on this device.',blocked:'Pinned-material storage is unavailable. Changes work only on this page and may be lost after reload. Removal is not guaranteed.',invalid:'The pinned-material record is damaged or has an unknown format. It is preserved. New choices work only on this page until you clear this record.',stale:'A saved pin refers to an unavailable material. The record is preserved; new choices work only on this page until cleared.',cleared:'Pinned-material record cleared. Last material and tasks are unchanged.'},
    ru:{title:'Закреплённые материалы',pin:'Закрепить материал',open:'Открыть закреплённый материал',remove:'Убрать закрепление',clear:'Очистить запись закреплений',help:'Закрепление сохраняет выбранный язык. Чтобы изменить его, уберите закрепление и закрепите снова.',none:'Нет закреплённых материалов.',saved:'Закрепление сохранено на этом устройстве.',blocked:'Хранилище закреплений недоступно. Изменения работают только на этой странице и могут потеряться после перезагрузки. Удаление не гарантировано.',invalid:'Запись закреплений повреждена или имеет неизвестный формат. Она сохранена без перезаписи. Новый выбор работает только на этой странице до очистки записи.',stale:'Сохранённое закрепление относится к недоступному материалу. Запись сохранена; новый выбор работает только на этой странице до очистки.',cleared:'Запись закреплений очищена. Последний материал и задачи не изменены.'},
    uk:{title:'Закріплені матеріали',pin:'Закріпити матеріал',open:'Відкрити закріплений матеріал',remove:'Прибрати закріплення',clear:'Очистити запис закріплень',help:'Закріплення зберігає вибрану мову. Щоб змінити її, приберіть закріплення й закріпіть знову.',none:'Немає закріплених матеріалів.',saved:'Закріплення збережено на цьому пристрої.',blocked:'Сховище закріплень недоступне. Зміни працюють лише на цій сторінці й можуть зникнути після перезавантаження. Видалення не гарантовано.',invalid:'Запис закріплень пошкоджено або має невідомий формат. Його не перезаписано. Новий вибір працює лише на цій сторінці до очищення запису.',stale:'Збережене закріплення стосується недоступного матеріалу. Запис збережено; новий вибір працює лише на цій сторінці до очищення.',cleared:'Запис закріплень очищено. Останній матеріал і завдання не змінено.'},
    pl:{title:'Przypięte materiały',pin:'Przypnij materiał',open:'Otwórz przypięty materiał',remove:'Usuń przypięcie',clear:'Wyczyść zapis przypięć',help:'Przypięcie zachowuje wybrany język. Aby go zmienić, usuń przypięcie i przypnij ponownie.',none:'Brak przypiętych materiałów.',saved:'Przypięcie zapisano na tym urządzeniu.',blocked:'Pamięć przypięć jest niedostępna. Zmiany działają tylko na tej stronie i mogą zniknąć po odświeżeniu. Usunięcie nie jest gwarantowane.',invalid:'Zapis przypięć jest uszkodzony lub ma nieznany format. Zachowano go bez nadpisania. Nowy wybór działa tylko na tej stronie do wyczyszczenia zapisu.',stale:'Zapisane przypięcie dotyczy niedostępnego materiału. Zapis zachowano; nowy wybór działa tylko na tej stronie do wyczyszczenia.',cleared:'Zapis przypięć wyczyszczono. Ostatni materiał i zadania są niezmienione.'}
  };
  function renderFavourites() {
    const state=favourites.snapshot(),t=favouriteCopy[lang];
    $('favouritesTitle').textContent=t.title;$('favouritesHelp').textContent=t.help;
    $('favouritesNotice').textContent=t[['blocked','invalid','stale','cleared'].includes(state.persistence)?state.persistence:state.items.length?'saved':'none'];
    $('favouritesClear').textContent=t.clear;$('favouritesClear').hidden=!['blocked','invalid','stale'].includes(state.persistence);
    $('favouritesList').replaceChildren(...state.items.map(pin=>{
      const response=reader.read({language:pin.requested_language}),item=response.items.find(x=>x.id===pin.material_id);
      if(!item)return null;
      const article=node('article'),title=node('h4',item.title);title.lang=item.language;
      const badge=node('p',response.fallback?materialCopy[lang].fallback.replace('{requested}',pin.requested_language):'ru · Zgorzelec','muted');
      const open=node('button',t.open);open.type='button';open.id='pin-open-'+pin.material_id;
      open.addEventListener('click',()=>{
        requested=pin.requested_language;lang=M.language(requested);syncURL();render();openMaterial(pin.material_id,pin.requested_language,false);
      });
      const remove=node('button',t.remove);remove.type='button';remove.id='pin-remove-'+pin.material_id;
      remove.addEventListener('click',()=>{favourites.remove(pin.material_id);renderMaterials();$('favouritesTitle').focus();});
      article.append(title,badge,open,remove);return article;
    }).filter(Boolean));
  }
  const sourceCopy={en:['Local source','Snapshot','Local mock'],ru:['Локальный источник','Снимок','Локальный mock'],uk:['Локальне джерело','Знімок','Локальний mock'],pl:['Lokalne źródło','Kopia','Lokalny mock']};
  function renderMaterials() {
    if(backupPending)cancelBackup();
    const t=materialCopy[lang];
    // Unsupported URL language stays visible in provenance; it is not silently relabelled EN.
    const requestedLanguage=requestedMaterialLanguage();
    const response=reader.read({language:requestedLanguage});
    const items=M.searchMaterials(response,$('materialQuery').value||'');
    $('materialsTitle').textContent=t.title; $('materialsLabel').textContent=t.search;
    $('materialsSourceLabel').textContent=sourceCopy[lang][0];
    $('materialsSource').replaceChildren(...['snapshot','mock'].map((mode,i)=>{const option=node('option',sourceCopy[lang][i+1]);option.value=mode;return option;}));
    $('materialsSource').value=materialMode;
    $('materialsNotice').textContent=t.notice;
    $('materialsStatus').textContent=items.length?(response.fallback?t.fallback.replace('{requested}',response.requested_language):'ru · Zgorzelec'):t.empty;
    $('materials').replaceChildren(...items.map(item=>{
      const article=node('article'),heading=node('h3',item.title),text=node('p',item.text),source=node('a',t.source);
      heading.lang=item.language;text.lang=item.language;
      source.href='https://github.com/'+item.source.repo+'/blob/'+item.source.ref+'/'+item.source.path;
      source.target='_blank';source.rel='noopener noreferrer';
      const read=node('button',recentCopy[lang].read);read.type='button';read.id='read-'+item.id;
      read.addEventListener('click',()=>openMaterial(item.id,requestedLanguage));
      const pin=node('button',favouriteCopy[lang].pin);pin.type='button';pin.id='pin-'+item.id;
      pin.disabled=favourites.snapshot().items.some(x=>x.material_id===item.id);
      pin.addEventListener('click',()=>{favourites.pin(item.id,requestedLanguage);renderMaterials();$('favouritesTitle').focus();});
      article.append(heading,text,node('p',item.location_id+' · '+item.id+' · '+item.source.selector+' · '+item.source.ref.slice(0,8)+' · '+t.dates.replace('{source}',item.source.source_updated_on).replace('{verified}',item.source.verified_on),'muted'),source,read,pin);
      return article;
    }));
    renderRecent();renderFavourites();
  }
  const published = /^https?:$/.test(location.protocol) && /\/tools\/coordinator\/(?:index\.html)?$/.test(location.pathname);
  let offlineState = 'loading', offlineAttempt = 0, offlineTimer;
  const webCopy = {
    en: {back:'Back to vacancies', loading:'Preparing an offline copy…', ready:'Offline copy ready on this device. Demo statuses remain local. External links need internet.', unavailable:'Offline copy is unavailable. Keep this page open or reconnect and reload; local statuses are not deleted.'},
    pl: {back:'Wróć do ofert', loading:'Przygotowywanie kopii offline…', ready:'Kopia offline jest gotowa na tym urządzeniu. Statusy demo są lokalne. Linki zewnętrzne wymagają internetu.', unavailable:'Kopia offline jest niedostępna. Nie zamykaj strony albo połącz się z siecią i odśwież. Lokalne statusy nie są usuwane.'},
    ru: {back:'Вернуться к вакансиям', loading:'Подготовка копии для работы без сети…', ready:'Копия для работы без сети готова на этом устройстве. Демо-статусы остаются здесь. Внешним ссылкам нужен интернет.', unavailable:'Копия для работы без сети недоступна. Оставьте страницу открытой или подключитесь к сети и обновите её. Локальные статусы не удалены.'},
    uk: {back:'Повернутися до вакансій', loading:'Підготовка копії для роботи без мережі…', ready:'Копія для роботи без мережі готова на цьому пристрої. Демо-статуси залишаються тут. Зовнішнім посиланням потрібен інтернет.', unavailable:'Копія для роботи без мережі недоступна. Залиште сторінку відкритою або підключіться до мережі й оновіть її. Локальні статуси не видалено.'}
  };
  function renderPublished() {
    if (!published) return;
    let back = $('catalogue-return');
    if (!back) {
      back = node('a'); back.id='catalogue-return';
      document.querySelector('main').prepend(back);
    }
    const url = new URL('../../', location.href);
    const original = new URL(location.href).searchParams.get('fromLang') || lang;
    if (/^[a-z]{2,3}$/.test(original)) url.searchParams.set('lang', original);
    back.href=url.href; back.textContent=webCopy[lang].back;
    $('offline').textContent=webCopy[lang][offlineState];
    $('offline').dataset.offlineState=offlineState;
    $('offline').setAttribute('role','status');
  }
  function prepareOffline() {
    if (!published) return;
    if (!('serviceWorker' in navigator)) {offlineState='unavailable';renderPublished();return;}
    const attempt=++offlineAttempt; clearTimeout(offlineTimer);
    offlineTimer=setTimeout(()=>{if(attempt===offlineAttempt){offlineState='unavailable';renderPublished();}},15000);
    navigator.serviceWorker.register(new URL('../../sw.js',location.href),{updateViaCache:'none'})
      .then(()=>navigator.serviceWorker.ready).then(reg=>{
        const channel=new MessageChannel();
        channel.port1.onmessage=event=>{channel.port1.close();if(attempt!==offlineAttempt)return;clearTimeout(offlineTimer);offlineState=event.data?.ready?'ready':'unavailable';renderPublished();};
        reg.active.postMessage({type:'CACHE_COORDINATOR'},[channel.port2]);
      }).catch(()=>{if(attempt!==offlineAttempt)return;clearTimeout(offlineTimer);offlineState='unavailable';renderPublished();});
  }
  const initialURL = new URL(location.href);
  // Keep a downloaded file's path and query stable: file localStorage is
  // browser-defined and changing the document URL can select another area.
  // A fragment carries view state without changing the file's storage address.
  const fileView = location.protocol === 'file:'
    ? new URLSearchParams(initialURL.hash.split('?').slice(1).join('?')) : null;
  let requested = fileView?.get('lang') || initialURL.searchParams.get('lang') || 'en';
  let lang = M.language(requested);
  let filter = fileView?.get('status') || initialURL.searchParams.get('status') || 'all';
  if (!['all', ...M.STATUSES].includes(filter)) filter = 'all';
  // Accessing localStorage itself can throw; each model reads only its own key.
  const storage = {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: key => window.localStorage.removeItem(key)
  };
  const model = M.create(storage);
  const recent = M.materialMemory(storage);
  const favourites = M.materialFavourites(storage);
  const taskLinks = M.taskMaterialLinks(storage);
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function syncURL() {
    try {
      const url = new URL(location.href);
      if (location.protocol === 'file:') {
        const view = new URLSearchParams();
        view.set('lang', lang);
        // Always include 'all' so a legacy query status cannot override it.
        view.set('status', filter);
        url.hash = url.hash.split('?')[0] + '?' + view.toString();
      } else {
        url.searchParams.set('lang', lang);
        if (filter === 'all') url.searchParams.delete('status');
        else url.searchParams.set('status', filter);
      }
      history.replaceState(history.state, '', url);
    } catch { /* Board still works without browser history. */ }
  }
  const backupCopy={
    en:{title:'Demo progress backup',help:'Only the three fictional demo task statuses. No people, materials or settings. Paste JSON, review, then explicitly apply. Cancel changes nothing.',export:'Export demo JSON',output:'Current demo JSON (read only)',input:'Paste demo JSON to restore',preview:'Preview restore',review:'Review all three demo statuses (before → after)',apply:'Apply demo statuses',cancel:'Cancel',ready:'No restore is pending.',previewed:'Review before applying. No statuses have been written.',invalid:'Invalid demo backup. Expected only the exact supported format and three allowed statuses (up to 2048 UTF-8 bytes). Nothing changed.',unavailable:'Restore aborted: storage is unavailable or contains an unsupported record. Original saved data and in-tab statuses are unchanged. Reset is separate.',changed:'Restore aborted: demo progress changed after preview. Preview again. Nothing was imported.',saved:'Three demo statuses restored and saved on this device.',cancelled:'Restore cancelled. Nothing was imported.',manual:'JSON is ready below for manual copying. Download is unavailable; no file save is confirmed.',download:'Download requested. File saving is not confirmed. The same JSON is available below for manual copying.'},
    ru:{title:'Резервная копия демо-прогресса',help:'Только статусы трёх вымышленных демо-задач. Без людей, материалов и настроек. Вставьте JSON, проверьте и явно примените. Отмена ничего не меняет.',export:'Экспорт демо JSON',output:'Текущий демо JSON (только чтение)',input:'Вставьте демо JSON для восстановления',preview:'Предпросмотр восстановления',review:'Проверьте три демо-статуса (до → после)',apply:'Применить демо-статусы',cancel:'Отмена',ready:'Восстановление не ожидается.',previewed:'Проверьте перед применением. Статусы ещё не записаны.',invalid:'Неверная демо-копия. Нужен точный поддерживаемый формат с тремя допустимыми статусами (до 2048 байт UTF-8). Ничего не изменено.',unavailable:'Восстановление отменено: хранилище недоступно или запись не поддерживается. Сохранённые данные и статусы вкладки не изменены. Сброс — отдельное действие.',changed:'Восстановление отменено: после предпросмотра прогресс изменился. Повторите предпросмотр. Ничего не импортировано.',saved:'Три демо-статуса восстановлены и сохранены на этом устройстве.',cancelled:'Восстановление отменено. Ничего не импортировано.',manual:'JSON готов ниже для ручного копирования. Скачивание недоступно; сохранение файла не подтверждено.',download:'Скачивание запрошено. Сохранение файла не подтверждено. Тот же JSON доступен ниже для ручного копирования.'},
    uk:{title:'Резервна копія демо-прогресу',help:'Лише статуси трьох вигаданих демо-завдань. Без людей, матеріалів і налаштувань. Вставте JSON, перевірте й явно застосуйте. Скасування нічого не змінює.',export:'Експорт демо JSON',output:'Поточний демо JSON (лише читання)',input:'Вставте демо JSON для відновлення',preview:'Перегляд відновлення',review:'Перевірте три демо-статуси (до → після)',apply:'Застосувати демо-статуси',cancel:'Скасувати',ready:'Відновлення не очікується.',previewed:'Перевірте перед застосуванням. Статуси ще не записані.',invalid:'Невірна демо-копія. Потрібен точний формат із трьома дозволеними статусами (до 2048 байтів UTF-8). Нічого не змінено.',unavailable:'Відновлення скасовано: сховище недоступне або запис не підтримується. Збережені дані й статуси вкладки не змінені. Скидання — окрема дія.',changed:'Відновлення скасовано: після перегляду прогрес змінився. Повторіть перегляд. Нічого не імпортовано.',saved:'Три демо-статуси відновлено й збережено на цьому пристрої.',cancelled:'Відновлення скасовано. Нічого не імпортовано.',manual:'JSON готовий нижче для ручного копіювання. Завантаження недоступне; збереження файлу не підтверджено.',download:'Завантаження запитано. Збереження файлу не підтверджено. Той самий JSON доступний нижче для ручного копіювання.'},
    pl:{title:'Kopia postępu demo',help:'Tylko statusy trzech fikcyjnych zadań demo. Bez osób, materiałów i ustawień. Wklej JSON, sprawdź i jawnie zastosuj. Anulowanie nic nie zmienia.',export:'Eksportuj demo JSON',output:'Bieżący demo JSON (tylko odczyt)',input:'Wklej demo JSON do przywrócenia',preview:'Podgląd przywracania',review:'Sprawdź trzy statusy demo (przed → po)',apply:'Zastosuj statusy demo',cancel:'Anuluj',ready:'Brak oczekującego przywracania.',previewed:'Sprawdź przed zastosowaniem. Statusy nie zostały zapisane.',invalid:'Nieprawidłowa kopia demo. Wymagany dokładny format z trzema dozwolonymi statusami (do 2048 bajtów UTF-8). Nic nie zmieniono.',unavailable:'Przerwano przywracanie: pamięć jest niedostępna lub zapis nieobsługiwany. Zapisane dane i statusy karty nie zmieniły się. Reset jest osobny.',changed:'Przerwano przywracanie: postęp zmienił się po podglądzie. Otwórz podgląd ponownie. Nic nie zaimportowano.',saved:'Trzy statusy demo przywrócono i zapisano na tym urządzeniu.',cancelled:'Przywracanie anulowane. Nic nie zaimportowano.',manual:'JSON jest gotowy poniżej do ręcznego skopiowania. Pobieranie niedostępne; zapis pliku nie jest potwierdzony.',download:'Zażądano pobrania. Zapis pliku nie jest potwierdzony. Ten sam JSON można skopiować poniżej.'}
  };
  let backupPending=false,backupStatus='ready',backupChanges=[];
  function cancelBackup() {model.cancelProgress();backupPending=false;backupChanges=[];backupStatus='cancelled';renderBackup();}
  function renderBackup() {
    const t=backupCopy[lang];
    for(const [id,key] of Object.entries({backupTitle:'title',backupHelp:'help',backupExport:'export',backupOutputLabel:'output',backupInputLabel:'input',backupPreview:'preview',backupReviewTitle:'review',backupApply:'apply',backupCancel:'cancel'}))$(id).textContent=t[key];
    $('backupReview').hidden=!backupPending;$('backupApply').disabled=!backupPending;
    $('backupNotice').textContent=t[backupStatus];
    $('backupChanges').replaceChildren(...backupChanges.map(x=>node('li',x.id+': '+copy[lang][x.from]+' → '+copy[lang][x.to])));
  }
  $('backupExport').addEventListener('click',()=>{
    const raw=model.exportProgress();$('backupOutput').value=raw;
    backupStatus='manual';let url=null,a=null;
    try {
      if(typeof Blob!=='function'||typeof URL.createObjectURL!=='function'||typeof URL.revokeObjectURL!=='function')throw Error('unavailable');
      a=node('a');if(!('download' in a))throw Error('unavailable');
      url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.href=url;a.download='primserv-demo-progress.json';a.hidden=true;document.body.append(a);a.click();backupStatus='download';
    } catch {backupStatus='manual';}
    finally {a?.remove?.();if(url)setTimeout(()=>{try {URL.revokeObjectURL(url);}catch {}},1000);}
    renderBackup();$('backupOutput').focus();
  });
  $('backupInput').addEventListener('input',cancelBackup);
  $('backupPreview').addEventListener('click',()=>{
    const result=model.previewProgress($('backupInput').value);backupPending=result.status==='preview';backupChanges=result.changes;backupStatus=backupPending?'previewed':result.status;renderBackup();
    (backupPending?$('backupReviewTitle'):$('backupNotice')).focus();
  });
  $('backupApply').addEventListener('click',()=>{
    backupStatus=model.applyProgress();backupPending=false;backupChanges=[];render();$('backupTitle').focus();
  });
  $('backupCancel').addEventListener('click',()=>{cancelBackup();$('backupInput').focus();});
  const progressSummaryCopy={
    en:{link:'DEMO material link',requested:'Requested language',linkWarning:'Material link data is unavailable or saving is unconfirmed. Only explicit in-tab choices are shown.',title:'Demo progress summary',help:'DEMO · All three fictional tasks, regardless of filter or material search. This is not a real work report. No employee records or working conditions.',label:'All three fictional demo tasks (read only)',select:'Select summary text',total:'Done: {done} / {total}',local:'Current statuses in this tab. Saving depends on your browser.',pageOnly:'Saving is not confirmed. Current statuses work in this tab only.'},
    ru:{link:'Связь DEMO с материалом',requested:'Запрошенный язык',linkWarning:'Данные связей недоступны или сохранение не подтверждено. Показан только явный выбор этой вкладки.',title:'Сводка демо-прогресса',help:'DEMO · Все три вымышленные задачи независимо от фильтра и поиска материалов. Это не реальный рабочий отчёт. Без записей работников и условий работы.',label:'Все три вымышленные демо-задачи (только чтение)',select:'Выделить текст сводки',total:'Готово: {done} / {total}',local:'Текущие статусы этой вкладки. Сохранение зависит от браузера.',pageOnly:'Сохранение не подтверждено. Текущие статусы работают только в этой вкладке.'},
    uk:{link:'Зв’язок DEMO з матеріалом',requested:'Запитана мова',linkWarning:'Дані зв’язків недоступні або збереження не підтверджено. Показано лише явний вибір цієї вкладки.',title:'Зведення демо-прогресу',help:'DEMO · Усі три вигадані завдання незалежно від фільтра й пошуку матеріалів. Це не справжній робочий звіт. Без записів працівників та умов роботи.',label:'Усі три вигадані демо-завдання (лише читання)',select:'Виділити текст зведення',total:'Готово: {done} / {total}',local:'Поточні статуси цієї вкладки. Збереження залежить від браузера.',pageOnly:'Збереження не підтверджено. Поточні статуси працюють лише в цій вкладці.'},
    pl:{link:'Powiązanie DEMO z materiałem',requested:'Żądany język',linkWarning:'Dane powiązań są niedostępne lub zapis niepotwierdzony. Pokazano tylko jawne wybory tej karty.',title:'Podsumowanie postępu demo',help:'DEMO · Wszystkie trzy fikcyjne zadania, niezależnie od filtra i wyszukiwania materiałów. To nie jest rzeczywisty raport pracy. Bez danych pracowników i warunków pracy.',label:'Wszystkie trzy fikcyjne zadania demo (tylko odczyt)',select:'Zaznacz tekst podsumowania',total:'Gotowe: {done} / {total}',local:'Bieżące statusy tej karty. Zapis zależy od przeglądarki.',pageOnly:'Zapis nie jest potwierdzony. Bieżące statusy działają tylko w tej karcie.'}
  };
  function renderProgressSummary() {
    const t=progressSummaryCopy[lang],state=model.snapshot();
    $('progressSummaryTitle').textContent=t.title;$('progressSummaryHelp').textContent=t.help;
    $('progressSummaryLabel').textContent=t.label;$('progressSummarySelect').textContent=t.select;
    const linkState=taskLinks.snapshot();
    const lines=M.IDS.flatMap((id,i)=>{
      const line=id.toUpperCase()+' · '+copy[lang].items[i][1]+' — '+copy[lang][state.statuses[id]],link=linkState.links.find(x=>x.task_id===id);
      return link?[line,'  '+t.link+': '+link.material_id+' · '+t.requested+': '+link.requested_language]:[line];
    });
    const total=t.total.replace('{done}',M.IDS.filter(id=>state.statuses[id]==='done').length).replace('{total}',M.IDS.length);
    const parts=['DEMO · '+t.title,t.help,...lines,total,['blocked','invalid'].includes(state.persistence)?t.pageOnly:t.local];
    if(['blocked','invalid','stale'].includes(linkState.persistence))parts.push(t.linkWarning);
    $('progressSummary').value=parts.join('\n');
  }
  $('progressSummarySelect').addEventListener('click',()=>{$('progressSummary').focus();$('progressSummary').select();});
  const taskLinkCopy={
    en:{choose:'Choose a public material for this DEMO task',none:'No material linked',save:'Save chosen link',open:'Open linked material',remove:'Clear this link',back:'Back to demo task',clear:'Clear only task material links',ready:'DEMO links are optional. Choose a material explicitly; this does not make it a task instruction.',saved:'Demo material links saved on this device.',blocked:'Link storage is unavailable. Changes work only on this page; saving or removal is not confirmed.',invalid:'Link data is damaged or has an unknown format. Original data is preserved; choices work only on this page until links are cleared.',stale:'A saved task or material is unavailable. It is not opened. Original data is preserved; use explicit link recovery.',cleared:'Task material links cleared. Statuses, backup, pins and last material are unchanged.'},
    ru:{choose:'Выберите публичный материал для этой DEMO-задачи',none:'Материал не связан',save:'Сохранить выбранную связь',open:'Открыть связанный материал',remove:'Очистить эту связь',back:'Назад к демо-задаче',clear:'Очистить только связи задач с материалами',ready:'Связи DEMO необязательны. Выбирайте материал явно; это не делает его инструкцией к задаче.',saved:'Демо-связи материалов сохранены на этом устройстве.',blocked:'Хранилище связей недоступно. Изменения работают только на этой странице; сохранение или удаление не подтверждено.',invalid:'Данные связей повреждены или имеют неизвестный формат. Оригинал сохранён; выбор работает только на странице до очистки связей.',stale:'Сохранённая задача или материал недоступны. Они не открываются. Оригинал сохранён; используйте явную очистку связей.',cleared:'Связи задач с материалами очищены. Статусы, копия, закрепления и последний материал не изменены.'},
    uk:{choose:'Виберіть публічний матеріал для цього DEMO-завдання',none:'Матеріал не пов’язаний',save:'Зберегти вибраний зв’язок',open:'Відкрити пов’язаний матеріал',remove:'Очистити цей зв’язок',back:'Назад до демо-завдання',clear:'Очистити лише зв’язки завдань із матеріалами',ready:'Зв’язки DEMO необов’язкові. Вибирайте матеріал явно; це не робить його інструкцією до завдання.',saved:'Демо-зв’язки матеріалів збережено на цьому пристрої.',blocked:'Сховище зв’язків недоступне. Зміни працюють лише на цій сторінці; збереження або видалення не підтверджено.',invalid:'Дані зв’язків пошкоджені або невідомого формату. Оригінал збережено; вибір працює лише на сторінці до очищення зв’язків.',stale:'Збережене завдання або матеріал недоступні. Вони не відкриваються. Оригінал збережено; скористайтеся явним очищенням зв’язків.',cleared:'Зв’язки завдань із матеріалами очищено. Статуси, копія, закріплення й останній матеріал не змінені.'},
    pl:{choose:'Wybierz publiczny materiał dla tego zadania DEMO',none:'Brak powiązanego materiału',save:'Zapisz wybrane powiązanie',open:'Otwórz powiązany materiał',remove:'Usuń to powiązanie',back:'Wróć do zadania demo',clear:'Usuń tylko powiązania zadań z materiałami',ready:'Powiązania DEMO są opcjonalne. Wybierz materiał jawnie; nie staje się on instrukcją zadania.',saved:'Powiązania demo zapisano na tym urządzeniu.',blocked:'Pamięć powiązań niedostępna. Zmiany działają tylko na tej stronie; zapis lub usunięcie nie jest potwierdzone.',invalid:'Powiązania są uszkodzone lub nieznanego formatu. Oryginał zachowano; wybory działają tylko na stronie do wyczyszczenia powiązań.',stale:'Zapisane zadanie lub materiał jest niedostępny. Nie zostanie otwarty. Oryginał zachowano; użyj jawnego czyszczenia powiązań.',cleared:'Powiązania usunięto. Statusy, kopia, przypięcia i ostatni materiał nie zmieniły się.'}
  };
  function renderTaskLink(task_id) {
    const t=taskLinkCopy[lang],entry=taskLinks.snapshot().links.find(x=>x.task_id===task_id),items=reader.read({language:requestedMaterialLanguage()}).items;
    const box=node('div','', 'task-material-link'),label=node('label',t.choose),choice=node('select');choice.id='task-link-choice-'+task_id;
    const empty=node('option',t.none);empty.value='';choice.append(empty,...items.map(item=>{const option=node('option',item.title+' · '+item.language);option.value=item.id;return option;}));choice.value=entry?.material_id||'';label.append(choice);
    const target=items.find(x=>x.id===entry?.material_id),notice=node('p',target?target.title+' · '+entry.requested_language+' → ru':t.none,'muted');notice.id='task-link-status-'+task_id;
    const save=node('button',t.save);save.id='task-link-save-'+task_id;save.type='button';
    save.addEventListener('click',()=>{if(!choice.value)return;taskLinks.assign(task_id,choice.value,requestedMaterialLanguage());render();$('task-link-save-'+task_id)?.focus();});
    const open=node('button',t.open);open.id='task-link-open-'+task_id;open.type='button';open.disabled=!target;
    open.addEventListener('click',()=>{
      const current=taskLinks.snapshot().links.find(x=>x.task_id===task_id);if(!current)return;
      openMaterial(current.material_id,current.requested_language,false,{task_id,requested,lang,filter,query:$('materialQuery').value,mode:materialMode});
    });
    const remove=node('button',t.remove);remove.id='task-link-remove-'+task_id;remove.type='button';remove.disabled=!entry;
    remove.addEventListener('click',()=>{taskLinks.remove(task_id);render();$('task-link-choice-'+task_id)?.focus();});
    box.append(label,notice,save,open,remove);return box;
  }
  $('taskLinksClear').addEventListener('click',()=>{taskLinks.clear();render();$('taskLinksClear').focus();});
  function render() {
    if(backupPending){model.cancelProgress();backupPending=false;backupChanges=[];backupStatus='cancelled';}
    const t = copy[lang], state = model.snapshot();
    const focused = document.activeElement?.id;
    document.documentElement.lang = lang;
    document.title = 'PrimServ · ' + t.title;
    for (const [id,key] of Object.entries({title:'title',demoNotice:'notice',languageLabel:'language',filterLabel:'filter',reset:'reset',confirmText:'question',confirm:'confirm',cancel:'cancel',empty:'empty',offline:'offline'})) $(id).textContent = t[key];
    $('language').value = lang;
    $('fallback').hidden = M.LANGS.includes(requested.toLowerCase()) || requested.toLowerCase() === 'ua';
    $('fallback').textContent = copy.en.fallback;
    $('filter').replaceChildren(...['all', ...M.STATUSES].map(id => {const option=node('option',t[id]);option.value=id;return option;}));
    $('filter').value = filter;
    $('storage').textContent = t[state.persistence];
    const visible = model.list(filter);
    $('summary').textContent = t.summary.replace('{done}', model.list('done').length).replace('{total}',M.IDS.length).replace('{shown}',visible.length);
    $('empty').hidden = visible.length !== 0;
    $('tasks').setAttribute('aria-label',t.tasks);
    $('taskLinksNotice').textContent=taskLinkCopy[lang][taskLinks.snapshot().persistence];$('taskLinksClear').textContent=taskLinkCopy[lang].clear;
    $('tasks').replaceChildren(...visible.map(id => {
      const [stage,title,detail] = t.items[M.IDS.indexOf(id)];
      const article=node('article','', 'task'), content=node('div');
      const heading=node('h2',title);heading.id=id+'-title';heading.tabIndex=-1;
      content.append(node('span',t.stage+' · '+stage,'tag'),heading,node('p',detail,'muted'));
      const label=node('label',t.filter), select=node('select');select.id=id;
      select.setAttribute('aria-label',t.filter+' · '+title);
      select.append(...M.STATUSES.map(status=>{const option=node('option',t[status]);option.value=status;return option;}));
      select.value=state.statuses[id];
      select.addEventListener('change',()=>{model.set(id,select.value);render();});
      label.append(select);article.append(content,label,renderTaskLink(id));return article;
    }));
    $('links').setAttribute('aria-label',t.links);
    const paths=[['company','https://www.primserv.pl/'],['jobs','https://oleksandrkiris.github.io/kiris-jobs/?lang='+lang],['training','https://oleksandrkiris.github.io/citronex-hydra-project/?lang='+(lang==='uk'?'ua':lang)],['bot','https://t.me/KirisWorkPoland_bot']];
    $('links').replaceChildren(...paths.map(([key,url])=>{const a=node('a',t[key]);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}));
    renderPublished();
    renderMaterials();renderBackup();renderProgressSummary();
    if (focused && M.IDS.includes(focused)) ($(focused) || $('filter')).focus();
  }
  $('language').addEventListener('change',()=>{requested=$('language').value;lang=M.language(requested);syncURL();render();});
  $('filter').addEventListener('change',()=>{filter=$('filter').value;syncURL();render();});
  $('favouritesClear').addEventListener('click',()=>{favourites.clear();renderMaterials();$('favouritesTitle').focus();});
  $('lastMaterialReturn').addEventListener('click',()=>{
    const entry=recent.snapshot().entry;if(!entry)return;
    requested=entry.requested_language;lang=M.language(requested);syncURL();render();
    openMaterial(entry.material_id,entry.requested_language,false);
  });
  $('lastMaterialClear').addEventListener('click',()=>{recent.clear();selectedMaterial=null;renderMaterials();$('materialsTitle').focus();});
  $('materialQuery').addEventListener('input',renderMaterials);
  $('materialsSource').addEventListener('change',()=>{
    materialMode=$('materialsSource').value;
    reader=M.materialReader(materialMode==='mock'?{mode:'mock',mock:q=>JSON.stringify(M.materialSnapshot(q))}:{});
    renderMaterials();
  });
  $('reset').addEventListener('click',()=>{if(backupPending)cancelBackup();$('resetConfirm').hidden=false;$('cancel').focus();});
  $('cancel').addEventListener('click',()=>{$('resetConfirm').hidden=true;$('reset').focus();});
  $('confirm').addEventListener('click',()=>{model.reset(true);$('resetConfirm').hidden=true;render();$('reset').focus();});
  render();
  if(published && 'serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', prepareOffline);
  prepareOffline();
})();

