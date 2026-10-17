# Catalogue shortcuts — issue 40

Prepared on 2026-10-17 against main `b6872bab4a86b10cd92ad1888fe5aa66bd0968e0`.
Exact tested head and CI/browser evidence are recorded in the PR, not inferred
from this date. This is not an installed-PWA or physical-phone acceptance.

## User result

Installed catalogue shortcuts now target existing search/contact elements.
Old `#home`, `#jobs`, `#profile` links continue to work. After rendering,
the corresponding main/search/contact element receives keyboard focus and is
scrolled into view. No contact link is activated and no application is sent.
Direct vacancy paths, `#job=...`, unknown hashes and the selected language,
search and filters are unchanged. No new storage key or migration is added.

Manifest: `./#main-content`, `./#job-search`, `./#footer-whatsapp`.
Cache: `kiris-jobs-v220-shortcuts-2026-10-17-1`; changed bootstrap/candidate
URLs add `shortcuts=1`. Other resource versions are untouched. Generated
vacancy HTML carries the same bootstrap URL. No new runtime resource/request,
font, media, dependency or external service is introduced.

## Offline and first launch

First successful HTTP(S) load is needed to cache the catalogue. Existing
cached language/search context then supports the same shortcut locally.
Never-opened devices are not covered; file:// does not install the SW.
WhatsApp, Telegram and HRappka still require internet and are not called by
the shortcut handler. No offline queue or candidate-data storage is added.

## Verification

Regression was run against the unmodified main source and failed because
`focusCatalogShortcut` did not exist. It passes after the change; all 25
accessibility tests pass locally. `npm test` was run: JS/unit checks passed
through accessibility, then asset validation stopped because the lightweight
local snapshot omits existing images/fonts. No bulk media download was done.
Full npm/packaging checks and exact-version browser acceptance must pass in
the existing authorized GitHub Actions checkout before readiness.

The CI browser matrix adds all six old/new anchors at 1280/320, keyboard
focus/viewport/language, corrupt/denied storage, Back/reload with saved search,
network-disabled reload and actual base-SW → head-SW upgrade on the same
local HTTP origin. The prior catalogue route/photo/form-link tests remain.
External requests/submissions are blocked. Screenshots, trace and JSON report
are CI artifacts outside Pages. Source tests alone are not browser acceptance.

## Release and rollback

Only owner10 may merge/release after fresh main/head, successful CI and review
of browser evidence. Revert through a separate checked PR, preserving any
later changes and using a new cache suffix; never reset/force-push or clear
user storage. Last base is the SHA above. Keep old public assets and forms.
The local calculator accepted in PR33 is not integrated by this change.
