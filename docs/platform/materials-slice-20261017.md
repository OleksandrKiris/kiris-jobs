# Role 9: one source-backed material, local preparation

Owner: 9. Repo: OleksandrKiris/kiris-jobs. Allowed paths: coordinator-demo/**,
docs/platform/**. Existing WIP branch: primserv/t09/turkish-coordinator-demo;
remote b7ae5d2 had no role-9 changes or open PR. Continued that branch locally
by fast-forward, without creating a second WIP. The earlier Turkish locale draft
is not available in this checkout and has not been overwritten or claimed complete.

Tested base: fbf5683a1c253a2eb740e998d17c58addd64673c (fresh main after PR56).
Source content stays pinned to fc672d805fb884eb1d09bdc8ca342ba530ad83f4.
Dependency: role-14 local contract commit 870e7829640f93e9f68c4fe14a2edd6bfa1fbda9,
contracts/materials-v1/{response.schema.json,snapshot.json,local_mock.py}.
Contract acceptance and public SW revision are separate dependencies for release.

## Useful scenario and current map

- Already working: three fictional tasks, statuses, filters, v1 local storage,
  explicit corrupt/denied storage states and confirmed demo-only reset.
- No newly reproduced product failure: PR53/55 and issue54 are not reopened.
- Gap addressed: source-backed knowledge was absent. The coordinator can now
  search one accepted Russian summary, see its location, ID and pinned original.
- Explicit no-match gives no inferred answer. Search is only in memory; it is
  neither saved nor placed in URLs, and clears on reload. Task statuses keep their
  existing persistence. No employee records or external actions are introduced.

Material site-cleaning-summary-ru is exactly jobs[id=site-cleaning] title/summary
from data/content.js. Original location is Zgorzelec; zgorzelec is an explicit new
mapping agreed with role14, not a claimed pre-existing housing ID. It is never
mapped to Bogatynia. Source updated date remains 2026-07-23. The 2026-10-17 date
means verified-against-repository only, not verification of current employment
conditions, availability, rates or legal advice. No such conditions are copied.

The four existing UI languages explain material fallback to Russian. Requested
ua stays ua in the response, canonical comparison uses uk, effective language is
ru. Unsupported UI languages retain the existing explicit EN fallback.

## Implementation and checks

model.js contains the pinned snapshot, typed request boundary, read-only snapshot
reader and explicitly injected local JSON mock reader. Default is snapshot;
online mode is rejected. Both readers validate the same pinned required content;
v1 additive response fields remain compatible. The mock is a synchronous local
function, not HTTP. It does not make a Django endpoint available. Transport
query strings belong to the role14 mock; internal limits are integers.

`node --test coordinator-demo/test.cjs`: 33 passed, including existing storage
regressions, exact source text/date, aliases, search UI handlers, limit/cursor and
language validation, refusal of wrong location/source/schema/synthetic data,
malformed/oversize responses, additive fields and no external data APIs.

`node coordinator-demo/contract-parity.cjs <role14 contracts/materials-v1>`:
exact snapshot fixture plus 16 combinations (8 languages x limits 1/20) passed
against the actual Python local_mock, frontend snapshot and frontend JSON mock.
Python runs with -B; the other checkout is only read. This command is repeatable
after contract integration with the default contracts/materials-v1 path.

Syntax checks for model.js, app.js, contract-parity.cjs and browser-acceptance.mjs,
and git diff --check passed. Browser acceptance runner now includes source/search
and no-match checks while offline, but has NOT run for this slice. Its existing
CI-only guard is preserved. DOM tests do not substitute for browser acceptance,
screenshots, narrow viewport, keyboard, reload/Back or worker upgrade checks.

## Publication and remaining step

No new runtime files, dependencies, requests, backend, keys or service worker
changes. Same five runtime assets; byte totals are recorded in the delivery report.
Source links require internet when explicitly opened. Search/reading itself needs
no network after the files are present. CSP still has connect-src 'none'.
Role1 must coordinate the public SW/cache revision after accepting this exact head;
role10 alone owns merge and release. Existing PR55 generation protocol is untouched.
Rollback is a reviewed revert of this slice; the task storage format/key is unchanged.

Function: locally implemented and unit/parity verified. Contract: matches the
specified local role14 commit; not yet accepted centrally. Acceptance/publication:
not performed, no new remote PR, merge or deploy.

Historical block: the prior role9 chat reports that automatic security review
rejected code writes to GitHub for this WIP, but exposes no raw operation/reason.
No replacement GitHub write mechanism has been used. Local commit and patch are
authorized by the current task. Remaining step: resolve the exact historical write
refusal, then publish this existing branch through the permitted mechanism and
run approved exact-head CI/browser acceptance; hand SW integration to role1 and
acceptance/release to role10. Do not treat historical CI as proof of this slice.
