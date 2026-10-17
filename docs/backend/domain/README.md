# Role 13 · Synthetic coordinator task workflow (domain v0.1)

**Status: isolated pure-Python proposal; not a Django app or published API.**
This work is deliberately restricted to `backend/domain/`,
`backend/tests/domain/`, and `docs/backend/domain/`. It must not be added to
GitHub Pages or imported by browser runtime. No worker/candidate records,
HRappka connections, real invitations, storage, network sends, paid AI, or
production database are involved.

## First useful scenario

A fictional coordinator creates a fictional `preparation`, `arrival`, or
`open_question` task with revision 1 and status `todo`. A trusted server adapter
will later validate the shape of an update (exact fields `status`,
`expected_version`), independently determine the current organization from an
authenticated context, load a task scoped to that organization, apply the
status transition and persist atomically **once core 12 and contract 14 are
ready**. No adapter, route, identity provider, database or Django project is
introduced here.

Allowed transitions: `todo → in_progress | blocked`;
`in_progress → blocked | done`; `blocked → in_progress`; `done` is terminal.
Changing to the same status with the current version is a no-op; successful
changes increment the version. A repeated stale request conflicts rather than
being silently interpreted as a safe retry. This is optimistic conflict
*logic*, not yet transactional conflict *enforcement*: concurrent storage writes
will require an atomic conditional update from core 12. Idempotency keys and
canonical HTTP error envelopes belong to contract 14, not this module.

`validate_status_change_payload` rejects missing/extra keys, unknown status,
non-integer/boolean revisions and client-supplied `organization_id` or
`task_id`. `transition_task` raises `TaskNotVisible` on cross-organization
access **before** revealing a revision or transition state; this only reduces
information leakage. Actual authentication, scoping of DB queries and negative
API authorization tests must be supplied by the server adapter; no endpoint
has been declared secure merely because these functions exist.

## Local verification (Python standard library; no external requests)

From the repository root, with Python 3.10+:

```sh
python3 -m unittest discover -s backend/tests/domain -p 'test_*.py' -v
python3 -m compileall -q backend/domain backend/tests/domain
```

Tests only construct immutable fictional data in memory. Zero databases,
fixtures from real people, packages, external APIs, background tasks, caches or
network requests. Size and network runtime delta: 0 (no public runtime).
There is no HTTP or offline UI scenario yet; this domain library works without
a network after source checkout. It provides no offline synchronization.

## Dependency handoff (no changes outside owned paths)

**Owner 12:** add only the shared Django settings/URLs/dependencies and the
future persistence/API integration point through a separate reviewed PR. The
identity-derived organization, atomic versioned update and tenant-filtered
query are mandatory before exposing this logic. `python manage.py check`,
migration and temporary SQLite/API tests are blocked until a real Django
project and app registration exist. Do not create a second project here.

**Owner 14:** decide versioned route/payload/error envelope, authorization
semantics and retry key contract. The accepted `status`/`expected_version`
shape here is provisional and may be adapted after reviewing the canonical
contract, with dedicated adapter tests. Do not treat it as a public API.

**Owner 10:** do not publish the backend tree in Pages. Review tests and
changed paths before any merge. Rollback is a reviewed revert of this isolated
module, not a database migration or forced branch reset.
