# PrimServ — проверенный GitHub-инвентарь

Сверка: 17.10.2026, 17:36 Europe/Budapest. Владелец: роль10.
Это свидетельство состояния, не второй roadmap. Каноническая очередь находится
в [primserv-roadmap.md](primserv-roadmap.md). Перед записью или merge перечитывать
main, head и CI; перечисленные SHA не являются вечными guards.

Область: семь перечисленных репозиториев PrimServ и отдельно существующий
recruitmentbot. Остальной аккаунт не объявляется областью удаления или выпуска.
Ниже проверены GitHub metadata/Actions. Это не повторная браузерная приёмка
всех неизменённых сайтов.

| Репозиторий | Проверенный main | Открытые PR | Последняя успешная публикация |
| --- | --- | --- | --- |
| [OleksandrKiris/kiris-jobs](https://github.com/OleksandrKiris/kiris-jobs) | `fbf5683a1c253a2eb740e998d17c58addd64673c` | [#59](https://github.com/OleksandrKiris/kiris-jobs/pull/59) | [39045592744](https://github.com/OleksandrKiris/kiris-jobs/actions/runs/39045592744) |
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
- PR59: head `77977573f3bff01abf08e9dcc45629e39b71ca09`, base `fbf5683`, оба CI
  success (39045678838/39045678871). Исправление отмены активного Pages deploy
  подготовлено, не принято. Фактические прошлые отмены или количество предотвращённых
  сбоев не установлены. Требуется независимое ревью и наблюдение следующего выпуска.
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
- Роль14 подготовила read-only материалы и карту владения локально; роль10 независимо
  прочла и приняла передачу десяти CI-путей. Автоматический ownership-gate ещё не в main.

## Регулярное продолжение

Пользователь 17.10.2026 отдельно разрешил постоянное регулярное продолжение.
Локальный heartbeat `primserv-15`, статус ACTIVE, возвращается в чат техлида
`01a14a76-0279-7801-b2ef-6ae9b75066a5` каждые 30 минут. Настройка прочитана обратно.
Это один координатор существующих 15 направлений, а не 15 дублирующих cron-задач.
Другие расписания не изменены. Будущие срабатывания ещё не являются доказательством
выполнения; сохраняются WIP и exact-head evidence. Для локальных файлов необходимы
доступный компьютер и запущенный Codex. Фронтенд PrimServ остаётся самостоятельным,
бэкенд развивается отдельно на fixtures; реальные компании и production-данные
подключаются только по отдельному решению.
