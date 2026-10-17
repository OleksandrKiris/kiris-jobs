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

## Local configuration regression checks

`test_local_configuration.py` imports dev/test settings in fresh isolated Python
processes with invented external database/cache/secret settings. Both remain on
in-memory SQLite and local memory cache; no production values are read. The
migration regression executes `migrate` twice against the runner's in-memory
SQLite and verifies the current empty migration graph and unchanged table set.
There are no persistent models yet; this is not evidence of future data migration
or PostgreSQL compatibility.

## Canonical materials schema (local only)

The accepted schema lives in `contracts/materials-v1/response.schema.json`.
`core.material_schema.material_response_validator()` returns a callback suitable
for the role13 adapter: `None` on success, a real `jsonschema.ValidationError` on
invalid data. It checks Draft2020-12 and date formats, and uses an empty registry
with no remote retrieval. Missing/broken schema fails explicitly. Business rules
remain in domain; this does not authenticate, serve or confirm the source content.

`jsonschema==4.23.0` matches accepted contract tooling. Directly imported
`referencing==0.37.0` pins the offline registry API (Python >=3.10; core >=3.12).
No format extras are needed for the current date-only schema. Django stays6.1.2.
Existing fixed dev/test settings and in-memory SQLite are used; no production
configuration or new settings profile is introduced.

The ordinary backend runner includes real canonical-schema negative tests.
The separate `docs/backend/core/verify-material-domain.py` is an explicit combined
proof command for a tree containing the role13 adapter. Missing adapter fails;
it is not silently skipped or claimed to run in main CI before PR62 acceptance.
Online remains off and no materials URL is installed by this slice.
