# PrimServ · Django core (local-only draft)

The published catalogue and recruitment bot remain independent. No real
users, candidate data, AI, Neon, external services or production settings.

Python 3.12+; install Django 6.1.2 once, then run on loopback:

```sh
cd backend
python -m venv "$HOME/.venvs/primserv-core"
. "$HOME/.venvs/primserv-core/bin/activate"
python -m pip install -r requirements.txt
python manage.py check --settings=config.settings.test
python manage.py test tests.core --settings=config.settings.test
python manage.py runserver 127.0.0.1:8000 --settings=config.settings.dev
```

Local routes: `/api/v1/health/`, `/api/v1/version/`.
SQLite is in memory only; no production database or migrations.
Pure no-dependency test: `python -m unittest discover -s tests/core -p test_stdlib.py`.

**Draft limitations:** active request throttling, payload-size enforcement,
structured request logging and corresponding negative Django tests are not
yet connected. Do not expose runserver publicly. Default Django request/server
logging is silenced to avoid URLs with personal query data.
Docs: `../docs/backend/core/api-v1.md`.
