# Local core acceptance — 2026-10-17

PR48 originally contained health/version handlers and response headers only.
The earlier missing-Python-CI and Pages-publication blockers were resolved by
accepted PR50 and PR45. PR44 supplies the separate pure domain library.

Continuation implements body-size and shared local rate enforcement, bounded
thread-safe admission, JSON CSRF/host failures, protective headers and safe
structured logging. Sixteen new regression tests cover actual failure paths,
body boundaries, concurrent admission, time-window recovery and log redaction.
All 37 core/domain tests pass locally on Python3.12 and pinned Django6.1.2;
Django check and migration-drift check also pass. GitHub exact-commit results
are linked in PR48 after completion.

No server was deployed and no real data or persistent database was connected.
The former note that no PR exists and Django cannot be tested is obsolete.
