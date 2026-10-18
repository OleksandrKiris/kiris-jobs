# Capabilities v1 handoff to owner12

Base: accepted `c032359519f1458e56963395bada7e0f711795da`. Coordinator10 approved
the exact five/five shape before owner14 implementation. This is one contract
handoff, not another roadmap. Owner14 owns only `contracts/capabilities-v1/`
and this document; owner12 owns later factory/HTTP/URL integration. Owner15 owns
existing backend-runner wiring. No company-context provider gap is bypassed and
no domain13 code is borrowed or changed.

Use `contracts/capabilities-v1/response.schema.json` and its public
`snapshot.json` fixture. Return protocol api_version/service/version plus
`capabilities.materials` contract/path/methods/languages/max_limit and
`data_source: local_mock`. Read actual protocol constants and canonical materials
OpenAPI at runtime/factory time; do not hardcode a second languages/limit list
or serve a stale fixture as dynamic capability truth. Canonical enum order is
part of fixture parity. No dynamic host/config enumeration.

GET-only `/api/v1/capabilities/`; HEAD405/AllowGET before factory/source reads.
Owner12 should preserve server-generated request ID/header/log correlation and
existing core errors, no-store/nosniff and pre-view guards. Source-read failures
must fail visibly and safely, never advertise guessed/default capabilities.
This contract does not install routes or assert implementation/runtime success.

Local verification belongs to the contract's nine tests, existing material and
ownership regressions, plus exact scope/diff checks. Owner12's real factory and
HTTP tests and owner15's CI wiring are separately attributed evidence. The
coordinator alone accepts/merges/releases; no backend deployment, real accounts,
production DB, online/AI activation or paid services are authorized here.

Rollback: revert this isolated contract slice; no stored data or migrations.
Exact reviewed head and ordinary CI are recorded in the external handoff after
commit, avoiding a self-referencing source pin.
