# Explicit pinned source materials

Pin is a separate deliberate action from Read/last Return. A pin retains its
requested language; repeating Pin for the same ID is idempotent and never
changes that language. Remove then Pin is the explicit way to change it. The
pinned list is independent of source-text search. Open resolves the current
allowlisted material through the currently selected snapshot/mock reader,
restores requested language/fallback and focuses reading without saving last
pointer. Query, source, task filter and task bytes remain unchanged. Reload lists
valid pins but never opens reading automatically. Remove affects only the pin.

There is currently **one** real public ID: `site-cleaning-summary-ru`, with Russian
content and existing requested-language aliases/fallback. No additional
materials, business translations or conditions are introduced. Maximum5 is a
storage bound, not a claim that five materials are available.

The separate key `primserv:coordinator:favourites:v1` holds only
`{version:1,items:[{material_id,requested_language}]}`. Exact envelope/entry keys,
version1, unique IDs, length0..5 and raw UTF-8 size<=2048bytes are checked before
adoption. IDs come from the current canonical slice; languages use the existing
allowlist. Snapshots and nested entries are cloned/frozen. There is no key or
input coercion, automatic recent import, migration, repair, eviction or pruning.
Title/text/content/query/source/task/private/user/company/timestamp/URL fields
are never persisted. Invalid/future/duplicate/oversize records stay untouched.
A removed ID makes the record stale and supplies no open target. Until explicit
recovery clear, new valid choices may work only in page memory.

Denied reads/writes, quota and removal failures show an explicit page-only or
unconfirmed-removal notice. Recovery clear deletes only the favourites key. Pin,
Open, Remove and recovery never write task or last-pointer keys. Last Read,
last Clear and task reset never mutate favourites. User-visible titles/content
are resolved from the current reader and rendered with textContent, never from
stored arbitrary text.

Validation: parser/idempotency/privacy/cap/fault/cross-key/UI tests, existing
contract parity, and additive checks in the existing1280/320 native browser
journeys. Browser checks preserve earlier assertions, use keyboard Pin/Open/
Remove, prove reload no-autoopen and context/key isolation, and capture pinned
reading before removal. Clearly labelled corrupt and denied-write fixtures
affect only the new key after the original normal journeys; denied setter is
restored in finally. These are negative tests, not a storage fix. Actual browser
evidence must come from the normal changed-head CI; no local/IAB browser or
server is run. Historical last-material proof is not new favourites execution.

Scope is only the six coordinator model/app/index/style/test/browser files and
this document. Shared harness/workflows, published tools, rootdocs, contracts,
backend, dependencies, SW and audio are unchanged. Source/runtime acceptance and
release remain separate; root alone merges/publishes.
