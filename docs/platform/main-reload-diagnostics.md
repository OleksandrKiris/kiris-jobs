# Main reload diagnostics, not a claimed fix

Owner9; repo OleksandrKiris/kiris-jobs. Allowed: coordinator-demo/browser-fixtures.cjs,
browser-acceptance.mjs, test.cjs, docs/platform/**. Basea8093c9e251f117dd113649fa82c3441ed5846e8 (fresh main; fixture/runtime unchanged from bf0fd233).
Branch codex/role9-reload-causal-diagnostics is the only active role9 WIP.
PR68 is CLOSED/PARKED, not merged, preserved at a41851cf8477584e5aeeff47b518e3577f7968df
with verified bundle/patch/manifest and its original branch. No material or public
cache work in this change. Root SW, workflows and runtime five files unchanged.

## Known evidence and limits

PR72/run39048985559/artifact12106594018: all five runtime hashes equal accepted
base; narrow done-filtered task absent after reload. Trace before navigation
contains saved-state UI and Done1/3. Thus material68 is not required for this symptom.

PR61/run39049003896/artifact12106678994: v1 call363 reads doing/done from storage,
call365 reads unrelated keep, call367 reloads, call373 reads native task value todo.
Failure screenshot shows todo/done. URL did not change. Neither query-change-only
nor absence-of-any-preread is sufficient to explain both failures.

Pure VM continuous storage preserves doing/done. Fresh storage causes fixture
seed and todo/done; stale storage already containing the seed causes todo/done
without a fixture KEY write. Native form restoration is another possibility until
raw and model are compared. Those are distinguishable hypotheses, not established
Chromium causes. A green diagnostic run alone will not establish a fix.

## One measurement run and observer effects

Eight original scenarios retain their storage operations, action order and all
assertions. No instrumentation/model facade is installed for controls. After a
control assertion fails, raw/marker/DOM can be inspected and labelled post-failure;
this never retries or changes the failed result.

Three passive scenarios cover wide/narrow empty and v1. They wrap the existing
Storage methods, recording returned values/writes and phase without adding a
storage read. The actual API factory returns its real model; a test-only facade
retains that model for snapshot comparison, without substituting storage/business
logic. This changes allocations/function identity/CPU timing, so is not invisible.
Existing focus-evaluate and v1 raw-read RPCs return larger evidence payloads;
those also can affect timing. After reload's existing readiness checks, one extra
evidence RPC records existing read results, initial/current model and DOM.

Three preseed scenarios add exactly one labelled raw read after the existing marker
read and before fixture writes. This explicit probe may affect IPC/cache timing;
it is a separate treatment, never called a durability flush or an implementation fix.
Navigation type/URL/timeOrigin/init time are observations, not a claimed browser cause.

Existing calls distinguish fixture and application phases. First application
getItem plus initial model identifies what the model consumed after fixture setup;
preseed raw/marker plus actual fixture writes distinguishes fresh reseeding from
stale data. Model snapshot vs task DOM distinguishes model state from native form
restoration. No secret or real account data is read: only fixed synthetic test keys.

Continue independent scenarios after failure to collect the paired evidence, while
retaining failed status and process exit1. Zero/unknown scenarios also fail. There
are no retries, sleeps, relaxed assertions, storage substitutions or local launch
of the CI-only harness. One exact-head approved CI follows this substantive delta.

33 local tests pass, including equality of passive/control storage call sequences,
exactly one extra active read, fresh/stale/continuous classification with real model,
and failure retention. Syntax/diff checks pass. Exact head/run/outcome will be in PR
metadata without a documentation-only rebuild. No merge/deploy by role9.

If no failure is captured, report the cause unresolved and retain the measurements;
do not rerun unchanged CI until green or claim that instrumentation fixed storage.
Only then propose a causal fix or an explicit supported-origin test policy for
independent role10 review. No silent weakening of file persistence acceptance.

