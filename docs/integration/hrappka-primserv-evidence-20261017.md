# HRappka → PrimServ: матрица доказательств и пробелов

Сверка: **17.10.2026**, Europe/Budapest. Owner14, repo
`OleksandrKiris/kiris-jobs`, allowed_paths `docs/integration/**`.
База: `54b597fcc5d50180adcf50d4d40dc9d81d83cc4d`.
Один WIP: `codex/role14-hrappka-evidence`.
Зависимости: materials-v1 принят и заморожен на `bf0fd233`; PR62 и PR68 draft.
Цель и выбор очереди ведёт10 в [единственном roadmap][roadmap]: [PR61][pr61]
уже принят; [PR78][pr78] обновляет статусы, пока draft, не источник принятого main.

Пользователь поставил цель: «всё должно быть лучше чем храпка».
Здесь это требование к будущему измеримому результату, а не заявление о
достигнутом превосходстве. Матрица даёт техлиду варианты небольших срезов и
способ их приёмки. Она не создаёт отдельную очередь, сроки или обязательство
реализовать все строки. Следующий WIP выбирается только в едином roadmap.

## Что именно проверено

HRappka описана по публичным официальным материалам, без входа в аккаунт,
тестирования её продукта, вызовов API или оценки её ошибок/производительности.
Маркетинговое заявление не равно нашей независимой функциональной проверке.
В таблице «заявлено» означает только наличие описания у поставщика.

- **S1 — [Функции системы HRappka][hr-functions]**: страница успешно прочитана
  web-инструментом 17.10.2026; разделы указаны в таблице. Это описание продукта,
  не проверка работы функций на конкретном тарифе или версии.
- **S2 — [API: интеграция и документация][hr-api]**: прямое открытие 17.10.2026
  вернуло 404. Официальный поисковый индекс, обход за предыдущий месяц,
  содержит описание API рекрутинга и передачи анкет. Это индексированное
  свидетельство; текущая доступность документа и endpoint'ов не подтверждена.
- **S3 — [Новая документация API][hr-api-new]**: прямое открытие тоже вернуло
  404; официальный индекс содержит указание на централизованную документацию
  и предварительную заявку с целью, endpoint'ами и частотой запросов.
  S2/S3 — исторические адреса, не текущий guide. Их 404 не доказывает
  отсутствие или устарелость API; актуальный публичный guide указан в S6.
  Доступ конкретной организации и выполнение endpoint'ов не проверялись.
  Примеры credentials/endpoints из S2 не переносить в PrimServ как актуальную
  спецификацию. Заявку не отправляли, аккаунт не создавали.
- **S4 — [Модуль рекрутинга][hr-recruiting]**: успешно прочитан live 17.10.2026;
  раздел «API ofert pracy» подтверждает описание API открытых/постоянных вакансий
  для сайта. Это актуальное публичное свидетельство именно recruiting API,
  не проверка всего API продукта или его исполнения.
- **S5 — [Интеграции / импорт / экспорт][hr-integrations]**: успешно прочитан
  live 17.10.2026; фактический пункт «Integracja API Hrappka» ведёт на
  `https://pomoc.hrappka.pl/baza-wiedzy/integracja-api-hrappka/` (S6),
  а не на исторический адрес S3.
- **S6 — [Integracja API Hrappka][hr-api-current]**: открыта через ссылку S5
  и прочитана live 17.10.2026; на странице дата обновления **2026-10-08**.
  Guide описывает процедуру доступа, техническую учётную запись, авторизацию
  JWT и обновление токенов; содержит ссылку на [техническую документацию][hr-api-doc].
  Target ссылки проверен открытием публичной страницы документации; web-парсер
  не вернул текст её содержимого. Исполнение endpoint'ов не проверялось. Логин/refresh не вызывали, токены/аккаунты не создавали.
  Сведения guide — описание поставщика, не рекомендация перенести его auth
  или лимиты в PrimServ и не наша проверка безопасности API.

Для PrimServ различаем: **принято** — конкретный объём в main на указанной
базе; **draft** — код в открытом PR, даже при зелёном CI; **нет доказательства** —
текущие просмотренные источники функцию не подтверждают. Последнее не доказывает,
что такой функции нет во всех проектах. Другие репозитории перечислены в roadmap;
их полный повторный аудит этим проходом не выполнялся.

Статусы повторно сверены 17.10.2026 на указанной базе:

- [PR73][pr73] принят в `ace6655`: [canonical schema validator][p-validator]
  реально применяет accepted v1 и date formats, запрещает remote refs; локальная
  совместная proof с exact PR62 зафиксирована владельцем12. Это принятое ядро,
  а не HTTP endpoint или выполненная интеграция в ветке13.
- [PR76][pr76] принят в `54b597f`: [file view/profile evidence][p-file-profile]
  фиксирует query→fragment для file URL и normal native Chromium profile;
  14 controls + 2 close/reopen = 16/16. Post-merge CI и 7 публичных bytes
  подтверждены выпускающим10. Это не обещание persistence всех браузеров/private mode.
- [PR75][pr75] closed, не merged; HTTP rewrite остался unapplied после policy
  refusal. Его не считать принятой runtime-реализацией и не обходить отказ.
- [PR68][pr68] **reopened/draft**, head
  `13dbd5c8b2767ce91213af2c4352a9c84341f18a`; прежняя парковка — история.
  Материалы и новый cache gate ещё не приняты и не опубликованы.
- [PR62][pr62] open/draft, head `177872e3a4a1ada304ab2f0e0d0b9e5ffa5f8119`.
  Интеграция13 с actual schema validator ещё не выполнена: в его durable-среде
  git fetch к GitHub443 policy-blocked, штатное разрешение отсутствует (передача10).
  Локальная proof12 этого не заменяет. Отказ не обходится другим инструментом
  или средой; требуется штатное разрешение сети того окружения.
- [PR77][pr77] ready/open, **не merged**: head
  `7406378500892cf41a0400ce4da32b9958c42b71`, implementation `d834881f`.
  Pure UTF-8 helper с cap32768: 54 backend tests +8 независимых регрессий
  отмечены в PR; на этом head Backend CI PASS, общий coordinator CI FAIL.
  GitHub draft flag выключен, но это
  не означает наличие helper в accepted main. HTTP route по-прежнему не установлен.
- [PR72][pr72] принят в `a8093c9`: [CI][p-contract-ci] исполняет 20 accepted
  contract/ownership regressions. **Hard lock не установлен**; выполнение
  тестов не означает enforcement карты на каждом произвольном PR.

## Сопоставление девяти направлений

Сценарии ниже — **предлагаемые критерии будущей приёмки**, не уже полученные
измерения. Во всех случаях используются публичные или вымышленные fixtures.
Владелец указан для реализации после выбора техлидом; роль14 этот код не пишет.

| Направление | HRappka: публично заявлено / источник | PrimServ: actual evidence и граница | Пробел | Owner / зависимость | Один следующий небольшой полезный срез | Измеримая приёмка выбранного среза |
| --- | --- | --- | --- | --- | --- | --- |
| Recruiting / подбор | Формы, статусы кандидатов, публикация вакансий; S1 «Moduł rekrutacji», S4 | [Каталог/контент][p-content], [валидация][p-content-check], [форма: проверка UI][p-apply-check]; в базе 14 вакансий. Это публичный путь, не подтверждённая ATS с кадровыми записями. Реальную отправку не проверяли. | Нет доказанного общего контекста вакансии/локации/языка на всём пути до возврата; ATS-переходы и реальные анкеты не входят в этап. | 1; переходы2/3/8; общая схема14 только при конкретной нужде | Сохранить безопасный контекст одной существующей вакансии при входе в форму и Back, без отправки. | Одна job ID × RU/UK/PL/EN × 320/1280 px: 8 проходов сохраняют job/location/language после Back и reload; неизвестный ID даёт явное состояние; внешних POST=0. |
| Onboarding / обучение | Шаги адаптации, контент, тесты, прогресс; S1 «Onboarding i szkolenia» | [Кабинет][p-coordinator] с тремя вымышленными задачами; учебные сайты отражены в roadmap. [PR76][pr76] принят: file fragment и native profile16/16; [PR68][pr68] source-view reopened/draft, не merged. | Нет принятого общего сценария «источник → нужная локация → прогресс → возврат» между компонентами. | 9 и профильные3/5/6/7; 1 для SW/упаковки, 10 выпуск; PR68 отдельно | Довести существующий PR68 source-view/cache gate до приёмки на базе принятого76, без нового consumer WIP. | 1 material ID; `ua→uk`, фактический RU fallback виден; Back/reload сохраняют контекст; 320px без переполнения; повреждённое storage не затирается; после сохранения пакет работает без сети. Нужны UI/браузерные доказательства точного head. |
| Time / время | Графики, регистрация времени, отсутствия; S1 «Czas pracy i nieobecności» | [Калькулятор длительности][p-time]: локальная арифметика, перерыв, явная полночь, сохранение. README прямо исключает табель, зарплату, даты/DST. | Нет подтверждённого табеля, согласования часов или распределения по клиентам. Калькулятор не выдавать за них. | 11; 14 только для согласованного формата; 13/12 при будущем хранении | Один вымышленный локальный черновик нескольких интервалов с проверкой пересечений, после проверки существующего backlog11. | 22:00–06:00/30 минут=7:30; два непересекающихся интервала суммируются; перекрытие отвергается; reload сохраняет разрешённый черновик; нет вывода о соблюдении закона или оплате; сетевых запросов=0. |
| Documents / документы | Шаблоны, подпись, кадровые папки; S1 «Kadry» | [PDF-проверка существующей формы][p-delivery-check], [privacy-проверка][p-privacy-check]; это вспомогательные документы публичного пути. [Материалы v1][p-contract] — публичное чтение с provenance, не личное дело. | Не подтверждены хранение личных дел, подпись, юридическая значимость или разграничение доступа к частным файлам. | 9/14 для публичного реестра; 12/13 для будущих прав/хранения | Показать происхождение и устаревание одного публичного документа без загрузки персональных файлов. | ID/ссылка/ref/историческая дата и статус видны; unverified не показан как confirmed; неизвестная версия не затирает сохранённую; 0 uploads и 0 обещаний электронной подписи. |
| Payroll / расчёты | Начисления, расчётные листы, корректировки; S1 «Wynagrodzenia» | [Контент вакансий][p-content] содержит опубликованные условия; [валидатор][p-content-check] проверяет диапазон/currency/period. [Утилита][p-time] не считает зарплату. | Нет доказанного payroll engine, налоговых/страховых расчётов или расчётных листов. Нельзя смешивать рекламную ставку и начисление. | 1 для условий; 13/14 для будущего typed input; 12 для зависимостей | Изолированные fixtures валидации decimal amount/currency/unit/gross-net/unknown; не расчёт налогов. Accepted materials-v1 не расширяется ради этого. | Decimal `31.40` сохраняется строкой; unknown остаётся null, не 0; gross/net обязательны для известной суммы; смешение валют/единиц отвергается; неверный ввод не порождает платёж/начисление. Правовую корректность не заявлять. |
| Legalisation / легализация | Учёт разрешений, сроки, заявления; S1 «Legalizacja» | [Публичные инструкции приезда в roadmap][roadmap] — пользовательская помощь. Проверенных моделей разрешений, правового движка или интеграции с ведомством эта база не подтверждает. | Нет доказанного case-management и проверенного источника для конкретного юридического вывода. | 3 за инструкции; 9 за реестр; 14 формат; 10 за выбор подтверждённого материала | Только карточка подтверждённой публичной инструкции с источником/датой и честным отказом при отсутствии материала. | Запрос по двум локациям не смешивает источники; нет подтверждения — показан отказ; дата источника не равна дате просмотра; 0 юридических решений, заявлений и отправок в ведомства. |
| Self-service / самообслуживание | Данные занятости, документы, заявки; S1 «Portal pracownika» | [Кабинет][p-coordinator] — локальное demo, без реальных работников/аккаунтов; [Django core][p-core] имеет health/version и принятый внутренний schema validator; materials HTTP route отсутствует. | Нет принятого защищённого личного кабинета или межустройственной синхронизации. Демонстрация не эквивалент employee portal. | 9 UI; 12 identity/URL; 13 объектная изоляция; контракт14 по отдельной задаче | Один локальный demo read-only экран с честным storage status; при необходимости доступа сначала тестовая матрица прав, без аккаунтов. | Вымышленные A/B: чужой объект не виден ни в списке, ни по ID; неизвестная роль denied; запрещённое storage показывает работу в памяти; reload не обещает серверную синхронизацию. Это local mock, не production auth. |
| ERP / CRM | Жильё/ресурсы, клиенты/проекты, расчёты; S1 «ERP», «CRM» | [Публичные материалы жилья][p-content] и [демо задач][p-coordinator]; [домен][p-domain] содержит локальные task transitions и вымышленную A/B изоляцию. Фото жилья не означают учёт свободных мест. | Не подтверждены бронирование/занятость жилья, реестр клиентов, склад или invoicing. | 9 публичное представление; 13 домен; 12 доступ/хранение; 14 ID | Одна вымышленная карточка связи площадки/работодателя/юридического лица, без резервирования ресурсов. | Три ID различаются; Bogatynia и Zgorzelec не сливаются; неизвестная связь остаётся unknown; A/B не пересекаются; 0 броней, счетов и реальных контактных записей. |
| API / интеграция | API вакансий — S4 live; API guide/JWT/refresh/ссылка на docs — S6 live, updated2026-10-08; S5 ведёт на S6. S2/S3 исторические | [Core][p-core] health/version и [принятый validator73][p-validator]; [accepted materials-v1][p-contract] со snapshot/mock. [PR77][pr77] byte-cap helper подготовлен, не merged; [PR62][pr62] adapter draft. Materials URL не установлен. | Нет принятой сквозной frontend↔local Django parity или production API. У13 actual-validator integration не выполнена из-за конкретного network policy refusal; proof12 остаётся отдельным evidence. | 13 adapter+actual-validator; 12 helper77/позднее маршрут; 9 consumer68; 14 frozen contract; 15 accepted CI72 | После штатного разрешения policy-блокера: actual-validator совместимость PR62 с accepted73; затем один локальный read-only сценарий с отдельным принятием77/68 и маршрута12. | Один fixture через snapshot, injected mock и localhost API даёт одинаковые ID/text/provenance/fallback; actual JSON Schema validator выполняется, а не spy; unknown/duplicate params, location, limit0/21, write methods дают согласованную ошибку; backend недоступен — snapshot работает; внешних запросов=0. |

## Как доказать, что выбранный сценарий стал лучше

В текущем проходе сравнительных пользовательских измерений нет. Предлагается
сначала выбрать **одну** сопоставимую задачу, а не считать число модулей.
Ограничение конкретной внешней анкеты не доказывает отсутствие offline во
всей HRappka. Проверяемые цели PrimServ: точное происхождение материала, отсутствие смешения
локаций, понятный fallback, возврат без потери контекста, работа локального
frontend без backend, доступность клавиатурой/на 320px и отсутствие отправок.
Указанные свойства HRappka не тестировались; нельзя объявлять их отсутствующими.

В собственном сценарном тесте записывать завершение/ошибку, число шагов, время,
потерянные поля, размер/запросы и offline/reload результат для точного head,
браузера и viewport. Исходные значения времени и шагов ещё не измерены; целевые
пороги принимает10 вместе с владельцем перед реализацией. Сравнение с HRappka
возможно только по той же задаче, разрешённому сопоставимому стенду, одинаковому
набору данных и протоколу; без этого допустимо говорить об улучшении PrimServ
относительно собственной предыдущей версии, но не о превосходстве над HRappka.

Три статуса сдачи сохраняются раздельно: функция работает; контракт совместим;
изменение принято/опубликовано. Зелёный draft не становится принятым. Текущая
ручная карта владения не является hard lock; 20 тестов уже подключены ролью15
в принятом72, дальнейшие CI-изменения остаются у15.
Accepted materials-v1 и ownership-map этим документом не меняются.

## Граница следующей передачи

Каждая строка — вариант декомпозиции для roadmap10, не разрешение на production,
платный сервис, реальных людей/секреты, сторонние аккаунты, AI, подпись, банк,
ведомство, HRappka write API или автоматические сообщения. Публичные инструкции
не превращаются в кадровое или юридическое решение. Frontend остаётся автономным;
backend — отдельно локальным. Новых зависимостей/серверов/расходов этот WIP не вводит.

Проверка документа: девять строк с evidence/gap/owner/dependency/slice/acceptance;
прямые официальные источники и ограничения API-index указаны; локальные ссылки
закреплены на accepted base, draft PR перечислены отдельно; diff только этого
файла в `docs/integration/`. Runtime/байты кэша/запросы изменением не затрагиваются.
Откат: обычный revert документа. Независимое содержательное ревью —10; критерии
конкретного выбранного среза согласует профильный владелец.

[roadmap]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/docs/primserv-roadmap.md
[pr61]: https://github.com/OleksandrKiris/kiris-jobs/pull/61
[pr62]: https://github.com/OleksandrKiris/kiris-jobs/pull/62
[pr68]: https://github.com/OleksandrKiris/kiris-jobs/pull/68
[hr-functions]: https://hrappka.pl/funkcje-systemu/
[hr-api]: https://pomoc.hrappka.pl/baza-wiedzy/api/
[hr-api-new]: https://pomoc.hrappka.pl/baza-wiedzy/nowa-dokumentacja-api/
[p-content]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/data/content.js
[p-content-check]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/scripts/validate-content.mjs
[p-apply-check]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/scripts/validate-apply.mjs
[p-delivery-check]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/scripts/validate-delivery.mjs
[p-privacy-check]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/scripts/validate-privacy.mjs
[p-coordinator]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/coordinator-demo/README.md
[p-time]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/offline-tools/shift-duration/README.md
[p-contract]: https://github.com/OleksandrKiris/kiris-jobs/tree/bf0fd233d12cb80939addbabc9526156e871b67c/contracts/materials-v1
[p-core]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/backend/README.md
[p-domain]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/docs/backend/domain/README.md

[hr-recruiting]: https://pomoc.hrappka.pl/modul-rekrutacji/
[hr-integrations]: https://pomoc.hrappka.pl/integracje-import-eksport/

[hr-api-current]: https://pomoc.hrappka.pl/baza-wiedzy/integracja-api-hrappka/
[hr-api-doc]: https://app.hrappka.pl/api/doc

[pr72]: https://github.com/OleksandrKiris/kiris-jobs/pull/72
[pr73]: https://github.com/OleksandrKiris/kiris-jobs/pull/73
[pr75]: https://github.com/OleksandrKiris/kiris-jobs/pull/75
[pr76]: https://github.com/OleksandrKiris/kiris-jobs/pull/76
[pr77]: https://github.com/OleksandrKiris/kiris-jobs/pull/77
[pr78]: https://github.com/OleksandrKiris/kiris-jobs/pull/78
[p-validator]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/docs/backend/core/canonical-material-validation.md
[p-file-profile]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/docs/platform/coordinator-file-profile.md
[p-contract-ci]: https://github.com/OleksandrKiris/kiris-jobs/blob/54b597fcc5d50180adcf50d4d40dc9d81d83cc4d/docs/quality/contract-ci-tests.md
