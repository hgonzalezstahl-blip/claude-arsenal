# ADR-001: Monorepo with Turborepo

**Status:** Accepted
**Date:** 2026-04
**Context:** Rekaliber PMS, Punto Azul ecosystem

## Decision

Use Turborepo monorepo structure for multi-app projects:
- `apps/` — deployable applications (API, web, portals)
- `packages/` — shared libraries (db, auth, email, config)

## Rationale

- Single `pnpm` workspace means shared dependencies, one lockfile
- Turborepo handles build ordering and caching across packages
- Prisma schema lives in `packages/db`, shared by all apps
- Avoids the "split repo" problem where API and web drift out of sync

## Consequences

- All apps must use compatible Node/TypeScript versions
- CI builds the full monorepo (Turborepo caches make this fast)
- `pnpm --filter` for running commands in specific packages
