# Explicit return to the last source material

The current source card has a **Read material** action. Only this action saves a
pointer and opens the reading block. A later reload/restart never opens it
automatically: **Return to last material** is an explicit user action. It restores
the requested language (including `ua`) and focuses the reading heading. The
current search text, snapshot/mock source, task filter and task statuses remain
in place; a reading block outside search results makes a no-match search usable.
The existing source/fallback notices remain visible. Material content is still
the pinned repository snapshot; no new conditions or translations of business
content were introduced. Four existing UI languages have navigation notices.

Only `primserv:coordinator:last-material:v1` is used for this feature. Its exact
record is `{version:1,material_id,requested_language}`. IDs and languages are
whitelisted against the current slice; no text, query, timestamp, source mode,
candidate data, URL or arbitrary payload is saved. Task v1 storage is independent
and unchanged. Plain JSON shape/version/size checks reject damaged/future or
extended records without overwriting them. A removed ID has no return target;
current material remains available and an explicit clear is offered.

Storage access, read, write/quota or removal errors have a page-only notice.
Damaged or stale records are preserved until explicit clear; a new read can still
work in memory on the page. A failed removal never claims successful deletion.
Clear removes only this feature's key, hides the reading block, and focuses the
materials heading. Reset demo tasks does not clear the last-material pointer.

Validation covers exact three-field privacy boundaries, unsupported IDs/languages,
corrupt/future/extra-field records, removed IDs, denied reads/writes/removal and
quota errors, UI explicit return/clear and task isolation. Existing native
restart journeys at1280/320 add a real save→close→reopen→explicit return→clear
journey without storage import/replay. Existing16 coordinator cases, calculator
and staged core requirements remain mandatory. Browser evidence comes only from
the normal CI at the actual changed head, not local/IAB execution.

Files are confined to coordinator-demo and this document. Root scripts, published
tools, packaging, workflows, contracts and dependencies are not edited. Release
and public upgrade acceptance remain the coordinator's responsibility.
