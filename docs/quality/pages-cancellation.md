# Pages deployment cancellation regression, 2026-10-17

Owner: role 15. Repository: `OleksandrKiris/kiris-jobs`.
Initial audited base: `fc672d805fb884eb1d09bdc8ca342ba530ad83f4`.
Tested base after PR56: `fbf5683a1c253a2eb740e998d17c58addd64673c`.
Issue: https://github.com/OleksandrKiris/kiris-jobs/issues/58.
Branch: `codex/role15-pages-cancellation-guard`; one WIP.
Initial allowed paths: `quality/security/**`, `docs/quality/**`.
Workflow edits depend on explicit role 10/14 transfer from role 1.
Role 10 confirmed the exact transfer in the current role-15 chat on October 17;
role 14 records the matching ownership map. Root scripts/package/browser stay role 1.
Role 14 has recorded the ten exact existing paths in
`docs/integration/ownership-map.json` and the transfer evidence in its README
(observed in its current work log). This slice additionally edits only
`.github/workflows/pages.yml` and `.github/workflows/check-pr.yml`.

## Confirmed problem

`pages.yml` has workflow-level `group: pages` and
`cancel-in-progress: true`. This covers the writing `deploy` job as well as
read-only verification. A subsequent run can cancel an active deployment.
This is a configuration defect, not evidence that a historical deployment
was actually interrupted. Observed interrupted deployments fixed: **0**.

[GitHub concurrency documentation](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
describes cancellation of running workflows when that option is true.
The minimal correction keeps the serialization group and sets cancellation
to false. Pending runs may still be superseded; this does not promise that
every intermediate main revision will publish. Role 10 still owns release.

## Reproduction and regression

From the repository root:

```text
python -m unittest discover -s quality/security -p 'test_*.py' -v
python quality/security/pages_concurrency.py .github/workflows/pages.yml
```

Python 3.11.9 on Windows: 4 regression tests passed. Before the correction,
the second command exits 1 with `Pages workflow must not cancel an in-progress
deployment`; the safe fixture exits 0. The CLI regression verifies both real
exit codes and unchanged input bytes. No deployment is dispatched or cancelled.
The policy guard supports this workflow's literal mapping only; expressions,
aliases, duplicate mapping entries and alternate layout need manual review.
It is not a general YAML validator or a live GitHub lock.
After the correction, the real workflow exits 0. The existing Catalogue PR
job runs this regression and policy check before npm tests, using Python 3.12.
Local unittest discovery remains covered by the existing dedicated backend
gate; this change does not replace it or claim a general zero-test lock.

## Fresh audit evidence

- kiris-jobs main `fc672d8`: Backend run39043698095 and Pages39043698088 success.
- PR56 `a9ad1a43cee0e53bdb8b3dfa3f6c501462e504bb`: Backend39045160494
  and Catalogue39045160417 success. No duplicate role-12 implementation.
- HYDRA PR11: browser assertion failed on `b2ed637` in run39045212681;
  newer `39d18a2` passed run39045329094. This is not a current failure.
- Latest arrival, Dragon, Siechnice, Ryczywol, Bogatynia/Zgorzelec runs were
  successful at audit. This is a small metadata snapshot, not full product QA.
- Backend gate negative fixtures: 10/10 passed, including absent backend,
  zero discovered tests, failing tests and import errors.
- Existing local-prototype fixtures fail on this Windows host: the POSIX-only
  `../` containment check misclassifies Windows `..\\` paths, and symlink
  creation returns EPERM. Existing Pages fixtures additionally require GNU tar;
  Windows tar rejects `--hard-dereference`. These are separate follow-ups,
  not evidence of failed Ubuntu CI. Gates were not suppressed or weakened.

No cron, notifications, protection, billing, permissions, production settings,
candidate data, real submissions, or external services were changed.
Old domain-QA/PR44 write refusal was not retried; role 10 clarified that it
does not prohibit this separate CI operation. No live browser was launched.

## Acceptance and rollback

Prepared locally; role 10 must review the exact head and current CI before merge.
After merge, observe the next authorized real release; no artificial deploy
is needed to test cancellation. Rollback is a normal revert of this isolated
commit; it would restore the known cancellation risk. No schema/cache changes.
