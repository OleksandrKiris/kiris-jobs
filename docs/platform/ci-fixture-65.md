# Issue 65: file reload fixture reseeding

Owner9; repo OleksandrKiris/kiris-jobs. Allowed: coordinator-demo/browser-acceptance.mjs,
coordinator-demo/browser-fixtures.cjs, coordinator-demo/test.cjs, this document.
Base427a8e13421f94e3e22b5fe03c9934f065d50df1; no functional dependencies.
Branch codex/role9-denied-remove-fixture. Material commit9b6fa61 and its patch
remain saved in the separate original worktree, excluded from this urgent fix.

Failure: PR61 head9a3b653aaad4d3d676e399fc65119774745d639c,
run39046009208/job117434756744, browser-acceptance.mjs:157.
Downloaded artifact12105628289. Read acceptance.json and denied-remove trace;
viewed denied-remove-failure.png at320px. Trace call619 reads doing/done after
denied reset; call629 reads todo after reload. Runtime did preserve state before
navigation; the resulting todo/done exactly matches the original seed.

Executed original init function from base in Node VM with persisted doing/done
and an absent session marker: it overwrites doing with todo before app code.
This causally reproduces a fixture error; no product-state loss is demonstrated.

Move the fixture marker to localStorage, beside the record. Even if marker is
missing, never replace an existing record. Reinstall denial in every document.
Browser scenario now deliberately clears sessionStorage before denied-remove
reload and asserts persisted doing before reload, then doing/done after reload.
Original assertions remain; no sleep/retry. Runtime five files unchanged.

Local29 tests pass, including two-document reproduction, denial reinstallation,
and preservation of corrupt/future/edited content with missing marker. Syntax and
diff checks pass. CI-only browser guard preserved; exact-head CI pending when
this checkpoint was written. CI result belongs in PR metadata to avoid another
documentation-only rebuild. No merge/deploy, schedules or external submissions.
