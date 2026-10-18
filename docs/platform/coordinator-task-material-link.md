# Explicit links from fictional tasks to public materials

Each of the three fictional DEMO task cards offers a deliberate material choice
from the two existing source-backed materials. Choosing an option alone does
not save. Save chosen link explicitly binds that task, selected material and
requested language. Clear this link removes only that task's choice; a separate
Clear only task material links action is own-key recovery. Nothing is assigned
automatically and linking does not turn a generic fictional task into an
instruction or prove current working conditions.

The new separate key is primserv:coordinator:task-material-links:v1 with exact
`{version:1,links:[{task_id,material_id,requested_language}]}`. It permits only
three allowlisted demo IDs, two current material IDs and existing requested
languages; maximum3 unique task links and2048 raw UTF-8 bytes. Unknown keys,
versions, duplicate tasks, malformed or excessive data are rejected. Unknown
or unavailable IDs are stale and never substituted with another material.
No content, source body, notes, URL, context, timestamp, user/company/candidate
or other private data is stored. Snapshots are cloned/frozen. Mutations reread
valid actual own-key state so sequential instances retain other task links;
no atomic multi-tab guarantee is claimed. Invalid/future/stale raw remains
untouched. Failed reads/writes remain honest page-only until explicit own-key
recovery; multiple page-only choices remain usable. Failed removal is not
reported as persisted success. All existing keys/formats/bounds stay unchanged.

Open linked material reads its exact ID through the current snapshot/mock
reader even when material search has no match. It preserves source refs/dates,
Russian text/fallback and saved requested language. This Open never writes the
last pointer, favourites, task status or backup. Its return context lives only
in memory: task ID, requested/UI language, filter, material query/source. Back
restores that context and focuses the same task heading. If status edits/import
make it invisible under the restored filter, Back focuses that filter without
resetting it or status. Reload retains valid links but never opens reading.
Normal Read/last/pin Open clears the task-return association to avoid stale Back
navigation for another material. Status reset/import and own material recovery
do not clear task links; own-link clear does not affect those existing records.

Four UI languages, visible linked title/language status and labelled controls
support keyboard/narrow screens. Existing task status diagnostics keep their
original scope by selecting only status IDs, excluding the new material select.
No shared helper, backend, contract or root documentation file is changed.

Targeted tests cover3tasks×2targets×8languages, clear/reload, exact record/bounds,
corrupt/future/stale/prototype/duplicate data, read/write/quota/remove failures,
page-only retention, sequential instances and all old-key isolation. Real UI
handlers cover four languages plus ua, explicit no-write selection, no-match
Open, context/language/source restoration and heading/filter focus. Existing
native320/1280 journeys add keyboard linkage/Open/Back/reload/filtered fallback
and own clear, retaining old assertions and capturing task-return screenshots.
They are source harness additions until authorized changed-head CI: no local
browser/IAB/server, broad old-suite audit or hosted CI is run. Local counts and
published99 history remain separate. Root alone authorizes push and release.
