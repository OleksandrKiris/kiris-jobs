# Catalogue keyboard navigation — 2026-10-16

Base: main `1cd6964cf22f2bf5c2cc3d87ab4df94d08c06924` (v218), no open PRs.

## Confirmed defect

In the public desktop browser, the Ukrainian tomato-vacancy page exposed its skip link as `#vacancies`. Because the document has `<base href="../../">`, its resolved destination was `https://oleksandrkiris.github.io/kiris-jobs/#vacancies`: leaving the vacancy and dropping the explicit language. The visible vacancy title also exposed heading level 2 rather than a page-level heading.

## Change

- Use a focusable `main-content` target. Runtime skip links retain the current path/query, including language and standalone-application context.
- Generate an explicit same-vacancy fallback URL before JavaScript loads.
- Render the direct vacancy title as native h1; modal titles remain h2. Existing desktop/narrow-screen title CSS covers both tags with unchanged values/specificity.
- Reuse the existing translated navigation label; no factual or instructional translations added.
- Refresh versioned assets and service-worker cache to v219, regenerate all 14 pages.

## Verification

- `npm test`: 124 behavioral tests passed (12 new), plus JavaScript/content/locale/UI/application/delivery/privacy validators.
- New coverage: 11 locales × catalogue + 14 vacancy routes × normal/application query contexts; all 14 native h1 titles and modal h2 titles; generated fallback targets and focusable main.
- Full diff reviewed; no job data, timestamps, locales, photographs, application logic or HRappka destination changed.
- Public desktop QA before release: Polish → Ukrainian; Ryczywół search; housing filter; tomato vacancy; Siechnice gallery photo 1 → 2 → close; explicit back retained Ukrainian, search and housing filter. HRappka link retains its original destination and explicit Polish/new-tab label. No form submission/contact action.
- This is desktop cloud-browser QA, not a phone test or a screen-reader certification. Post-release result is recorded in the PR.

## Follow-up observations (not changed here)

- Footer navigation landmark is still labelled `Informacje prawne` in Ukrainian. It contains company/training/contact links too; review its accessible name across locales in a separate focused change.
- Manifest shortcuts still use old `#jobs` / `#profile` fragments; verify compatibility and intended destinations before changing them.

## Rollback

Revert this PR via a new reviewed commit, then advance cache/version references so already-cached clients receive the rollback. Do not alter vacancy data or remove public resources.
