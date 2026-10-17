# PrimServ · local Django core

Read-only local API scaffold, independent of the catalogue and recruitment bot.
No real users, candidate records, external services or production deployment.

Python 3.12+; install the pinned requirements in an isolated environment:

```sh
python -m venv .venv
. .venv/bin/activate
python -m pip install -r backend/requirements.txt
python .github/scripts/backend-ci.py
python backend/manage.py runserver 127.0.0.1:8000 --settings=config.settings.dev
```

Routes: `/api/v1/health/` and `/api/v1/version/` (GET/HEAD). Database and test
configuration use only in-memory SQLite. Pages excludes backend/ and docs/backend/.

API guards enforce a 16,384-byte body limit and a shared 120-request, 60-second
window per middleware instance/process. The counter is lock-protected, bounded
and stores no client identifiers. It resets on process restart. This is a local
resource guard, not a distributed production rate limiter; an upstream server
must bound request buffering and connections before Django in any future deployment.

API responses carry no-store, API version, generated request ID and protective
headers. JSON failures cover 400/403/404/405/413/429/500; 429 includes Retry-After.
CSRF remains enabled; unsafe requests without a valid token can return 403 before
the read-only view returns 405. Unexpected exceptions return generic JSON when
DEBUG=False. Development DEBUG=True can display Django diagnostics locally.

Structured logs contain only API version, generated ID, allowlisted method/route,
status and elapsed milliseconds. Paths, query strings, bodies, IPs, credentials,
headers and exception details are excluded. Django's request/server/security
loggers remain silenced. No log storage or external collector is configured.

`backend-ci.py` runs all core/domain test files and Django checks. Request guards,
concurrent admission, recovery, body boundaries, CSRF, errors and redaction are
covered by tests. See `../docs/backend/core/api-v1.md`.
