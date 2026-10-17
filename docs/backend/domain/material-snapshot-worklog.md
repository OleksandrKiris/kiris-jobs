# Role 13: internal material snapshot validation, 2026-10-17

## Ownership and preflight

- Owner/repository: role 13, OleksandrKiris/kiris-jobs.
- Allowed paths: backend/domain/, backend/tests/domain/, docs/backend/domain/.
- Initial preflight base: fc672d805fb884eb1d09bdc8ca342ba530ad83f4. Final tested base after PR56: fbf5683a1c253a2eb740e998d17c58addd64673c.
- Fresh REST open pulls: empty; Backend 39043698095 and Pages 39043698088 success on that base.
- No AGENTS.md found. No competing local role-13 process/worktree found. Remote executions in other chats cannot be detected from this environment.
- PR44 is accepted; the old fictional-arrival draft branch is not resumed.
- One new WIP: primserv/t13/material-snapshot-validation, based on fresh main.
- Dependencies: Python standard library only. No settings, URLs, package, lockfile, workflow or shared file changes.
- contracts/ and docs/integration/ are absent in main; inspected owner-14 branch b6872bab4a86b10cd92ad1888fe5aa66bd0968e0 also has no contract paths.
- The Windows attachment path supplied in the task is unavailable here; it was not read.

## Result and evidence map

| Area | State | Evidence / next step |
| --- | --- | --- |
| Existing synthetic task transitions and A/B organization isolation | Working locally | Existing 18 unit tests retained and passed |
| Immutable read-only metadata and exact location/material lookup | Prepared locally | 9 new tests; synthetic fixture IDs only |
| Requested/effective language and ua alias | Prepared locally | Alias is retained in requested language; effective language uses uk; explicit fallback test |
| Missing metadata, unconfirmed status, invalid lookup | Rejected locally | Negative test cases, no mutation or I/O |
| Confirmed real material content and canonical API | Gap | Owners 14/9 select and verify an existing material and stable IDs before compatibility fixtures |
| HTTP auth, pagination, errors, API schema and online adapter | Not implemented | Owner 14 contract first; owner 12 alone handles shared integration |
| UI and live offline acceptance | Not applicable to this pure module | No frontend or runtime change; no UI/offline claim |

The function does not confirm content or authenticate users. A trusted loader must verify provenance and confirmation, and an authenticated adapter must scope any future lookup. A status string and reference alone are never proof of approval. Unknown/missing and cross-location IDs both return None. This is exact lookup, not search or tenant authorization.

## Three separate statuses

- Function: internal validation prepared with local unit evidence.
- Contract: unassigned / not agreed with owners 14 and 9. The internal dataclass is not an API schema. No production ID or approved content is invented.
- Acceptance/publication: pending owner-10 review. No merge, deploy, API route, server, database, online adapter, real message or scheduled automation introduced.

## Verification and handoff

From repository root:

```sh
python3 -m unittest discover -s backend/tests/domain -p 'test_*.py' -v
python3 -m compileall -q backend/domain backend/tests/domain
```

27 tests passed (9 new, 18 existing). No dependencies downloaded or external services used by tests. Final commit SHA and CI results are recorded in the PR/report, avoiding a self-referential SHA in this file.

Next: owners 14/9 review metadata needs against their first confirmed read-only material slice; adapt this internal DTO and add compatibility tests only against their pinned contract and verified provenance. Owner 12 receives any later URL/settings/dependency integration. Owner 10 reviews and controls merge/publication. No shared files require a handoff for this change.

Parent handoff received: owner 9 selected data/content.js jobsite-cleaning, mapping Zgorzelec to zgorzelec. Owner 14 has local contracts/materials-v1 on Windows, unavailable here; read_thread is not exposed. Exact fixture compatibility remains pending. PR56 core merge was fetched and this WIP rebased onto it without shared changes.

## PR67 compatibility preparation (same PR62 WIP)

Fresh main observed: e93dc59c6339a94020e955969a074c8c1d3a5956; latest main runs 39046564380/39046564372 success. PR62 remains draft at 374591c2e64e577b9c04518b9cc6c45cc799b2cd, no competing changes to its head. Reviewed the 11-file PR67 at 7225ba73c273c06c233053e157180eb434cb3723 through the connector. Contract remains UNACCEPTED per owner-10 handoff. Earlier fixture-access limitation is superseded by this published source.

Added a pure internal adapter, not a second schema: a required caller-supplied owner-14 JSON Schema validator runs before metadata mapping. No schema, query parser, mock API or HTTP route copied. Build version is supplied separately by packaging. Nested source provenance and repository-comparison status map into the existing internal DTO. Semantic checks reject inconsistent fallback, source/content revisions, item language, unsupported versions/pagination, synthetic and unverified items. No claim that repository comparison confirms current employment conditions.

The test fixture is byte-for-byte snapshot.json from PR67's exact head (path contracts/materials-v1/snapshot.json), copied only as a pinned test input under backend/tests/domain/. It preserves site-cleaning / site-cleaning-summary-ru / zgorzelec and source text. Six adapter tests cover eight languages, required validation, immutable inputs and negative semantics. Existing 27 tests retained; total 33 passed, compileall passed. The adapter tests inject a validator spy, so they are NOT full JSON Schema compatibility evidence: jsonschema is unavailable in this environment and no dependency was added. Full schema execution with the accepted contract remains an explicit integration gate for owners 14/12; the adapter is not wired to any runtime.

Function: local preparation complete. Contract: reviewed proposed PR67, not accepted; source version pinned. Acceptance/publication: PR62 remains draft for owner10. Online adapter disabled by absence of any wiring. No new PR, route, server, send, shared-file edit, merge or deployment. Shell git fetch is now blocked by network policy; connector reads/writes are the permitted route. Exact-head checks and CI are recorded in PR62.
