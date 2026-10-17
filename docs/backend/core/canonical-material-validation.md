# Canonical material validation — role 12

Owner: 12; repo: OleksandrKiris/kiris-jobs.
Allowed paths: backend/core/, backend/tests/core/, backend/requirements.txt,
backend/pyproject.toml, backend/README.md, docs/backend/core/.
Tested base: bf0fd233d12cb80939addbabc9526156e871b67c (accepted PR67).
Depends on: canonical contracts/materials-v1/ from this base; joint proof uses
role13 PR62 exact head 177872e3a4a1ada304ab2f0e0d0b9e5ffa5f8119.

Preflight: fresh main equals accepted contract merge; postmerge Backend
39048649759 and Pages39048649677 succeeded. Previous role12 PR56 accepted;
no open role12 WIP. One dedicated checkout/branch. Domain files remain owner13.

Useful slice: supply the real caller-provided JSON Schema validator required by
PR62. Load canonical schema without a copy or second business-rule validator;
check the schema, enforce its date formats and disable remote reference retrieval.
Use current dev/test in-memory SQLite configuration. No URL, listener, online/AI,
production connection, user data or frontend changes.

Dependency decision: jsonschema==4.23.0 matches accepted contract tooling and
supports Python >=3.8. referencing==0.37.0 is directly imported to construct an
empty local Registry; pin it explicitly rather than rely on an implicit transitive
API. It was resolved with jsonschema4.23.0 under Python3.12.14. No format extras:
the accepted response schema contains date only, handled without extra packages.
Django remains6.1.2. Both direct dependency declarations must agree.

Official references:
- https://pypi.org/project/jsonschema/4.23.0/
- https://python-jsonschema.readthedocs.io/en/v4.23.0/validate/
- https://python-jsonschema.readthedocs.io/en/v4.23.0/referencing/

Validation plan: canonical fixture, missing required fields, wrong types/enums/
versions/IDs, maxItems, valid/invalid calendar dates, additive fields and offline
schema construction/validation. Separately run a reproducible integration harness
against unchanged exact PR62 domain files in a disposable combined checkout;
check fixture parity and schema-valid business contradictions without editing13.
No skip may turn missing domain code into success. No URL before joint evidence
and owner10 acceptance. Root CI remains owner15.

Results (Python3.12.14 / Django6.1.2): 46 tests on the role12+accepted-contract
tree; 61 backend tests on the disposable tree combined with exact PR62 files;
6 explicit integration tests including 16 language/limit combinations. Django
check: 0 issues; makemigrations --check --dry-run: no changes; uv pip check: all
10 installed packages compatible. Schema checks cover required fields unused by
metadata mapping, strict dates/leap day, limits and additive compatibility.
Combined proof preserves the existing synthetic company A/B workflow tests. The
public metadata adapter itself is not tenant authorization or persistence.

An initial harness input used fallback=False, already correct in the Russian
fixture. The negative input was corrected to True before the passing proof;
no domain/contract behavior was changed to obtain success.

Reproduce without touching any owner's checkout (ROLE12_HEAD is tested_head in
this PR; use the pinned PR62 SHA above, not an unverified newer head):

1. In a disposable directory, extract a git archive of ROLE12_HEAD.
2. Overlay a git archive of PR62@177872e3a4a1ada304ab2f0e0d0b9e5ffa5f8119,
   restricted to backend/domain/, backend/tests/domain/, docs/backend/domain/.
3. Create a private Python3.12 environment; install that tree's
   backend/requirements.txt. No production environment or DB is consulted.
4. Run from that tree:
   `python -B .github/scripts/backend-ci.py`
   `python -B docs/backend/core/verify-material-domain.py`
   The integration harness fails rather than skips if the domain adapter or
   canonical fixture is missing. Socket construction is forbidden during schema
   construction/validation and adapter checks; no online API is needed.

The ordinary main CI does not yet run the joint proof automatically because PR62
is unaccepted. The explicit harness supplies reproducible evidence for review,
not a claim of an installed HTTP endpoint. Root CI changes belong to15. The
CI-only jsonschema4.23.0/referencing0.37.0 pins reported by15 match these backend
pins and resolved dependencies; no backend/CI ownership overlap is introduced.

Limits: local full-checkout operation only; contracts must remain alongside
backend. The JSON Schema does not enforce serialized response bytes or the
query/HTTP error policy. Those remain a later accepted route/service slice.
Online/AI/production remain off. Synthetic domain regression tests do not prove
production multi-company access control. No cache/runtime request changes.

Rollback: revert this single role12 slice; no migrations or stored data to undo.
Prepared for role10 review; no author merge/deploy. Final exact tested_head and
CI status are recorded in PR metadata rather than a self-referential file SHA.
