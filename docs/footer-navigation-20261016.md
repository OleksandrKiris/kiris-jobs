# Footer landmark language — 2026-10-16

## Evidence and scope

Base: `ebba0f24283da4535d19c21e2d58753c67f19981` (v219), no open PRs.
All 291 local file blobs matched the current remote main tree before editing.
The public Ukrainian catalogue exposed the footer navigation as Polish
`Informacje prawne`, while its links include PrimServ, HYDRA, Telegram,
privacy and WhatsApp. This label was both untranslated and narrower than the
actual navigation. The main navigation already uses the existing localization
mechanism; reuse that mechanism without adding runtime JS or dependencies.

## Change

Add `ui.footerNavigation` to all 11 catalogue locales and bind the footer
landmark in the source template and all 14 generated vacancy pages. The label
describes PrimServ, contact and privacy. Keep a meaningful Polish no-JS label.
Asset/cache version v220 invalidates the changed locale packs and HTML shell.
All job data, photos, links, legal text and application logic remain unchanged.

## Verification and rollback

Twelve new regressions failed on the original markup/locale packs: 11 test
initial language plus switches PL → EN → original with the actual i18n engine;
one checks all generated vacancy footers. Tests forbid network/submission calls
and assert that content data is not mutated. Run the full `npm test` suite,
review the complete diff, then check exact PR head/CI and live assets after
publication. Real browser evidence is desktop only, not a phone or assistive
technology device test. No extra requests or runtime module is introduced.

Rollback: revert this PR as one change and bump the cache version; do not
overwrite later publications. Final test/release evidence is recorded in PR.
