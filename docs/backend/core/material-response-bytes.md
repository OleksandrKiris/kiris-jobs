# Bounded material response bytes — role 12

Owner12 / OleksandrKiris/kiris-jobs.
Allowed paths: backend/core/, backend/tests/core/, docs/backend/core/,
backend/README.md if needed. No dependencies, schemas, domain, common URL,
settings or root CI edits.
Base: ace6655eff143e674dc93e07a3a8709e45d5d14c, accepted PR73.
Preflight: PR73 merged; postBackend39054980031 and Pages39054979967 successful.
No open role12 WIP. Search of core/tests/docs found no equivalent serializer;
only the accepted contract mock has a limit check and is not runtime core code.

One useful slice: validate through accepted material_response_validator, produce
strict JSON UTF-8 bytes in memory, enforce the accepted32768-byte serialized
response cap from contracts/materials-v1/README.md and OpenAPI. Return bytes only
on full success; reject schema/encoding/serialization errors generically, expose
no payload or partial bytes, preserve caller input. No business-rule duplication.

Dependencies: accepted canonical schema/validator from this base. Role13's PR62
stays separate and untouched; this pure helper has no domain/HTTP dependency.
No listener, browser, DB, secrets, online/AI or production tenancy involved.
No new schema validator, backend instance, settings profile or field rule.

Proof plan: canonical fixture round trip, actual32768/32769-byte boundaries,
multibyteUTF8, required schema/date errors, unsupported/cyclic data and nonfinite
numbers, immutable input and payload-free failures. Existing backend and accepted
contract checks retained. Tests use only public/synthetic in-memory fixtures.

API: `core.material_response.serialize_material_response(response) -> bytes`.
It returns complete compact JSON with raw Unicode, strict UTF-8, no NaN/Infinity
and string-only object keys. The schema-agnostic key walk prevents Python's JSON
encoder from silently coercing keys or creating duplicate object names. Field,
version and format rules remain solely in accepted material_response_validator.

MaterialResponseTooLarge identifies responses above32768 encoded bytes;
MaterialResponseError identifies schema-invalid or non-encodable input. Both
have fixed public messages. Input failures discard the original exception chain;
no payload is copied into error arguments, logged, written or returned as partial
bytes. Schema configuration/I/O errors remain explicit as in the accepted factory.
Raw traceback/frame-local dumps are outside this public error guarantee.

Tests use a schema-permitted additive padding field to reach exactly32768 and
32769 bytes without violating text-field length rules. A separate emoji/UTF8 case
proves encoded bytes, not character count, control admission. Other cases cover
canonical fixture roundtrip, required field/version/date failures, NaN/Infinity,
set/bytes/object values, unpaired surrogate, nonstring nested keys and cycles.
Success and failure preserve input; fixed exception messages, cause/context and
captured stdout/stderr/logs are checked. Socket creation is forbidden in tests.

Validation: Python3.12.14 / Django6.1.2, full backend runner54 tests PASS;
Django check0 issues; makemigrations check/dry-run no changes, in-memory SQLite.
Read-only independent code review found no actionable defect. Exact final head
and CI are recorded in PR metadata, avoiding a self-referential commit SHA.
Command: `python -B .github/scripts/backend-ci.py`.

Limitations: this is a pure helper, not a route or HTTP error mapper. It does not
add authorization/tenancy/content approval or change existing health/version.
The output cap applies to completed response bytes; it is not a peak-memory/CPU
bound on arbitrary Python objects during validation/encoding. No streaming sink
or listener exists. Online/AI/production remain off; dependencies/schema/domain/
settings/URL/rootCI unchanged. Public artifact/cache/request impact is zero.

Rollback: revert this isolated slice; no migrations or stored data involved.
Prepared for owner10's later acceptance slot; no author merge/deploy.

Python JSON behavior reference:
https://docs.python.org/3.12/library/json.html#basic-usage
