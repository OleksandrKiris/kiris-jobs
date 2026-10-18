# Local material detail v1 — owner12

GET `/api/v1/materials/{material_id}/` serves the accepted canonical materials
envelope with exactly one matching item. The source contract is owner14 commit
`4fef25ee4bfd68181bc1bca62f5ec2451550e22e`, tree
`0d1d6112a4e958bf39f88b4ca5c5bf70bceec6bf`, based on accepted main99
`92dc5b64477de83a1d174ecba154c03bdb29922f`. It was imported by ordinary
fast-forward, preserving its author and seven source paths. Owner12 adds the
HTTP integration as a separate local commit. Acceptance and release belong to
root; this local implementation does not constitute deployment or Ready.

## Accepted HTTP behavior

- GET only. HEAD and writes return 405 with `Allow: GET`; Django suppresses the
  HEAD response body while retaining its advertised content length. Existing
  CSRF, request-body and rate guards can reject a request before the handler.
- IDs are ASCII lowercase letters, digits or hyphens, length 1..80. Malformed
  IDs return 400 `INVALID_MATERIAL_ID`; valid unknown IDs return 404
  `MATERIAL_NOT_FOUND`. The handler captures trailing-slash malformed variants,
  including empty IDs and decoded slashes/newlines, and rejects them without
  using any ID as a filesystem, module or provider selector.
- Only `language` and `location_id` are accepted. Duplicate or unknown keys,
  including list-only `limit` and `cursor`, return 400 `INVALID_QUERY`.
  Filter/language values use the accepted local reference rules. Default en,
  the visible ua alias, effective ru and fallback remain identical to the list.
- The canonical trailing-slash route precedes the API catch-all. Missing-slash
  and wrong-version routes retain generic core404 and do not redirect.

## Complete source before selection

The fixed local reference module is loaded without changing sys.path, a module
cache or bytecode files. It validates query filter values against an empty
in-memory source before reading the real snapshot. The raw complete snapshot
then passes the existing canonical schema, real-date and strict JSON/UTF-8
serializer, including the 32768-byte cap, before the reference list adapter can
apply its default 20-item slice. The full returned provider document is checked
again before lookup, and every material ID must be unique.

Consequently a malformed nonselected item, unsupported JSON representation,
invalid date, duplicate ID or over-limit full response cannot become a partial
success or be hidden by an unknown-ID 404. The two-item fixture and all source
objects/dates remain unchanged. No client limit truncates the lookup set.

After successful full validation, the handler constructs a new envelope with
one existing item. It validates owner14's detail `allOf` with its one-item
cardinality and local canonical `$ref`, then uses the accepted strict serializer
again. The registry contains only the canonical local resource; there is no
remote schema retrieval. No item schema, snapshot or source store is duplicated.

## Errors and request logs

Material failures contain only an accepted fixed code and the server-generated
request ID, correlated with `X-Request-ID`. Provider/client IDs, private error
fields, exception text and tracebacks are discarded, including under DEBUG.
Schema/I/O/encoding failures return bounded generic 500. Full byte overflow
returns 500 `RESPONSE_TOO_LARGE`; no response is streamed before validation.
Core body 413, rate 429/Retry-After, CSRF 403 and host 400 retain their envelopes.

The existing fixed log fields remain unchanged. Every non-list path in the
v1 materials prefix uses the constant `/api/v1/materials/{material_id}/` route
marker, including malformed paths and early guard failures before URL
resolution. Raw IDs, request paths, queries, headers and fault details are not
logged. Existing list and capabilities log markers retain their values.

## Local verification and ownership

The new targeted tests use Django Client/SimpleTestCase with blocked sockets
and no database setup. They cover both actual IDs in eight languages, exact
provenance, malformed/encoded paths, query/method rejection, full-source
corruption in both directions and before unknown 404, duplicates, byte bounds,
local schema failures, guard behavior and request-ID/log redaction. Existing
core regressions are run separately; their database use is in-memory only.
Verification: 12 HTTP tests plus 9 guard/redaction tests passed, together with
69 unchanged existing core tests. After strengthening the 21-item raw-source
case, that one test was repeated and passed. These cover 90 unique tests. The guard module was repeated after its final
helper refinements; superseded runs and exact raw outputs are distinguished
in the owner12 handoff.

Only owner12 core/config/tests and this document change in the implementation
commit. Domain 13, tests/domain and blocked PR62 remain untouched; no blocked
network operation is retried through another environment, file or provider.
Contracts remain the separate unmodified owner14 component. Owner 15 alone owns
the CI-runner update. There is no API server, real DB, user/tenant assertion,
online adapter or AI activation, push, PR, CI run or release in this handoff.

The original preparation journal is preserved in owner12 output history.
The permanent excluded-chat routing rule remains in the coordination handoff;
that chat is never used directly or indirectly for assignments or reviews.
