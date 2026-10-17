# Coordinator file view state and native browser profiles

The old harness used `browser.newContext()`, an isolated, non-persistent context
(similar to incognito). Run 39050068735 captured an empty file storage view after
reload, before fixture writes or application startup. Run 39055093303 reproduced
that loss even in an on-disk profile: changing profiles alone was insufficient.
Both new native close/reopen checks passed in that run. The Chromium mechanism
is not established; unchanged reruns are not a fix.

For file URLs, language/filter changes now preserve the original path and query.
View state uses `#board?lang=uk&status=done` instead. Reload and Back restore this
fragment, with legacy query values as fallback. An explicit `status=all` in the
fragment overrides a legacy filtered query. The board fragment prefix and other
query values are preserved. HTTP/HTTPS URLs keep their existing query behavior.
This avoids switching the address of a browser-defined file storage area when
the view changes; no storage values are copied, replaced or migrated.

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

Only app.js runtime bytes change. The storage key/schema, Pages file allowlist
and worker are unchanged. Real offline file loading, zero network requests, keyboard/focus,
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

Validation: 38 local coordinator tests pass, including stable file queries,
fragment reload and legacy-filter overrides, profile isolation, same-directory
restart, and cleanup after initial/restart launch failure. Browser
results must come from the new exact-head CI artifact; no local CI-only harness
was launched. The previous failing diagnostic is preserved in PR75 and its run.
