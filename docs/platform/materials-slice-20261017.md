# Role 9: one source-backed material

Owner9; repo OleksandrKiris/kiris-jobs. Allowed coordinator-demo/**, docs/platform/**.
Base e93dc59c6339a94020e955969a074c8c1d3a5956 includes accepted fixture fix PR66.
This resumes saved material patch9b6fa61 in codex/role9-material-snapshot; original
patch and branch remain preserved. It excludes the old Turkish locale draft and
its historically rejected write. Role10 expressly authorized this new scoped
material implementation. No second functional PR exists for the role.

Dependency: draft PR67 head7225ba73c273c06c233053e157180eb434cb3723,
contracts/materials-v1/{response.schema.json,snapshot.json,local_mock.py}.
The dependency is proposed, not accepted centrally. This client stays independent
of Django and has no online mode. Root SW/cache integration belongs to role1;
acceptance, merge and release belong to role10.

## Scenario and provenance

Already working: three fictional tasks, statuses, filters, v1 storage, explicit
corrupt/denied states and confirmed demo-only reset. PR53/55 and issue54 are not
reopened; no new product failure is claimed.

Gap addressed: coordinator can search one accepted Russian summary, see location,
stable material/job IDs, historical date and pinned original link. Source selection
switches between a snapshot and an explicitly local JSON mock in the same screen.
No confirmed match means no inferred answer. Search and source mode are memory-only
and reset on reload; task statuses preserve their existing persistence and format.
No employee data, background sync or external actions are introduced.

Material site-cleaning-summary-ru is exactly jobs[id=site-cleaning] title/summary
from data/content.js at fc672d805fb884eb1d09bdc8ca342ba530ad83f4. Original location
Zgorzelec maps explicitly to new location_id zgorzelec as agreed with role14; it is
not a claimed pre-existing housing ID and is never mapped to Bogatynia.
Source updated date stays2026-07-23. verified_on2026-10-17 means only
verified-against-repository, not current conditions/availability/rates approval.
No pay, availability, private contact or legal assertions are copied.

Four existing UI languages explain fallback to Russian. requested_language ua
remains ua; canonical comparison uses uk; effective_language is ru. Unsupported UI
languages preserve the explicit EN fallback. Existing task translations unchanged.

## Implementation and evidence

model.js contains the pinned data, typed query boundary and two read-only readers.
Default snapshot; mock is a synchronous JSON function, never a URL. Required data
is checked against the pinned slice; v1 additive fields remain compatible. Bad
requests, other locations, wrong provenance/text/schema, synthetic/unverified data,
malformed and over32768-byte responses are refused. HTML uses textContent; CSP
connect-src 'none' remains. Search is bounded to120 characters, never sent or put
in a URL. Future GET /api/v1/materials/ is not claimed available.

35/35 own Node tests pass including PR66 fixture regressions, source text/date,
alias/fallback, search/mode UI handlers, no-match, negative responses and storage.
`node coordinator-demo/contract-parity.cjs ../contract67/contracts/materials-v1`
passes exact fixture and16 combinations8languages x limits1/20 against actual
Python mock and both frontend readers. contract67 was exported with git archive
from fetched remote PR67 head7225ba73; another role checkout was not modified.
Syntax and git diff --check pass. Exact-head CI/browser results belong in PR body.

Browser runner retains CI-only guard and tests mode equality, search/no-match,
material language, existing keyboard/languages/reload/Back/storage faults/offline.
Local DOM tests are not browser acceptance. No fresh screenshots/CI are claimed
until that run completes; native-speaker and physical-device review not performed.

## Release boundary

Same five runtime assets, no new dependencies or network requests. Source link
needs internet only when opened. Reading/search work with downloaded files.
No root SW, packaging, workflow or backend changes. PR55 cache generations and
PR66 fixture protections preserved. Runtime byte delta is reported in PR metadata.
Role1 must prepare the public worker/cache revision after this exact head is
accepted; this functional PR alone is not evidence of an updated public offline
package. No merge/deploy or schedule changes by role9.

Rollback: normal reviewed revert of this slice; task storage key/version unchanged.
Function locally implemented and unit/parity verified. Contract matches proposed
PR67; central contract/client acceptance and publication are separate pending steps.
