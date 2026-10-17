# Isolated prototype acceptance contract

This is shared CI plumbing, owned by catalogue task1; requested by PR33/34 and
tracked under issues32/31. Module implementations belong exclusively to tasks11/9.
It adds no public route, Pages payload, account, backend or production integration.

The PR checkout includes the synthetic merge and its two parents (fetch-depth 2).
The existing pinned Playwright 1.56.1 / Chromium installation is reused once.
Registered modules only:

| Owner | Folder | Unit entry | Browser entry |
| --- | --- | --- | --- |
| 9 | coordinator-demo/ | test.cjs | browser-acceptance.mjs |
| 11 | offline-tools/shift-duration/ | test.cjs | browser-acceptance.mjs |

Absent module: explicitly not-applicable, not tested. Present module without
either entry: fail with owner/path, never silently pass. Module owners add their
own browser entry inside their existing PR, then synchronize this workflow via
main after owner10 accepts it. No copying module code into another owner's PR.

Browser entry runs only in CI with PLAYWRIGHT_PACKAGE, TESTED_HEAD, TESTED_BASE
and BROWSER_REPORT (module-specific directory outside checkout/Pages).
Do not install a second browser. No public preview/deployment or external API.
Run a downloaded file:// folder or bounded loopback fixture in the CI runner;
record the method and stop any server/browser in finally. This is not authority
to bypass local preview/sandbox/browser permissions in the agent workspace.

Write BROWSER_REPORT/acceptance.json containing:
- status: passed only after all mandatory scenarios succeed;
- head/base: exact 40-character provided SHA, not the synthetic merge SHA;
- browser: actual browser name/version;
- resources: runtime path and SHA-256, checked against TESTED_HEAD;
- scenarios: names, status, viewport, actions, results and limitations.

Also save screenshots/traces and request/error counts into BROWSER_REPORT. A
schema check cannot prove that a browser really ran: owner10 must review scripts,
logs, exact hashes, screenshots and offline evidence before readiness/merge.
Eight required themes: useful route, keyboard, languages/fallback, reload/Back,
narrow viewport, real network-off, storage failures/preservation, update/recovery.
Use only fixed fictitious/nonsecret fixtures. Never send forms/messages or read
candidate data. Do not call a narrow viewport a physical phone. Links may be
inspected without visiting external operational services. No hidden send queue.

No scripts/report means no module acceptance. Existing root npm tests and the
catalogue browser acceptance remain separate and mandatory. All artifacts have
7-day retention; local-prototypes summary may legitimately be not-applicable on
main until the isolated prototype is accepted. No new Pages or SW cache entries.

Regression tests: node --test .github/scripts/local-prototypes.test.mjs (12).
They use synthetic filesystem/process fixtures, not a browser, and verify missing
entries, symlink boundaries, stop-on-error, exact-head evidence, report isolation,
CI-only browser invocation and explicit absent-module handling.

Rollback: separate checked PR reverting these three added .github/scripts files
and the workflow additions; retain PR38 Pages packaging. Do not reset branches,
erase module saves or treat rollback as browser acceptance.
