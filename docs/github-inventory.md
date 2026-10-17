# PrimServ — проверенный GitHub-инвентарь

Сверка: 17.10.2026, после приёмки73 и наблюдения76; kiris-jobs main54b597. Владелец: роль10.
Это свидетельство состояния, не второй roadmap. Каноническая очередь находится
в [primserv-roadmap.md](primserv-roadmap.md). Перед записью или merge перечитывать
main, head и CI; перечисленные SHA не являются вечными guards.

Область: семь перечисленных репозиториев PrimServ и отдельно существующий
recruitmentbot. Остальной аккаунт не объявляется областью удаления или выпуска.
Ниже проверены GitHub metadata/Actions. Это не повторная браузерная приёмка
всех неизменённых сайтов.

| Репозиторий | Проверенный main | Открытые PR | Последняя успешная публикация |
| --- | --- | --- | --- |
| [OleksandrKiris/kiris-jobs](https://github.com/OleksandrKiris/kiris-jobs) | `558e6e75e85734e1895b323094d47a43a8792fde` | [#60](https://github.com/OleksandrKiris/kiris-jobs/pull/60) draft, [#62](https://github.com/OleksandrKiris/kiris-jobs/pull/62) draft, [#68](https://github.com/OleksandrKiris/kiris-jobs/pull/68) draft, [#74](https://github.com/OleksandrKiris/kiris-jobs/pull/74) draft, [#77](https://github.com/OleksandrKiris/kiris-jobs/pull/77) ready, [#82](https://github.com/OleksandrKiris/kiris-jobs/pull/82) diagnostic draft, [#84](https://github.com/OleksandrKiris/kiris-jobs/pull/84) docs draft, [#85](https://github.com/OleksandrKiris/kiris-jobs/pull/85) CI fix | [39065923321](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39065923321) |
| [OleksandrKiris/citronex-hydra-project](https://github.com/OleksandrKiris/citronex-hydra-project) | `533360d78af23d61bebaa3607d26b5af5b6cdd70` | нет; PR13 принят | [39067949384](https://github.com/OleksandrKiris/citronex-hydra-project/actions/runs/39067949384) |
| [OleksandrKiris/przyjazd-do-pracy](https://github.com/OleksandrKiris/przyjazd-do-pracy) | `fe33e4c8f74990d6b90de90cd6dec6bf67799024` | нет | [39035276392](https://github.com/OleksandrKiris/przyjazd-do-pracy/actions/runs/39035276392) |
| [OleksandrKiris/citronex-dragon-guide](https://github.com/OleksandrKiris/citronex-dragon-guide) | `3a7ea5e0b70abece336f41c00c31cf510928aaeb` | [#10](https://github.com/OleksandrKiris/citronex-dragon-guide/pull/10) draft | [39061616083](https://github.com/OleksandrKiris/citronex-dragon-guide/actions/runs/39061616083) |
| [OleksandrKiris/citronex-siechnice-szkolenie](https://github.com/OleksandrKiris/citronex-siechnice-szkolenie) | `7de9b9531736fdc44ab299ecac21ad1c7457cc1c` | нет | [39022510232](https://github.com/OleksandrKiris/citronex-siechnice-szkolenie/actions/runs/39022510232) |
| [OleksandrKiris/citronex-ryczywol-szkolenie](https://github.com/OleksandrKiris/citronex-ryczywol-szkolenie) | `65ad74e8f4d5010d1a1189ba78cd01c29469214a` | нет | [39020651545](https://github.com/OleksandrKiris/citronex-ryczywol-szkolenie/actions/runs/39020651545) |
| [OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie) | `adadca034f3c0724564922209e05f91444a825fe` | нет | [39035291375](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie/actions/runs/39035291375) |

## Приёмка и ограничения

- Аудит всех15 направлений: snapshots чатов, REST metadata и current artifacts
  проверены раздельно. Один author/source-reviewer/runtime-verifier, один current
  manifest; raw history не переписывается. Очередь и точные remaining gates —
  в единственном roadmap. Повторные неизменённые audits/CI/статусы убраны из поручений.
- HYDRA13 принят guardcbb35d46/baseb820 →533360d7. Independent99unit/66entries/6PNG,
  Pages39067949384 success и3public exact bytes подтверждены; OSclipboard fixture only.
- Внешний83 acceptedmain558: postBackend39065923209/Pages39065923321 success,
  tested/merged tree и7public runtime bytes совпали. Новые60/74 failures — git ancestry
  preflight до браузера; existing85 af008c86 независимо reviewed15, второго автора нет.
  Новые77d2cbb/base558 обаCIgreen/ready;68cc2/base558 mandatorygreen, но Chromium156
  histogram недоступен и diagnosticmatrixFAIL/calculatorNOTRUN. Это отдельные причины.
- PR78 принят guard611089b7/base54b597 →f89e0e4a: только два документа,
  независимое ревью clear. Exact Backend39062359825/Catalogue39062359944 success
  (module16/16, оба native restart). Post Backend39063588523/Pages39063588437 success,
  семь public runtime assets HTTP200 exact-tested bytes/tree58b58b09 совпал.
  Issue79 открыт: этот docs-only pass не исправляет непостоянный reload.
- PR56 kiris-jobs принят guarded merge `fbf5683a1c253a2eb740e998d17c58addd64673c`.
  Head `a9ad1a43cee0e53bdb8b3dfa3f6c501462e504bb`; 39 backend-тестов, 10 проверок
  CI-runner, Django check и проверка миграций прошли. Это локальная пустая SQLite,
  не PostgreSQL и не онлайн-бэкенд. Post-merge Backend39045592730 и Pages39045592744 success.
- На принятом main корневые index.html/SW и пять runtime-файлов по
  `tools/coordinator/` побайтно совпали с публичным HTTP-ответом. Прямой
  `/coordinator-demo/` намеренно не публикуется: упаковка переносит allowlist
  в `tools/coordinator/`. Полная новая browser/offline-приёмка здесь не выполнялась.
- PR59 принят guarded merge `427a8e13421f94e3e22b5fe03c9934f065d50df1` с exact
  head `77977573f3bff01abf08e9dcc45629e39b71ca09`. Четыре локальные регрессии и
  CLI policy guard повторно прошли; post-merge Backend39046140582 и Pages39046140524
  success. Корневые index/SW и пять runtime-файлов demo побайтно совпали с публичной
  версией. Фактических прошлых отмен deploy не установлено; исправлена конфигурация.
  Наблюдение следующего функционального PR на новой базе остаётся отдельным шагом.
- PR61 docs-only head `9a3b653` упал в Catalogue39046009208/job117434756744:
  coordinator-demo/browser-acceptance.mjs:157 denied-remove/reload: todo != doing.
  Предыдущие шесть сценариев прошли; дальнейшее причинное исправление fixture
  принято в66, см. ниже. Проверка не выключена и повтор вслепую не выполнялся.
  Позднее PR61 принят на head3f11c589, guarded merge3c2c73fb;
  post Backend39050890139/Pages39050890058 success, семь public bytes совпали.
  Старый failure не является состоянием принятого head.
- HYDRA PR11 принят: head `beb192c684dea9a770b8d8c9c29c69cad767af02`,
  base02a1bfd, CI39049963079 success. Дельта от ранее проверенного39d18a2 —
  только tests/browser.mjs; runtime/SW/переводы прежние. Независимо прочитан
  artifact12106809441:30 уникальных ka/tr/hy ×1280/320 ×5fault-case,
  guide целиком во viewport/clipping bounds с center hit-test,
  14 Tab stops с прямым/обратным циклом и wrap. Три guide-320 screenshot просмотрены;
  десять прежних сценариев и upgrade/offline сохранены, всего41 запись.
  Guarded merge0aaa156939e35d52506629d509abb3e5271d27e9, Pages39057041456 success;
  три публичных runtime bytes/index/sw/manifest HTTP200 совпали с tested head,
  оба treeSHA=b5a7e68525f30f37c37c670e575fef52ddc3b04b. Носитель языка,
  физический телефон, полные процедуры и внешнее обучение не проверены.
  PR12 принят отдельно на b8e5c00a/base0aaa, guarded mergeb820e85f:
  последняя публичная площадка/сброс, текущий язык/fallback, storage-denied limits.
  95 unit и CI39058694900 success;54 result entries/reportpassed,
  120 readability measurements и просмотренные1280/320 PNG. P2 layout44px исправлен.
  Промежуточный1ef5 безbase_tree_sha потерял26 файлов и отклонён; b8e5
  восстановил26 exactblobSHA, net без удалений. Pages39059220706 success,
  HTML117274B/SW3193B/manifest593B HTTP200 exacttestedbytes, treeSHA совпал.
  Следующий WIP2 — PR13@cbb35d46/baseb820, копирование публичной ссылки;
  автоматических отправок нет. CI39060090874 success, independent review clear:
  99 unit/66 entries/6 current PNG. Clipboard outcomes смоделированы;
  Принят533360d7; Pages39067949384/3publicbytes/tree594df011 verified.
- Dragon PR9@810125c0/base79fdd78 принят, guarded merge3a7ea5e0.
  Accepted binary blobs сохранены. Старый green31270 имел BASE-cache gate,
  не доказывающий HEAD-upgrade (issue81); de798 red выявил requestedtr loss
  после reload. Automatic fallback/manual language choice разделены;
  CI39060007333 success:144 unit/9 browser groups,5 current PNG и trace просмотрены;
  actual changed/activated HEAD/noBASE/offline HEAD notice+JS2770c8c0 exact подтверждены.
  Issue81 CLOSED, Pages39061616083 success и пять public runtime assets HTTP200
  exact-tested bytes. Старые недостаточные/красные proofs сохранены, не исправление79.
  Следующий WIP4 — PR10@6cb0c3dd/base3a7, публичная guide-ссылка/requested context
  и clipboard fallback. CI39062064278 success; independent review clear153unit/17browser,
  шесть current PNG просмотрены,7paths/no deletes/11binarysame/actualHEADofflineJS.
  OS clipboard — fixtures; late rejection unit/static, browser late resolve only.
  Frozen/draft, не merged/не опубликован; следующий guard отдельно.
- Pinned company-import source проверен отдельно на synthetic :memory: fixture:
  preview-valid/apply-UnicodeEncodeError на4 surrogate inputs, baseline unchanged.
  Private PROPOSED guard+test candidate:8 generic CommandError/SQL0/validemojiPASS;
  independent review clear. Actual TestCase: old10PASS, old11 с новой регрессией
  четыре preview FAIL/четыре apply ERROR, candidate11PASS. Источники/proposal immutable.
  Source repo/production не изменены, полного project suite
  или tenant isolation proof нет; это условие перед reuse, не внедрённый backend fix.
- Роли3/5/6/7/9/11 подготовили отдельные локальные commits/patches и адресные тесты.
  В передаче имеются исторические отказы отдельных GitHub write/PR операций без
  полного исходного ответа. Эти операции не повторялись другим инструментом.
  Не объявлять локальные patches опубликованными или общий запрет всех новых операций.
- Роль8 read-only сверила безопасные metadata: recruitmentbot current/active deployment37
  completed. Исходный v4 ZIP теперь получен:664425B/SHA256b0b33003…a79ee74,
  72 entries проверены. Owner local evidence:110 MiniApp/472 total tests/build PASS,
  preservation7c106d1/validation8933e5c, runtime/lockfile unchanged, deliverable ZIP+bundle.
  Canonical26/deployment-source correspondence и exactbuild browser acceptance
  не подтверждены; прежний administrator-blocked HTTP preview не обходился.
  Новый deploy, production/env/DB и реальные отправки не выполнялись.
- Роль14 опубликовала read-only срез и карту в PR67. Head2f26bf5 независимо
  прошёл 20 тестов: 9 материалов с JSON Schema/FormatChecker и 11 ownership,
  включая настоящие Git copy/source-edit/rename. Старый task-write пакет не
  перенесён. Head49f0e32 после интеграции70 повторно прошёл20 тестов и оба CI;
  выполнен guarded mergebf0fd233d12cb80939addbabc9526156e871b67c.
  Post Backend39048649759/Pages39048649677 success; семь публичных runtime-ресурсов
  побайтно совпали с main. Контракт принят отдельно, HTTP backend не опубликован.
  старый failure39047515282 относится к shallow base issue69. Десять CI-путей
  переданы вручную, live ownership-gate не установлен; запуск20 тестов позже принят72.
- Причина fixture failure из PR61 установлена до app: повторный seed при утрате
  session marker. PR66 принят на head604e627b2025328f2831ef8f2db738de90d20c99,
  merge e93dc59c6339a94020e955969a074c8c1d3a5956. Независимые 29 тестов, две регрессии
  падают на старой fixture; 8/8 browser-сценариев, просмотрены screenshot/trace.
  Post-merge Backend39046564372/Pages39046564380 success; семь runtime-ресурсов
  побайтно совпали с публикацией. Runtime не менялся; дефект app не подтверждён.
- PR64 принят на head224bd7eb253e25fcbc0733ed5d297a708903b607, merge30fee5a.
  Независимые 9 адресных и все 15 Ubuntu fixture-тестов, включая symlink rejection,
  прошли. Post Backend39047515522/Pages39047515502 success и 7public bytes совпали.
  Windows symlink EPERM остаётся ограничением среды, тест не отключён.
- PR70 принят на head7cfb3b0c392243e0a3011305b3b1106f99e4c8c6, mergea33a8e9.
  Исправлена недоступность точной shallow-базы issue69; 9 независимых тестов,
  post Backend39048252624/Pages39048252675 success, 7public bytes совпали.
  Не более двух явных fetch-команд, глубина64; это не измерение полного трафика.
  Ancestry/sw.js/upgrade guard сохраняются. Новые consumerheads проверяются
  отдельно; старые упавшие workflow не перезапускаются вслепую. В новых PR67/68
  helper и полные CI прошли, fetched=False: base уже доступен после merge.
  Живой missing-base fetch этим не доказан; его проверяют реальные Git fixtures.
- PR72 принят headdeb34683d2fb65b50376dd5b02cd8466a3ac9b36/mergea8093c9:
 20 принятых тестов и4 проверки runner прошли независимо; expectedFailure больше не маскирует
 падение. Post Backend39049976165/Pages39049976240 success,7 publicbytes совпали.
 Тесты выполняются в отдельной CI venv; Django environment не меняется, hardlock отсутствует.
- PR62 отдельно проверен как библиотека (33 теста); spy не доказывает schema.
 PR73@b41b6c6a независимо прошёл 46 backend-тестов, а combined73+62@177872e3 —61 тест
 и6 настоящих schema/domain integrations, включая16 сочетаний языка и лимита.
 PR73 принят на head98a30113/base3c2: backend/deps/schema bytes неизменны,
 независимое delta review clear, Backend39054315640/Catalogue39054315607 success.
 Guarded mergeace6655; post Backend39054980031/Pages39054979967 success,
 семь public ресурсов HTTP200 побайтно совпали с main. Принят локальный validator,
 PR62 и HTTP/URL12 ещё впереди. Backend не опубликован, production tenancy не доказана.
- Следующий helper12 подготовлен в PR77@d834881f/baseace6655:54 backend-теста,
  независимые8 регрессий/pip check и оба CI39055318327/39055318340 success.
  Фактический strict JSON/UTF-8 cap32768, без URL/domain/deps. Не merged;
  memory/CPU cap и production authorization не заявлены.
  Новый head7406378500892cf41a0400ce4da32b9958c42b71/base54b597 сохраняет эти bytes;
  Backend39056290992 SUCCESS, Catalogue39056291062 FAILURE в общем coordinator
  reload. Не готов к guarded merge; повторов ради зелёного нет.
- Продолжение62 в durable-чате13 не завершено: модель at capacity, а
  `/bin/bash -lc 'git status --short; git fetch origin main'` получила
  `Network access to "https://github.com:443" was blocked by policy.`
  Исходная команда/ответ сохранены; владелец подтвердил отсутствие доступного
  механизма разрешения сети, sandbox_approval отключён.
  Отказ не заменяется GitHub-записью через другой инструмент.
- Исторический PR68 CLOSED/PARKED, NOTmerged: exacta41851cf8477584e5aeeff47b518e3577f7968df,
 ветка сохранена; bundleverify/patch/manifest/metadata сохранены9. Независимо
 P3case исправлен red/green,36tests/16parity иCI39048930084/39048930092green,
 artifact12106589116:10browserPASS,0externalHTTP/errors. Runtime45 789B;
 appSHA2564c081403d2434593a4b5f7ec635277eff30d1e475d9b1976f1d45b92e0c111f0.
 Ранние initreads вno-prereadcontrols остаются; историческая причина не доказана.
 После76 тот же68 уже REOPENED draft, первый headc7a06df6/base54b597.
 Сообщены46 local+16 parity PASS; новый P3 profile setup-cleanup в работе.
 Независимая приёмка нового head и cache-gate1 до publicmerge обязательны.
 Head13dbd5c8 после адресного P3 cleanup:47 local+16 parity по автору,
 Backend39056223256 SUCCESS, Catalogue39056223259 FAILURE15/16 board-wide reload;
 оба actual restart PASS. Post-failure rawKEY=null/marker=yes при прежнем path/query
 не доказывает состояние до fixture или причину. Артефакт12109233074 сохранён;
 роли9/15 продолжают один разбор без mass rerun, новый head не принят.
 Следующий1895b595:51 local+16 parity PASS по автору, Backend39057614115SUCCESS,
 Catalogue39057614010FAILURE14/16, оба native restart PASS. Все12samples/шесть пар
 сообщают одинаковые target/context/storageKey, но observed-v1 initial raw/marker
 после reload=null до fixture. Внутренняя identity/причина этим не доказаны;
 bounded primary-source research не нашёл подтверждённого upstream fix. Issue79 открыт.
 Same68 следующий704961af/base54b: один отдельно разрешённый CI показал12 доступных
 literal backend-open histograms (count1/sum0/OK), шесть zero-delta pairs.
 Catalogue39063668245 red15/16 observed-v1-preseed, Backend39063668373 success;
 native2 PASS. Это не KEY commit/load proof. Synthetic parser P2 принят в работу;
 actual12 coherent, local correction отдельно на ревью, не исправление79.
- Внешние diagnostic82@f319 и fixture83@462 — draft, не приняты.
  Current82 fixed3samples/version:1.56.1 триsuccess/1.64.1 триfailure; init1.64
  16/18, ready-once vs init-each-document confound. Три rawlogs просмотрены.
  Exact83:42unit/6×16browser PASS, но mandatoryCatalogue39063711982 red позже
  в shift-duration/corrupt; future/denied NOTRUN. Owner11 разбирает новый случай;
  source/runtime proof и global gate отдельно, без вывода о причине/storage fix.
  После этого PR83 перешёл наd4db033a; новая delta/CI ещё не приняты.
  Source clear и прежние42unit/6×16 относятся только к46209753.
- PR61@02485d33 run39049003896 и прежнийPR72@594 run39048985559 выявили разные
 reload failures mainfixture: v1todo!=doing иboard-narrowmissingdemo01. Старые
 входные raw подтверждены trace, initraw/marker нет. PureVM continuousstorage
 сохраняет состояние; fresh/stale input дают одинаковые сочетания статусов, причинного
 browserдоказательства нет. PR75@b808045/basea809 — исторический diagnostic9,
 теперь CLOSED, не merged;
 независимо подтверждены прежние8controls/assertions и33 unit-теста; измерения отдельно,observereffect указан.
 Catalogue39050068735 FAILURE(13/14), Backend39050068823 success; original8 иpassive3
 прошли. Независимо artifact12107372113 подтвердил initialKEY/marker=null доfixture,
 0fixtureKEYwrites/removals, первыйappget=null иrealmodelTODO. Для этого случая
 исключены fixtureoverwrite/nativeformrestore; storagewhy/связь со старымv1 не доказаны.
- Supported-origin policy75 принята только для реализации: восемь обязательных
 semantic assertions на фиксированном HTTP origin плюс отдельный file:// offline UI,
 публичный SW/offline gate остаётся у1. Локальные code/helper статически reviewed clear,
 runtime/SW неизменны, нового remote head/CI нет. Запись карты в
 docs/platform/main-reload-diagnostics.md через exec_command/PowerShell Set-Content
 с последующими checks отклонена до исполнения: blocked by policy, подробностей нет.
 Исходный caller request, видимый усечённый ответ и unapplied patches сохранены;
 Для этой неприменённой HTTP-передачи README/doc расходились.
 Тот же HTTP rewrite не записывался другим способом.
 Для75 upgrade=N/A; будущий68 требует реальных old5tool→new5tool, per5interrupt,
 last-good и tool status после reconnect: нынешняя root-shell overlay этого не доказывает.
- PR76 из отдельного пользовательского чата MERGED54b597 на head2ffee86e;
  file view-state теперь fragment при стабильном query. Profile-only15/16 red
  сменился exact-head16/16:14 controls+2 настоящих Chromium restart без replay.
  Независимо прочитаны artifacts12108814444/12108648711 и traces, два PNG просмотрены.
  38 unit и оба PR CI success; post Backend39055542656/Pages39055542734 success,
  семь публичных HTTP200 bytes совпали с54b597. Это не второй merge координатора.
  Normal-profile сценарий подтверждён; все исторические причины/другие браузеры
  и старый опубликованный5tool→новый5tool/per5failure/reconnect ещё не доказаны.
  SW прежний; owner1 добавляет gate в60, необходимость bump определяет по результатам.
  Документ76 — исторический diagnostic/native-profile follow-up, не отклонённый
  HTTP rewrite75. Материалы68 продолжаются в существующем PR после сохраненияa418.
- PR74@d3345af8 — подготовленная9-row/30refs HRappka evidence/gap matrix; исправлены
 live APIguide/S5→S6 и parked68. Это не второйroadmap или доказанное превосходство.
  Последняя адресная фраза запрещает обход сетевого отказа13 другим инструментом;
  Backend39057556666SUCCESS, Catalogue39057556741FAILUREcoordinator, draft.
- PR60@3876a64a/base54b597 содержит fix80 неполного первого скачивания tool-body.
  Независимый VM red/green: новый24PASS, старый40ed с тем же testfile19PASS/5coldFAIL,
  реальное потребление streams в Cache.put mock. ExactCatalogue39057420518:
  каталоговый этап33PASS (18old+10warm+5cold503/recovery), последующий coordinator
  file-gate79FAILURE; Backend39057420520SUCCESS. Не merged/не опубликован.
  Это proof ace6655→76/60, будущие5runtime68 отдельно. Подробности в issue80.

## Регулярное продолжение

Пользователь 17.10.2026 отдельно разрешил постоянное регулярное продолжение.
Локальный heartbeat `primserv-15`, статус ACTIVE, возвращается в чат техлида
`01a14a76-0279-7801-b2ef-6ae9b75066a5` каждые **15 минут**. Настройка прочитана
обратно и сохранена; при создании интервал был 30 минут.
Это один координатор существующих 15 направлений, а не 15 дублирующих cron-задач.
Другие расписания не изменены. Будущие срабатывания ещё не являются доказательством
выполнения; сохраняются WIP и exact-head evidence. Для локальных файлов необходимы
доступный компьютер и запущенный Codex. Фронтенд PrimServ остаётся самостоятельным,
бэкенд развивается отдельно на fixtures; реальные компании и production-данные
подключаются только по отдельному решению.
