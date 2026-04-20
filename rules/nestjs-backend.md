---
paths:
  - "**/*.module.ts"
  - "**/*.service.ts"
  - "**/*.controller.ts"
  - "**/*.guard.ts"
  - "**/*.dto.ts"
  - "**/*.interceptor.ts"
---

# NestJS Backend Conventions

- Follow Controller → Request DTO → Service/Action → Model pattern
- Controllers handle HTTP concerns only — no business logic
- Services contain all business logic
- DTOs validate all incoming data (class-validator decorators)
- Guards handle authorization (JWT, roles, org scoping)
- All responses use format: `{ success: true, message: string, data: {} }`
- Multi-tenant: always scope queries by orgId from JWT context
- Use dependency injection — never instantiate services manually
- Prefer Prisma transactions for multi-step mutations
- Error handling: throw NestJS HTTP exceptions, let global filter format response
