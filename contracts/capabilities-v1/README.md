# Public local capabilities v1

Owner14 contract, agreed with coordinator10 before implementation on accepted
base `c032359519f1458e56963395bada7e0f711795da`. Owner12 implements the endpoint
separately; this contract does not install a route or publish a backend.

The proposed `GET /api/v1/capabilities/` lets clients discover the existing local
materials capability without probing invalid queries. Response has exactly five
top-level keys: `api_version`, `service`, `version`, `capabilities`, `data_source`.
`capabilities` contains only `materials`, itself exactly five keys: `contract`,
`path`, `methods`, `languages`, `max_limit`. See `snapshot.json` for a public
valid fixture; no hostnames, internal configuration, secrets or company data.

Canonical values come from `backend/core/protocol.py` (`API_VERSION`,
`SERVICE_NAME`, `SERVICE_VERSION`) and the existing
`contracts/materials-v1/openapi.json` GET operation. Its language parameter enum
is copied in canonical order and its limit maximum is the advertised max_limit.
The schema defines nonempty unique language strings and a positive integer,
not another enum/limit authority. Test parity is mandatory: structural schema
validation alone cannot certify that advertised languages/limit are supported.
No new provider, rule framework or second materials validator is introduced.
The version schema accepts three numeric version components; the fixture must
match the actual service version rather than freezing `0.1.0` forever.

`data_source: local_mock` describes the existing repository snapshot provider;
it does not promise live conditions, online connectivity or backend deployment.
Materials methods remain exactly GET. This discovery endpoint is also GET-only:
HEAD and all other methods return405 with `Allow: GET` before factory/source
reads. For owner12 integration, use the existing trusted server request ID,
protective headers and core error envelope (`api_version`, `error.code`,
`error.message`), not a new business-error taxonomy. The materials endpoint's
separate `{code, request_id}` envelope remains unchanged. Pre-view body/rate/CSRF
guards retain their current behavior; this contract does not supersede them.
Success is complete UTF-8 JSON with no-store/nosniff; do not expose internal
configuration through a generic introspection mechanism. No HTTP client,
listener, ORM, auth, tenant or company capability is specified here.

Run locally with the existing private jsonschema environment:

`python -B -m unittest discover -s contracts/capabilities-v1 -p 'test_*.py' -v`

Nine test methods cover fixture/source parity, missing and extra fields at every
level, wrong kinds/constants, empty/duplicate languages, plausible but incorrect
language sets/order and positive limits, version drift and UTF-8 roundtrip.
Test-only parity assertions read the two canonical source files; they are not
production factory code. Owner15 wires these tests through the existing runner
in its own reviewed change. No new dependencies or CI files are added here.
