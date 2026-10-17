# Role 14 integration handoff

Owner: 14. Repository: OleksandrKiris/kiris-jobs. Allowed writes: `contracts/**`,
`docs/integration/**`. Base: `fc672d805fb884eb1d09bdc8ca342ba530ad83f4`.
Branch: existing `feat/contracts-coordinator-tasks-v1`; no earlier role commits
on its remote head `b6872bab4a86b10cd92ad1888fe5aa66bd0968e0`; advanced by
fast-forward, no history rewrite. One WIP. No runtime, deploy or schedule changes.

## Ownership transfer evidence

User assignment 2026-10-17 transfers CI from 1 to 15. Role 10 independently
checked the exact existing tree and accepted the ten paths listed in
`ownership-map.json` transfer.paths in chat `01a14a76-0279-7801-b2ef-6ae9b75066a5`.
There are **five workflows and five CI script/document files**, not six scripts.
New files in either directory require map review. Root package/lockfiles,
`scripts/**` including `scripts/build-pages-artifact.mjs`, `.github/browser/**`
and `.github/public-tools.json` stay with 1. Module runners remain with their
module owners. No blanket reassignment of browser runners to 15.

Map is a review proposal and read-only preflight, **not an installed hard lock**.
The map/checker/test files require separate independent review by 10 and affected
owners. CI must use the map/checker from a trusted accepted base, not a PR-modified
copy; approval labels are not an input. Map changes always produce review errors.
An accepted map update is installed by a separate review decision, never an
in-PR switch. Role 15 owns wiring into CI; that is not implemented here.

The explicit map intentionally fails closed on unlisted files; owner 1 must
review additions for existing root files rather than assigning every unknown
path to 1. Role 8 and roles 2–7 work in other repositories and are not inferred
from this repository map. The eight local ownership fixtures cover roles
1,9,10,11,12,13,14,15. Concurrent WIP paths and accepted dependency versions must
be supplied by a trusted orchestrator; this is not an atomic GitHub reservation.

## Read-only materials slice

Contract in `../../contracts/materials-v1/`; consumer owner 9 selected
`data/content.js` job `site-cleaning` at the pinned base. Source text is verified
against repository bytes, not a new confirmation of recruitment conditions.
`zgorzelec` is an explicit new mapping of the existing display value `Zgorzelec`,
not an already-established housing ID. Existing job ID is unchanged. No employer,
legal entity, salary, vacancy availability or candidate record is inferred.

Dependencies: owner 9 snapshot/mock consumer; owner 13 local read service;
owner 12 future URL registration only after contract acceptance. PR56 is separate
core work (a9ad1a43, two successful CI checks observed 2026-10-17). Proposed
materials route is not currently installed. Online and AI stay disabled.

## Verification and recovery

`python -m unittest discover -s docs/integration -p 'test_*.py' -v`

`python -m unittest discover -s contracts/materials-v1 -p 'test_*.py' -v`
(with jsonschema==4.23.0 in a private local environment).

Example actual-diff preflight: `python docs/integration/check-diff.py --claim
claim.json --base <accepted-base> --head <exact-head>`. Claim contains owner,
repo, head (full SHA), allowed_paths, depends_on and optional other_wip path
lists; actual changed paths replace any claim paths. Rename/copy old and new
names are both checked. The CLI cannot approve dependency/map changes itself.
Revert this isolated commit to recover; no storage/cache format is changed.

## Previous work and access limitation

Old ChatGPT reports referenced local ZIP packages (task-write coordinator
contract, 20/25 tests) that are not available as local filesystem files here.
Those packages and branch are not removed or silently claimed as tested here.
Current scope supersedes the old task-write proposal with a read-only slice.
The readable history only says a prior GitHub write was blocked, without the
original tool result or exact operation. No alternate-tool retry of that old
operation is performed. Local commit/patch remains reviewable; remote publication
must retain this evidence limitation until the specific refusal is resolved.
