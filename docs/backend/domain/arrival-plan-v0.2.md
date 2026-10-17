# Role 13 — fictional ordered arrival stages (domain v0.2 draft)

**Scope:** `backend/domain/arrival_workflow.py` and
`backend/tests/domain/test_arrival_workflow.py`. Standalone pure Python code,
no new Django project, routes, migrations, accounts, services or storage. This
is an addition to the accepted task workflow v0.1, not a replacement.

## Useful synthetic scenario

A fictitious coordinator works through exactly three illustrative stages:
`preparation → journey → arrival`. They are **not** a real legal, immigration,
transport or employee onboarding checklist. Each stage has `todo`,
`in_progress`, `blocked`, `done`. The next stage cannot be started or blocked
until every earlier stage is done. `done` is terminal; blocked stages must
resume before completion. A plan is complete when all three stages are done.

`SyntheticArrivalPlan` is an immutable snapshot. Every successful state change
increments one *plan-wide* version; an unchanged state is a no-op only when the
expected version matches. A stale version raises `RevisionConflict`. A caller
from another fictional organization receives `TaskNotVisible` before any
version/state details. There is no persistence, transaction or concurrency
synchronization: future database updates must enforce a conditional atomic
revision check.

The framework-independent `validate_stage_change_payload` accepts **only**
`{stage, status, expected_version}` and rejects wrong types, unknown values,
missing/extra keys and user-supplied organization/plan/task IDs. The request
shape is provisional and **not** the canonical API contract; owner 14 must
specify actual HTTP routes, versions, errors and idempotency before any adapter
exists. Identity-derived organization scoping and negative authorization tests
must be implemented with the real adapter, after owner 12's Django core is
accepted. Do not expose this as a live endpoint or connect real invitations.

## Reproducible local checks

From repo root, Python 3.10+ for pure unit tests, without dependencies:

```sh
python3 -m unittest discover -s backend/tests/domain -p 'test_*.py' -v
python3 -m compileall -q backend/domain backend/tests/domain
```

Tests use only in-memory fictional names and identifiers. A network is needed
to obtain the source initially, not to run the module. **No UI, HTTP service,
new download, cache, background process, cost or online/offline sync.** Backend
Django core12 is now accepted on `main` (PR48), but this pure module does
not register Django apps/routes or add models/migrations. Core CI should still
run Django check, migration check and the domain tests on the proposed commit;
HTTP API / negative authorization tests are not applicable until an adapter
is reviewed against the canonical contract. Do not claim an HTTP endpoint exists.

## Dependency and acceptance handoff

- **Owner 12**: Django core PR48 is accepted on main. Common URLs/settings,
  dependencies and API integration remain exclusive to this owner; no edits here.
- **Owner 14**: accepted canonical route/version/error/auth/retry contract is
  still absent on current main. Agree adapter semantics before adding Django API.
- **Owner 10**: review isolated three-file diff and unit evidence; backend remains
  excluded from Pages. Rollback is a reviewed revert of just these three files.

No production data, real organization, candidate, employee or HRappka fields
were consulted or created. This slice remains local until separately accepted.
