# Local canonical snapshot HTTP API — role 12

## Initial scope journal (before implementation)

Owner 12. Base: accepted PR77 merge
`3ad9f93f66776613443f767403cd239c4678d605`, tree
`c9938ac045610d4ba05318d520fc9d8ad9d1a006`. Previous role12 WIP77 is closed;
the open-PR preflight found no other role12 WIP. No equivalent materials route
exists: the common URL config currently falls through to the API404 handler.

Owner10 selected one local GET endpoint after reviewing the accepted OpenAPI.
Exactly five allowed paths:

- `backend/core/material_http.py`
- `backend/config/urls.py`
- `backend/tests/core/test_material_http.py`
- `docs/backend/core/material-http-response.md`
- `backend/core/middleware.py`

`GET /api/v1/materials/` will call the existing accepted
`contracts/materials-v1/local_mock.py::mock_api` with query pairs preserved,
then pass a successful document through the real accepted
`serialize_material_response`. The provider reads the canonical public
`snapshot.json`; it is not a new provider or a production/company API.
Contracts, dependencies, settings, domain13 and company-v1 boundaries stay
unchanged. No backend deployment, accounts, production DB, network adapter or
online mode is introduced.

The common URL is owner12's shared file. Middleware changes are limited to a
materials route log label and exposing the generated server request ID on the
request before the view. Material errors use accepted `{code, request_id}` and
the generated ID shared with response headers/logs. Client/provider IDs, headers,
cookies and private failure details are never forwarded. Existing body/rate/CSRF
guards retain their accepted core error envelope.

GET-only semantics, query validation, language fallback and errors follow the
accepted material contract. HEAD and other methods return405 with `Allow: GET`
without calling the provider or serializer. Responses are complete strict UTF-8
JSON within32768 bytes. Oversize returns500 `RESPONSE_TOO_LARGE`; malformed
provider/schema/encoding/configuration failures return500 `INTERNAL_ERROR`.

Proof plan: real canonical provider/snapshot parity for eight languages and
limits1/20; duplicate/unknown/invalid queries; route ordering; HEAD/write405;
matching body/header/log IDs and spoof resistance; actual32768/32769-byte
transport boundaries; redaction of injected provider/configuration failures
even with DEBUG enabled; preservation of source input and existing core guards.
Tests run offline with in-memory SQLite. One author backend run and ordinary
changed-head CI follow implementation and independent source review.

Rollback: revert this isolated five-path slice; no migrations or stored data.
No author merge/deploy. Exact head/base, source hashes and CI will be recorded
in the external current handoff after validation, avoiding a self-reference.

## Implemented local behavior

`core.material_http.list_materials(request)` is registered as `core-materials`
before the API catch-all. It serves only the existing public canonical snapshot.
The fixed repository reference module is compiled into an isolated namespace
without changing `sys.path`, `sys.modules`, or writing a bytecode cache. Neither
the module path nor snapshot path can be supplied by a request. This is an
explicit local integration with accepted reference code, not a replacement for
the future domain service or confirmation of current recruitment conditions.

All query pairs, including duplicate keys, reach accepted `mock_api`. The view
does not reimplement location, pagination, or language field rules. Successful
documents pass through the actual PR77 schema/strict-JSON serializer and are
returned without re-encoding or streaming. Content-Type is
`application/json; charset=utf-8`; Content-Length counts the returned bytes.
No-store/nosniff and the existing API protective headers apply.

Material errors rebuild only an accepted code and the middleware's server ID.
That body ID matches X-Request-ID and the structured log; client/provider IDs
and provider error fields cannot override it. Invalid provider statuses/shapes
fail500. Provider/schema/encoding/configuration exceptions are caught at this
specific transport boundary and become bounded `INTERNAL_ERROR` responses even
with local DEBUG enabled. This does not change Django's handling of failures
outside the provider/serializer boundary or impose a peak CPU/memory bound.

HEAD and other non-GET methods do not call the provider/serializer. They return
405 with `Allow: GET`; Django removes the body for HEAD as usual. CSRF remains
enabled and may reject unsafe methods with the pre-existing403 core envelope
before this view. Existing body413 and rate429 retain their original envelope,
limits, and retry behavior. Health/version and unknown-route behavior are
unchanged. Public Pages still excludes backend source and its documentation;
no backend server was published.

## Validation

The author backend runner passed68 tests (54 existing plus14 new HTTP tests),
with zero Django system-check issues and no migration changes, using in-memory
SQLite. Command: `python -B .github/scripts/backend-ci.py`.

The default GET and16 language/limit combinations use the real accepted
provider and snapshot and compare the complete returned document/bytes with
the reference. These canonical compatibility checks do not substitute a spy.
Separate injected transport tests cover exact32768/32769 byte boundaries,
unchanged input, malformed provider results, schema/encoding/nonfinite failures,
I/O/overflow redaction under DEBUG, method short-circuiting, and ID/header/log
correlation. Socket construction is prohibited and Django SimpleTestCase denies
database access in the HTTP cases. Source snapshot bytes remain unchanged.
Existing body/rate/CSRF guard regressions are exercised with the new route.

Independent read-only source review found no actionable defects. The reviewer
did not repeat tests or CI. Exact-head ordinary CI results are recorded in the handoff.
No additional local full-suite run is needed unless reviewed code changes.
