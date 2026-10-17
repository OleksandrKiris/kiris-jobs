# Exact event base in shallow PR checkout

Owner15; repository `OleksandrKiris/kiris-jobs`; issue69.
Initial tested base `30fee5af5afe8c3c7658cb5040100b130d5933ae`.
One WIP `codex/role15-exact-base-fetch`.
Allowed writes: transferred `.github/workflows/check-pr.yml`,
`quality/security/**`, `docs/quality/**`. No catalogue/module browser edits.

## Evidence

PR60 run39046250833 failed at `git show fbf5683:sw.js`, event head
`04069c01083a68c791b5aa8352c5e7b9cace2fb8`, base
`fbf5683a1c253a2eb740e998d17c58addd64673c`, checkout
`243b9bb07b666fafeadf5ae8bf089968052ade55`. The remote base contains the worker.
Depth2 only promises the synthetic merge and its immediate parents; it does
not guarantee an older event base after main moves. A developer merging main
can incidentally repair this, but it is not a durable CI policy.

Regression uses real temporary Git repositories and file:// shallow clones:
base contains an old worker, feature branches, main advances four commits,
then synthetic merge is cloned at depth2. The exact base worker read fails
before preparation, succeeds afterwards, and checkout HEAD stays unchanged.
Fixtures do not use GitHub, browsers, external services or user data.

## Bounded protocol

Before browser/tool installation, validate full event SHA values and require
the exact PR head to be a parent of the checked-out synthetic merge. If the
base commit is absent, fetch that exact SHA once with depth1, no tags and
blob:none. Require its worker file. Verify `git merge-base --is-ancestor` from
that exact base to the exact tested checkout. If shallow history prevents
proof, fetch only the exact checkout SHA at depth64 with blob:none once, then
require ancestry proof. No alternate base, checkout, merge, retry loop or
skip-upgrade path is permitted. Both subprocesses have a 60-second limit.

Maximum two explicit fetch commands; no fetch of every branch or unbounded
history. Blob filtering avoids historical media eagerly; Git may lazily fetch
the exact worker and subsequent old files needed by the existing upgrade test.
Actual transfer bytes depend on object reuse/server support and were not
measured on GitHub here. File:// fixture servers may ignore filtering.
If ancestry exceeds the depth64 bound or the server rejects the exact object,
CI fails clearly rather than weakening acceptance. This is an explicit limit.

Negative fixtures preserve failure for malformed SHA, stale head, unavailable
base, genuine missing worker and unrelated base with a worker. Repeated
preparation on already complete history needs no fetch. All existing backend,
static, packaging and browser gates remain required. New tests run inside the
existing quality unittest step; no additional workflow/run is introduced.

```text
python -m unittest discover -s quality/security -p 'test_*.py' -v
```

Recovery: normal revert of this isolated PR restores the shallow-base risk.
No runtime/cache/schema bytes, permissions, schedules or deployment changed.
Role10 reviews exact current head/base and CI and alone merges/releases.
