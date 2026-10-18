# Local capabilities API — role 12

## Initial scope journal (before implementation)

Owner12. Base: accepted combined84 merge
`c032359519f1458e56963395bada7e0f711795da`, tree
`702d29d17953b1d68a5ba6f602f93aaf8f39f5ae`. Component86 is merged/closed;
the role12 open-PR preflight is empty. One new prepared branch:
`codex/role12-local-capabilities`. No existing capabilities endpoint/factory
was found in accepted core/config.

Owner10 independently agreed the five-field response shape with contract owner14.
The role12-to14 message was not sent: its direct-human permission request was
not used. Implementation may proceed on root's approved shape; final schema
validation/commit/CI wait for owner14's exact verified contract pin.

Exactly five proposed owner12 implementation paths:

- `backend/core/capabilities.py`
- `backend/config/urls.py`
- `backend/core/middleware.py`
- `backend/tests/core/test_capabilities.py`
- `docs/backend/core/capabilities.md`

One function: local `GET /api/v1/capabilities/` reports existing core protocol
identity, `data_source: local_mock`, and actual materials contract/path/methods,
languages and maximum limit. Languages/order and limit derive read-only from
accepted materials OpenAPI. The response has exactly five top-level fields and
five materials fields; no duplicated language enum or business-rule source.

Contract owner14 alone authors `contracts/capabilities-v1/` and its fixture/schema.
The exact contract commit will be imported normally, with author/path provenance;
no manual duplicate schema or contract edits by12. Owner15 separately wires its
contract suite into the existing runner. Final candidate assembly/CI follows
coordination with owner10, avoiding redundant full CI runs per component.

GET-only; HEAD and other methods return405 `Allow: GET` before the factory.
The existing core error envelope, trusted server request ID, protective headers
and log policy remain in force. Malformed/missing canonical metadata/schema or
encoding failures return a bounded generic500 even with DEBUG enabled. A4096-byte
transport cap bounds metadata output without changing material field rules.
No provider, domain/company schema, settings, dependencies, online/AI mode,
production DB, or backend deployment is introduced. Shared URLs remain owner12's
single-writer file; middleware only gains the fixed capabilities log-route label.

Proof plan: actual Django Client GET validated against owner14 schema/fixture;
identity and exact canonical language/limit parity; real materials support for
advertised languages; GET-only short-circuit; immutable fresh documents; bounded
response and malformed canonical/schema/I/O failure redaction; generated header/
log IDs with client spoofing rejected; existing API/guard regressions. Targeted
tests first, then one final candidate backend/ordinary CI after exact dependency
pins. No actual network or DB data in HTTP tests.

Rollback: revert this isolated feature; no migrations or stored state. Owner10
retains merge/release; backend stays local. The permanently excluded chat is not
a participant or dependency.

## Implementation and targeted proof

The initial journal above records the pre-implementation decision and remains
historical. Owner14's exact preparation import is
`9c4d1f6ed4e47283942d2586b544ae726809565f`, based on
`c032359519f1458e56963395bada7e0f711795da`, tree
`3dab9e6150afcfa984d77acd0433e9a4db949788`. It was verified and imported by
fast-forward with owner14's authorship preserved. Root subsequently accepted
the independent source review of this exact contract and the owner15 runner
commit `45818545cf253ab4650a95d071518b680743fed1`, tree
`66896605307c92034e0a1357c1adb4bb68a343ee`, also based on `c0323595`.
Owner12 did not author or modify either dependency.

The owner12 feature remains exactly these five paths:

- `backend/core/capabilities.py`
- `backend/config/urls.py`
- `backend/core/middleware.py`
- `backend/tests/core/test_capabilities.py`
- `docs/backend/core/capabilities.md`

The implemented factory returns a fresh document, deriving identity from
`core.protocol` and ordered languages/maximum from the canonical materials
OpenAPI. It validates the result against
`contracts/capabilities-v1/response.schema.json` using the existing Draft2020-12
validator and an empty offline reference registry. The real canonical
`snapshot.json` matches the factory and actual Django Client GET. Tests also
exercise the real materials GET for every advertised language with the
advertised maximum, rather than treating structural schema validation as proof
of support. Protocol-version drift and injected source-order/maximum checks
separately establish that the factory does not freeze fixture values.

HEAD and other methods short-circuit with405 `Allow: GET` before factory reads,
when reached after the unchanged pre-view guards. Failures use the existing
nested core error envelope; no body request ID or new error taxonomy is added.
The server-generated response-header ID matches the structured request log and
ignores the client's supplied ID. Factory errors have a fixed public message
without the original exception context. Missing/malformed canonical metadata or
schema, unresolved external schema references, and HTTP encoding failures are
redacted; HTTP failures remain generic500 even with DEBUG enabled. Existing
body, CSRF and rate guards retain their core envelopes and precede the factory.

The first targeted module run completed **19 tests PASS in0.514s**, with Django
system check reporting zero issues. Evidence is retained in this chat's external
`outputs/role12-capabilities-targeted-tests.txt`. Tests use `SimpleTestCase`;
unused database setup was skipped and socket creation was blocked. These checks
make no database connections or external network/provider calls, use no accounts
and do not deploy; the existing local mock is exercised by materials GET parity.

The actual canonical GET is complete strict UTF-8 JSON with exact Content-Length
and is at most4096 bytes. A separate injected oversized factory result proves
that the HTTP transport rejects output above4096 with a bounded generic500 and
no partial document. This is not an exact4096-byte equality test or proof that
the canonical fixture itself is oversized. Injected unencodable output is also
separate from real canonical parity. The nineteen methods do not claim dedicated
duplicate-JSON-key or nonfinite-JSON-input coverage.

No full backend runner or CI has run for this candidate yet. Root approved
ordinary integration of the exact owner14 and owner15 commits with their
authorship and blobs preserved. One final candidate push/CI awaits root's
documentation pin and assembled-head source handoff. Targeted success does not
replace the final candidate gate. Runtime dependencies, settings, domain/company
boundaries and providers remain unchanged; this endpoint is local and has not
been published.
