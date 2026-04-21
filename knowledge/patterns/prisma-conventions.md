# Prisma Conventions

**Used in:** Rekaliber PMS, Punto Azul

## Naming

- Models: PascalCase singular (`Property`, `Reservation`, `GuestMessage`)
- Fields: camelCase (`checkInDate`, `orgId`, `createdAt`)
- Enums: SCREAMING_SNAKE_CASE values (`CONFIRMED`, `PENDING_PAYMENT`)
- Relations: named for clarity (`property Property @relation(...)`)

## Standard Fields

Every model gets:
```prisma
id        String   @id @default(cuid())
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

Tenant-scoped models also get:
```prisma
orgId     String
org       Organization @relation(fields: [orgId], references: [id])
```

## Soft Deletes

Use `deletedAt DateTime?` instead of hard deletes for:
- Reservations, Properties, Guests, Financial records
- Prisma middleware filters `deletedAt IS NULL` by default
- Hard deletes only for ephemeral data (sessions, temp tokens)

## Indexes

- Always index `orgId` (tenant queries)
- Compound indexes for common query patterns: `@@index([orgId, status])`
- Unique constraints where business logic demands: `@@unique([orgId, externalId])`

## Migrations

- Never edit a migration after it's been applied
- Use `prisma migrate dev --name descriptive-name`
- Seed data in `prisma/seed.ts` with multiple orgs for tenant isolation testing
