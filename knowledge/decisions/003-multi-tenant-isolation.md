# ADR-003: Organization-Scoped Multi-Tenancy

**Status:** Accepted
**Date:** 2026-04
**Context:** Rekaliber PMS — SaaS model

## Decision

All tenant data is scoped by `orgId` at the database level:
- Every table with tenant data has an `orgId` column
- A NestJS guard extracts `orgId` from the JWT and injects it into the request
- Services MUST filter by `orgId` on every query — no exceptions
- Prisma middleware adds `orgId` filter automatically as a safety net

## Rationale

- Shared database (not database-per-tenant) is simpler and cheaper at our scale
- `orgId` in JWT means no extra database lookup per request
- Double-filtering (guard + Prisma middleware) prevents accidental cross-tenant leaks
- Indexes on `(orgId, ...)` compound keys keep queries fast

## Consequences

- Every new table needs an `orgId` column and compound index
- Seed data must include multiple orgs to test isolation
- Rex-security audits specifically check for missing orgId filters
