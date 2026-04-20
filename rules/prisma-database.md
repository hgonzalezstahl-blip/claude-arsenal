---
paths:
  - "**/schema.prisma"
  - "**/migrations/**"
  - "**/prisma/**"
  - "**/*.prisma"
---

# Prisma Database Conventions

- Schema changes require a migration: `npx prisma migrate dev --name descriptive-name`
- Always add indexes for foreign keys and frequently queried columns
- Use @map and @@map for snake_case database column/table names
- Enums for fixed value sets (status, type, role)
- Soft deletes via deletedAt DateTime? field — never hard delete user data
- Relations: always define both sides of the relation
- Multi-tenant: every tenant-scoped table has orgId field with index
- Seed data: maintain in prisma/seed.ts for development environments
- After schema changes: run `npx prisma generate` before testing
- Use Prisma transactions for operations that must be atomic
