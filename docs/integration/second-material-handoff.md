# Second materials summary — owner14 local handoff

Base `2e80ab811fa3573fc13ac7dd6ee65279865cc58b`; owner14 writes only materials
snapshot/tests/README and this journal. One local commit and patch for integrator9;
no push, separate PR, CI, backend/frontend edits or deployment by owner14.

Initial candidate greenhouse-tomatoes was rejected before fixture editing:
its source locations exclude Zgorzelec while accepted v1 schema/filter permits
only Zgorzelec. Root selected banana-warehouse-poland instead; its exact source
location is `Pruszcz Gdański · Zgorzelec`. This is a corrected source selection,
not a product defect. No schema/location/provider relaxation is needed.

New ID `banana-warehouse-poland-summary-ru`, job_id unchanged. Public title and
summary match the pinned data/content.js block verbatim. Source selector/ref,
calendar updated date2026-07-23 and actual repository comparison2026-10-18 are
recorded separately. HousingLocations is not a housing promise. No salary,
availability, condition or non-Russian translation is added.

Site-cleaning remains first and its complete item bytes/data are unchanged,
including fc672 source ref and original verification date. Envelope content
version advances to the current source pin. Limit1 keeps the legacy first item;
limit2/default20 expose both, with existing RU fallback and cursor policy.
Capabilities advertises max_limit, not item count; no capabilities files change.

Targeted verification: all13 material contract tests,9 capabilities tests and11
ownership tests; exact source block/legacy digest, duplicate and stale fixture
negatives, eight-language fallback and deep-copy isolation. Runner minimum for
materials grows9→13 only through owner15/root-owned integration. No existing
negative was removed. Root/9/12 own their later combined execution and acceptance;
owner14 local checks are not that future CI or production verification.

Full patch, source manifest, commit SHA and test command results are recorded in
the external current handoff. Rollback is the isolated local commit revert; no
migrations, stored data, network/AI or real personal data are involved.
