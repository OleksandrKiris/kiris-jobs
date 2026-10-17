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
  // Accessing localStorage itself can throw; no other keys are read.
  const storage = {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: key => window.localStorage.removeItem(key)
  };
  const model = M.create(storage);
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
  function render() {
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
    $('tasks').replaceChildren(...visible.map(id => {
      const [stage,title,detail] = t.items[M.IDS.indexOf(id)];
      const article=node('article','', 'task'), content=node('div');
      const heading=node('h2',title);heading.id=id+'-title';
      content.append(node('span',t.stage+' · '+stage,'tag'),heading,node('p',detail,'muted'));
      const label=node('label',t.filter), select=node('select');select.id=id;
      select.setAttribute('aria-label',t.filter+' · '+title);
      select.append(...M.STATUSES.map(status=>{const option=node('option',t[status]);option.value=status;return option;}));
      select.value=state.statuses[id];
      select.addEventListener('change',()=>{model.set(id,select.value);render();});
      label.append(select);article.append(content,label);return article;
    }));
    $('links').setAttribute('aria-label',t.links);
    const paths=[['company','https://www.primserv.pl/'],['jobs','https://oleksandrkiris.github.io/kiris-jobs/?lang='+lang],['training','https://oleksandrkiris.github.io/citronex-hydra-project/?lang='+(lang==='uk'?'ua':lang)],['bot','https://t.me/KirisWorkPoland_bot']];
    $('links').replaceChildren(...paths.map(([key,url])=>{const a=node('a',t[key]);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}));
    renderPublished();
    if (focused && M.IDS.includes(focused)) ($(focused) || $('filter')).focus();
  }
  $('language').addEventListener('change',()=>{requested=$('language').value;lang=M.language(requested);syncURL();render();});
  $('filter').addEventListener('change',()=>{filter=$('filter').value;syncURL();render();});
  $('reset').addEventListener('click',()=>{$('resetConfirm').hidden=false;$('cancel').focus();});
  $('cancel').addEventListener('click',()=>{$('resetConfirm').hidden=true;$('reset').focus();});
  $('confirm').addEventListener('click',()=>{model.reset(true);$('resetConfirm').hidden=true;render();$('reset').focus();});
  render();
  if(published && 'serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', prepareOffline);
  prepareOffline();
})();

