# PrimServ Django core: local API v1

GET /api/v1/health/ returns JSON status ok. GET /api/v1/version/ returns the local code version. Unknown API routes return a JSON 404; other methods at known routes return JSON 405. API responses send no-store and a generated request ID.

This code is not deployed. The root Pages staging script must exclude backend/ and docs/backend/ in a separately reviewed owner1 PR before this draft is merged. Django checks, full negative tests, request limits and logging remain acceptance tasks.
