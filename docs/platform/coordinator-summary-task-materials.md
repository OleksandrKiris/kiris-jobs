# Demo summary includes explicitly linked material metadata

The existing readonly all-three-task summary now includes each explicitly
linked material's stable ID and saved requested-language code, using readable
EN/RU/UK/PL labels. It reads only the existing strict task-link store snapshot.
No effective language, read receipt, business assignment, content or provenance
is invented. Linking is still an optional DEMO choice, not an instruction or
proof of current conditions. Filters/search do not reduce the summary scope.

Save, per-task Clear and own-links Clear already render the board and now update
these summary lines. With valid empty/cleared links, the previous no-link summary
text is byte-identical in all four languages. Tests pin those exact base strings
by SHA256 without requiring historical Git commits in CI. Only linked tasks gain
an extra metadata line. Blocked/invalid/stale link state adds an honest warning:
only explicit in-tab choices are shown and persistence/reading is unconfirmed.
Corrupt/future/stale raw never becomes a link and remains untouched. Current
page-only choices are labelled as unconfirmed. Native readonly text selection
performs no read/write, sending, copying or download.

No new storage key, backup format, API, contract, backend, model, shared helper or
root documentation change is included. Existing source material content/dates,
pins, status/backup and task-link Open/Back behavior are preserved. The prior
context test captures its expected summary after explicit Save because the
summary intentionally gains link metadata; its Back/isolation assertions remain.

Targeted tests cover four languages, exact no-link bytes, all three task links,
filter/no-match scope, saved requested language across UI language changes,
Save/Clear freshness, page-only quota warning and readonly selection, corrupt/
future/stale preservation. Only these meaningful cases and the affected existing
Open/Back case are run locally. New hosted/browser acceptance is not claimed.
Source patch, raw unit log and exactbase/head/tree manifest remain local until
root acceptance and explicit authorization. No push/PR/CI/Ready/merge occurs.
