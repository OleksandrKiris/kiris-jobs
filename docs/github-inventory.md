# PrimServ — проверенный GitHub-инвентарь

Сверка: 17.10.2026, 17:36 Europe/Budapest; kiris-jobs дополнен после приёмки72. Владелец: роль10.
Это свидетельство состояния, не второй roadmap. Каноническая очередь находится
в [primserv-roadmap.md](primserv-roadmap.md). Перед записью или merge перечитывать
main, head и CI; перечисленные SHA не являются вечными guards.

Область: семь перечисленных репозиториев PrimServ и отдельно существующий
recruitmentbot. Остальной аккаунт не объявляется областью удаления или выпуска.
Ниже проверены GitHub metadata/Actions. Это не повторная браузерная приёмка
всех неизменённых сайтов.

| Репозиторий | Проверенный main | Открытые PR | Последняя успешная публикация |
| --- | --- | --- | --- |
| [OleksandrKiris/kiris-jobs](https://github.com/OleksandrKiris/kiris-jobs) | `a8093c9e251f117dd113649fa82c3441ed5846e8` | [#60](https://github.com/OleksandrKiris/kiris-jobs/pull/60) draft, [#61](https://github.com/OleksandrKiris/kiris-jobs/pull/61) draft, [#62](https://github.com/OleksandrKiris/kiris-jobs/pull/62) draft, [#73](https://github.com/OleksandrKiris/kiris-jobs/pull/73), [#74](https://github.com/OleksandrKiris/kiris-jobs/pull/74) draft, [#75](https://github.com/OleksandrKiris/kiris-jobs/pull/75) draft | [39049976240](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39049976240) |
| [OleksandrKiris/citronex-hydra-project](https://github.com/OleksandrKiris/citronex-hydra-project) | `02a1bfdb08b1ccf72e49113f57ca144ab14cd328` | [#11](https://github.com/OleksandrKiris/citronex-hydra-project/pull/11) draft | [39035254461](https://github.com/OleksandrKiris/citronex-hydra-project/actions/runs/39035254461) |
| [OleksandrKiris/przyjazd-do-pracy](https://github.com/OleksandrKiris/przyjazd-do-pracy) | `fe33e4c8f74990d6b90de90cd6dec6bf67799024` | нет | [39035276392](https://github.com/OleksandrKiris/przyjazd-do-pracy/actions/runs/39035276392) |
| [OleksandrKiris/citronex-dragon-guide](https://github.com/OleksandrKiris/citronex-dragon-guide) | `79fdd78cde1d3f46e1e8d9e17b6178a3e13a2d9a` | нет | [39016686598](https://github.com/OleksandrKiris/citronex-dragon-guide/actions/runs/39016686598) |
| [OleksandrKiris/citronex-siechnice-szkolenie](https://github.com/OleksandrKiris/citronex-siechnice-szkolenie) | `7de9b9531736fdc44ab299ecac21ad1c7457cc1c` | нет | [39022510232](https://github.com/OleksandrKiris/citronex-siechnice-szkolenie/actions/runs/39022510232) |
| [OleksandrKiris/citronex-ryczywol-szkolenie](https://github.com/OleksandrKiris/citronex-ryczywol-szkolenie) | `65ad74e8f4d5010d1a1189ba78cd01c29469214a` | нет | [39020651545](https://github.com/OleksandrKiris/citronex-ryczywol-szkolenie/actions/runs/39020651545) |
| [OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie) | `adadca034f3c0724564922209e05f91444a825fe` | нет | [39035291375](https://github.com/OleksandrKiris/citronex-zgorzelec-bogatynia-szkolenie/actions/runs/39035291375) |

## Приёмка и ограничения

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
  Документационный WIP согласован с новым main обычным merge;
  новый exact head должен пройти проверки и сохраняет draft до необходимой приёмки.
- HYDRA PR11: head `39d18a27881e07de5577fb216b84f038c6254700`, draft, CI39045329094
  success. Более ранний failure39045212681 относится к `b2ed637`, не текущему head.
  Непроведённая лингвистическая проверка не считается выполненной.
- Роли3/5/6/7/9/11 подготовили отдельные локальные commits/patches и адресные тесты.
  В передаче имеются исторические отказы отдельных GitHub write/PR операций без
  полного исходного ответа. Эти операции не повторялись другим инструментом.
  Не объявлять локальные patches опубликованными или общий запрет всех новых операций.
- Роль8 read-only сверила безопасные metadata: recruitmentbot current/active deployment37
  completed. Код v4 и canonical archive26 находятся в прежнем cloud/Library-контексте;
  байты candidate ZIP локально не получены. Соответствие исходников deployment,
  новый deploy и реальная отправка не выполнялись. Это отдельная зависимость передачи.
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
 и6 настоящих schema/domain integrations, включая16 сочетаний языка и лимита. Это не merge
 и не HTTP. Совместный73head5d00a7c/basea809 имеет прежние backend/deps/schema
 bytes и только accepted72 CI delta; независимое reviewclear,
 Backend39050175711/Catalogue39050175723 success. Merge73, затем62 иURL12 ещё впереди.
- PR68 CLOSED/PARKED, NOTmerged: exacta41851cf8477584e5aeeff47b518e3577f7968df,
 ветка сохранена; bundleverify/patch/manifest/metadata сохранены9. Независимо
 P3case исправлен red/green,36tests/16parity иCI39048930084/39048930092green,
 artifact12106589116:10browserPASS,0externalHTTP/errors. Runtime45 789B;
 appSHA2564c081403d2434593a4b5f7ec635277eff30d1e475d9b1976f1d45b92e0c111f0.
 Ранние initreads вno-prereadcontrols остаются; историческая причина не доказана.
 После fixturefix переоткрывать68; cache/SW интеграция1 до publicmerge обязательна.
- PR61@02485d33 run39049003896 и прежнийPR72@594 run39048985559 выявили разные
 reload failures mainfixture: v1todo!=doing иboard-narrowmissingdemo01. Старые
 входные raw подтверждены trace, initraw/marker нет. PureVM continuousstorage
 сохраняет состояние; fresh/stale input дают одинаковые сочетания статусов, причинного
 browserдоказательства нет. PR75@b808045/basea809 — единственный diagnosticWIP9,
 независимо подтверждены прежние8controls/assertions и33 unit-теста; измерения отдельно,observereffect указан.
 Catalogue39050068735 FAILURE(13/14), Backend39050068823 success; original8 иpassive3
 прошли. Независимо artifact12107372113 подтвердил initialKEY/marker=null доfixture,
 0fixtureKEYwrites/removals, первыйappget=null иrealmodelTODO. Для этого случая
 исключены fixtureoverwrite/nativeformrestore; storagewhy/связь со старымv1 не доказаны.
- PR74@3f5ddeb — подготовленная9-row HRappka evidence/gap matrix; исправлены
 live APIguide/S5→S6 и parked68. Это не второйroadmap или доказанное превосходство.

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
