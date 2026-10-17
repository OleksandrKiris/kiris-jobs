# Coordinator file acceptance: native browser profiles

The old harness used `browser.newContext()`, an isolated, non-persistent context
(similar to incognito). Run 39050068735 captured an empty file storage view after
reload, before fixture writes or application startup. It did not identify the
Chromium mechanism. Re-running that same test until green would not fix it.

File acceptance now uses a fresh temporary **on-disk Chromium profile per
scenario**. Every original control, passive/preseed observation and assertion is
retained. There are no sleeps, retries, relaxed status assertions, storage-state
imports, fixture replays after failures, or browser flag workarounds. This changes
the supported browser mode; it does not prove a Chromium bug or repair incognito
file storage. The fourteen previous scenarios remain mandatory.

Two additional mandatory scenarios at 1280 and 320 pixels close Chromium and
reopen the same profile. They set statuses through the actual UI, preserve the
language/filter URL, and verify both the filtered and full task board after
restart. They never install a seed/init script or write storage from the test.
This checks native disk persistence beyond a same-process reload. Profiles are
isolated per scenario, removed after use, and never uploaded in evidence.

The five runtime files, storage key/schema, Pages artifact and worker are
unchanged. Real offline file loading, zero network requests, keyboard/focus,
languages, corrupt/future formats, denial paths, reload/Back and reset all remain
required. The existing staged public-package browser acceptance remains required.

Limits: file-URL localStorage is browser-defined. Normal Chromium with a dedicated
profile is the tested configuration. Incognito/private browsing, moving the
downloaded folder, other browsers and localhost HTTP persistence are not covered.
Do not infer that a successful write guarantees persistence in those modes.

References:
- https://playwright.dev/docs/api/class-browsercontext
- https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
- https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

Validation: 36 local coordinator tests pass, including profile isolation,
same-directory restart, and cleanup after initial/restart launch failure. Browser
results must come from the new exact-head CI artifact; no local CI-only harness
was launched. The previous failing diagnostic is preserved in PR75 and its run.
