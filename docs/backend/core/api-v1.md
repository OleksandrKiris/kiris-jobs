# Local API v1 contract

GET/HEAD `/api/v1/health/` returns service `primserv-core`, API version `1`, status
`ok`. GET/HEAD `/api/v1/version/` returns code version `0.1.0`. HEAD has no body.
Known routes reject other methods with JSON405 and `Allow: GET, HEAD` after CSRF
validation. Unknown `/api/` routes return JSON404, including unknown API versions.

Every API response has X-API-Version, a fresh X-Request-ID, Cache-Control:no-store,
X-Content-Type-Options:nosniff, X-Frame-Options:DENY and Referrer-Policy:no-referrer.
Errors use `{ "api_version": "1", "error": { "code": "...", "message": "..." } }`.

| Status | Code | Condition |
|---|---|---|
|400|invalid_request|Invalid host/framing or unreadable body|
|403|csrf_failed|Django CSRF verification failed|
|404|not_found|Unknown API route/version|
|405|method_not_allowed|Method not allowed by a known read-only endpoint|
|413|payload_too_large|Declared or readable body exceeds 16,384 bytes|
|429|rate_limited|Shared local 120-request/60-second window exhausted|
|500|internal_error|Unhandled exception with DEBUG=False|

The guard reads at most limit+1 bytes, rejects oversize data and restores accepted
bytes for Django consumers. Invalid content length is rejected; a missing or
understated length does not disable the check on readable bytes. Transport/server
framing remains upstream; ASGI can buffer data before synchronous middleware.
A production server must separately enforce transport/body/time limits.

Rate admission is thread-safe and process-local, with one bounded counter and no
IP/user keys. Rejected requests receive Retry-After seconds until the current
window expires. All API requests share the quota; forwarded headers cannot select
another bucket. This is not a per-user or multi-worker production throttle.

Logs contain only generated request ID, API version, allowlisted route/method,
status and duration. No raw request data or exception text. These endpoints do
not authenticate users or connect the pure domain model to persistence/API routes.
The backend and its documentation remain excluded from the public Pages artifact.
