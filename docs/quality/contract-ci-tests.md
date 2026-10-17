# Accepted contract regression execution

Owner15, `OleksandrKiris/kiris-jobs`, issue71.
Initial tested base `bf0fd233d12cb80939addbabc9526156e871b67c` (accepted PR67).
One WIP `codex/role15-contract-ci-tests`.
Allowed writes: existing transferred `.github/workflows/backend.yml`,
`quality/security/**`, `docs/quality/**`. No backend/core, contract, map or
checker source edits. Validator version is the accepted contract's
`jsonschema==4.23.0`; dependency coordination with owner12 is recorded in PR.

Before this slice, Backend/Catalogue CI did not execute the 20 accepted tests
under `contracts/materials-v1/test_materials.py` and
`docs/integration/test_ownership.py`. The existing Backend job now runs them
after its existing Django checks, in a separate temporary venv. All six
validator dependencies are pinned in `quality/security/contract-ci-requirements.txt`.
Backend requirements and its environment are unchanged. `pip check` is required.

The explicit runner requires at least nine materials and eleven ownership
tests, logs actual discovered counts, and fails missing, reduced, failed or
skipped required tests. Additions are permitted. Changing this baseline needs
review; this does not prevent deliberate malicious PR edits to test code.
Before running, it probes valid/invalid `date` format checking; no optional
format extras are necessary for these accepted date-only schemas. A future
new schema format requires its own dependency/probe review.

Local Python3.11.9 isolated environment: 20/20 accepted regressions passed,
including invalid dates, schema/source parity, unknown/foreign paths, eight
independent areas, map changes, dependency versions and real Git copy/rename
fixtures. Three runner regressions prove missing/empty/reduced suites fail,
an intentional failure remains failed, and skips cannot produce success.
`pip check` passed. Exact-head Python3.12 Ubuntu CI remains required.

```text
python -m pip install -r quality/security/contract-ci-requirements.txt
python quality/security/contract_ci.py
python -m unittest discover -s quality/security -p 'test_contract_ci.py' -v
```

This executes accepted regressions from the tested checkout, **not** a trusted
live ownership gate. It does not invoke check-diff on the live PR, read labels
as approval, claim a reservation, or install trusted caller/map inputs. Such a
gate needs a separately reviewed protocol. No new workflow, schedules,
permissions, deployment, online adapter, runtime assets or cache formats.
Role10 reviews and merges; normal revert removes this added test step only.
