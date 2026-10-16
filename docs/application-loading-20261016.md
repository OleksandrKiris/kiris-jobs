# Application loading — 16 October 2026

Base: `36e9558f2ab8e2787f2d7eec1cd3f61015df5788`; public cache version: `218`.

The catalogue bootstrap previously awaited the 130,611-byte application module before rendering any vacancies. It now awaits a 4,870-byte loader and imports the existing application only when opened. This removes 125,741 uncompressed bytes from the JavaScript startup dependency chain. This is not a measured page-speed result or a claim of lower total traffic: the service worker still precaches the original application to retain offline behaviour.

The loader supports both modal and direct `?apply=1` entry points, retains the vacancy and mode, shares a pending request, ignores completed loads after closing the dialog, and shows loading/error/retry states in all 11 catalogue languages. A failed module request does not prevent browsing vacancies. Explicit retries use a new module URL to avoid a cached failed import.

The existing application source, delivery logic, draft handling, HRappka destinations, catalogue data and photographs are unchanged. No forms or messages were submitted. The original form remains a public and precached resource.

Validation: full `npm test`, including 16 new loader tests, existing HRappka/availability/search/filter/gallery tests, and all content, locale, UI, form, delivery and privacy checks. Content validation confirms 14 vacancies and 54 housing photographs. Generated vacancy pages and the cache version are synchronized. Browser connection failed, so no real browser or phone visual pass is claimed.

Rollback: revert the release commit through a PR, increment the public cache version again, regenerate vacancy pages and run `npm test` before publishing.
