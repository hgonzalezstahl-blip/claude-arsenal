# ADR-002: Standardized API Response Format

**Status:** Accepted
**Date:** 2026-04
**Context:** Rekaliber PMS API

## Decision

All API endpoints return this envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 50 }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [...]
  }
}
```

## Rationale

- Frontend can check `success` before unwrapping — no ambiguous status codes
- `meta` for pagination keeps it consistent across all list endpoints
- Error `code` is machine-readable, `message` is human-readable
- Interceptor handles wrapping automatically — controllers just return raw data

## Consequences

- Every controller returns raw data; the response interceptor wraps it
- Frontend service layer always unwraps `.data` from responses
- Error handling uses NestJS exception filters, not manual try/catch
