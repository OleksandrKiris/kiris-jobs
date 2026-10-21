# Local material detail v1 — owner14 handoff

Base92dc5b64477de83a1d174ecba154c03bdb29922f, ordinary fast-forward integration
in the existing role14 branch after accepted99. No competing branch or PR.
Owner14 writes contracts/materials-v1 and this document only. No core/domain,
frontend, runner, production, DB, company or online/AI changes.

Proposed GET `/api/v1/materials/{material_id}/` returns the existing canonical
list response envelope with exactly one item. detail-response.schema.json uses
offline `$ref`/allOf to the unchanged canonical response schema, adding only
items cardinality1. There is no duplicate item schema or snapshot. Both stable
IDs retain exact identity/title/text/language/provenance; metadata and fallback
are inherited from existing read_snapshot. Default language en, requested ua
retained, effective ru/fallback explicit. Only location_id and language queries
are accepted; list-only limit/cursor and duplicate/unknown parameters fail400.
Strict ASCII lowercase/digit/hyphen ID1..80; malformed400 INVALID_MATERIAL_ID,
unknown well-formed404 MATERIAL_NOT_FOUND. These two codes add to the existing
error envelope without changing existing list error behavior. HEAD/writes405,
future HTTP owner12 must add Allow: GET and trusted server ID/header correlation.
The mock's local-contract-test ID remains test-only, never client/provider trust.

mock_detail_api is an offline contract adapter, not an installed route. It
rejects method/ID/query before source reads; validates the full source snapshot
against canonical schema and date formats, rejects duplicate identities, reuses
list filter/language/size rules, selects exactly one item, validates the allOf
detail representation and strict UTF-8 serialization. Schema/config/I/O/encoding
faults return fixed INTERNAL_ERROR, never an empty success or guessed material.
The offline Registry has only the canonical local schema resource and no remote
retrieval. Full source-list size checks remain conservative and fail closed.

Snapshot bytes, source dates/refs, first-item legacy, list schema/provider
behavior, max/default20 and capabilities semantics remain unchanged. A detail
404 does not certify tenancy/authorization. Repository verification is not
current employment confirmation. Frontend9 remains autonomous and does not
depend on this future backend route.

Six new targeted tests plus all existing13 materials tests exercise both IDs
across8languages, unknown/malformed IDs, invalid/duplicate/list-only queries,
method/source-read isolation, schema/date/duplicate/encoding/I/O failclosed,
cardinality and deep-copy isolation. Owner15/root will adjust runner required
count13→19 separately; this is a planned gate update, not a new issue. Existing
negative tests are retained. Owner12 later implements HTTP integration after
exact localcommit/patch/source handoff. No push/PR/CI/merge by owner14 here.
