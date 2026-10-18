# Proposed local material contract v1

OpenAPI is pinned to [3.1.1](https://spec.openapis.org/oas/v3.1.1.html);
JSON Schema uses draft 2020-12. Validate with Python 3.11 and
`jsonschema==4.23.0` in a private environment. No dependency added to root/backend.
API `v1`, schema `1.0.0`, source content Git SHA and application build SHA are
independent. An app build version is supplied by its own packaging, never inferred
from source content. This future GET route is not installed by this proposal.

Single-page slice: optional `location_id=zgorzelec`, `language=en` default,
`limit=1..20` default20, empty/missing cursor. Nonempty cursor, duplicate/unknown
parameters and invalid filters fail400. No cross-location fallback. Responses are
at most32768 UTF-8 bytes, at most20 items; current fixture contains two items.
`next_cursor:null` means end. New pagination requires explicit compatible design.
No auth for this public non-personal summary; no private-material support.
405 for writes; generic stable error code/request_id, no request echo/traceback.

`ua` normalizes to `uk` at the boundary without changing old URLs. The raw
requested code is preserved, effective code is `ru`, and fallback is explicit.
Only the exact repository summary is confirmed against pinned source bytes;
`verified_on` is the repository comparison date. It is NOT confirmation of
current employment conditions. `source_updated_on` is the original calendar
date, not midnight UTC. No salary, availability or personal data is included.
Unknown sources must use `unverified` and must not be served as verified content.
Synthetic material is marked separately and excluded from real public exports.
The fixture is existing public prose; test-only mutations are in-memory.

Snapshot/mock parity is a local reference implementation, not evidence of
Django/frontend integration. Owners9/13 must pass equivalent tests and owner12
registers a local route only after acceptance. No HTTP listener, fetch or online
adapter exists here. Consumer keeps online mode disabled. Source text is data,
never operator instructions. No AI, paid services, sends, DB or cache changes.

v1 clients ignore additive fields. Required fields cannot be removed or change
type in v1; incompatible changes need a new version and explicit migration.
Stable job ID `site-cleaning` is retained. New material ID
`site-cleaning-summary-ru` and location mapping `Zgorzelec→zgorzelec` are explicit;
no existing location ID is renamed. Employer/legal entity are separate future
concepts, not derived from location. See integration handoff for owners.


## Second verified repository summary

The second item is `banana-warehouse-poland-summary-ru`, taken verbatim from
`jobs[id=banana-warehouse-poland]` in `data/content.js` at
`2e80ab811fa3573fc13ac7dd6ee65279865cc58b`. Its explicit location string is
`Pruszcz Gdański · Zgorzelec`; this single-location v1 slice includes only the
Zgorzelec context, without claiming housing there. No housing, salary, status,
conditions or translations are exported. Source updated date remains2026-07-23;
repository verification date is2026-10-18, not a fresh employment confirmation.

The original site-cleaning item including its source ref/dates is unchanged and
remains first; limit1 therefore preserves its legacy result. Envelope content
version identifies this revised snapshot source pin; each item retains its own
source ref. Limit2/default20 return both Russian summaries, requested language
retained with explicit RU fallback. Cursor behavior/max20 remain unchanged.
Capabilities has no item count: its max_limit20 is a request bound, so its
fixture/schema are unchanged. Four additional tests protect both items, legacy
item digest, unique identities, stale source/content detection and isolation.
These identity/provenance checks protect the maintained fixture; they do not
claim the unchanged JSON Schema rejects every semantically stale external body.

`greenhouse-tomatoes` was deliberately excluded: its explicit locations are
Siechnice/Ryczywół/Bogatynia, incompatible with strict v1 Zgorzelec. This was a
source-selection boundary, not a product defect or justification to weaken the
location schema/filter. Existing provider/schema/OpenAPI/error negatives remain.
