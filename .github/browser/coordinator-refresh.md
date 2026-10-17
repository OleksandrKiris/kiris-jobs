# Public coordinator generation acceptance

Owner1; existing PR60 only. No coordinator runtime, owner9 fixture, SW
implementation, transferred CI path or production server is changed by this
test slice. `package.json` adds the HTTP-fixture regression to the existing
`npm test`; the existing catalogue workflow invokes the browser runner.
All new helpers and this note are inside hidden `.github/browser/`, outside
the Pages artifact. No runtime dependency, mandatory request or public byte
is added by these tests.

## Exact source of the old bytes

Role10 identified published commit
`ace6655eff143e674dc93e07a3a8709e45d5d14c` as the last version before PR76's
runtime change. `coordinator-refresh.mjs` reads its actual five
`coordinator-demo/` blobs using `git show SHA:path`; the public builder copies
these unchanged into `tools/coordinator/`. It checks this complete SHA-256
manifest before any browser scenario:

| File | Published SHA-256 |
| --- | --- |
| index.html | c4a0b566e37495c7a58a3394ede4bb99e8a1740a9b84a9a1c4eb22d63c16922d |
| model.js | c245ccc24b67dcb23e31185a8bf445d3358e4db383aebf732d794ee6554ab7a8 |
| app.js | a6ac0d59ced55c8ccf0673561a764e6af4715e58238bf8f468be5f49be69f817 |
| style.css | ff0a673c7625c9dbc2d4cad0feddd8b2340bcec44be4413761a7767f36663481 |
| primserv-logo.svg | 1a29802a4a0065ad84e8f8dbdd5bc46dcb9b67bbecb2190de6a99464feaf5157 |

Initial target main is `54b597fcc5d50180adcf50d4d40dc9d81d83cc4d`, accepted
PR76. Its real `app.js` differs; the four other files are unchanged. The
actual combined PR60 head/base/checkout and all five target hashes come from
the staged artifact and are recorded in `acceptance.json`; a no-change tool
comparison fails rather than pretending to exercise an upgrade.

When the pinned historical commit is absent in the shallow checkout, the
runner fetches that exact SHA at most once, depth1/no-tags/blob:none, with a
60-second command timeout. No replacement SHA, checkout change, all-branch
fetch, assertion skip or retry loop. `git show` may lazily retrieve the
specific historical blobs; this is not a claim about total Git wire bytes.

## Linked real-browser matrix

Ten cases: five interrupted resources at 1280×900 and 320×900. Each case:

1. Stage the actual published shell files and all five old tool files before
   the first load. Download that runtime, set fictional doing/done statuses,
   record the exact raw task value and a complete old generation manifest.
2. Stage the combined head shell/SW and five target runtime files. Where SW
   bytes differ, apply its normal update, check old shell-cache removal and
   exact old tool-pack retention. First tool entry after activation is with
   the origin stopped AND browser offline, before any online tool refresh.
3. On reconnect, keep these same head worker bytes throughout the remaining
   refresh. The HTTP origin sends a 200 with the real Content-Length, writes
   only half the selected resource body, then destroys its TCP socket.
   Server-side evidence must confirm the targeted partial response. Page
   routing is not used to simulate a worker-network failure.
4. Check failed navigation and reload retain the SAME old generation pointer,
   all five old hashes, exactly one generation and the exact raw progress.
   Stop the origin and disable browser network again; reload/Back/return and
   search/language remain usable. Capture last-good screenshot and trace.
5. Restore the origin, explicitly reload, require all five target hashes,
   a different complete generation, unchanged progress and no staged/old
   generation. Check status again after reconnect and catalogue return/reentry.
   Stop origin + disable network; the new version reloads offline with progress.

Five more 320-wide cases interrupt each resource during a cold download:
there must be no committed generation or offline-ready UI, including after
stopped-origin offline reload. Reconnection downloads a complete pack; a
new fictional status then survives another stopped-origin offline reload.

These cases run even when event-base and head worker bytes are identical.
The older root-shell upgrade scenario now also stages and verifies the event
base's five actual tool blobs, rather than serving head tools during its
base phase. Event base and confirmed published base remain separate fields.

## Evidence and limits

`acceptance.json` contains `toolRefresh` provenance/manifests, per-resource
cut evidence, old/new committed generations and results. Traces and images
are named `tool-refresh-FILE-WIDTH-*` and `tool-cold-cut-FILE-320-*` in the
existing catalogue-browser artifact. A failed assertion leaves the workflow
failed and records `currentScenario`; no repeat-until-green behavior.

The HTTP helper's separate Node test uses real requests to verify all five
cuts, unrelated-resource success, recovery, server stop and restart. This
does not substitute for the Chromium matrix. Browser execution is only in
the already authorized GitHub Actions runner; no local browser is launched.
Viewport emulation is not a physical phone. All data are fictional; external
requests remain blocked. This acceptance does not diagnose Chromium file://
storage internals or certify arbitrary future runtime compatibility.

Rollback of this test slice is a normal reviewed revert; it removes coverage,
not production behavior. PR60's separate locale runtime/cache rollback still
requires a new cache version and release-owner acceptance.
