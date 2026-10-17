# Windows evidence containment

Owner15, repository `OleksandrKiris/kiris-jobs`, issue63.
Base: `427a8e13421f94e3e22b5fe03c9934f065d50df1` (PR59 accepted).
One WIP: `codex/role15-windows-containment`.
Allowed writes: `.github/scripts/local-prototypes.mjs`, its existing test file,
and this report under `docs/quality/`. Exact CI paths were transferred by
roles10/14 from1; module browser runners remain with their module owners.
Dependencies: none beyond accepted PR59; no new runtime dependencies.

## Before and after

The existing `absent prototypes` fixture fails on Windows Node23.5.0 with
`Evidence must remain outside checkout/Pages`. `path.relative` produces
`..\evidence`, while the previous parent-prefix check only recognized `../`.
The sibling evidence directory was incorrectly classified as internal.

Use the separator belonging to the path implementation. Production calls use
the host's `node:path`; the pure helper is exported so Windows and POSIX
semantics can both be tested on the Ubuntu CI host. Keep realpath resolution,
explicit symlink checks, parent rejection and absolute-path rejection.
This fixes a false rejection, not a demonstrated production escape.

Added regressions cover root/child, legitimate `..notes` child, parent, sibling,
similar-prefix sibling, Windows different drive and different UNC share.
Existing evidence tests verify valid output as well as stale/failed/missing
evidence. No real browser or external request is needed for these fixtures.

```text
node --test --test-name-pattern 'containment|absent prototypes|browser evidence|reports cannot' .github/scripts/local-prototypes.test.mjs
node --test .github/scripts/local-prototypes.test.mjs
```

On Windows, targeted suite: 9/9 pass; previously failing absent-prototypes
fixture now passes. Full suite still exits1 solely at the existing symlink
creation fixture with EPERM. This environmental limitation is not suppressed;
full Ubuntu PR CI must pass before merge. GNU tar differences are separate.
No module runner, workflow, cron, permissions, deployment, public payload or
storage format changed. Role9 owns its independently reported coordinator
fixture failure and this change does not attempt to fix it.

Role10 reviews exact head/current base and CI before merge. Recovery is a normal
revert of this isolated change; that restores Windows false rejection. Runtime
and cache sizes are unchanged. The complete consumer CI remains required.
