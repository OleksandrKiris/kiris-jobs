# Coordinator backend open telemetry

This test-only observation uses measured `Browser.getVersion` product, protocol
and pinned revision to select a source-supported profile. It does not access
Web Storage data. Unknown profiles remain unavailable; there is no fallback
probe, retry, delay or flush.

| Profile | Product / revision | Required histogram contract |
| --- | --- | --- |
| chromium141 | HeadlessChrome/141.0.7390.37 / 9f043f63b0e5b728c8d09f3e3ddfc1681a4bd58e | LocalStorage.DatabaseOpen; status codes 0–5 |
| chromium156 | HeadlessChrome/156.0.8078.4 / f842f52ef39fd97b449eb27cff414bf05a98ddce | Storage.LocalStorage.OpenDatabase.InMemory, .OnDisk and .OnDiskExperimental; status codes 0–6 |

Each capture records the literal version result and every configured histogram
request/result/error, then detaches the browser CDP session. The 156 family is
queried completely once at each existing observation boundary. Its source
equivalence is verified; availability of the new names in a real run is still
unobserved until an authorized changed-head CI.

A snapshot requires at least one positive valid member and no malformed or
unexpected-error member. An explicit `Cannot find histogram` response is a
missing member, never a fabricated zero histogram. Comparison requires at least
one same-name positive pair. Missing at both boundaries is explicitly
`absent-both`, with no delta. A one-sided, decreasing or incoherent member makes
the family comparison incomparable, even when another member is comparable;
partial evidence remains in the report. Disjoint positive boundaries therefore
fail the required gate. Unknown profiles and all-missing families also fail.

Integer bucket ranges must be unique/nonoverlapping, within the profile's enum,
with positive safe counts and coherent safe header count/sum. Cumulative deltas
receive the same coherence checks. Empty delta means no new visible open sample,
not a successful write/load. Status 6 exists only in the 156 schema and denotes a
database-engine error; it is not a legacy status coercion.

Functional coordinator scenarios, task assertions, calculator requirements,
native profiles and fixture provisioning are unchanged by this helper. Required
telemetry unavailable/incomparable still produces overall failure. Workflow
orchestration belongs to its existing owner. Old cc2 reports remain unchanged:
156 functional scenarios passed, old-name telemetry was unavailable and the
later calculator step did not run.

The signal is process-wide database-open metadata. OK can include memory-backed
or recovery opens; it proves no task KEY commit, GetAll load or disk durability.
CDP calls affect timing. This is not a root-cause fix for issue79, a public upgrade
test, or permission to accept/release PR68.

Primary sources: [141 callback](https://github.com/chromium/chromium/blob/9f043f63b0e5b728c8d09f3e3ddfc1681a4bd58e/components/services/storage/dom_storage/local_storage_impl.cc),
[156 open metrics](https://github.com/chromium/chromium/blob/f842f52ef39fd97b449eb27cff414bf05a98ddce/components/services/storage/dom_storage/dom_storage_database.cc),
[156 suffixes](https://github.com/chromium/chromium/blob/f842f52ef39fd97b449eb27cff414bf05a98ddce/components/services/storage/dom_storage/dom_storage_histogram_helper.cc),
[156 status enum](https://github.com/chromium/chromium/blob/f842f52ef39fd97b449eb27cff414bf05a98ddce/components/services/storage/dom_storage/db_status.h).
