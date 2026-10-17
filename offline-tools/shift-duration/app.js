(function () {
  'use strict';
  const C = window.ShiftDuration;
  const copy = {
    en: {
      title:'Shift duration', badge:'Offline prototype · v1', eyebrow:'A small tool for everyday calculations', language:'Language', intro:'Calculate one interval and subtract a break. Nothing is sent anywhere.', inputTitle:'Enter the time', start:'Start', end:'End', nextDay:'End on the following day', breakMinutes:'Break, minutes', calculate:'Calculate', resultTitle:'Time remaining after the break', placeholder:'Enter the time to begin', disclaimer:'Arithmetic only, not a timesheet or payroll calculation. No assessment of working-time rules. Intervals must be shorter than 24 hours. Clock changes and time zones are not included.', storageTitle:'On this device only', storageNote:'Save the current fields and language only when you choose. No names or employee records. Browser storage may be cleared.', save:'Save fields', forget:'Forget saved fields', offline:'Works without internet from a downloaded local copy. Open index.html or use the documented local server. External links below need internet; this is not an installed PWA.', company:'PrimServ company', jobs:'Vacancies', hydra:'Training / HYDRA', telegram:'Telegram bot', timeError:'Enter a valid start and end time (HH:mm).', rangeError:'Choose an interval greater than zero and shorter than 24 hours. For an overnight interval, select the following day.', breakError:'Enter whole break minutes, from zero to less than the interval length.', empty:'Nothing saved. Changes stay in memory until you choose Save.', loaded:'Saved fields restored. Changes are not saved automatically.', saved:'Fields saved on this device.', unsupported:'Saved data is damaged or uses another format. It was not changed. Calculate normally; to save again, explicitly forget the old data first.', unavailable:'Storage is unavailable. Calculation works in memory.', saveFailed:'Could not save or remove data. Calculation still works in memory.', forgotten:'Saved fields removed. The current calculation is unchanged.', cancelled:'Removal cancelled. Saved fields are unchanged.', confirm:'Remove only this calculator’s saved fields? Current inputs and other applications will not change.', hours:'h', minutes:'min', total:'Whole interval', breakLabel:'Break'
    },
    ru: {
      title:'Длительность смены', badge:'Офлайн-прототип · v1', eyebrow:'Небольшой инструмент для повседневных расчётов', language:'Язык', intro:'Рассчитайте один интервал и вычтите перерыв. Ничего никуда не отправляется.', inputTitle:'Введите время', start:'Начало', end:'Конец', nextDay:'Окончание на следующий день', breakMinutes:'Перерыв, минуты', calculate:'Рассчитать', resultTitle:'Время после вычета перерыва', placeholder:'Введите время для расчёта', disclaimer:'Только арифметика — не табель и не расчёт зарплаты. Нормы рабочего времени не оцениваются. Интервал должен быть короче 24 часов. Перевод часов и часовые пояса не учитываются.', storageTitle:'Только на этом устройстве', storageNote:'Сохраняются только текущие поля и язык, по вашей кнопке. Без имён и записей о сотрудниках. Браузер может очистить хранилище.', save:'Сохранить поля', forget:'Забыть сохранённые поля', offline:'Работает без интернета из скачанной локальной копии. Откройте index.html или используйте локальный сервер по инструкции. Ссылкам ниже нужен интернет; это не установленная PWA.', company:'Компания PrimServ', jobs:'Вакансии', hydra:'Обучение / HYDRA', telegram:'Telegram-бот', timeError:'Введите корректное время начала и окончания (ЧЧ:мм).', rangeError:'Выберите интервал больше нуля и короче 24 часов. При переходе через полночь отметьте следующий день.', breakError:'Введите целые минуты перерыва: от нуля до значения меньше длительности интервала.', empty:'Ничего не сохранено. Изменения остаются в памяти до нажатия «Сохранить».', loaded:'Сохранённые поля восстановлены. Изменения автоматически не сохраняются.', saved:'Поля сохранены на этом устройстве.', unsupported:'Сохранённые данные повреждены или имеют другой формат. Они не изменены. Расчёт доступен; для нового сохранения сначала явно удалите старое.', unavailable:'Хранилище недоступно. Расчёт работает в памяти.', saveFailed:'Не удалось сохранить или удалить данные. Расчёт по-прежнему работает в памяти.', forgotten:'Сохранённые поля удалены. Текущий расчёт не изменён.', cancelled:'Удаление отменено. Сохранённые поля не изменены.', confirm:'Удалить только сохранённые поля этого калькулятора? Текущий ввод и другие приложения не изменятся.', hours:'ч', minutes:'мин', total:'Весь интервал', breakLabel:'Перерыв'
    },
    uk: {
      title:'Тривалість зміни', badge:'Офлайн-прототип · v1', eyebrow:'Невеликий інструмент для щоденних розрахунків', language:'Мова', intro:'Розрахуйте один інтервал і відніміть перерву. Нічого нікуди не надсилається.', inputTitle:'Введіть час', start:'Початок', end:'Кінець', nextDay:'Завершення наступного дня', breakMinutes:'Перерва, хвилини', calculate:'Розрахувати', resultTitle:'Час після віднімання перерви', placeholder:'Введіть час для розрахунку', disclaimer:'Лише арифметика — не табель і не розрахунок зарплати. Норми робочого часу не оцінюються. Інтервал має бути коротшим за 24 години. Переведення годинника та часові пояси не враховуються.', storageTitle:'Лише на цьому пристрої', storageNote:'Зберігаються лише поточні поля та мова, після натискання кнопки. Без імен і записів про працівників. Браузер може очистити сховище.', save:'Зберегти поля', forget:'Забути збережені поля', offline:'Працює без інтернету із завантаженої локальної копії. Відкрийте index.html або скористайтеся локальним сервером за інструкцією. Посиланням нижче потрібен інтернет; це не встановлена PWA.', company:'Компанія PrimServ', jobs:'Вакансії', hydra:'Навчання / HYDRA', telegram:'Telegram-бот', timeError:'Введіть коректний час початку та завершення (ГГ:хх).', rangeError:'Оберіть інтервал більший за нуль і коротший за 24 години. Якщо він проходить через північ, позначте наступний день.', breakError:'Введіть цілі хвилини перерви: від нуля до значення меншого за тривалість інтервалу.', empty:'Нічого не збережено. Зміни залишаються в пам’яті до натискання «Зберегти».', loaded:'Збережені поля відновлено. Зміни автоматично не зберігаються.', saved:'Поля збережено на цьому пристрої.', unsupported:'Збережені дані пошкоджені або мають інший формат. Їх не змінено. Розрахунок доступний; для нового збереження спочатку явно видаліть старе.', unavailable:'Сховище недоступне. Розрахунок працює в пам’яті.', saveFailed:'Не вдалося зберегти або видалити дані. Розрахунок працює в пам’яті.', forgotten:'Збережені поля видалено. Поточний розрахунок не змінено.', cancelled:'Видалення скасовано. Збережені поля не змінено.', confirm:'Видалити лише збережені поля цього калькулятора? Поточне введення та інші застосунки не зміняться.', hours:'год', minutes:'хв', total:'Увесь інтервал', breakLabel:'Перерва'
    },
    pl: {
      title:'Czas trwania zmiany', badge:'Prototyp offline · v1', eyebrow:'Małe narzędzie do codziennych obliczeń', language:'Język', intro:'Oblicz jeden przedział czasu i odejmij przerwę. Nic nie jest nigdzie wysyłane.', inputTitle:'Wpisz godziny', start:'Początek', end:'Koniec', nextDay:'Zakończenie następnego dnia', breakMinutes:'Przerwa, minuty', calculate:'Oblicz', resultTitle:'Czas po odjęciu przerwy', placeholder:'Wpisz godziny, aby obliczyć czas', disclaimer:'Tylko obliczenie arytmetyczne — nie ewidencja czasu pracy ani obliczenie wynagrodzenia. Bez oceny norm czasu pracy. Przedział musi być krótszy niż 24 godziny. Zmiany czasu i strefy czasowe nie są uwzględniane.', storageTitle:'Tylko na tym urządzeniu', storageNote:'Zapisujesz tylko bieżące pola i język, po naciśnięciu przycisku. Bez nazwisk i danych pracowników. Przeglądarka może wyczyścić pamięć.', save:'Zapisz pola', forget:'Usuń zapisane pola', offline:'Działa bez internetu z pobranej kopii lokalnej. Otwórz index.html lub użyj lokalnego serwera zgodnie z instrukcją. Poniższe linki wymagają internetu; to nie jest zainstalowana PWA.', company:'Firma PrimServ', jobs:'Oferty pracy', hydra:'Szkolenia / HYDRA', telegram:'Bot Telegram', timeError:'Wpisz prawidłową godzinę rozpoczęcia i zakończenia (GG:mm).', rangeError:'Wybierz przedział większy od zera i krótszy niż 24 godziny. Jeśli obejmuje północ, zaznacz następny dzień.', breakError:'Wpisz całkowitą liczbę minut przerwy: od zera do wartości mniejszej niż długość przedziału.', empty:'Brak zapisu. Zmiany pozostają w pamięci do naciśnięcia „Zapisz”.', loaded:'Przywrócono zapisane pola. Zmiany nie zapisują się automatycznie.', saved:'Pola zapisano na tym urządzeniu.', unsupported:'Zapisane dane są uszkodzone lub mają inny format. Nie zmieniono ich. Obliczenia są dostępne; przed nowym zapisem jawnie usuń stary.', unavailable:'Pamięć przeglądarki jest niedostępna. Obliczenia działają w pamięci tymczasowej.', saveFailed:'Nie udało się zapisać lub usunąć danych. Obliczenia nadal działają w pamięci tymczasowej.', forgotten:'Usunięto zapisane pola. Bieżące obliczenie nie zostało zmienione.', cancelled:'Anulowano usuwanie. Zapisane pola pozostały bez zmian.', confirm:'Usunąć tylko zapisane pola tego kalkulatora? Bieżące wartości i inne aplikacje nie zostaną zmienione.', hours:'godz.', minutes:'min', total:'Cały przedział', breakLabel:'Przerwa'
    }
  };
  const $ = id => document.getElementById(id);
  const getStorage = () => window.localStorage;
  const loaded = C.read(getStorage);
  let state = { ...loaded.value }, status = loaded.status, attempted = false;
  const requested = new URLSearchParams(window.location.search).get('lang');
  if (requested) state.lang = C.language(requested);
  $('fallback').hidden = !requested || C.LANGS.includes(requested) || requested === 'ua';
  function values() { return { start:$('start').value, end:$('end').value, nextDay:$('nextDay').checked, breakMinutes:$('breakMinutes').value, lang:state.lang }; }
  function format(n, t) { return `${Math.floor(n / 60)} ${t.hours} ${n % 60} ${t.minutes}`; }
  function result(focus = false) {
    const t = copy[state.lang], r = C.calculate(values());
    ['start','end','breakMinutes','nextDay'].forEach(id => $(id).removeAttribute('aria-invalid'));
    $('error').textContent = '';
    $('result').replaceChildren();
    if (!attempted) { $('result').textContent = t.placeholder; return; }
    if (r.error) {
      $('error').textContent = t[r.error]; $('result').textContent = t.placeholder;
      $(r.field).setAttribute('aria-invalid', 'true');
      if (focus) $(r.field).focus();
      return;
    }
    $('result').textContent = format(r.net, t);
    const detail = document.createElement('small');
    detail.textContent = `${t.total}: ${format(r.total,t)} · ${t.breakLabel}: ${r.rest} ${t.minutes}`;
    $('result').append(detail);
  }
  function render() {
    const t = copy[state.lang]; document.documentElement.lang = state.lang; document.title = `${t.title} · PrimServ`;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t[el.dataset.i18n]; });
    $('language').value = state.lang;
    $('storageStatus').textContent = t[status];
    $('jobs').href = `https://oleksandrkiris.github.io/kiris-jobs/?lang=${state.lang}`;
    $('hydra').href = `https://oleksandrkiris.github.io/citronex-hydra-project/?lang=${state.lang === 'uk' ? 'ua' : state.lang}`;
    result();
  }
  ['start','end','breakMinutes'].forEach(id => { $(id).value = state[id]; });
  $('nextDay').checked = state.nextDay;
  $('calculator').addEventListener('submit', event => { event.preventDefault(); attempted = true; result(true); });
  $('calculator').addEventListener('input', () => { result(); });
  $('language').addEventListener('change', () => {
    state.lang = C.language($('language').value); $('fallback').hidden = true;
    try { const url = new URL(window.location.href); url.searchParams.set('lang', state.lang); window.history.replaceState(null, '', url); } catch { /* file:// or blocked history: calculation must remain usable */ }
    render();
  });
  $('save').addEventListener('click', () => { attempted = true; const v=values(); if(C.calculate(v).error) { result(true); return; } status=C.save(getStorage,v); render(); });
  $('forget').addEventListener('click', () => { status=C.forget(getStorage,window.confirm(copy[state.lang].confirm)); render(); });
  attempted = loaded.status === 'loaded' && !C.calculate(state).error;
  render();
})();
