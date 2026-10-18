# Explicit backup of fictional demo progress

This feature exports and restores only the three fictional coordinator task
statuses: demo-01, demo-02 and demo-03, each todo/doing/done. It is not a backup
of workers, candidates, companies or the PrimServ ecosystem. No real records,
notes, material contents/titles, URL, query, source, languages, favourites,
last-material pointer, company/user identifiers or timestamps are exported.

The exact JSON envelope is
`{format:"primserv-coordinator-demo-progress",version:1,statuses:{...}}`.
All three IDs are mandatory with no extra keys. Envelope/status own keys,
version/format and finite status allowlists are checked; malformed, unknown,
prototype-extra and oversized records are rejected. Input is at most2048 UTF-8
bytes (the textarea character limit does not replace byte validation).

Export is explicit and reads the current in-tab model, including page-only
status edits. It makes a readonly JSON snapshot available for manual copying
and attempts a local Blob download when supported. The UI says download was
requested, never that the OS saved a file. Missing/throwing APIs keep the manual
snapshot available. The temporary anchor is removed and the object URL revoked.
No import file picker or asynchronous FileReader flow is introduced.

Restore uses one paste textarea. Preview validates input and the actual own
storage key, captures its exact raw bytes plus current in-tab statuses, and
shows before/after for all three tasks. Preview and Cancel never write. Apply is
an explicit, one-use confirmation: reread and compare the exact actual own key
and in-tab statuses before writing. A different valid record, whitespace-only
change, invalid/future replacement, read failure, denied write or quota failure
aborts with no imported status change. Invalid/future original data remains
untouched; task reset remains its existing, separate explicit recovery flow.
No atomic or transactional cross-tab localStorage guarantee is claimed.

Editing import text, changing task/view/material context or entering task reset
cancels a preview. Reload retains neither input/output text nor pending preview.
The existing task lifecycle, reset confirmation, favourites and last-material
semantics remain intact. Backup writes only the existing task key; it never
writes material or view keys, changes query/source/filter/language, or calls a
network/AI/backend adapter. Four existing UI languages and English fallback are
supported, with keyboard focus for preview, cancellation and apply.

Validation: all27 status combinations roundtrip through export/parse/preview/
confirm; strict parser negatives and exact2048-byte boundary; no writes before
confirm/after Cancel; invalid/future/denied/quota preservation; exact-key and
stale-preview abort; page-only export and cross-key isolation; translated UI
flows and download success/throw/missing controlled fixtures. Previous82 unit
tests and all old browser assertions are preserved. Additive native320/1280
journeys cover manual export fallback, preview/cancel/confirm, context/isolation,
a second model changing the own key, malformed input and quota refusal.
Download/quota fault fixtures are labelled and restored in finally; they do
not establish native OS save or repair storage. Screenshots capture pending
preview. Current browser proof must come from changed-head normal CI, not
historical94 evidence. No local browser, IAB, server or mechanical rerun is used.

Scope: six coordinator app/model/index/style/test/browser files and this one
journal. Shared harness/workflows, root documentation, backend, contracts,
dependencies, service workers and published tools are outside this change.
Independent source/runtime reviews and root release remain separate.
