# Readable fictional demo progress summary

A readonly text summary is shown next to the existing JSON backup. It always
includes DEMO, all three fictional task IDs/titles and their current status,
and done/total across all three tasks. It is explicitly not a real work report.
No employee/candidate information, working conditions, material contents,
query/hash/URL, raw storage, favourites or last-material records enter this text.

The existing supported UI language EN/RU/UK/PL supplies task/status labels;
unsupported requested language uses the existing English fallback. The summary
is built only from the current in-tab demo task model and static UI copy, so
page-only changes remain visible and unconfirmed saving is stated. Every board
render updates it after task edits, reset or confirmed restore. Preview/Cancel
never import statuses. Filters and material search do not narrow its three-task
scope. A labelled button focuses and selects the readonly text using native
textarea selection. It does not copy, download, send, store or access the network.

The existing JSON backup envelope and flows, two-material source fixture/model,
all storage keys, limits, invalid/future preservation, backend and shared browser
helpers are unchanged. Existing textarea styles apply at narrow/wide widths.

Addressed tests cover all four languages, complete scope under filtering/search,
edit/reset/cancel/import/reload freshness, English fallback, page-only storage,
privacy markers and zero extra writes on text selection. Additive checks in the
existing native320/1280 journeys verify imported totals, full scope under a
filter/no-match search, native selection/focus and unchanged task bytes. They
remain source harness changes until normal changed-head CI is authorized; no
local/IAB browser or server is run. Counts are local targeted tests, not current
aggregate CI acceptance. Source patch/commit and before/after proof are retained
in role9 outputs. Only root may authorize push, CI, readiness and publication.
