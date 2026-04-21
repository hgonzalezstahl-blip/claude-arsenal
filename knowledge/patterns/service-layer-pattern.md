# Service Layer Pattern

**Used in:** Both NestJS backend and Next.js frontend

## Backend (NestJS)

```
Controller → validates input (DTO) → calls Service → Service does business logic → returns data
```

- Controllers are thin — validate, delegate, return
- Services own business logic, database calls, and external integrations
- One service per domain (PropertiesService, ReservationsService)
- Services can call other services via DI, never other controllers
- Complex operations use Action classes (single-purpose, testable)

## Frontend (Next.js)

```
Component → calls hook → hook calls service function → service calls API → returns typed data
```

- **Never** use raw `fetch` in components
- Service functions live in `lib/services/` (e.g., `properties.service.ts`)
- Each service exports typed functions: `getProperties()`, `createProperty()`
- TanStack Query hooks wrap service functions for caching/invalidation
- Components only interact with hooks, never services directly

## Why This Matters

- Testable: mock the service, not the HTTP layer
- Consistent: every data path follows the same flow
- Type-safe: DTOs on backend, TypeScript interfaces on frontend, both generated from the same schema
