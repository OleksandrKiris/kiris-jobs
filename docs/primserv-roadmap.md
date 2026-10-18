# PrimServ — канонический план развития

Дата сверки: **18 октября 2026**, Europe/Budapest (проход05:03; локальные source-статусы на 2026-10-18T04:59:51.682132+00:00, опубликованный99 сохранён). Цель: самостоятельный
фронтенд PrimServ и отдельный локальный Django-бэкенд с проверяемыми контрактами,
подготавливаемый для других компаний без зависимости экранов от его запуска.
По уточнению пользователя 17.10.2026 работа распределяется
между **15 ролями** с отдельными областями и одним выпуском сайтов.
Ниже остаются **10 продуктовых направлений**: это не количество исполнителей.
Другие документы `docs/` — доказательства отдельных
исправлений, а не альтернативные планы.

Текущая очередь — в [таблице 15 ролей](#очередь-и-исполнение-после-аудита-всех-15-направлений).
Датированные записи приёмки сохраняют прежние head и ограничения; поручения
для нового прохода брать из текущей очереди, а не из старых слов «следующий».

## Продуктовая цель: превзойти HRappka

Прямое уточнение пользователя 17.10.2026: **вся экосистема PrimServ должна быть
лучше HRappka**. Это постоянный критерий выбора функций и приёмки, а не уже
доказанный результат. Сравниваются законченные задачи кандидата, работника,
координатора и администратора; наличие экранов само по себе не закрывает задачу.

Публичная база сравнения прочитана 17.10.2026: официальный
[перечень функций HRappka](https://hrappka.pl/funkcje-systemu/) и
[официальный раздел рекрутинга/API](https://pomoc.hrappka.pl/modul-rekrutacji/).
Поставщик описывает рекрутинг, onboarding/обучение, кадровые документы,
легализацию, время/отсутствия, расчёты, самообслуживание, ERP/CRM и API
интеграции рекрутинга. Это заявленный публичный набор, не наш
аудит их закрытого продукта; скорость, ошибки, стоимость владения и офлайн
HRappka не измерены. Отсутствие функции в документации не доказывает её отсутствия.

| Область | Критерий приёмки PrimServ | Как доказывать и что пока открыто |
| --- | --- | --- |
| Полезность целого процесса | Вакансия → понятные условия → анкета/контакт → приезд → обучение → помощь координатора связаны; контекст и язык сохраняются. | Exact-head browser-сценарий со всеми переходами; внешнюю доставку не подменять проверкой ссылки. Полная цепочка ещё не принята. |
| Удобство и скорость | Для каждого частого действия фиксируются время, число шагов, ошибки и восстановление; улучшение сравнивается на одной задаче и одинаковых вымышленных данных. | Записывать устройство, сеть, размер набора, версии и результат. Сравнительная база HRappka пока не измерена; проценты превосходства не заявлять. |
| Телефон и доступность | Все действия доступны на ширине320–1440, клавиатурой, с видимым фокусом, понятной ошибкой и возвратом без потери контекста. | Скриншоты состояний и реальные browser-переходы; узкий desktop viewport не заменяет физический телефон или screen reader. |
| Языки и доверие к содержанию | Requested/effective язык различаются честно; fallback виден, источники и даты проверяемы, неподтверждённые условия не выдумываются. | Матрица поддержанных языков/алиасов/ошибок загрузки; лингвистическая сверка отдельно от DOM-тестов. |
| Сохранность и офлайн | После первого поддержанного запуска основные локальные задачи доступны без сети; reload/upgrade/прерванный ресурс не теряют прогресс. | Переход с опубликованной версии, первый offline вход в модуль, отказ/повреждение storage, восстановление последней пригодной версии. File-storage ограничения указывать прямо. |
| Глубина HR-функций | Для recruiting, onboarding, времени, документов, расчётов, легализации, self-service и ERP/CRM вести явные пробелы: готово / ограничено / следующий срез. | Приоритет — целый полезный процесс PrimServ, затем расширение; название модуля не равно parity. Большая часть полного HR-набора ещё не реализована и не принята. |
| Работа разных компаний | Один отдельный backend конфигурируется для двух вымышленных компаний; данные, роли, файлы и операции изолированы, межкомпанейный доступ отвергается. | Отрицательные контрактные/интеграционные тесты двух компаний; текущая SQLite-проверка и snapshot не доказывают production multi-tenancy. |
| Переносимость и контроль | Версионированные API, экспорт/импорт с проверкой обратного чтения, источник изменений и понятный откат; frontend работает без Django. | Контрактные fixtures/mock parity, совместимость версий и проверенный rollback. API материалов67 — первый принятый срез, не весь HR API. |
| Качество выпуска | Критический путь и восстановление проверены на точном head; найденный пользовательский дефект исправляется адресно до соответствующего выпуска. | Свежие CI/браузерные доказательства, независимое ревью, guarded merge и post-check. Зелёный CI не является общей оценкой «лучше HRappka». |

Роль14 ведёт декомпозицию пробелов и критерии контрактов,1/9 — пользовательские
сценарии,12/13 — переносимость и изоляцию,15 — регрессии,10 — итоговую приёмку.
Все15 владельцев применяют критерии в своих существующих областях и одном WIP.
Новая цель не снимает ограничения на реальные данные, онлайн-публикацию,
платные интеграции, внешние отправки и ИИ: следующий разрешённый срез проверяется
на fixtures. Превосходство объявляется отдельно для доказанного сценария и версии.

## Как читать статус

Уточнение пользователя: внедрять новый функционал и качественно адаптировать
его к PrimServ, а не ограничиваться проверками. При отсутствии блокирующего
дефекта брать следующий полезный функциональный срез. Его приёмка включает
языки, доступность, узкий экран, возврат/контекст, ошибки и тесты. Расписание
не означает гарантированную публикацию новой функции каждый час.

- **не проверено** — нет достаточного актуального доказательства; это не утверждение об отсутствии функции.
- **в работе** — часть результата подтверждена, но критерии всего направления ещё не выполнены.
- **проверено** — перечисленный объём проверен на указанной версии; не гарантия всех будущих версий.
- **блокер** — конкретное препятствие для следующего шага с указанным владельцем решения.

Ни одно направление пока не объявляется полностью завершённым. Успешный CI,
HTTP 200 и DOM-тесты не заменяют полный пользовательский сценарий, реальный
мобильный экран или проверку экранным диктором. Старые результаты ниже явно
отделены от текущей сверки метаданных.

## Актуальное состояние после исправлений — 18.10.2026

Проход05:03: guard0. Последний опубликованный kiris main — `92dc5b64477de83a1d174ecba154c03bdb29922f` после99; 35HTTPexact/311projection/276otherGitidentity относятся к этому выпуску. Следующие компоненты локальны, не push/PR/Ready/публикация; новый общий head, PR и counts ещё не определены.

Локальная текущая работа роли9: `cd8a11f191cb5b673760b8206c27b584c8f148d7` — явная привязка выбранного публичного материала к DEMO-задаче, Save/Clear и возврат к ней. Source CLEAR, авторские13/13 и независимые13/13 адресных VM/unit PASS. Native browser и CI нового среза NOTRUN.
Локальная текущая работа роли14: `4fef25ee4bfd68181bc1bca62f5ec2451550e22e` — detail GET contract по stable materialID. Source CLEAR; независимые только новые6/6 pure-mock PASS. Это не Django HTTP/браузерная приёмка; прежние collection/source границы сохранены.
Локальная текущая работа роли12: `96d2a0082f5ae57691b9e20557e3806f165e96b6` —8 собственных config/core/tests/backenddocs paths, accepted14 импортирован отдельно. Source peer CLEAR. Авторские21 новых(12HTTP+9guards)+69 прежних PASS; усиленная повторная1 входит в12, не отдельный новый тест. Независимая HTTP-runtime приёмка не проводилась; Django локальный, online/AIoff.
Локальная текущая работа роли15: `a045dfbed9e874a18d56206dfe8e1b253ed32285` —2 quality/security paths поверх exact14. Source CLEAR, авторские21stdlib/39real-contract PASS; это не новый hosted CI и не HTTP-route приёмка.

Один существующий владелец9 готовит следующий ordinary combined candidate после этих source-gates: сохранить исходные14/12/15 и root2docs blobs/authorship, затем проверить фактический union и текущие тесты/browser/обычный CI. Counts, Ready и guard нового общего head заранее не переносятся. Новый backend не deployed; роли2/13 и их точные отказы не затрагиваются.

### История прохода04:35 — snapshot 18.10.2026 04:56 UTC

В [кабинете координатора](https://oleksandrkiris.github.io/kiris-jobs/tools/coordinator/) опубликована readonly-сводка всех3 вымышленных задач: ID, текущие статусы и общий прогресс на EN/RU/UK/PL. Фильтр/поиск не сужают сводку; edit/reset/подтверждённый restore обновляют её. Явное выделение readonly-текста не копирует, не отправляет, не сохраняет файл и не создаёт новые записи. При недоступном storage видна оговорка о работе только в текущей вкладке; реального рабочего отчёта/данных работников нет.
Единственный guarded merge04:35: tested `77455024168f59d6a766992acae5a784016734fc` → main `92dc5b64477de83a1d174ecba154c03bdb29922f`, tree `d50443d1af3c2a3add3df6d95d7d6fa361ea8070`, orderedparents[0986,774550]. Pages39097972392/Backend39097972375 terminalSUCCESS attempt1; 35 выбранных HTTP-файлов exact size/SHA256/Gitblob, main до/после совпал. Full projection311: остальные276 только Gitidentity, не311HTTP. Source431/net7 сохранил4feature source/test files, новый journal и2rootdocs bdbed; backend локальный, online-adapter/AIoff.
Текущий runtime: core16, worker N/A unchanged, main19, prototypes16+8; Native6 jobs по127 TAP, browser16+8 в каждом; Backend10/87/33; early-security19. Две новые summary-проверки находятся внутри прежних16, не18. Языки/reset/storage проверены текущими VM fixtures; browser320/1280 и native selection приняты в ограниченном CI-сценарии. Это не physical-device/OS clipboard/save или полная браузерная матрица4языков.
Один guard04:35 использован; второго merge в этом проходе нет. Эти2docs после выпуска — следующий локальный неопубликованный компонент.

Локальная следующая работа роли9 (не публикация): cd8a11f: локальная привязка материала к DEMO-задаче, явные Save/Clear и возврат к задаче. Автор13/13 и независимые13/13 адресных unit PASS; source-review завершается, браузер и CI нового среза NOTRUN. Не опубликовано.
Локальная следующая работа роли14 (не публикация): Контракт material detail4fef25e source CLEAR; независимые только новые6/6 pure-mock PASS. Collection13 и источники сохранены. Роль15 подготовила отдельный локальный CI-компонентa045dfb: явное включение6 detail, фактические offline39/39 и early21/21; source-приёмка15 ещё ожидается.
Локальная следующая работа роли12 (не публикация): После exact source-приёмки14 реализация Django detail GET разрешена и выполняется. Сохранена исходная подготовка; новый HTTP-handoff и независимая приёмка ещё ожидаются. Тестовые fixtures, backend локальный, online/AIoff.

### История прохода04:08 — snapshot 18.10.2026 04:20 UTC

В [Dragon guide](https://oleksandrkiris.github.io/citronex-dragon-guide/) опубликовано копирование готовой публичной памятки: PR14 tested `a57306ac862d3986748a7164e272745ed72e3868` → main `0b03581a621c8ec55ee8e073152fc2ac5daeb144`, tree `7d7b05cb1f69ae2f9db1fd5ea522fcc6bf659ff4`. Pages39096400094 terminalSUCCESS; 8 выбранных HTTP-файлов совпали с Git по размеру/SHA256/blob; 40 source entries сохранены, остальные32 проверены только по Gitidentity. Копирование запускается явным действием; успех показывается после fulfilled Promise. Denied/unavailable/syncThrow дают честный readonly manual fallback. Устаревшие callbacks после смены языка/места, очистки или другого copy/action не меняют текущий status/focus; уже начатая OS-запись не объявляется отменённой. Принятые exact-head413unit/59browser и peer8GREEN переиспользованы без нового прогона. OS clipboard/physical-device/full12browser гарантии не заявлены. Один guard04:08 использован; второго merge в этом проходе нет.

Следующая локальная работа роли9 (не опубликована): Человекочитаемая readonly-сводка всех3 вымышленных задач и их статусов на EN/RU/UK/PL реализована в source57d470457f1fead1097e315d417385ad890e283d/base0986. Фильтр и поиск не сужают сводку; изменения, сброс и подтверждённый импорт обновляют её. Авторские6 и независимые QA6 адресных тестов PASS; exactbase без функции дал0/6. Это VM/DOM fixtures, native browser ещё не принят. Выделение текста не добавляет хранение или отправку. Published96 и его backend/материалы сохранены; общий head и обычный функциональный CI принимаются отдельно.

### Состояние kiris96 и очередь — сохранённый snapshot 18.10.2026 03:56 UTC

Последняя сверка main: `0986cc9ff47b6eae6d28814d38c17494e6b36bac`, после PR96.
В [кабинете координатора](https://oleksandrkiris.github.io/kiris-jobs/tools/coordinator/) опубликован второй подтверждённый материал `banana-warehouse-poland-summary-ru`. Поиск, чтение, last и избранное работают с обоими ID; source refs остаются per-item. Default/max20 и explicit limit1, Zgorzelec filter/schema сохранены. Это существующие публичные title/summary, не новая проверка вакансии или перевод.
Единственный guarded merge03:07: tested `10e899d351613799152cb0fbce2b42620e676d08` → main `0986cc9ff47b6eae6d28814d38c17494e6b36bac`, tree `32fe72cc38c3cf829b34491ecac7f45c4b9f0cd1`, orderedparents[2e80,10e899d351613799152cb0fbce2b42620e676d08].
Pages39095191175 и Backend39095191167 terminalSUCCESS; 34 выбранных HTTP-файла exact bytes/SHA256/Gitblob, main до/после неизменен.
Full projection310: остальные276 только по Gitidentity, не310HTTP. Django остаётся локальным; online-adapter/AIoff.
Текущие проверки CI: Catalogue: core16, worker N/A, main19, prototypes16/8; Native: 6 jobs по121 tests, browser16/8 в каждом; Backend:10/87/33; early-security19. Три material-target fixture tests входят в текущую TAP-группу30. Группы исполнения учитываются отдельно.
Авторские107=98 coordinator+9 backend-open-observation и24parity остаются историей локального прогона, не подменяют counts текущего CI. Локальные48+5 backend12 на eb95 остаются отдельным fixture proof; новые прогоны на408/rootdocs не выдумываются.
Причина issue97 — обращение test fixture к отсутствующему историческому Git object в shallow checkout; исправление сохраняет exact-source/checksum/tamper проверки. Issue97 actualclosed 2026-10-18T03:55:08Z после postBackend39095191167; это отдельный actual close action. Issue98 actualclosed 2026-10-18T03:55:10Z после того же postBackend39095191167; исправлена старая проверка одной карточки в общем browser-helper.
Один guard прохода использован. Следующий небольшой шаг — свежий guard уже READY Dragon14 в следующем проходе; сейчас дополнительного CI/merge нет.

### История PR95 и подготовки PR96 — snapshot 18.10.2026 03:10 UTC

Последняя сверка main: `2e80ab811fa3573fc13ac7dd6ee65279865cc58b`, после PR53/55/56/59/66/64/70/67/72/61/73/76/78/83/85/77/60/84/89/94/95.
Выпущено **резервное копирование и подтверждённое восстановление демо-прогресса**
в [кабинете координатора](https://oleksandrkiris.github.io/kiris-jobs/tools/coordinator/).
Экспорт содержит только статусы3 вымышленных задач. Импорт проверяет strictJSON/2048B,
показывает до/после и применяет запись один раз после явного подтверждения;
изменившиеся, повреждённые и недоступные данные не перезаписываются. OS-save и
атомарное изменение нескольких вкладок не заявлены.
Единственный guarded merge прохода02:29: tested `be90179caf98a877fc485be5c36832c74563d2b5` → main `2e80ab811fa3573fc13ac7dd6ee65279865cc58b`,
tree `9cfb6d73dd19f95b36859447ab5fe03822a15abe`, orderedparents[6faa,be901].
[Pages39091485504](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39091485504) и
[Backend39091485527](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39091485527) SUCCESS;
33 выбранных HTTP-файла совпали с Git по размеру/SHA256/blob, main до/после неизменен.
Full publication projection309: остальные276 — только Gitidentity, не309HTTP.
Общий428entry/21path union сохранил backup954daf, API92d9f и rootdocs5c.
Точный current runtime: core16+workerN/A/main19/proto16+8, Native6×(16coordinator+8calculator),
109 combined TAP в каждом native job отдельно от Catalogue86 и прежних author95.
Backend10runner/87backend/29contracts и early18 выполнены на общем head.
Локальный API capabilities и обязательная CI/schema-проверка вошли в source main;
это не публикация Django. Frontend работает самостоятельно, online-adapter/AIoff.
Следующий срез реализован локально: второй материал
`banana-warehouse-poland-summary-ru` из существующего `jobs[id=banana-warehouse-poland]`.
Его title/summary/ref/дата подтверждены точным `data/content.js`; Zgorzelec явно
присутствует в source location. Схема/filter Zgorzelec сохранены; прежний материал
site-cleaning побайтно неизменён. Неподходящий greenhouse-кандидат исключён до правок.
Canonical default/max20, explicit limit1 возвращает первый материал; max_limit
capabilities — граница запроса, а не количество материалов.
Contract14 `eb95f8bbe3c1893b2bd009e058a589e78fa41790` SOURCE_ONLY CLEAR, авторские
13materials (9 прежних+4 новых)+9capabilities+11ownership. Отдельный doc-компонент
`40852827abf3322e1b784524fc8615c020889aae` исправляет только устаревшее описание
OpenAPI «один материал»; форма/числа/данные не меняются, тесты не повторялись.
Frontend9 `4e4cb703307e5ff0361582bf70f33ee6ed614a86` SOURCE_ONLY CLEAR:
оба ID доступны для поиска/чтения/last/избранного, per-item source refs честны,
ключи/границы storage и task/backup prefix сохранены. Авторские107unit/24parity
отдельны от ещё не запущенного browser/CI. Четыре unit и четыре browser assertion
заменены для двух items/per-item ref, остальные старые assertions сохранены.
Backend12 на exact14 дал48 targeted+5 внешних fixture checks, independent receipt
CLEAR; 24 test-client ответа для8языков×limit1/2/20 и три malformed second-item
проверки отвергают весь ответ даже с DEBUG. NO_BACKEND_CHANGE; без сервера/БД/сети.
CI15 `593b0dffd27b418a60c0912c06dba86cc353c8a4` SOURCE_ONLY CLEAR: minimum
materials13, 12 отвергается/13 проходит; авторские19stdlib и33real schema(13+9+11).
Прежние strict/partial/skip/expectedFailure/jsonschema guards сохранены; issue93
остаётся закрытым после95. Это плановое усиление покрытия новой функции.
Local union904 tree6a833/430entries/net14 независимо принят по исходникам.
До одного combinedpush владелец9 добавит exact408 OpenAPI description и этот
компонент2rootdocs; новый whole-tree/head и текущий CI/runtime проверяются заново.
В проходе03:07 guarded merge ещё не выполнен; второй материал пока не опубликован.
Предыдущий выпуск94 и датированные pre95-поручения ниже сохранены как история.

Выпущено явное **избранное материалов**: Pin сохраняет requested language, Open
использует текущий snapshot/mock reader, Remove удаляет только pin. После reload
список остаётся видимым без autoopen; задачи, поиск, источник и last-pointer сохранены.
PR94 tested head `ea941579813be675c1285b8d099f942f07dc8a2c` принят единственным
guard прохода01:57 в `6faaea9e2d109bc808ff0ca4eac863c4a2d65e3d`, tree65616 и parents[8abf,EA].
Pages39088679663 и Backend39088679636 SUCCESS;32 выбранных публичных HTTP-файла
побайтно совпали с Git (размер/SHA256/blob), main до/после6faa. Ещё276 файлов
проекции сохранены по Gitidentity, это не308 HTTP-проверок. Один P2 старого694
воспроизведён двумя RED-пробами и закрыт двумя independent GREEN наEA: сохранённый язык
и вновь появившийся invalid/future raw не перезаписываются устаревшим store.
Native6 дал96 coordinator+48 calculator;12 выполнений Pin — по2 в каждом из6 наборов16,
Catalogue2 Pin также внутри16. Author-local82/16parity и literalCatalogue73
сохраняются раздельно; полного совпадения их команд/охвата не утверждаем.
Реальный материал по-прежнему один; max5 — storage bound, не новые переводы.
PR92 после ordinary integration main6faa и rootdocs1990 принят заново на
`d9f7d10f0860cb6bb7eead104c3178ceac1ef891`, tree99d28/427entries/net14.
Backend39089216166 и Catalogue39089216182 SUCCESS; независимые source/union и
runtime CLEAR:10runner/87backend/29contracts (9capabilities+9materials+11ownership),
core16+workerN/A, main19, prototypes16+8. Native не планировался; отдельные
fullPOST16/mainPOST20 — ABORTED fixtures, не доставка и не ноль попыток.
Root actualReady92 выполнен02:19:03; прежний5f12/base8abf остаётся историей.
PR95 `4dafb3499b928bd8cf3164143781f4c114ce5296` на той жеmain6faa отдельно принят
source1/runtime4, actualReady02:23:27. Добавлены backup/restore только3 вымышленных
demo statuses: strictJSON до2048 UTF-8 bytes, preview без записи, Cancel и одноразовое
подтверждение с повторной проверкой текущего storage/состояния. Авторские95unit/16parity,
literalCatalogue86unit и Native109unit — отдельные команды; native6 browser96+48,
два новых backup journeys внутри каждого прежнего набора16. OS-save не доказан.
На02:34 оба компонента не merged. Чтобы не создавать две последовательные
пересборки при изменении main, root назначил владельцу9 обычное объединение92 INTO
существующий95 с этим компонентом2rootdocs перед одним combinedpush. PR95 снова draft;
новый общий head требует своей полной source/union и CI/runtime-приёмки. Старые
Ready/counts не переносятся на него. Один guarded merge прохода02:29 ещё не выполнен.
HYDRA15 Copy route TEXT `7ae29ddfd98e2e6fa302e6d69324351b51f192bc` реализован:
CI39088860365 SUCCESS,191unit/106browser; прежние136unit/66browser сохранены.
Поздний actual runtime4 BOUNDED_RUNTIME_CLEAR получен отдельно; дополнительные
clipboard traces не заявлены. Peer сообщил source CLEAR и сохранил5primary files,
но финальная операция записи формального source-report была `Rejected: blocked by
policy` без более точной причины. Точная команда и причина сохранены; повторения
этой записи другим инструментом нет. PR15 остаётся draft; публикация не объявлена.
Бэкенд локальный, online-adapter/AI выключены. Ниже история публикации PR89.
В [кабинете координатора](https://oleksandrkiris.github.io/kiris-jobs/tools/coordinator/)
опубликован явный возврат к последнему прочитанному материалу с сохранённым
requested language. Самопроизвольного открытия после reload нет; очистка указателя
сохраняет задачи. Tested head0811 и merged tree67a0 совпали, Pages39085391777
и Backend39085391776 SUCCESS,31 активный HTTP-файл совпал с Git по размеру,
SHA256 и blob; main до/после проверки8abf. Issue87 закрыт после этой публикации.
Это выпуск автономного фронтенда; Django не развёрнут, online-adapter/AI выключены.
Отдельными проходами приняты HYDRA11/12/13/14, main `b04fc7302612affa0c2eec71ac66ebbc13912e46`.
Ранее приняты Dragon9/10/11/12; текущий Dragon main после PR13 — `f0883032674a5dc9c2034fb144c04286a5617598`.
PR53 подключил demo по `tools/coordinator/`; issue51 закрыт. PR55 сохранил
полный offline-пакет при обновлении оболочки; issue54 закрыт. Его точный head
`da054fd69b2f831de93d16842991cc38e280233a` прошёл CI; merge `fc672d8`,
[Pages39043698088](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39043698088)
успешен. Дополнительную живую проверку возврата ограничила защита браузера:
это предел доказательств, а не подтверждённый дефект. Старые задачи входа и
исправления пакета не открывать заново.

PR56 принят на head `a9ad1a43cee0e53bdb8b3dfa3f6c501462e504bb` с guard SHA,
merge `fbf5683a1c253a2eb740e998d17c58addd64673c`: 39 backend-тестов,
10 проверок CI-runner, Django check и отсутствие новых миграций.
[Backend39045592730](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39045592730)
и [Pages39045592744](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39045592744)
успешны. После публикации HTTP и bytes корневых index/SW и пяти разрешённых
runtime-файлов `tools/coordinator/` совпали с принятым main. Это не новая полная
браузерная offline-приёмка. Backend остаётся локальным: доказана повторяемость
текущей пустой схемы SQLite в памяти, не будущие миграции и не PostgreSQL.

Пользователь отдельно разрешил регулярное продолжение работы после прежней
паузы. В локальном Codex создан и прочитан обратно активный heartbeat
`primserv-15` в чате техлида. При создании интервал составлял 30 минут;
текущая прочитанная настройка — **15 минут**, ACTIVE. Она сохранена без
перезаписи. Продолжаются WIP и приёмка всех 15 направлений группами до восьми
независимых владельцев. Другие расписания
этим решением не возобновлялись. Это проверенная настройка продолжения,
не доказательство 15 непрерывных процессов или будущих успешных запусков.
Техлид проверяет реальные команды/коммиты, а не только сообщения и active.
Неизменный блокер не создаёт новый PR или уведомление каждый цикл.

Принят срез CI — [PR59](https://github.com/OleksandrKiris/kiris-jobs/pull/59),
issue58, head `77977573f3bff01abf08e9dcc45629e39b71ca09`, base `fbf5683`:
Pages deploy не отменяется новым push; четыре регрессии и оба CI успешны.
После независимого ревью выполнен guarded merge `427a8e1`;
[Backend39046140582](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39046140582)
и [Pages39046140524](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39046140524)
успешны. Корневые index/SW и пять разрешённых runtime-файлов demo снова побайтно
совпали с опубликованными. Фактические прежние отмены не установлены;
наблюдение следующего функционального PR на новой базе остаётся отдельным шагом.
В PR61 docs-only на прежнем head `9a3b653` обнаружено падение browser fixture
кабинета: denied-remove/reload получил todo вместо doing (run39046009208).
Владелец9 воспроизвёл перезапись fixture до запуска app при отсутствии session
marker; дефект пользовательского сохранения этим не подтверждён. Исправление
[PR66](https://github.com/OleksandrKiris/kiris-jobs/pull/66) принято следующим
последовательным проходом на head `604e627b2025328f2831ef8f2db738de90d20c99`,
merge `e93dc59`: независимые 29 тестов, две регрессии падают на прежней fixture,
8 browser-сценариев, просмотрены screenshot/trace. Проверки сохранены и усилены,
runtime не менялся. Post-merge Backend39046564372 и Pages39046564380 success;
семь опубликованных runtime-ресурсов снова совпали с принятым main.
Следующим проходом принят [PR64](https://github.com/OleksandrKiris/kiris-jobs/pull/64),
head `224bd7eb253e25fcbc0733ed5d297a708903b607`, merge `30fee5a`:
Windows containment использует системный разделитель пути; realpath, symlink,
cross-drive и UNC-защита сохранены. Независимые 9 адресных тестов и все
15 fixture-тестов Ubuntu прошли; Windows symlink EPERM остаётся ограничением
среды, проверка не выключена. Post-merge Backend39047515522/Pages39047515502
success; семь публичных runtime-ресурсов совпали с принятым main.

Общая причина падений PR60/67/68 — недоступный точный base:sw.js в shallow
checkout — исправлена отдельно в [PR70](https://github.com/OleksandrKiris/kiris-jobs/pull/70),
issue69, head `7cfb3b0c392243e0a3011305b3b1106f99e4c8c6`, merge `a33a8e9`.
Проверяются SHA события, родители checkout, наличие sw.js и ancestry. Допустимы
не более двух явных fetch: точный отсутствующий base и ограниченная глубина64
для доказательства ancestry; неподтверждённая связь завершает проверку ошибкой.
Это предел явных fetch-команд, не измерение всех запросов или байтов GitHub.
Независимые 9 тестов, включая 5 настоящих Git DAG, прошли; gate обновления SW
сохранён. Post-merge Backend39048252624/Pages39048252675 success; семь публичных
runtime-ресурсов побайтно совпали с main. Авторы согласуют существующие PR с
этой базой: успешный старый run не считается проверкой нового совместного head.
В новых consumer PR67/68 helper и полные проверки прошли. Base уже был доступен
после обычного merge, fetched=False; missing-base fetch здесь не выполнялся.
Этот путь отдельно доказан настоящими Git DAG в регрессиях, не живым трафиком.

Отдельно принят [PR67](https://github.com/OleksandrKiris/kiris-jobs/pull/67),
head `49f0e32b460608f7c4ea6ec44f64fff5c726a6ab`, base `a33a8e9`, merge `bf0fd23`.
Независимые 20 тестов и Backend39048514712/Catalogue39048514904 успешны.
Принят read-only контракт материалов и ручная ownership-карта; HTTP route,
автоматическое применение ownership отсутствует. На момент67 эти20 тестов
выполнялись отдельно; последующее подключение в CI принято в72 ниже.
Post-merge Backend39048649759/Pages39048649677 success; семь публичных runtime
ресурсов HTTP200 побайтно совпали с main. Это завершённая приёмка контракта,
не новая полная browser/offline-приёмка и не публикация backend.

Принят [PR72](https://github.com/OleksandrKiris/kiris-jobs/pull/72),
head `deb34683d2fb65b50376dd5b02cd8466a3ac9b36`, base `bf0fd23`, merge `a8093c9`:
20 принятых тестов выполняются в отдельной CI venv с закреплёнными зависимостями,
проверкой формата date и минимального состава9+11. Django environment не меняется.
Независимое ревью обнаружило, что expectedFailure мог засчитываться как успех;
исправление доказано одной и той же регрессией на старом и новом gate.
20 тестов и четыре регрессии runner прошли независимо; оба PR CI успешны.
Post-merge Backend39049976165/Pages39049976240 success; семь публичных runtime
ресурсов побайтно совпали с main. Это исполнение тестов, не live ownership lock.

PR61 принят на head `3f11c5890fea6777bba87b5240fae4204a051935`,
guarded merge `3c2c73fbb0172f3520df450fd1bd36b3233c6930`:
единый план и измеримые критерии сравнения с HRappka стали частью main.
Post-merge Backend39050890139/Pages39050890058 success; семь публичных
runtime-ресурсов HTTP200 побайтно совпали с main. Это принятие документации,
не доказательство превосходства продукта.

Принят [PR73](https://github.com/OleksandrKiris/kiris-jobs/pull/73),
head `98a30113f4280647bb3bae9121c6397850052e3e`, base `3c2c73f`,
guarded merge `ace6655eff143e674dc93e07a3a8709e45d5d14c`:
локальный validator читает каноническую materials-v1 schema, проверяет date
через FormatChecker и не загружает внешние references. Независимая проверка
дала 46 backend-тестов, отдельное объединение с PR62 — 61 тест и 6 интеграционных
проверок. Эти доказательства относятся к неизменным backend/schema/deps bytes;
последующие обычные merge добавляли только принятые CI и документы.
Exact-head Backend39054315640/Catalogue39054315607 success;
post-merge Backend39054980031/Pages39054979967 success, семь публичных ресурсов
HTTP200 побайтно совпали с main. PR62 ещё не принят; HTTP route и публикация
бэкенда отсутствуют. Новая полная browser/offline-приёмка здесь не заявляется.

Отдельная нестабильность main browser fixture не объявляется исправленной72:
PR61@02485d33 / run39049003896 получил v1 todo вместо doing после reload;
PR72@594b830 / run39048985559 не нашёл demo-01 после reload в board-narrow.
Сохранённый doing до reload подтверждён raw в первом trace. Init storage/marker
нового документа не измерены; свежий и старый storage в pure-VM probes дают
одинаковые сочетания статусов, соответствующие наблюдаемому сбою. Это не доказательство конкретного browser-дефекта
или повторного seed. Историческая диагностика9 — [PR75](https://github.com/OleksandrKiris/kiris-jobs/pull/75)
на basea809, headb808045: независимо подтверждено сохранение восьми controls/assertions,
добавлены отдельные измерительные сценарии, observer effect указан.
Нет sleep/retry, повторов до зелёного или заявления causal fix. Catalogue39050068735
завершился FAILURE:13/14 сценариев прошли, observed-wide-preseed упал; все8
original controls и3passive прошли. Backend39050068823 success. Независимо
прочитан artifact12107372113: новый документ увидел KEY/marker=null до fixture,
fixture не записывала и не удаляла KEY, первый app read=null, real model=todo.
Для этого случая исключены fixture overwrite и native form restoration;
причина недоступности storage и связь с прежним v1-сбоем не доказаны.
Техлид принял для реализации явную границу поддержанных origin: восемь прежних
семантических проверок сохранения/raw/reload/Back/языков/ошибок должны выполняться
на одном фиксированном CI HTTP origin с пятью exact-head файлами, без storage shim,
повторного seed, sleep или retry. Доступный HTTP reload не называется offline.
Отдельные file:// сценарии проверяют первый offline вход/UI; сохранение прогресса
для file:// условно и может пропасть без Storage exception. Реальный установленный
public/SW offline-путь остаётся обязательным у1. Это изменение явно заявленной
границы поддержки, не доказанный causal fix Chromium или прежних падений.
Локальные code/helper и карта9 прошли статическое ревью; нового remote head/CI
именно для HTTP-переноса нет, предложение осталось неприменённым.
Команда exec_command с PowerShell Set-Content для
`docs/platform/main-reload-diagnostics.md`, затем tests/syntax/git checks,
отклонена до исполнения: `CreateProcess ... rejected: blocked by policy`.
Подробная причина не предоставлена; исходный запрос, весь видимый усечённый
ответ и неприменённые patches сохранены. На этом шаге целевой документ оставался
старым, README ссылался на новую карту; разрыв блокировал передачу75. Отказ не обходился
разделением команды, другим инструментом или записью того же документа на GitHub.
Это не общий запрет независимых задач. PR75 позднее CLOSED, не merged;
его failed run остаётся историческим failure. Для75 runtime/SW не менялись,
upgrade был явно N/A. Для будущих изменений tool нужны старые
опубликованные пять tool-файлов → совместный новый head, реальные прерывания
каждого из пяти ресурсов, last-good recovery и статус tool после reconnect.
Существующая overlay только root-shell и VM Cache.put-проверки этого не доказывают.

В отдельном пользовательском чате исправления GitHub подготовлен и объединён
[PR76](https://github.com/OleksandrKiris/kiris-jobs/pull/76),
head `2ffee86e2556399b8b3d09bcefa2f3703237fd3c`, merge `54b597f`.
Это не второй merge координатора: в его проходе единственным был73.
Для file:// язык/фильтр переносятся во fragment, path/query сохраняются;
HTTP/HTTPS поведение прежнее. На profile-only head277607f run39055093303
упал15/16, тогда как новый exact-head run39055353570 дал16/16:
14 прежних controls и два закрытия/перезапуска настоящего Chromium-профиля
без seed/replay. Независимо прочитаны artifacts, traces и два screenshot;
38 unit-тестов и оба CI success. Подтверждён наблюдаемый normal-profile сценарий,
не внутренний механизм Chromium, все старые v1 failures или другие браузеры.
Документ76 содержит прежнюю диагностику/native-profile follow-up, семантически
отличается от отклонённого HTTP rewrite75; совпадение пути не означает его применение.
Post-merge Backend39055542656/Pages39055542734 success; семь публичных HTTP200
ресурсов побайтно совпали с54b597, включая app.js SHA256
`b0e6c859dabbe5f02a3776c15027f2539ef538909cfb0c35078bd05b614f0e0b`.
Обновление старого опубликованного tool-пакета до нового и per-resource recovery
этим не доказано. Владелец1 добавляет этот gate в существующий60 даже при прежнем
worker; обязательный SW bump из изменения app.js не следует.
Владелец9 возобновляет тот же68 на новой базе после сохранения прежнего a418;
новый competing PR или HTTP rewrite75 не требуется.

Принят [HYDRA PR11](https://github.com/OleksandrKiris/citronex-hydra-project/pull/11)
на head `beb192c684dea9a770b8d8c9c29c69cad767af02`, base `02a1bfd`,
guarded merge `0aaa156939e35d52506629d509abb3e5271d27e9`.
Опубликованы ka/tr/hy интерфейс выбора площадки и общая текстовая вводная,
явный EN training handoff/нет озвучки и доступный keyboard focus/trap/return.
87 unit/negative тестов, 30 адресных viewport/fault/keyboard случаев,
10 прежних сценариев и worker upgrade прошли; всего41 запись.
Независимо просмотрены три guide-320 PNG, прямой/обратный цикл14 Tab stops,
полная видимость guide и clipping/hit-test. CI39049963079 и
Pages39057041456 success; merge/tested tree побайтно одинаковы.
Публичные index.html/sw.js/manifest.webmanifest HTTP200 совпали с tested head.
Это три runtime-файла, не новый аудит всех brand/audio assets; внешний training
и озвучка не исполнялись. Все процедуры, носители языка и физический телефон
не объявлены проверенными. Следующий срез2 — возврат к последней выбранной
площадке по публичному ID с очисткой выбора и текущим языком, без данных человека.

Этот срез принят в [HYDRA PR12](https://github.com/OleksandrKiris/citronex-hydra-project/pull/12):
head `b8e5c00a0c0fa76d3dfabd6c8f0fb20f2d45b724`, base `0aaa1569`,
guarded merge `b820e85fe44cbc0c36a0d86ecdcc1e95f131431b`.
Сохраняется только публичный ID, ссылка строится из действующего allowlist
с текущим языком/fallback; неизвестные/повреждённые значения не создают маршрутов.
Очистка возвращает фокус; отказ storage означает только память до reload.
95 unit-тестов и CI39058694900 success; report passed содержит54 записи,
прежние offline/upgrade assertions сохранены. Независимо проверены120 измерений
читаемости (10 cases ×12 языков) и просмотрены1280/320 PNG.
P2 узкой44px колонки устранён. Промежуточный1ef5 с пропущенным base_tree_sha
удалил26 файлов и был отклонён; исправляющийb8e5 восстановил все26 прежних blob SHA,
net diff без удалений, workflow/manifest/assets/tests сохранены.
Pages39059220706 success; merge/tested tree одинаковы. Публичные HTML117274B,
SW3193B и manifest593B HTTP200 совпали с tested bytes. Это три runtime-файла,
не повторная проверка audio/внешнего обучения. Следующий срез2 — копирование
публичной ссылки на площадку/язык с доступным fallback при отказе clipboard.

Принят [Dragon PR9](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/9):
head `810125c0a5aeca8f945d041fa281b5e45c18e5d4`, base `79fdd78c`,
guarded merge `3a7ea5e0b70abece336f41c00c31cf510928aaeb`.
Явный Turkish-запрос получает EN и понятное пояснение; automatic fallback
сохраняет requested tr/ka/hy в URL после reload/Back. Ручной EN/UA обновляет
запрос и скрывает fallback notice. При автоматическом fallback контент и handoff
используют effective EN; ручной выбор задаёт выбранный язык.
CI39060007333 success:144 unit и9 browser groups, включая четыре TR-case
(1280/320 × saved PL/corrupt storage), keyboard, reload/Back и прежние controls.
Независимо просмотрены пять current PNG и trace; пять URL-regressions дали
de7980/5 →8984/5 →8105/5, без ослабления требований.
Исправлена проверка обновления: подтверждены changed/activated HEAD controller,
HEAD cache без BASE cache, остановленный origin/offline HEAD notice и точный
JS SHA256 `2770c8c0071e8648faf71204da8976ec6ff39c3c954e63942e4c1a528c0466e2`.
Старый false-green31270 и red de798 сохранены; issue81 закрыта после приёмки.
Pages39061616083 success; merge/tested tree совпали. Публичные HTML10243B,
JS79991B, CSS19323B, SW1659B и manifest323B HTTP200 exact-tested bytes.
Это пять runtime-файлов;11 прежних binary blobs сохранены, нового полного
аудита audio, OS voices или физического телефона не было.

Принят [PR78](https://github.com/OleksandrKiris/kiris-jobs/pull/78):
head `611089b76032878b02051893f0c42e651e68ceb9`, base `54b597fc`,
guarded merge `f89e0e4a3bf0a58714de0883970e6569c78e318d`.
Только roadmap/inventory; остальные tracked bytes сохранены. Независимое
финальное ревью clear, exact Backend39062359825/Catalogue39062359944 success,
16/16 module scenarios и оба native restarts прошли. Это зелёный docs-only run,
не исправление непостоянного issue79. Post Backend39063588523/Pages39063588437
success; tested/merged tree совпали. Семь public runtime assets HTTP200
побайтно совпали с tested head; упаковка переносит пять исходников из
`coordinator-demo/` в `tools/coordinator/`. Django этим merge не опубликован.

Аудит 15 направлений завершил приёмку [HYDRA13](https://github.com/OleksandrKiris/citronex-hydra-project/pull/13):
guardcbb35d46/baseb820 → merge533360d7, tested/merged tree594df011 совпал.
Независимые99unit/66browser entries/6current PNG относятся к этому head.
Pages39067949384 success; HTML/SW/manifest HTTP200 exact-tested bytes.
Публичная ссылка на площадку/effective язык копируется явным действием;
при отказе API доступен выделяемый readonly URL. Реальный OS clipboard не проверен.
Для внешнего PR83/main558 также завершён post-check: Backend39065923209,
Pages39065923321 success, семь public runtime bytes совпали с tested d4db033a.

Новый gate1 в PR60@40edbe38 доказал18 прежних+10 warm browser случаев:
каждый из пяти ресурсов ×1280/320, реальные socket cuts, старые5 hashes/одна
generation/progress, восстановление нового пакета и offline после stop origin.
Это конкретный переход ace6655 → bytes76/60, ещё не будущий68.
Первый cold partial HTML упал, следующие четыре cold и module-gate тогда не run.
Отдельная [issue80](https://github.com/OleksandrKiris/kiris-jobs/issues/80):
неполный body ошибочно ловился как отказ Cache.put и давал unreadable200 вместо503.
В PR60@3876a64a подготовлено полное чтение пяти bodies до storage-fallback try.
Независимо с одним testfile: новый SW24/24 PASS, старый40ed19PASS/5coldFAIL;
пять warm regressions проходят на обоих. Node23.5 — отдельная локальная VM-проверка.
На exact3876 Catalogue39057420518 каталоговый этап33/33 PASS (18+10warm+5cold,
503 и восстановление), но весь run FAILURE в последующем coordinator file-gate79;
Backend39057420520 success. Fix80 подготовлен, не merged/не опубликован.
Issue79 и80 имеют разных владельцев реализации9/1, причины не смешиваются.

Пользователь повторно прямо разрешил техлиду самостоятельные проверки, ревью
и merge. Обычная приёмка в согласованной области не требует повторного вопроса;
сохраняются независимое ревью, свежие main/head/CI и guard точного SHA.
Реестр семи репозиториев: [github-inventory.md](github-inventory.md).

Ниже сохранены доказательства предыдущих выпусков на их исходных версиях.
Проверенные изменения сайтов доведены до публикации; локальные модули приняты
отдельно и не подключены к production. Статусы ниже заменяют прежнюю очередь
ожидания PR34/42/44/45/48/49/50 и готовых учебных сайтов. База этой сверки —
`9a5900389566673327de87ffef891f28059b3e98`. Настройки расписаний и состояние
включения заданий этой документационной правкой не меняются и не подтверждаются.
Перед новым действием читать свежие main, состояние PR и CI: закрытый/merged PR
не является WIP, а исторический блокер ниже не является новым запретом.

| Проект / изменение | Принятый commit | Публикация |
| --- | --- | --- |
| Каталог, [PR45](https://github.com/OleksandrKiris/kiris-jobs/pull/45): внутренние пути исключены из Pages | `0527381d7e3fb943dabc5e8089c799448417b462` | [39035218899 success](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39035218899) |
| HYDRA, [PR10](https://github.com/OleksandrKiris/citronex-hydra-project/pull/10): History API и язык после Back | `02a1bfdb08b1ccf72e49113f57ca144ab14cd328` | [39035254461 success](https://github.com/OleksandrKiris/citronex-hydra-project/actions/runs/39035254461) |
| Приезд, [PR7](https://github.com/OleksandrKiris/przyjazd-do-pracy/pull/7): видимый список вещей и сохранение отметок | `fe33e4c8f74990d6b90de90cd6dec6bf67799024` | [39035276392 success](https://github.com/OleksandrKiris/przyjazd-do-pracy/actions/runs/39035276392) |
| Zgorzelec / Bogatynia, [PR13](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie/pull/13): фильтр локации и поиск словаря | `adadca034f3c0724564922209e05f91444a825fe` | [39035291375 success](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie/actions/runs/39035291375) |

Двенадцать публичных HTML/JS/CSS/SW-файлов побайтно совпали с этими commits.
Живой Chrome: каталог — поиск Siechnice, карточка, фото, Escape, Back и reload
с сохранением запроса; HYDRA — UA→EN/reload и согласованные ссылки; приезд —
отметка зарядки/reload, затем возврат тестовой отметки в исходное состояние;
обучение — Zgorzelec скрывает тепличные разделы, словарь сохраняет reader
при RU→EN и reload. Старый credential_observation_restricted не повторился.
Это проверка настольного браузера, не физического телефона. Активный
CacheStorage клиента отдельно не читался; offline и обновление предыдущих
worker подтверждены точными CI-доказательствами в соответствующих PR.
Никаких заявок, звонков или внешних сообщений.

[PR50](https://github.com/OleksandrKiris/kiris-jobs/pull/50) включил отдельный
Python CI: merge `bcc732c4476f7bc24e0c5b30de5358f8092e630a`,
[Backend39036220135](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39036220135)
и [Pages39036220150](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39036220150)
success. Отсутствующий backend явно not-applicable; существующие пустые,
неимпортируемые и падающие тесты дают failed. Django использует только
config.settings.test и SQLite в памяти; check и проверка миграций обязательны.
Сохранены каталоговый/browser CI и защита упаковки PR38/45.

- PR44 принят как изолированная доменная библиотека, merge
  `5b402c630ffd5032bdecfe146447675401fcc913`; проверенный head `9ab6f7a55ece9fc0ada0d3934705e86ae5e07557`;
  [Python39036292633](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39036292633)
  выполнил все 18 доменных тестов. Это локальная библиотека, не опубликованный API.
- [PR48](https://github.com/OleksandrKiris/kiris-jobs/pull/48) принят как локальное
  ядро Django: head `b788ec3c81157316555b08885d58f598261aaa6d`, base
  `f8ec367b0211c2168f7b6fc51c4add9f5107ac85`, merge
  `b7ae5d2968adb4b0e0a317b2b64e9d107b49f75a`.
  [Backend39040047293](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39040047293)
  и [Catalogue39040047303](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39040047303)
  success; независимо повторены 37 тестов ядра/домена, Django check и проверка
  миграций. CI также выполняет 10 регрессий своего Python-gate.
  Ограничения 16 384 байта и 120 запросов за 60 секунд, негативные API-тесты
  и журналы без тела запроса/персональных полей реализованы. Квота общая для
  процесса, не production-защита пользователя или распределённой системы.
  Post-merge [Backend39040216113](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39040216113)
  и [Pages39040216128](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39040216128)
  success. Backend исключён из Pages; онлайн API и связь с frontend не включены.
- [PR34](https://github.com/OleksandrKiris/kiris-jobs/pull/34) принят как локальное
  demo: head `f0283be66aea438ced8633db0ac5e01c944e3fcb`, base
  `1687e37ca4aa4454f2c4b4e1c48d23ca2c459894`, merge
  `f8ec367b0211c2168f7b6fc51c4add9f5107ac85`.
  25 модульных тестов и 8 browser/offline сценариев в
  [CI39036908583](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39036908583),
  просмотрены JSON и скриншоты артефакта12102980337. Chromium, 1280/320:
  четыре языка/fallback, клавиатура, статусы/фильтр, reload/Back, reset,
  отсутствие сети и повреждённое/запрещённое хранилище. Это эмуляция узкого
  окна, не физический телефон. [Pages39039442029](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39039442029)
  success; публичные активы каталога сверены. Пять runtime-файлов кабинета,
  32 770 байт, на момент PR34 оставались локальными. Отдельный вход из
  [issue51](https://github.com/OleksandrKiris/kiris-jobs/issues/51) уже опубликован PR53;
  текущий статус выше заменяет прежнее ожидание этой передачи.
- [PR49](https://github.com/OleksandrKiris/kiris-jobs/pull/49) объединён:
  head `72259ddcbc113b447a9adbad42dc7304d0281200`, base
  `b7ae5d2968adb4b0e0a317b2b64e9d107b49f75a`, merge
  `9a5900389566673327de87ffef891f28059b3e98`.
  [Catalogue39040280718](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39040280718)
  и [Backend39040280701](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39040280701)
  success. Приёмка в PR фиксирует 20 тестов калькулятора и браузерную матрицу
  семи языков, offline/reload/Back, клавиатуры и отказов хранилища.
  ka/tr/hy подключены к целому сценарию калькулятора; прежнее ограничение
  «только fallback» снято для этого модуля. Исправлен повторный засев
  повреждённой записи тестовой fixture при reload file://.
  Калькулятор остаётся локальным и исключён из Pages; это не перевод всех
  компонентов и не проверка носителем языка. Общая [очередь41](https://github.com/OleksandrKiris/kiris-jobs/issues/41)
  остаётся открытой. Post-merge [Backend39040524233](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39040524233)
  и [Pages39040524234](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39040524234)
  success; публикация портала не включает локальный калькулятор.
- PR38/39, Dragon PR8, Ryczywół PR15 и Siechnice PR17 уже merged; не открывать
  их заново и не переносить старые preview-блокеры на новые версии.

## Историческая подтверждённая база веб-проектов

Повторная сверка 17.10.2026 около 00:17 Europe/Warsaw: заново прочитаны main,
открытые PR/issues и последние Actions всех семи репозиториев. PR30 объединён;
каталог теперь на `cb10d69d64936393239bd3ef65944b552ee76345`. Остальные main
остались указанными ниже. Перечисленные Pages имеют completed/success.
Пять подготовленных функциональных PR перечислены в очереди ниже; все draft.
Числа тестов ниже — доказательства соответствующих выпусков, не заявление
о повторном локальном запуске семи наборов в рамках создания журнала.

| Проект | Проверенный main | Выпуск и тесты | Успешная публикация |
| --- | --- | --- | --- |
| Каталог | `cb10d69d64936393239bd3ef65944b552ee76345` | [PR30](https://github.com/OleksandrKiris/kiris-jobs/pull/30), документация поверх PR29, v220, 136 тестов и валидаторы | [Pages 38968648359](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/38968648359) |
| HYDRA | `e3524efc5b9586a53790707381d671786149e3f0` | [PR9](https://github.com/OleksandrKiris/citronex-hydra-project/pull/9), 62 теста | [Pages 38895805598](https://github.com/OleksandrKiris/citronex-hydra-project/actions/runs/38895805598) |
| Приезд | `dfac43ca1f5d9f79eefecf5201896eca7ca9c0e8` | [PR5](https://github.com/OleksandrKiris/przyjazd-do-pracy/pull/5), v54-housing-contact, 145 тестов | [Pages 38920406346](https://github.com/OleksandrKiris/przyjazd-do-pracy/actions/runs/38920406346) |
| Голосовой гид | `3cea7654917c19a076bf1fe97bb75f3cdb3f9f7d` | [PR7](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/7), 118 тестов | [Pages 38893066247](https://github.com/OleksandrKiris/citronex-dragon-guide/actions/runs/38893066247) |
| Siechnice | `31ce4ab72866659bea7b0adbdf6efa0cc8e5b31e` | [PR15](https://github.com/OleksandrKiris/citronex-siechnice-szkolenie/pull/15), 162 теста | [Pages 38917364313](https://github.com/OleksandrKiris/citronex-siechnice-szkolenie/actions/runs/38917364313) |
| Ryczywół | `1ec6c4368fdea340e0b5e7b9b6516b4d0cf360b5` | [PR13](https://github.com/OleksandrKiris/citronex-ryczywol-szkolenie/pull/13), 151 тест | [Pages 38919755511](https://github.com/OleksandrKiris/citronex-ryczywol-szkolenie/actions/runs/38919755511) |
| Zgorzelec / Bogatynia | `639bd798687b8a0b7045f92369717293e47edd27` | [PR11](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie/pull/11), 152 теста | [Pages 38918941765](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie/actions/runs/38918941765) |

Бот: 17.10.2026 безопасные метаданные Neon заново подтвердили current/active
deployment **37, completed**, создан 16.10.2026 03:50:39 UTC, runtime nodejs24.
Публичный `/app` открылся в облачном Chrome и показал 14 вакансий. Это не полная
приёмка: `/health` недоступен инструменту чтения, архив и соответствие исходников
активному deployment не сверены. Ошибка инструмента не объявляется сбоем бота.
Перед изменением бота отдельно сверять актуальный авторизованный архив,
безопасные метаданные действующей функции и разрешённые health/app-проверки.
Приватные идентификаторы архива, проекта и ветки не публикуются в этом журнале.
Историческая версия 2.17.6 / deployment37 / 459 тестов не разрешает публиковать
старый архив поверх более новой версии.

## Состояние десяти направлений

| № / направление | Статус | Фактический результат и доказательство | Ограничение | Следующий конкретный шаг |
| --- | --- | --- | --- | --- |
| 1. Ошибки и надёжность | в работе | PR42/45 опубликованы; маршрут каталога проверен. PR50 подключил Python CI, серверные ветки прошли собственные тесты. | Полный клиентский cache-postcheck, бот и незавершённые функции не объявлены принятыми. | Продолжать существующие draft по конкретным критериям ниже; не повторять исправленные блокеры упаковки и отсутствия Python CI. |
| 2. Единый интерфейс PrimServ | в работе | Официальные активы сохранены; каталог PR28: h1 и skip-link; PR29: локализованное имя footer navigation на 11 языках. | Единый визуальный аудит всех инструментов на узком экране не завершён. | Проверить шапку, навигацию, фокус и контакты HYDRA → локация в разрешённом браузере; фиксировать фактический размер экрана и границы проверки. |
| 3. Правильные переводы | в работе | HYDRA PR11 опубликовал ka/tr/hy hub/intro с явным EN handoff; `uk → ua` сохранён. Каталог PR29 проверяет доступную подпись подвала во всех 11 локалях. | Это не полный перевод процедур и не лингвистическая сертификация. | Продолжать пользовательский маршрут по подтверждённым материалам; новый срез2 сохраняет выбранную площадку и корректный язык/fallback, без новых неподтверждённых условий. |
| 4. Вакансия → анкета → контакт | в работе | Каталог PR28: настольный сценарий PL→UK, поиск/фильтр, вакансия, фото 1→2→закрыть, возврат и пустой результат; существующая HRappka открывается. PR27 сохраняет прямое открытие анкеты при lazy load. 14 вакансий/54 фото проверяются валидаторами. | У HRappka наблюдалось предупреждение лимита reCAPTCHA; отправка не проверялась и запрещена в этой работе. | Проверить текущие ссылки/возвраты без отправки; владелец HRappka отдельно проверяет CAPTCHA и реальную доставку в разрешённом им процессе. |
| 5. Помощник по приезду | в работе | PR7 опубликован: видимый список вещей, сохранение отметок и безопасный static cache; 176 тестов, CI offline/upgrade и живой reload. | Проверка функции не подтверждает актуальность всех адресов и условий. | Следующий функциональный срез выбирать по подтверждённому backlog; материалы и контакты сверять с утверждёнными источниками. |
| 6. Обучение сотрудника | в работе | Bogatynia/Zgorzelec PR13 опубликован: разделение локаций, сохранение поиска словаря; 203 теста, CI offline/upgrade, живые RU→EN/reload. Прежние принятые учебные изменения сохранены. | Все аудио, переводы и полный учебный путь всех локаций не перепроверены. | Продолжать существующие учебные задачи по локациям, сохраняя разделение Bogatynia и Zgorzelec. |
| 7. Рабочее место координатора | в работе | PR34 принят; PR53 опубликовал отдельное demo, PR55 исправил сохранение offline-пакета. Точные версии и предел живой проверки выше. | Только вымышленные задачи; это не кабинет реальных работников. Контракт материалов принят в PR67; потребители ещё не приняты. | Владелец9 продолжает подтверждённый материал со snapshot/mock parity; 13/12 — отдельная локальная реализация. issue51/54 закрыты, их работу не повторять. |
| 8. Единая база знаний | не проверено | Есть журналы выпусков и источники отдельных исправлений (ссылки выше), но это ещё не реестр утверждённых материалов. | Нельзя считать старую память подтверждением содержания или даты. | Инвентаризировать существующие материалы, затем добавить реестр: источник, локация, язык, версия/дата подтверждения, противоречия. Не копировать персональные данные. |
| 9. Основа для других компаний | в работе | Приняты локальные core48/56 и canonical validator73; отдельная fixture-интеграция с domain62 проверена. | SQLite в памяти, публичный snapshot и синтетические domain-тесты не доказывают production multi-tenancy, права или реальные миграции. | Согласовать62 с принятым73, затем проверить транспортную границу ответа и локальный маршрут отдельно; изоляцию компаний доказывать отрицательными fixture-тестами. Реальные компании и данные не подключать. |
| 10. Подготовка к ИИ | не проверено | Внешний ИИ в рамках плана не включается; будущие ответы должны ссылаться на источники или честно сообщать об отсутствии подтверждённых данных. | Нет разрешения на LLM/API, расходы, кадровые решения, самостоятельные сообщения или изменение условий. | После реестра знаний подготовить схему подключения, набор вопросов/эталонных ответов со ссылками и локальные mock/contract tests; никакого внешнего вызова. |

## Риски и границы готовности

### Текущая очередь после публикаций

Готовые PR45, HYDRA10, приезд7 и Bogatynia13 уже объединены и опубликованы;
не держать их в очереди выпуска. Python CI из #47 уже подключён PR50.
PR44/48 приняты как локальные backend-модули, PR34 — локальное demo, PR49 —
локализация калькулятора. Они закрыты и не остаются незавершёнными PR.
При сверке main `54b597fcc5d50180adcf50d4d40dc9d81d83cc4d` PR59/66/64/70/67/72/61/73/76 merged;
остаются PR60 каталога, PR62 локального домена, PR74 матрицы14,
PR77 сериализации12. Документация PR78 принята отдельным guarded mergef89e0e4,
post-check выше. PR75 закрыт, не merged.
PR68 просмотра материалов9 возобновлён в том же PR, draft, не merged:
первый head после возобновленияc7a06df6/base54b597; новый P3 cleanup профиля в работе.
Прежний a418 сохранён, продолжение совмещает материалы с file-логикой76 и gate1.
Контракт14 PR67 закрыт после отдельной приёмки.
Перед действием перечитать их head/CI и проверить совместный результат с новым main.
Функциональные изменения не принимать по старой зелёной версии после нового push.
HYDRA PR11/12/13 приняты и опубликованы, guard/post-check выше. Завершённый
WIP2 — [HYDRA PR13](https://github.com/OleksandrKiris/citronex-hydra-project/pull/13),
headcbb35d46/baseb820: передача публичной ссылки на выбранную площадку/язык, без персональных
данных и автоматических отправок, с ручным выделяемым URL при отказе clipboard.
CI39060090874 success; независимая проверка exact-head завершена:
99 unit,66 entries (54 прежних+12 clipboard), шесть current PNG просмотрены,
scope/tree/hashes сохранены. Clipboard outcomes смоделированы; реальный OS clipboard
не проверен. PR13 merged533360d7/Pages39067949384/три live bytes подтверждены.
Предыдущий дефект layout и случайные удаления исправлены до приёмки12;
исторические9e2c/1ef5 proof сохранены отдельно, не названы принятыми head.
Существующий WIP4 завершён [Dragon PR9](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/9),
guard/post-check выше. Следующий единственный WIP4 — [Dragon PR10](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/10),
head6cb0c3dd/base3a7: копирование публичной guide-ссылки с requested языком,
allowlisted context/существующим anchor и ручным fallback, без произвольных
query/hash/прогресса/отправок. CI39062064278 success; независимая приёмка clear:
153 unit/17 browser (9 прежних+8 clipboard fixtures), шесть current PNG просмотрены,
семь net paths без удалений/11 binary blobs сохранены. Actual changed/activated
HEAD/offline exact JS подтверждены. OS clipboard не проверен; late rejection
проверен unit/static, browser pending cases покрывают late resolve. Frozen/draft,
не merged/не опубликован; следующий guard отдельно.
Прежний head810125c0/base79fdd78 принят; бинарные активы сохранены.
Старый green31270 не доказал HEAD-upgrade: helper ждал BASE-cache; это
[issue81](https://github.com/OleksandrKiris/kiris-jobs/issues/81), owner4.
Новый browser gate на de798 выявил потерю requestedtr после reload; automatic
fallback и ручной выбор языка разделены; независимые final browser/offline
доказательства прочитаны, CI39060007333 success. Issue81 CLOSED, не исправление79.
Передача владельца1 / issue51 завершена PR53, offline-пакет принят PR55.
Следующая интеграция — один источник подтверждённого материала, общий read-only
контракт14, совместимые snapshot/mock9 и локальный домен13/маршрут12.
PR67 проверен отдельно: 20 собственных тестов, включая реальный JSON Schema
validator с FormatChecker и Git-регрессии ownership. Политика проверяет
изменённые пути: rename — оба пути, copy — записываемый destination; чтение
неизменённого public source не объявляется записью. Совместный CI на basea33 прошёл.
Эти20 тестов подключены в CI принятым72. Карта/checker по-прежнему требует
доверенной базы и назначения владельца для live preflight;
произвольная метка PR не является полномочием.

PR62: независимо прошли 33 domain-теста, snapshot совпадает с67. Это внутренняя
библиотека: validator spy не доказывает совместимость полного JSON Schema.
Принятый PR73 добавляет настоящий canonical validator/FormatChecker и offline
registry. Независимо прошли 46 backend-тестов; совместный exact73+domain62@177872e3
прошёл 61 тест и 6 интеграционных проверок, включая 16 сочетаний языка и лимита.
Это доказательство в отдельном checkout, не принятие PR62. Финальный head73
`98a30113f4280647bb3bae9121c6397850052e3e` включает base3c2; backend/deps/schema
побайтно прежние относительно independently tested implementation. Независимое
ревью дельты без замечаний; exact-head и post-merge CI перечислены выше.
13 согласует существующий62 с принятым73 и закрепит actual-schema integration
в своих тестах вместо одного spy. Новая попытка в durable-чате13 завершилась
`Selected model is at capacity`; до этого `/bin/bash -lc 'git status --short;
git fetch origin main'` в `/workspace/scratch/121eff2d5d00/role13` получила
`Network access to "https://github.com:443" was blocked by policy.`
Новой интеграции/CI нет; точные аргументы/ответ сохранены в реестре исполнения.
Владелец подтвердил: доступного механизма разрешения нет, sandbox_approval отключён.
Условие синхронизации — явное разрешение сети штатным механизмом того окружения;
отказ не обходится другим инструментом/средой/сборкой дерева из API.
Это не запрет независимых core-срезов.
Следующий отдельный срез12 подготовлен в [PR77](https://github.com/OleksandrKiris/kiris-jobs/pull/77),
headd834881f/baseace6655: core helper strict JSON → UTF-8 bytes с принятым лимитом
32768 байт. 54 backend-теста и Backend39055318327/Catalogue39055318340 success;
независимо повторены8 регрессий и pip check. Проверены точная граница32768/32769,
multibyte, NaN/Infinity, surrogate, nonstring keys, циклы, ошибки schema/date,
фиксированный отказ без payload/partial output и неизменность входа.
PR77 не merged; новые main/head требуют свежей сверки перед приёмкой.
Это не второй validator и не ограничение пиковых memory/CPU.
На следующем head77 `7406378500892cf41a0400ce4da32b9958c42b71` после обычного
merge54b597 все три serializer-файла/backend/schema/deps побайтно прежние;
независимая дельта без замечаний. Backend39056290992 SUCCESS, но
Catalogue39056291062 FAILURE в общем coordinator reload (`#demo-01`/todo!=doing).
Это не доказанный дефект serializer; PR77 не готов к guarded merge.
Роли9/15 разбирают exact-head доказательства, без rerun до зелёного.
Domain/core/contract владельцы раздельны, новых зависимостей или настроек не нужно.
Только12 после соответствующей приёмки регистрирует локальный URL;
production API, deployment и доказанная многокомпанейная авторизация отсутствуют.
Для последующей переносимости проверена существующая граница
[primserv-helpdesk@3e17f1ce](https://github.com/OleksandrKiris/primserv-helpdesk/blob/3e17f1cebda946cf77385c60a2931d97d2fb8677/ui/management/commands/import_company.py):
`export_company` → `import_company` preview → apply, девять публичных полей,
строгий envelope/32KiB, full_clean перед atomic apply и singleton pk=1.
После двух документов прочитаны пять pinned исходников и три вспомогательных
файла, включая requirements/validators. Written roundtrip/rollback тесты не запускались.
Это отдельная компания на установку. Замена singleton не является A/B tenant
изоляцией; один nonstaff GET→302 не доказывает POST/staff/object права.
Frontend этим серверным интерфейсом не обладает; production isolation не проверена.
На source pin с Django5.2.18 проведена отдельная локальная fixture: один valid
Unicode+emoji roundtrip и четыре ASCII-escaped surrogate input (name/phone × high/low).
Старый preview принимает их, apply выдаёт UnicodeEncodeError; baseline во всех
случаях сохранён. Это воспроизведённый local correctness gap, не production corruption.
Подготовлен PROPOSED/NOT APPLIED patch: пять строк UTF-8 scalar check перед ORM
и предложенный26-line test. На отдельной candidate copy все8 preview/apply вызовов
дали generic CommandError, SQL=0, baseline unchanged; обычный Unicode/emoji прошёл.
Python3.12.14/Django5.2.18/SQLite3.53.1, только :memory: и одна CompanyProfile table.
Независимое source/raw-proof review clear;8 исходников и старый repro сохранены.
Дополнительно исполнен actual CompanyTransferTests на трёх private copies:
старые10 методов 10/10 PASS; та же новая регрессия на старом importer даёт
четыре preview FAIL и четыре apply UnicodeEncodeError, exit1; candidate11/11 PASS.
Оригинальные8 файлов, proposed2 и старый repro побайтно сохранены. Только
одна memory table, строк после TestCase0. Полный project suite не исполнялся;
socket=0 относится к guarded phase после django.setup. Исходный репозиторий не изменён,
патч не принят в семь репозиториев и не означает внедрение всех10 приложений.
Перед reuse нужна передача владельцу, проверка в исходном проекте и отдельная
совместимость с core6.1.2; реальные компании/импорт/tenant права не подключать.

Исторический снимок PR68 **CLOSED/PARKED, не merged** — head `a41851cf8477584e5aeeff47b518e3577f7968df`.
Ветка, проверенный bundle, patch, manifest и PR metadata сохранены9; после закрытия75
владелец9 REOPENED тот же68 наc7a06df6/base54b597, согласуя с76 и cache-gate1.
Сообщены46 local/16 accepted-parity PASS и прежние14 controls+2 restart с material
assertions; независимая приёмка нового head ещё впереди. Дополнительный адресный
P3 setup-cleanup профиля исправляется в том же WIP, без второго PR.
После конкретного P3-fix head68 `13dbd5c8b2767ce91213af2c4352a9c84341f18a`
имеет47 local+16 parity PASS по автору, Backend39056223256 SUCCESS,
но Catalogue39056223259 FAILURE15/16: board-wide теряет demo-01 после reload.
Оба native restart прошли. В post-failure capture rawKEY=null, marker=yes,
path/query неизменны; preseed/initialraw не измерены, причина не установлена.
Прежний c7 run39056120814 был green с теми же runtime bytes. Этот новый failure
сохранён, не маскируется прежним успехом76 или повторами. Public gate1 также открыт.
Новый измерительный head68 `1895b5957426272dad310ab30be314cf488ddab3` сохранил
runtime и16 assertions:51 local+16 parity PASS по автору, Backend39057614115 success,
Catalogue39057614010 FAILURE14/16 (v1 control/observed-v1), оба native restart PASS.
Все12 read-only CDP samples/шесть пар доступны: сообщённые target/context/storageKey
до/после совпадают (`file:///`). В observed-v1 до reload raw/model=doing,
после — initial raw/marker=null, затем fixture записала todo. Одинаковая видимая
CDP identity не доказывает одинаковое внутреннее backing store или причину потери.
Observer effect указан. Ограниченный разбор WHATWG/Chromium141/Playwright1.56.1
не нашёл подтверждённого upstream fix; успешный setItem не объявлен disk acknowledgement.
Причина issue79 остаётся открытой, повторных CI без полезного изменения нет.
Последующий разбор headless topology нашёл source-supported backend UMA
`LocalStorage.DatabaseOpen`; pinned Chromium tag совпал с сообщённым CDP revision,
но отсутствие Playwright patches этим не доказано. После отдельного прямого
разрешения пользователя исполнен один полезный diagnostic CI на том же68,
head `704961af5b9bc9176b3cfa176bdc54c284aa6008`, base54b597, checkout0a0210de.
Backend39063668373 success, Catalogue39063668245 FAILURE15/16: observed-v1-preseed
todo!=doing; оба native restart PASS. Все12 literal histogram snapshots доступны:
count1/sum0/один OK bucket; шесть cumulative pairs дают нулевую дельту.
Это доказывает доступность данного open-signal, не KEY commit/load или отсутствие
backend failure. До reload raw/modeldoing, после initial raw/marker=null до fixture.
Остаток упавшего scenario после первого assertion не исполнялся; later cases сохранены.
Независимый review обнаружил parser P2: synthetic duplicate buckets/impossible sum
могли получить observed. Actual12 samples coherent; их результат не переобозначен.
Подготовлен малый local correction и отрицательные регрессии, отдельно на ревью.

Внешний пользовательский [PR82](https://github.com/OleksandrKiris/kiris-jobs/pull/82)
headf3196914 оставлен diagnostic draft. Current fixed comparison: Playwright1.56.1
три jobs success,1.64.1 три failure. Из трёх прочитанных rawlogs sample1 даёт
16/16 против12/16; init1.64 —16/18. No-init и once-after-ready по6/6, ранний
empty init4/6; ready-once и init-each-document различаются жизненным циклом.
Это association, не доказательство причины Chromium/fixture или готовый fix.
Следующий [PR83](https://github.com/OleksandrKiris/kiris-jobs/pull/83) head46209753,
basef89e0e4, меняет только fixture/acceptance/tests/workflow/docs. Actual42unit
и шесть fixed reports16/16 прошли, включая native2. Mandatory Catalogue39063711982
FAILURE позже в shift-duration/corrupt после reload; последующие future/denied
сценарии не запускались. Owner11 получил адресный разбор этого случая.
На историческом head46209753 PR83 ещё не был принят: source review и общий gate тогда оставались обязательными.
Source review clear46209753 не переносился автоматически на d4db033a.
Последующая проверка d4db завершена: independent source/gate clear и семь rawlogs
exact head/base — mandatory и6fixed jobs имеют16coordinator+8calculator PASS;
matrix65unit=42+23. Внешний PR83 merged558e6e75; post-check выше. Старые462red сохранены.

### Очередь и исполнение после аудита всех 15 направлений

Это текущий срез очереди; ниже остаётся история проверенных head. Число тестов
не заменяет пользовательскую, контрактную и публикационную готовность.

| Роль | Подтверждено | Один оставшийся результат / зависимость |
| --- | --- | --- |
| 1 | Новый AS_PATCH c63598:4 shared browser files принят и доставлен96; прежний own59/source94 history сохранён | Patch заморожен; actual current runtime4 принят, дополнительные probes/CI в этом проходе не назначать |
| 2 | HYDRA14 опубликованb04f; новый Copy route TEXT15@7ae реализован,191unit/106browser и actual late runtime4 bounded CLEAR. Source peer CLEAR и5primary files сохранены | Draft15: конкретный отказ записи финального source-report сохранён дословно; эту операцию не повторять. Новая публикация/формальная приёмка не объявлены. Dragon14 peer history отдельно |
| 3 | Local58005b9f и прежние proofs сохранены; новая publicHTTPS QA попытка закончилась IAB timeout | Одна30s попытка без page/PNG; training-destination/Back NOTRUN, не дефект сайта. Без повторов до изменения доступности среды |
| 4 | Copy MEMO TEXT14@a573 опубликован`0b03581a621c8ec55ee8e073152fc2ac5daeb144`; Pages39096400094 SUCCESS,8HTTPexact; source/runtime/peer приняты на неизменном head | Сохранить выпущенный source. Readonly manual fallback и async stale-UI guards; OS clipboard/physical/full12browser гарантии не заявлены. Нового WIP/CI здесь нет; отдельная QA99: Current99@774550 source/runtime CLEAR и опубликован92dc; собственная Dragon14-история сохранена. Две новые summary journeys входят в прежние16, не18. |
| 5 | Local0c099a6,181unit+author UI; независимое source-ревью6 CLEAR,17runtime hashes | Exact browser приёмка и разрешённая remote передача; source CLEAR не равен выпуску |
| 6 | Localaf02e06: исправлен R6-LANG-01,182unit PASS; независимое source-ревью7 закрывает P2 | Браузерная приёмка af02; прежние UI-доказательства742 исторические, remote refusal не снят |
| 7 | Local843c40d,208unit+author UI/upgrade; независимое source-ревью5 CLEAR | Exact browser приёмка; конкретную отказанную IDG6-операцию не повторять |
| 8 | Consolidated5f5a98c8/runtime92027,476saved PASS;73/73ZIP blobs | Permitted exact UI/offline и canonical26 backup; без mini-fix цепочек |
| 9 | Сводка99@774550 опубликована`92dc5b64477de83a1d174ecba154c03bdb29922f`,35HTTPexact/311projection; current source/runtime приняты, прежний96 сохранён | Локальный cd8a11f source CLEAR; author13/independentQA13 VM PASS. Browser/новый CI NOTRUN. Следующий ordinary union с exact14/12/15/rootdocs — отдельная приёмка; общего head/PR/counts пока нет. |
| 10 | Единственный guard04:35 выпустил99→`92dc5b64477de83a1d174ecba154c03bdb29922f`, Pages39097972392/Backend39097972375 SUCCESS,35HTTPexact | Проход05:03 guard0. Эти2docs — локальный draft от92e19, не push/CI/публикация. Датированные99/0408/96/95 сохранены; новый aggregate будет определён по фактическому union. |
| 11 | Local1f087fe:26unit/6runtime exact; независимо проверены14HTTP bytes роли3 | Для3 IAB HTTP timeout и recovery inventory, UI NOTRUN; собственный file-policy отказ11 сохраняет отдельную область |
| 12 | NO_BACKEND_CHANGE fixture2 proof48+5 на eb95 сохранён; exact current aggregate Backend counts указаны выше | Локальный96d2 detail GET source peer CLEAR,8own paths;14 импортирован отдельно. Author21new(12HTTP+9guards)+69old PASS; независимыйHTTP-runtime NOTRUN. Backend локальный/onlineAIoff. |
| 13 | PR62@177872e3; exact fetch-policy отказ durable | Supported network permission именно этого окружения |
| 14 | Contracteb95 и description408 source доставлены96; прежние13/9/11 относятся eb95 | Локальный4fef detail-contract source CLEAR, peer только6 новых pure-mock PASS. Передан12; CI15a045 source CLEAR отдельно. HostedHTTP/browser/newCI не приняты. |
| 15 | CI593 minimum13 доставлен96; actual current gates/postBackend39095191167 SUCCESS | Issue97 actualclosed 2026-10-18T03:55:08Z после postBackend39095191167; это отдельный actual close action. Новые CI/merge только при отдельной причине/следующем проходе Issue98 actualclosed 2026-10-18T03:55:10Z после того же postBackend39095191167; исправлена старая проверка одной карточки в общем browser-helper. Следующий локальныйa045 CI-компонент source CLEAR; author21stdlib/39contracts PASS, новый hosted CI NOTRUN; только вместе с exact14 detail. |

Предыдущий выпуск: PR84 с tested head `af5ea148abc1d5a21b8095383d6a42cd6115f8b3`
принят в `c032359519f1458e56963395bada7e0f711795da`, tested/merged tree702d совпал.
Сохранены authored heads68/74/86/88; их автоматическое closed/merged
не меняет канонический main-release SHA. После успешных Pages/Backend
30 активных HTTP-файлов совпали по размеру и SHA256. Это публикация
фронтенд-материалов и приёмка локального API source; Django-сервис
не развёрнут, online-adapter/AI выключены.
HYDRA14 accepted head `efbb5a8a6f989586b3f335335f550bed6cbe1d7f`/base533
принят как `b04fc7302612affa0c2eec71ac66ebbc13912e46`, tested/merged tree
`d10760fff07e9183cc2ec5364a918a039940eb5a`, orderedparents[533,efbb].
[Pages39086963240](https://github.com/OleksandrKiris/citronex-hydra-project/actions/runs/39086963240)
SUCCESS и latest legacy build built от того же merge. Три критических runtime-файла
index/SW/manifest и новый journal проверены HTTP200/размер/fullSHA256/Gitblob;
ещё12 неизменённых runtime assets подтверждены Gitidentity без повторного media download.
Новый блок предлагает прочитать инструкцию выбранного участка и продолжить обучение;
guide href сохраняет requested lang, location и welcome=1 без приватных query/hash.
Прежняя exactefbb приёмка136unit/66browser включает hub UI, keyboard, reload/Back,
offline/upgrade и href contract. Переходы внутри внешнего Dragon, новые переводы,
физический телефон, аудио или OS clipboard этим выпуском не сертифицируются.
Memo head `5ded5080976e70fcbebb6395b4f42ab485b34e7a`/basef51,
parentb6, принят после трёх bounded-проверок и выпущен как
`f0883032674a5dc9c2034fb144c04286a5617598`: [Pages39083503804](https://github.com/OleksandrKiris/citronex-dragon-guide/actions/runs/39083503804)
SUCCESS, accepted/merged treecd117 и8публичных файлов совпали с Git по
размеру/SHA256/blob. Публичная UTF-8 памятка сохраняет выбранный язык/площадку,
работает offline после установки и даёт readonly-текст при отказе download API.
310unit/57browser и8реальных TXT — прежняя exact5ded приёмка;
VM48/17/6/12/2+invalid — отдельная peer-матрица. Полный12-язычный browser,
физическое устройство и сохранение файла ОС не сертифицированы; новых аудио нет.
Следующий copy MEMO TEXT — [Dragon PR14](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/14),
head `a57306ac862d3986748a7164e272745ed72e3868`/basef088, actualready, не выпущен.
Независимое ревью нашло cross-action race у старогоd000: запоздалый callback
Copy Link мог изменить status/focus нового Copy Memo и наоборот. Общий generation
исправляет все четыре callback; отмена уже начатой nativeOS записи не заявлена.
Текущий CI39084077900 дал413unit и59browser (57 сохранённых+2 новых clipboard
viewport сценария), отдельная peer VM-матрица8GREEN. Доказательства runtime
связывают обновление опубликованногоf088 с новымhead, offline activecontroller,
восемь прежних TXT и три PNG. Fixtures clipboard не являются чтением OS clipboard.

История точной приёмки до выпуска94; указанные ниже Ready/base8abf не текущая
готовность92 после изменения main6faa.

PR89 `6f006a453e389532d163daa24e8671f2af442826` сохраняет семь c2 feature blobs
и четыре corrected59 guard blobs: independent418union и текущий runtime CLEAR.
Catalogue39082972260 подтвердил actual-current core16+workerN/A, mandatory19
и prototype16+8; все6native jobs текущего head SUCCESS по metadata.
Raw144cases/12новых Return journeys сохранены как отдельное доказательство c2,
не новый literal count6f. PR92 `3807d4002086d9f43e0d201e935d4e3cb0d9e0c7`
сохранил API/schema/root207 и importedCI21: Backend39082750131 дал87+29 PASS,
Catalogue39082750177 — early18 и обязательные browser gates PASS; новый native6
не планировался. Это приёмка прежних исходных head, а не новая проверка будущего
API combinedhead. Финальный docs-only89@0811 сохранил все11 feature/guard paths;
его собственные8checks SUCCESS и независимый418union bridge позволили guarded
merge в8abf. Новых literal144/12/72 на0811 не заявлено. PostPages39085391777 и
Backend39085391776 SUCCESS; все31 активный public-файл exact Git bytes/hash/blob,
tested/merged tree67a0 и orderedparents[c032,0811] совпали. Единственный guard
прохода01:03 использован89. Existing92 после ordinary main8abf+rootdocs5db
интеграции получил head `5f12f76ff1267b09c4a04afa2b1a91c7a4b1d2a9`/tree460a:
426 Git entries и net14paths совпали с независимым union, исходные12 API/schema/CI
blobs не изменились. Его новые Backend39085885535 и Catalogue39085885537 SUCCESS:
raw10runner/87backend/29contracts, early18, core16+workerN/A, main19 и prototypes16+8.
Два Return/Clear journeys входят в16; native matrix не планировался. Raw16full и
20main POST attempts сохранены раздельно как aborted fixtures, не уникальная сумма,
не zeroattempts и не доставка. Root actualready выполнен01:23:51; PR92 не merged,
бэкенд не развёрнут и не объявлен production multi-company системой.
Единственный guard01:28 использованHYDRA14. Online-adapter/AI выключены.

PR85 сохраняет ancestry guard и использует existing exact-base подготовку.
Независимые5 real-Git fixtures и6×(16+8) browser подтверждены; live fetched=False,
recovery доказан fixture, не live. Guard10 завершён: exact af008/base558 принят
merge62cb5788; post Backend39070310347 и Pages39070310282 SUCCESS, семь публичных
runtime-файлов HTTP200 совпадают с ранее проверенными байтами; tested/merged tree610028a7.
Это единственный guarded merge прохода20:59. Один affected consumer — PR74: обычная
интеграция принятого main остановлена на add/add общего workflow; owner15 подтвердил
точный accepted blob40250282 и восстановил его в index/worktree; unmerged entries0.
Consumer74 завершил integration heade7311a10/base62cb; Backend39070535484 и
Catalogue39070535513 SUCCESS, actual exact-base/preflight fetched=False и16+8 PASS.
Новый PR74 net diff — один integration Markdown; runtime/fixtures/workflow равны62cb.
Native matrix на e731 NOTSCHEDULED по accepted paths, а не PASS/FAIL: шесть прежних85
jobs относятся к тем же байтам, нового выполнения шести jobs здесь нет. Scoped review
не требует искусственного запуска для sole docs diff. Массовый rerun60/74 не выполнялся.
Переход missing-base в live consumer ещё не доказан; PR74 ещё не merged.
По прямому запросу пользователя о видимых функциях21:48 готовый Dragon10 выпущен: guarded merge70b0f74e, tested/merged tree18b4d00e, Pages39072598765SUCCESS; восемь public assets HTTP200/exact bytes. Кнопка копирования guide-ссылки сохраняет язык/локацию и даёт ручной вариант при недоступном clipboard. Это единственный merge этого отдельного пользовательского прохода. Следующий видимый кандидат — материалы координатора PR68@c896: свежие8checksSUCCESS; independent integration4blobs/runtime5/workflows CLEAR; QA15 подтверждает actual141legacy/156OnDisk,6×24PASS/72telemetry samples. Это process-wide open measurement, не доказательство commit/durability. До выпуска68 остаётся совместный public old5/new5 gate1. Локальный backend77@0fe5f63a/62cb с новым зелёным CI сохраняет отдельный следующий слот. Готовый77
не ждёт универсального объяснения file-storage. Исторический red не является
текущим результатом нового head.

Историческая matrix68@cc2 на Chromium156: functional16 PASS, но histogram unavailable давал
diagnostic gate FAIL; calculator там NOTRUN. Это не preflight85 и не потеря задачи.
Новый source-контракт proposalSHA2560f600a79/fixturesfe9bc7c9 получил CLEAR14/15
и независимую delta-проверку. Никаких сопоставимых same-name пар, mixed incomparable,
all-missing/unknown/malformed дают FAIL; absent-both не превращается в ноль.
Исторический локальный срез: owner9 подготовил helper/test/docs patch SHA256f169c5b8: авторский новый
fake-CDP suite9/9 PASS, combined64/64; old-helper9tests даёт1PASS/8FAIL.
Тогда независимое review реализации ещё требовалось: новые RPC-имена и runtime не наблюдались,
авторский результат не заменял приёмку. Root review требовался до одного changed-head CI; functional16
и shift8 остаются обязательными, общий nonzero не снимается.
Первый independent review local patch нашёл P2: consumer report подписывал156
legacy141 scope/revision. Metadata-only коррекция d3d01 затем получила independent CLEAR:
72assertions/runner body неизменны, один pure metadata check PASS. Обычный pushc896
после accepted62cb integration дал8green checks; actual156OnDisk подтверждён QA15.
Этот новый результат закрывает прежний telemetry gate, не выдаёт process-wide open за
KEY commit/durability и не закрывает историческую проблему79. Public gate1 остаётся.

На WIP назначаются один автор, один source-reviewer и один runtime-verifier.
Один current manifest содержит repo/head/base/runtime hashes, proof/команды/результат,
author/independent attribution, один remaining gate/его owner и точный refusal.
История отдельно; parent получает один consolidated handoff по head/готовности/блокеру.
Unchanged не вызывает повторный CI, ZIP download, полный audit или уведомление.
Готовый автор не начинает новый срез до приёмки. Тяжёлых local jobs одновременно
не более2, browser session1: это протокол поручений, не установленный глобальный lock.
Единственный heartbeat primserv-15 сохранён без изменения расписания; active/dispatch
не являются выполнением. Повторно не требовать у пользователя отсутствующие originals.

К десяти CI-путям15 вручную добавлен `.github/workflows/offline-file-fixture-regression.yml`.
Будущие `coordinator-storage-comparison.yml`/`coordinator-storage-init-probe.yml`
в той же папке назначены15, но отсутствуют в main558 и не импортируются из82.
Module fixtures9/11 и browser1 сохраняют владельцев. Existing external author85
завершает свой уже открытый срез;15 независимо ревьюит, не пишет конкурента.

Отдельные10 standalone Django-приложений1.6 сохраняют своего владельца. Их metadata
2538PASS/391SKIP не являются общей многокомпанейной production-платформой. Перед
стыком нужны capability/skip-reason matrix и existing primserv.companyv1 boundary;
новый параллельный core/framework/обязательный online backend не создаются. Текущий
1.7 другого владельца не прерывается и автоматически сюда не принимается.
На a418 независимо устранён P3 ?lang=RU → requested=en:
новый case-тест падает со старым app и проходит с новым;36 локальных тестов,
16 snapshot/mock parity, оба CI и10 browser-сценариев прошли. Два controls не
добавляют pre-reload reads, но ранние init reads остаются: успех не исключает
их влияния и не объясняет исторический cfa6 failure. Внешних HTTP/ошибок страницы0.
Runtime:45 789 байт; app SHA256 `4c081403d2434593a4b5f7ec635277eff30d1e475d9b1976f1d45b92e0c111f0`.
Существующий68 уже возобновлён; нового PR для тех же материалов не создавать.
Пять runtime-файлов входят в public allowlist: до merge68 обязательна совместная
приёмка owner1 перехода со старых опубликованных пяти tool-файлов к новому head,
первого offline входа, задач/reload/Back, прерывания каждого ресурса,
last-good recovery и статуса после reconnect. Владелец1 добавляет gate в свой
единственный PR60; необходимость cache/SW bump определяется результатами,
не считается автоматически выполненной или обязательной из одного изменения app.js.
Переводы других компонентов продолжаются по issue41 в своих областях;
готовность одного калькулятора не закрывает общую очередь.

Матрица сравнения с HRappka подготовлена отдельно в [PR74](https://github.com/OleksandrKiris/kiris-jobs/pull/74),
headd3345af8, draft, не принят:9 направлений и30 ссылок. Исправлена связь старых API404 с текущим
live guide от 08.10.2026. Это evidence/gaps и предложенные критерии; порядок
выполнения задаёт этот roadmap. Превосходство над продуктом пока не измерено.
Новая P2-фраза о сетевом отказе13 исправлена; Backend39057556666 success,
Catalogue39057556741 FAILURE в общем coordinator reload. Старый green f663
не заменяет проверку нового head.

Ownership-карта14 принята вручную в67; её подключение ролью15 остаётся отдельной
приёмкой. Передача десяти CI-путей ниже принята техлидом, hard lock не включён.
Успех Python CI не означает, что ownership-check уже установлен.
Не расширять backend до реальных данных, авторизации или онлайн-публикации.

### Новый функциональный проход — 18 октября, 00:20 Europe/Budapest

По прямому запросу пользователя владельцу4 передана реализация текстового пути
грузинский/турецкий/армянский в существующем issue41. Подготовлен один
[Dragon PR11](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/11),
head `5ac5dd049f7e8407b94cd1bdb9618106d7c1a283`, base70b0f74e.
Текст, controls, выбор трёх существующих локаций, URL и public-copy сохраняют язык.
Английское вступление запускается явно по кнопке; новые MP3/TTS не добавлены.
CI39073440703:167unit/35browser PASS, в том числе18 новых путей; runtime+18544B,
11 binary assets сохранены. Независимые source/runtime/VM проверки CLEAR:6PNG просмотрены,15VM PASS. Переводы не проверены
носителем, целевые сайты могут переводить материалы частично. Пока не опубликован.

В этом проходе выполнен один guarded merge [PR77](https://github.com/OleksandrKiris/kiris-jobs/pull/77):
exact head0fe5f63a/base62cb → `3ad9f93f66776613443f767403cd239c4678d605`,
tested/merged treec9938ac0 совпал. Три serializer-пути сохранили reviewed bytes;
Backend39071027081/Catalogue39071027060 SUCCESS,54 backend tests.
Post Backend39073288882/Pages39073288866 SUCCESS, семь public assets HTTP200/exact.
Это принятие локального backend helper32KiB, без route, DB-изменений и публикации Django.
Прежние нижеупомянутые READY/red77 относятся к старым head.

Совместный public gate60@4179 получил независимые48/48 PASS:33 прежних,
10 warm и5 cold с OLD62cb/NEWc896/SW60,25 socket cuts и просмотренными PNG.
Текущий60 уже6979459d/base3ad с семью изменёнными browser-файлами и19 composite
группами. Дерево сохранено: backend77 exact, удалений0. Verify39073975495 FAILURE:
8/19 PASS, logo1280 timeout при первом offline tool-entry; следующие10 NOTRUN,
localprototypes SKIPPED. Причина продукта/обвязки ещё не установлена; владелец1
разбирает сохранённый trace. Старые48PASS не заменяют приёмку нового head.
Материалы координатора68 ещё не опубликованы; сначала prerequisite60, затем68.
После этого red владелец1 подготовил head cba1c2fc4acd753c5df6114e030b4a4a4d85c2f1: ожидание actual controller/автоматического reload усилено без изменения runtime. Независимое delta-review и новый CI ещё не завершены; это не принятое исправление.

Перекрёстное source-ревью5/6/7 выявило реальный R6-LANG-01: сохранённый польский
язык перекрывал явный турецкий запрос. Владелец6 исправил свой единственный WIP
доaf02e06e;182unit PASS, независимая дельта-проверка7 закрыла P2. Проверки5/7
без новых source findings. Эти локальные результаты не выданы за публикацию.
QA11 проверил14/14 HTTP runtime bytes приезда3; разрешённый IAB HTTP bootstrap
завершился timeout до страницы. Инвентаризация доступных поверхностей успешна,
другого поддержанного HTTP-браузера нет. UI/offline NOTRUN, повторного цикла нет.

### Выпуск Dragon и следующий функциональный срез — 18 октября, 00:38

По новому прямому поручению пользователя готовый Dragon11 выпущен отдельным
guarded merge: head `5ac5dd049f7e8407b94cd1bdb9618106d7c1a283`,
base70b0f74e → `95ba121c42e82582a9efdff0d4b4b38e577e7840`.
Свежая база, service-worker CI39073440703, отсутствие review-блокеров и
неизменность source/tree сверены перед merge. Дерево принятой версии совпало
с проверенным6fc651d0. [Pages39075670274](https://github.com/OleksandrKiris/citronex-dragon-guide/actions/runs/39075670274)
успешен; все восемь публичных файлов вернули HTTP200 с точными размерами/SHA256.
Новые текстовые пути грузинского, турецкого и армянского доступны на сайте;
выбор локации и публичная ссылка сохраняют язык, английское аудио запускается
явно по кнопке. Независимые167unit/35browser/15VM/6PNG доказательства сохранены.
Черновые переводы не проверены носителем, полные переводы целевых обучений
и системное аудио/clipboard на физическом телефоне не сертифицированы.

В этом проходе выполнен один merge. PR60@cba1c2fc теперь имеет независимое
source-ревью двух browser-файлов и current19 runtime CLEAR:4 functional,
10 warm,5 cold,25 partial-body cuts,10 actual reload/controller receipts,
три просмотренных PNG. Verify39074332390/Backend39074332378 SUCCESS.
Исторические33/48 на4179 имеют отдельное происхождение; red697 сохранён.
Выпуск60 и последующий68 остаются очередными отдельными слотами.

Владелец2 подготовил [HYDRA PR14](https://github.com/OleksandrKiris/citronex-hydra-project/pull/14),
head `efbb5a8a6f989586b3f335335f550bed6cbe1d7f` / base533360d7: явная ссылка
на гида выбранной площадки с requested language и пояснением следующего шага.
CI39075737482:136unit/66current-browser PASS; независимые source/runtime/peer4 проверки CLEAR.
Внешний Dragon в этих тестах не открывался; публикации14 пока нет.
Текущий runtime-отчёт содержит66 записей, включая сохранённые проверки.
Новые CTA assertions выполнялись в10 last-site группах:3 площадки сua и
12 языков наZgorzelec. Отдельные36 сочетаний площадки/языка,3 alias и
negative/storage/fallback случаи проверены peer4 через VM. Из четырёх
просмотренных PNG новый CTA показан вka на320/1280; tr/hy снимки относятся
к прежнему welcome modal. Это не полная декартова browser-матрица и не
реальная межсайтовая навигация.
Владелец12 подготовил [PR86](https://github.com/OleksandrKiris/kiris-jobs/pull/86),
head `b564c93663e8645a5c33ebeb775f73ea4501f0b4` / base3ad9f93f:
локальный `GET /api/v1/materials/` на существующем canonical mock/snapshot и
serializer77. Авторский runner:68backend PASS, включая14 новых HTTP-тестов
и16 комбинаций реального provider; check0, миграций нет. Backend39076208129
и Catalogue39076208133 SUCCESS. Роль14 независимо приняла source/contract,
роль15 проверила raw CI и выполнила только14 новых HTTP-тестов в отдельной
копии exactb564:14PASS наDjango6.1.2, Python3.12.14 (CI3.12.15). Старые54
локально не повторялись. Raw CI и независимый лог сверены root поSHA256,
пять source-manifest совпали. Граница compact32768/32769 доказана отдельно
инъекционными transport-тестами; actual fixedsnapshot проверен через реальный
provider, его прежний более ранний spacedJSON cap сохранён. Разрешены только
material_http, commonURLs, targetedtests, один core-doc и минимальный trusted
request-ID/route mapping в middleware. Contract GET-only/HEAD405 сохраняется,
ошибки view имеют accepted code/request_id, header/body/log ID генерируется
сервером. Core guards до view сохраняют прежний envelope. Новый endpoint
подготовлен и независимо принят в этом объёме, PR86 ready; merge и backend
publication не выполнялись, frontend online-adapter выключен. Предложение company-context guard отложено:
в принятом core нет чистого canonical company-provider, callback-spy или
существующий ORM importer не подтверждают такую интеграцию. Десять векторов14
сохранены как NOTRUN, новый параллельный backend framework не создаётся.

### Выпуск каталога и устранение общего препятствия — 18 октября, 01:20

По очередному прямому поручению пользователя PR60 выпущен с guard exact
`cba1c2fc4acd753c5df6114e030b4a4a4d85c2f1` / base3ad9f93f →
`374d5bddbd4630352f75e902536a11c2175c5411`. Tested/merged tree
`d38641c8cadf5f72c960fa2e2a2d2fe63c90dc3a` совпал. Свежие обязательные CI и
независимые source/current19 browser proofs проверены до merge; исторические
33/48 на4179 имеют отдельное происхождение. [Pages39077298495](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39077298495)
и [Backend39077298482](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39077298482)
SUCCESS. После завершения публикации26уникальных публичных файлов вернули
HTTP200 и точные принятые bytes/SHA256/Git blobs:21изменённый файл оболочки/
вакансий и5прежних runtime coordinator. Материалы68 этим выпуском не опубликованы;
локальный backend не развёрнут. Literal `privacy.html` передан owner1 только
для существующего frontend bootstrap scope; юридическая экспертиза не заявлена.

Владельцы9/12/14 один раз обычным merge включили новый main в прежние PR68/86/74.
Чужие принятые blobs и собственные manifests сохранены, конфликтов нет.
Новые Catalogue failures подтверждены до первого browser case:
68@44383dc падает на сравнении actual нового coordinator со старым baseline
receipt4179 (line107);74@fd9a721 и86@173f1b28 — на line115, которая ошибочно
считает весь non-browser diff публичным и допускает лишь три старых backend77
пути. Это дефект применимости общего harness, а не доказанная неисправность
функций материалов/API. Для68 все6native checks и Backend успешны отдельно;
для86 fresh68backend tests PASS; mandatory prototype steps после раннего
Catalogue failure пропущены. Старый зелёный CI не выдан за готовность новых head.

Владелец1 исправляет одну общую причину в [issue87](https://github.com/OleksandrKiris/kiris-jobs/issues/87)
отдельным узким WIP;15 проверяет
регрессию, независимый source-reviewer проверяет границы reuse. Защита
исторических33 должна опираться на реально публикуемые неизменные bytes,
текущие19 — на настоящий staged candidate. Простая замена хешей, отключение
assertions и добавление частных исключений для каждого PR не принимаются.
Проверенные исходники уже собраны обычным Git merge в локальной ветке
существующего PR84: промежуточный headafc19dee/treec216e8fb содержит21component
путь(14+5+2), два root-документа и393неизменённых base entries. Независимо
сверены все416mode/type/blob entries, потерь/скрытых правок нет. Это локальный
draft с известным красным guard: его не отправляли на заведомо неуспешный CI и
не объявляли ready. Manifests, патч и Git bundle сохранены. После добавления
проверенного fix1 потребуется один push и свежая приёмка всего общего head;
следующий guarded merge будет отдельным проходом. Это убирает очередь
отдельных docs-only выпусков и сохраняет один guard на проход. Новый PR той же
роли и новые расписания не создаются.

Новый пользовательский срез Dragon: единый выбор/смена/сброс площадки для всех
12языков. Независимые36language×location и36URL-priority baseline fixtures
подтвердили, что на опубликованном95ba picker и last-site доступны только
ka/tr/hy, а явного reset нет. Роль4 реализовала функцию в одном
[Dragon PR12](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/12),
head `80162bbb3b01c8d41734380de13ead2b08bd3910` / base95ba. Первый CI выявил
потерю кнопки возврата после reload с полностью запрещённым storage; автор
сохранил failure, исправил причину и добавил12регрессий.
[CI39077674513](https://github.com/OleksandrKiris/citronex-dragon-guide/actions/runs/39077674513)
SUCCESS:230unit/53current-browser. Независимые source/runtime/peer2 проверки
CLEAR: семь путей/11binary сохранены;36language×location+36URL-priority и
адресные storage/reset/callback VM; восемь runtime bytes/Git blobs, raw CI/report
53records и actual BASE→HEAD worker/offline proof совпали. Четыре текущих PNG
320/1280 просмотрены. Свежие head/main/base/CI/reviews сверены, PR12 ready.
Девять существующих аудио, URL-priority, optional storage, sanitized public-copy
и отсутствие autoplay сохранены. Функция принята в этом ограниченном объёме,
но ещё не merged/опубликована; переводы не проверены носителем, OS media и
физическое устройство не сертифицированы.

Найдено лишнее потребление ресурсов: archive12118170261 имеет1007892499B,
из них991172664Bcompressed —53успешныхtrace. Независимый verifier проверил
выбранные acceptance.json/4PNG по central CRC и собственным SHA256, восемь
runtime blobs и равенство raw CI. Полный SHA256 ZIP не проверен; handoff digest
атрибутирован GitHub metadata, непрочитанные traces не объявлены проверенными.
Получена одна неполная копия158007296B и65536Bcentral-directory tail без
повторного полного скачивания. Root признал выбранные доказательства
достаточными для описанного объёма приёмки. Ограничить успешные traces с
сохранением failure evidence — следующий отдельный WIP после выпуска функции.

Дельта01:23: guardfix сохранён в [PR88](https://github.com/OleksandrKiris/kiris-jobs/pull/88),
head `beb025c68f33b3a1758ff02f79a73c7abb75466d` / base374d,
tree9a62e038. Ровно шесть browser harness файлов,14адресных тестов автора PASS,
один штатный CI запущен. Независимые source/runtime проверки начаты; этот fix
ещё не включён в локальный общий84 и не считается принятой реализацией.
NEW68/full-current fallback требуют свежего совместного CI, old-tool88 green
не заменит эту проверку. Незавершённая передача и исходники сохранены отдельно.
Независимое source-review beb выявило два P2: failed/timeout full-current child
может быть принят по оставшемуся passed JSON; замена published.ref на eventbase
с прежними OLD-хешами создаст несогласованную tuple после выпуска68. Автор1
исправляет оба в том же87/88 с адресными регрессиями. Независимые14tests и
current19old-tool CI88 PASS имеют ограниченный объём и не закрывают эти P2;
fullCurrent на88 NOTRUN. До нового head и закрытия findings88 не импортируется.

### Опубликован выбор площадки и подготовлена общая сборка — 18 октября, 01:37

Dragon12 принят с expectedhead80162bbb/base95ba →
`f51c280d90697cd3ad2d9e0623dedc020fa2073d`. Свежая независимая сверка11условий
совпала с принятыми source/runtime/peer proofs. [Pages39079184115](https://github.com/OleksandrKiris/citronex-dragon-guide/actions/runs/39079184115)
SUCCESS; восемь уникальных HTTP200 файлов совпали по размеру/SHA256/Git blob,
tested/merged tree8ef8b332 совпал. Выбор/возврат/очистка площадки теперь
опубликованы для всех12языков. Это единственный guarded merge прохода23:26.
Отдельная новая publicHTTPS UI-попытка роли3 остановлена после IAB bootstrap
timeout30.1485s: страницы/PNG/перехода к обучению и Back нет. Она не заменяет
успешную CI-приёмку и не доказывает дефект сайта; повторного цикла не запускали.

Оба P2 старого88beb закрыты в `dae521a094c27614fef222bdbda09ed14942f889`:
process success проверяется до чтения JSON, historical OLD tuple атомарен,
eventBase записан отдельно. Независимые18tests PASS и три exact-source old/new
probes воспроизводят старые допуски и новые отказы. Это чистые probes, не
реальный browser timeout. CI39079187539/39079187543 SUCCESS:19OLDoverlay,
fullCurrent NOTRUN. Fix принят только как source/fixture component, а не
как новая full-current browser приёмка материалов68.

Обычный локальный merge88dae в existing84 дал промежуточный head3b83175e,
tree37b8a70e: все417mode/type/blob entries совпали с ожидаемым составом.
Сохранены21component пути9/12/14, шесть browser путей1 и два документа10;
исходники авторов не переписаны. Один общий push/CI должен впервые проверить
реальные staged NEW5, весь current-core и mandatory19, восстановление stage,
оба prototype suites и предусмотренные native checks. Свежий результат
этого head фиксируется в PR84 и техническом реестре; старые green не переносятся.
До этой проверки общий кандидат не ready; следующий main guard отдельно.

Владелец4 начал один следующий [Dragon PR13](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/13),
headb6b0ca667fe5c3ff999f5f8abf5ff6d355913e2c/basef51: ограничить успешные
traces, сохранив failure trace, representative worker trace, все assertions,
screenshots/report и runtime manifest. Четыре пути, независимые source/runtime/
peer проверки ещё идут. Объём нового artifact пока не объявлен измеренным;
публичный runtime этим тестовым WIP менять не разрешено.

### История очереди — ранняя сверка 17.10.2026, не задания к повтору

Следующая таблица и описание блокеров фиксируют прежнее состояние. Текущие
статусы и следующие действия находятся выше; исторические SHA не применять
к новым update_ref/merge.

| Область / PR | Точный head | Проверки | Следующий шаг |
| --- | --- | --- | --- |
| 6 / [Ryczywół PR15](https://github.com/OleksandrKiris/citronex-ryczywol-szkolenie/pull/15) | `37af1925ba2706d98be719fb96492544891ef853` | 164 теста; CI 38973012598 success | Браузерная приёмка сохранения поиска; cache 20261016-glossary-context1 |
| 7 / [Bogatynia PR13](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie/pull/13) | `e1a554a330e2568dc7114e7f9494f496e98927ce` | 174 теста; CI 38973811213 success | Поиск/язык/reload в двух режимах; cache 20261017-glossary-context1 |
| 5 / [Siechnice PR17](https://github.com/OleksandrKiris/citronex-siechnice-szkolenie/pull/17) | `5f9692e3956f372ff8456126ac0c6980f41b0501` | 176 тестов; CI 38972505257 success | Повтор только ошибок, сохранность правильных ответов; cache 20261016-quiz-retry1 |
| 11 / [Калькулятор PR33](https://github.com/OleksandrKiris/kiris-jobs/pull/33) | `55b0f1b9b43a9108010abc37d6ca3d25e55d1db2` | 12 отдельных + 136 каталога; CI 38969966573 success | Локальный запуск/offline/storage и #35; 36 927 runtime-байт |
| 9 / [Кабинет PR34](https://github.com/OleksandrKiris/kiris-jobs/pull/34) | `4ec4001d34c321be45288c6d82cb7fde252b1a33` | 23 отдельных + 136 каталога; CI 38974891076 success | Локальный запуск/offline/storage и #35; 32 770 runtime-байт |

На момент этой исторической сверки все пять были **подготовлены в PR, не объединены и не опубликованы**. Тогдашние CI
сверены по head; числа тестов первых четырёх подтверждены журналами PR, без
повторного тяжёлого прогона неизменённых проектов. У каждого PR полный
сценарий/файлы/откат. Готового к функциональному выпуску PR пока нет.
В HYDRA, приезде и голосовом гиде открытых PR/issues при этой сверке нет.

Два разных блокера, не общий запрет работы:

- **Предпросмотр новой версии:** локальное расширение вновь вернуло
  `originating browser context`; разрешённый managed preview ранее остановился
  на `bwrap: Can't mount proc ... Operation not permitted`. Без восстановления
  среды запуск не повторять и защиту не обходить. Ответственный за дальнейшую
  приёмку — владелец каждого PR совместно с задачей10; условие снятия — доступный
  разрешённый exact-head preview и матрица keyboard/lang/reload/Back/узкого
  viewport, отдельный реальный offline и обновление кэша где применимо.
  Облачный Chrome доступен для публичных страниц; проверка старого сайта не
  заменяет эту приёмку. Каталог PL→UK и ссылка обучения uk→ua подтверждены.
- **Граница публикации новых приложений:** [issue35](https://github.com/OleksandrKiris/kiris-jobs/issues/35),
  владелец1. `.github/workflows/pages.yml` на базе cb10d69 публикует `path: "."`.
  Merge PR33/34 автоматически вывел бы прототипы в Pages даже без входа в меню.
  Сначала отдельный проверенный PR упаковки, исключающий только новые
  `coordinator-demo/` и `offline-tools/` из артефакта, без удаления исходников и
  потери существующих публичных ресурсов. Инвентарь/SHA, регрессионный тест,
  npm test и приёмка действующего каталога обязательны. Прототипы в main пока
  отсутствуют; действующий сайт этим дефектом не объявляется сломанным.

Описанные выше preview/packaging-блокеры — исторические: их снятие зафиксировано
принятыми PR38/39/45 и текущей приёмкой. Не воспроизводить прежнюю очередь по
этой таблице. Для нового дефекта нужны текущая версия и новое подтверждение.
Независимый готовый PR разрешено принять после завершения предыдущего выпуска;
максимум один merge за проход, без дублей ради обхода ожидания.

1. **Внешняя HRappka:** предупреждение
   `Ta strona przekracza limit bezpłatnych testów reCAPTCHA dla firm.`
   зафиксировано в PR28. Это риск, а не доказанный отказ отправки. Настройки,
   оплату и CAPTCHA не менять. Ответственность за проверку — администратор
   HRappka; остальные безопасные работы не заблокированы.
2. **Бот и Mini App:** до свежей сверки deployment/архива не заявлять
   актуальную версию, готовность или число пройденных тестов. Проверять темы,
   избранное/сравнение и возвраты без отправок.
3. **Устройства и содержание:** настольные проверки выпусков не заменяют
   визуальную проверку телефона, экранного диктора и полную сверку переводов.
   Недоступный источник инструкции — блокер её замены, а не повод придумать текст.

## Правила исполнения и публикации

### Распределение 15 владельцев задач и запусков

Минуты в таблице — историческая схема, не свидетельство активных расписаний.
Текущее регулярное продолжение ведёт один heartbeat техлида каждые 15 минут
(прочитанная настройка ACTIVE; при создании было 30 минут).
Он возобновляет существующий WIP ролей, а не создаёт новый продукт за цикл.
Границы записи, PR и проверка точного head действуют независимо от времени.

| Задача | Минута каждого часа, Europe/Warsaw | Исключительная область подготовки | Публикация |
| --- | --- | --- | --- |
| 1. Frontend и SEO каталога | :43 | kiris-jobs: каталог, package/lockfiles/CSS/JS/SW/упаковка, scripts/**, .github/browser/**, .github/public-tools.json; исключает области9–15 и перечисленные CI-пути15 | Только PR |
| 2. UX и навигация HYDRA | :51 | citronex-hydra-project | Только PR |
| 3. Frontend приезда | :55 | przyjazd-do-pracy | Только PR |
| 4. Мультимедиа и доступность | :59 | citronex-dragon-guide | Только PR |
| 5. Обучение Siechnice | :03 | citronex-siechnice-szkolenie | Только PR |
| 6. Обучение Ryczywół | :07 | citronex-ryczywol-szkolenie | Только PR |
| 7. Обучение Bogatynia / Zgorzelec | :11 | citronex-zgorzelec-bogatynia-szkolenie | Только PR |
| 8. Бот / Mini App | :15 | Только recruitmentbot и его канонический архив | Единственный code-only deploy бота |
| 9. Frontend кабинета | :19 | Только coordinator-demo/ и docs/platform/; кабинет и база знаний | Только PR; вымышленные данные |
| 10. Техлид и выпуск | :31 | docs/primserv-roadmap.md, docs/github-inventory.md; ревью без изменения чужого кода | Единственный merge сайтов и принятие локальных модулей; максимум один merge за проход, затем post-check |
| 11. Новые программы | :23 | Только offline-tools/ и docs/offline-services/; не дубль кабинета | Только PR |
| 12. Django-платформа | :39 | backend/config/, backend/core/, backend/tests/core/, backend/manage.py, backend/pyproject.toml, backend/requirements*.txt, backend/README.md, docs/backend/core/ | Только PR; локальная тестовая БД |
| 13. Django-домен и API | :47 | backend/domain/, backend/tests/domain/, docs/backend/domain/ | Только PR; без изменения общих settings/urls/deps |
| 14. Архитектор и планировщик | :35 | contracts/ и docs/integration/ | Только PR; версии контрактов, mock, ownership, приоритеты |
| 15. GitHub/CI, надёжность и QA | :27 | quality/security/, docs/quality/ и десять явно переданных ниже CI-путей | Только PR; исправление конвейера, адресные регрессии, без присвоения функционального кода |

Роли10/14 зафиксировали передачу1→15 после независимой сверки дерева:
`.github/workflows/backend.yml`, `check-pr.yml`, `pages.yml`,
`production-health.yml`, `rebuild-apply-v17.yml` (все в `.github/workflows/`);
`.github/scripts/backend-ci.py`, `backend-ci.test.py`, `local-prototypes.mjs`,
`local-prototypes.test.mjs`, `local-prototypes.md` (все в `.github/scripts/`).
Новые файлы этих папок требуют отдельного review карты, не автоматической
передачи. Package/lockfiles, `scripts/**`, `.github/browser/**` и manifest
публичной упаковки остаются1; тесты модулей — их владельцам. Запись карты14
SHA256 `7d52bf4a03f2812755a63178facc1665462271febd1e922d24c7a0329d676903`
прочитана и вручную принята10; автоматический gate ещё не установлен в main.

Все неуточнённые пути относятся к OleksandrKiris/kiris-jobs; остальные шесть
repo также принадлежат OleksandrKiris. Локальные ветки/каталоги отдельны для
роли и запуска. Восемь одновременных ролей допустимы только в независимых
областях; общий файл имеет одного владельца. Сдвиг времени не является lock.

Старое общее задание заменяется этой схемой. Прототип и каталог не меняют
общие файлы друг друга; интеграционный вход из каталога готовит его владелец
после его приёмки. Новые самостоятельные утилиты относятся к задаче 11,
кабинет и реестр знаний — к задаче 9. Их тесты и инструкции запуска лежат
в своих папках; общие package.json, README, JS/CSS/SW они не меняют.
Ни одна задача не меняет соседний модуль ради своего
теста. Задача выпуска отклоняет конфликтующий/непроверенный PR, а не обходит
проверки. Новые задания самостоятельно не создаются. Обычный проход —
примерно 25–30 минут; незавершённое сохраняется в ветке/PR. Разнесение стартов
не гарантирует отсутствие пересечения: отдельные рабочие каталоги, один WIP
на область, актуальный main и exact-head guard обязательны. Наблюдатель
принимает готовые результаты предыдущих циклов, не требует завершить работу
за интервал между стартами. При занятой области новый цикл не дублирует её.

### Офлайн-приоритет и новые приложения

- Делать полезные новые функции, не бесконечные проверки. Изолированный
  прототип разрешён до полной готовности платформы; подключение к действующим
  страницам — только после тестов, проверки совместимости и приёмки владельцем.
- GitHub хранит исходники, версии и PR, но не заменяет сервер данных.
  Фронтенд остаётся самостоятельным local-first/static. По прямому запросу
  17.10.2026 роли12/13 разрабатывают Django отдельно, локально, с временной
  тестовой БД и вымышленными данными. Auth/RBAC допустимы только кодом и
  фиктивными тестовыми пользователями; production-БД, реальные доступы,
  новый online backend, внешняя синхронизация, платные API и ИИ не разрешены.
  Будущий стык — версионированные contracts/mock роли14. Существующие сайты/бот/
  онлайн-анкеты не отключать и не переписывать ради офлайна.
- Для каждого инструмента документировать первый запуск, офлайн-сценарий и
  действия, требующие сети. PWA после первой загрузки не равна работе на
  никогда не открывавшем страницу устройстве; service worker не обещать на
  file://. Нужен проверенный локальный HTTP-запуск или самодостаточный файл.
  Внешние переходы в Telegram/HRappka и отправка анкет требуют интернета;
  это ограничение наших переходов, не проверка всего offline-режима HRappka.
- Не добавлять обязательные внешние CDN/шрифты/API для локального сценария.
  Не предзагружать массово фото/аудио; тяжёлое — по запросу. Фиксировать
  изменение размера, запросов и кэша где применимо; без бесконечного polling
  и тяжёлых зависимостей без обоснования.
- Проверять без сети, reload/возврат/язык, пустое, повреждённое и запрещённое
  хранилище, совместимость предыдущих сохранений и безопасное обновление кэша.
  Не уничтожать пользовательское содержимое миграцией. Не кэшировать личные
  данные и не вводить скрытую очередь отправки анкет после восстановления сети.
- Пользователь разрешил отдельные новые PrimServ-репозитории для действительно
  самостоятельных офлайн-продуктов. Только владелец 9 или 11 создаёт repo
  своего продукта через доступный разрешённый инструмент, после проверки
  дублей и фиксации назначения/имени/владельца в своём журнале. Private по
  умолчанию; без новых Pages, серверов, секретов, расходов и пользователей.
  Минимальная инициализация README допустима, функциональный код — через PR.
  Нет инструмента/прав — продолжать в изолированной папке, не обходить доступ.
- Задача 10 принимает новый repo в область только по точной зарегистрированной
  ссылке с владельцем; может проверять и объединять PR, но не включать новый
  онлайн-deploy. Весь GitHub-аккаунт не становится областью очистки.
  Новые repo в этой сверке не созданы и не объявляются существующими.

### Передача коммита, CI и merge без потерянной работы

1. Перед записью: свежие main, head своего PR, полный список путей и зависимости.
   Один незавершённый PR на роль, прежнюю ветку не переименовывать. Новый цикл
   продолжает WIP; новый соседний PR сам по себе не блокирует непересекающуюся
   область. Если другой запуск той же роли пишет сейчас, второго писателя нет.
2. Подготовить и проверить маленький diff. До конца запуска сохранить коммит
   и создать/обновить PR, даже если он пока draft. Созданная пустая ветка или
   локальная папка без коммита/PR не считаются передачей. При запрете записи
   сохранить разрешённый локальный patch, точный head и причину; не обходить отказ.
3. При update_ref: expected_sha и force:false. При обычном git push — только
   fast-forward. При несовпадении SHA остановить запись и перечитать изменения,
   сохранить чужие коммиты; никаких reset/force/слепого повтора. При новой базе
   обычное согласование с main и повтор затронутых проверок.
4. PR сообщает owner, allowed_paths, tested_base, tested_head, depends_on,
   команды tests, evidence URL/хеш, offline/online границы, rollback и один
   следующий шаг. После push дождаться CI именно нового head; прежний зелёный
   статус не переносится. Существующий catalogue CI проверяет каталог,
   упаковку и зарегистрированные локальные прототипы. PR50 добавил отдельный
   Backend Python checks для всех backend/tests/**/test_*.py; его результат
   проверяется отдельно, Django запускается только с тестовыми settings.
5. QA15 даёт адресные замечания к head; роль10 проверяет весь diff/актуальную
   базу/успешный CI и действительно просматривает браузерные доказательства
   там, где изменён UI. Для чистого локального backend без UI — собственные
   unit/API/negative/migration-тесты, Django check где уже есть Django; не
   требовать вымышленную браузерную страницу pure-Python модуля.
6. Роль10 единственная делает guarded merge с expected_head_sha, после свежей
   повторной проверки main. Максимум один за проход; предыдущий выпуск сначала
   заканчивается. Для сайта: Pages success → точные живые активы/кэш → основной
   сценарий → released. Для локального backend/контракта: accepted, без нового
   deploy. Защита упаковки обязательна прежде merge внутренних каталогов.
7. Коммит, green CI, ready PR, merge и работа на сайте — разные состояния.
   Если ready PR не менялся, не повторять весь аудит и не начинать вторую
   функцию; роль10 принимает его либо оставляет точное недостающее действие.
   В PR остаётся воспроизводимый журнал, а не только уведомление в чате.

Это рабочий протокол, не утверждение о включённом GitHub hard lock или
обязательном ownership-check. Реестр/проверку пересечений готовит14 с тестами
восьми независимых областей, чужих и общих путей; root CI после передачи
подключает15, независимо принимает10 и затронутые владельцы. До приёмки
действуют ручные scope/head guards.
Автоматические проверки безопасности и разрешения не отключать ради merge.

### Наблюдение, приоритеты и приёмка

Задача 10 сравнивает свежие версии/PR/CI/Pages/публичные страницы и безопасные
доказательства бота с предыдущими результатами. Не запускает тяжёлые наборы
всех неизменённых проектов каждый цикл и не считает один timeout доказательством
поломки. Код исправляет профильный владелец; наблюдатель доводит его PR до
проверенного результата, не вмешиваясь параллельно в чужую реализацию.

Очередь — существующие issues с префиксом `[PrimServ priority]`, без дублей,
назначения людей и @mentions. P0 — воспроизведённый блокирующий сбой;
P1 — важная ошибка/сценарий; P2 — полезная новая функция. Для бота issue в
kiris-jobs явно помечается recruitmentbot и исполняется только задачей 8.
Issue не расширяет полномочия и не заменяет подтверждённый источник.

Для ошибки нужны версия, шаги, ожидаемое/фактическое поведение и регрессионный
тест. Для функции — пользователь, подтверждённый пробел, минимальный офлайн-
сценарий, владелец, зависимости, размер/кэш, риски и критерии приёмки.
Наблюдатель выбирает максимум одну новую приоритетную функцию за проход по
всей платформе при отсутствии нерешённого P0; разработчики сначала завершают
свои незавершённые изменения. Не выдумывать спрос и метрики.

Прямое разрешение пользователя 17.10.2026: проверять изменения, выполнять
merge и удалять подтверждённо плохие/ненужные элементы, чтобы рабочий процесс
GitHub продолжался. Прежний общий запрет на любую чистку больше не применяется.
Повторного согласия на обычный проверенный merge или обратимое удаление
доказанного дубля не требуется.

- Перед чисткой записать точный repo/путь/ref, причину, доказательство
  неиспользования и восстановление. Ошибка теста, старый возраст или название
  файла сами по себе не означают, что работу надо удалить.
- Исходники менять/удалять в PR владельца области с регрессией и проверкой
  динамических ссылок, шаблонов и SW. Сохранять историю, исходные материалы,
  действующие публичные ресурсы и незавершённую работу соседних ролей.
- Завершённая ветка может быть кандидатом на удаление после подтверждённого
  merge, отсутствия другого WIP/зависимых PR и записи исходного SHA для
  восстановления. Не удалять единственную копию незавершённой работы.
- Репозитории, релизы и теги не выбирать для массового удаления по имени или
  предположению. Нужны точный инвентарь зависимостей и проверяемый путь возврата.
  Не очищать весь аккаунт одним действием.
- Разрешение на чистку не меняет права, visibility/protection, секреты, billing,
  требования тестов/браузерной приёмки, областей и единственного выпуска.
  При неудачном выпуске остановить следующие релизы затронутой области;
  откат — отдельный проверенный revert PR с новым кэшем, не reset/force-push.

- Сначала читать этот журнал, свежие main/deployment, открытые PR и результаты
  предыдущей работы. Готовые `[PrimServ cleanup]` проверять первыми. При чужом
  незавершённом изменении не перезаписывать его. Одна небольшая задача до результата.
- Очередь: блокирующие дефекты 1–6 → прототип/реестр 7–8 → разрешённая
  подготовка 9–10. Независимые офлайн-прототипы можно готовить параллельно,
  не подключая их к production до приёмки. Исследование не обозначать внедрением.
- Веб-авторы: отдельная ветка и PR, полный diff, `npm test` при наличии и проверки
  проекта; перед merge повторно читать main и точный tested head, применять
  expected-head guard силами единственной задачи выпуска. Авторы PR сами не
  объединяют и не деплоят. Дождаться CI/Pages и сверить живые активы. Изменения
  runtime требуют обновления кэша; этот документ и README runtime не меняют.
- Бот: только code-only deploy указанной функции; свежая сверка версии,
  резервная копия, тесты, completed, health/app; безопасный ZIP заменять в том
  же Library-файле с expected_current_version. Не менять environment, секреты,
  триггеры или схему БД. Репозитории не дублировать в Library.
- Сохранять 14 вакансий и 54 фото/связи, работодателей Citronex/PPO, условия,
  даты, контакты, документы, аудио и языки. Не менять `updatedAt` ради свежести.
  Более поздние статусы сравнивать с подтверждением наличия 15.10.2026 с точным
  временем/часовым поясом. Не удалять совместимость или публичные материалы
  без доказательства неиспользования.
- Не читать кандидатские данные, `.env` или секреты. Не отправлять заявки,
  сообщения, звонки, бронирования и запросы приезда. Не менять HRappka,
  WhatsApp/группы, сторонние проекты и primserv.pl. ИИ выключен, платные
  вызовы и новые интеграции запрещены. Ридер/планшет — только учебные сайты.
- Использовать официальный логотип и взаимные ссылки PrimServ/каталог/HYDRA/
  Telegram; `ua` на обучении, `uk` в каталоге/боте; неподдерживаемый грузинский
  ведёт на EN с понятным предупреждением, не выдуманным переводом.

## Журнал существенных изменений

- **2026-10-18, выпуск Dragon11:** опубликован текстовый путь ka/tr/hy, guarded95ba121c, Pages39075670274 и8точных публичных файлов. Current19 prerequisite60 независимо CLEAR, выпуск60→68 впереди. Следующие задачи поручены владельцам2/12; незавершённый код не объявлен готовым.

- **2026-10-18, проход01:57:** опубликовано избранное PR94→6faa после source1
  и runtime2 приёмкиEA; post Pages39088679663/Backend39088679636 SUCCESS,32HTTPexact.
  Точный старый5f12 API92 сохранён, но root вернул PR в draft для ordinary
  main6faa+rootdocs integration и новой приёмки. Назначены два независимых
  функциональных среза: HYDRA Copy route TEXT и demo-status backup/restore;
  поручение не означает готовую реализацию. Новых автоматизаций/второго merge нет.

- **2026-10-18, функциональный проход:** новый Dragon11 ka/tr/hy подготовлен с167unit/35browser PASS; независимые source/runtime/VM проверки CLEAR, выпуск отдельно. Локальный serializer77 принят3ad9f93 с post-CI/7public bytes. В Ryczywół исправлен найденный P2 с182tests. Совместный public gate4179 прошёл48сценариев, новый697 имеет отдельный timeout; материалы68 пока не опубликованы.

- **2026-10-17, PR78:** единый roadmap принят на guard611 →f89e0e4,
  post Backend/Pages и семь public bytes проверены. Company importer получил
  actual TestCase red/green proof в private copies; source proposal не применён.
  Dragon10 independently clear/frozen. Новые storage diagnostics68/82/83
  продолжают отдельную приёмку; причиной issue79 или завершённым fix не названы.

- **2026-10-17, передача8:** получен прежний v4 source ZIP и подтверждены
  его72 entries. Owner evidence:110 MiniApp/472 total tests и build PASS,
  local preservation+validation commits; runtime/lockfile сохранены. Это
  восстановление reviewable source, не новый deploy/canonical26 acceptance.

- **2026-10-17, Dragon9:** исправлены явный TR fallback и requested context после
  reload/Back; guard810 →3a7, Pages39061616083 и пять runtime bytes проверены.
  Issue81 закрыта с actual HEAD-upgrade/offline proof. HYDRA13 currentcbb отдельно
  прошёл независимое ревью, остаётся draft. Company Unicode gap воспроизведён
  и закрыт в private candidate proposal с SQL0; source repo не изменён.

- **2026-10-17, HYDRA12:** последняя публичная площадка/очистка выбора приняты
  с guard b8e5 → b820; Pages39059220706 и три точных runtime-файла проверены.
  Независимо закрыты layout P2 и случайное удаление26 файлов до merge.
  Dragon9 сохраняет прежний WIP4 в PR, следующий срез2 — публичная ссылка;
  общего исправления file-reload79 и публикации Django пока нет.

- **2026-10-17, HYDRA11:** ka/tr/hy hub/intro и keyboard guide приняты с guard,
  Pages39057041456 и три публичных runtime-файла проверены. Новый полезный срез2
  продолжает последнюю выбранную площадку. PR60 теперь доказывает10 warm/5cold
  tool-refresh случаев; fix80 имеет независимый red/green proof и33 browser PASS,
  но общий file-gate79 красный, fix60 ещё не принят. Все незавершённые head/patch
  и ограничения сохранены, нового расписания или production backend нет.

- **2026-10-17, после PR61/73:** единый план и критерии HRappka приняты в main;
  локальный canonical validator принят отдельно с guard head98a30113, mergeace6655.
  Post Backend39054980031/Pages39054979967 и семь опубликованных ресурсов проверены.
  PR62 и HTTP ещё не приняты; следующие срезы13/12 — actual-schema integration
  и строгая граница сериализованного ответа. Подготовка75 сохранена локально:
  конкретная запись документа policy-blocked, это не принятый fix или общий запрет.

- **2026-10-17, после PR72:**20 контрактных/ownership-тестов выполняются в CI,
  expectedFailure gate исправлен с red/green proof; post Backend/Pages и7 активов
  проверены. Материалы68 сохранены и временно parked ради единственного causal
  diagnostic WIP75. Независимая интеграция validator73+domain62 прошла61+6 тестов,
  приёмкаPR/HTTP ещё впереди. Цель лучшеHRappka сохраняется через явные критерии.

- **2026-10-17, после PR64/70/67:** приняты Windows containment и проверка точной
  shallow-базы CI; оба post-merge Backend/Pages и семь публичных активов
  проверены. Контракт67 принят отдельно после независимых 20 тестов и свежего CI;
  домен62 и просмотр материалов68 остаются WIP, ownership-gate ещё отсутствует.
  Текущий интервал heartbeat прочитан как 15 минут; первоначальные 30 минут ниже
  являются историей создания. Пользователь повторно разрешил самостоятельные
  проверки, ревью и merge; это разрешение сохранено для дальнейших проходов.

- **2026-10-17, после PR53/55/56 и нового разрешения пользователя:** вход demo и
  offline-пакет больше не стоят в очереди; PR56 принят как локальное доказательство
  изоляции настроек/пустых миграций, post-merge CI/Pages успешны. Фронтенд PrimServ
  и переносимое серверное ядро развиваются отдельно через проверяемый контракт.
  Десять CI-путей переданы15; карта не выдаётся за hard lock. Создано регулярное
  продолжение техлида каждые30 минут; старые заявления о включении 15 заданий
  ниже остаются историей, а не состоянием новых автоматизаций. PR59 принят
  следующим проходом с успешными post-merge Backend/Pages и сверкой живых активов;
  сценарий denied-remove из PR61 причинно исправлен владельцем9 в принятом PR66,
  без изменения runtime. Контракт14 впервые опубликован в draft PR67;
  его приёмка и автоматический ownership-gate остаются отдельными шагами.

- **2026-10-17, после PR34/48/49:** из активной очереди удалены уже объединённые
  PR кабинета, локального ядра Django и переводов калькулятора. Добавлены точные
  tested head/base, merge и CI; старые draft/preview/fallback-ограничения больше
  не предписывают повторить закрытую работу. Следующая интеграция кабинета —
  существующий issue51 владельца1. Backend и оба инструмента остаются
  локальными, без новых серверов, реальных данных и публикации папок целиком.

- **2026-10-17, после ручного исправления GitHub:** опубликованы PR45/HYDRA10/
  приезд7/Bogatynia13; проверены Pages, публичные bytes и живые сценарии.
  PR50 включил Python CI; PR44/48 согласованы с базой без force-push и прошли
  собственные серверные проверки. PR49 больше не падает на fallback.
  Расписания и права этой работой не менялись. Записи ниже — история на их дату.

- **2026-10-17, разрешение на merge и чистку:** снят устаревший абсолютный
  запрет на удаление. Проверенные merge и обратимая чистка доказанных дублей
  выполняются без повторного согласия, с сохранением проверок, истории и WIP.
  Это изменение правил, не утверждение о выполненном merge/удалении.
  Передача существующих веток восстановлена в PR48 (Django core, draft) и
  PR49 (переводы калькулятора, draft с воспроизведённым сбоем fallback);
  задачи 1–15 включены с прежними ID/расписаниями. Приёмка PR42 и Python CI
  по issue47 остаются незавершёнными.

- **2026-10-17, после PR42:** план согласован с15 ролями и действующим часовым
  кругом. Устаревшая очередь и preview-блокеры отделены от текущей передачи;
  записаны PR45→PR44, незавершённый post-check PR42, отсутствие автоматического
  Python/ownership CI и конкретные владельцы подключения. Django разрешён
  отдельно локально, frontend не зависит от него. Код/настройки/расписания/
  права этой документационной правкой не меняются; merge этой правки ещё
  не означает включение недостающих проверок.

- **2026-10-17:** зафиксирована очередь пяти draft с точными head/CI, направление7
  переведено в «в работе», а не «проверено». Обнаружена небезопасная для новых
  local-first приложений упаковка Pages; создан один issue35 владельцу1 и
  оставлены замечания в PR33/34. Не изменены код чужих PR, права, расписания,
  настройки Pages или бот. Частичный preview-блокер не выключает всю работу;
  выпуск новых функций до обязательной приёмки не выполнялся.

- **2026-10-16:** создан этот единый реестр после сверки семи main, открытых PR,
  последних выпусков и успешных Pages. В дереве kiris-jobs до изменения были
  только три журнала отдельных исправлений, эквивалентного roadmap не было.
  В README добавлен один вход в план. Код, данные, медиа, настройки и кэш v220
  не меняются. Точный PR/head, полный результат тестов и публикации фиксируются
  в [PR30](https://github.com/OleksandrKiris/kiris-jobs/pull/30). Перед выпуском
  согласованы уточнения пользователя: 11 владельцев, офлайн-приложения,
  наблюдатель/очередь приоритетов, условия новых repo и пределы нагрузки.
  Будущие записи добавлять только при существенном
  изменении статуса, включая ссылки на незавершённую работу.

Критерии будущего завершения (не утверждение, что они уже выполнены):
базовые сценарии проверены без известных
блокирующих ошибок; coordinator demo использует только вымышленные данные;
реестр имеет подтверждённые источники; подготовка ко второму клиенту и ИИ
документирована и покрыта доступными тестами без включения сервисов. После
достижения этих критериев либо необходимости новых прав/бюджета/решения —
фактический итог и приостановка задачи, не бесконечные косметические правки.
