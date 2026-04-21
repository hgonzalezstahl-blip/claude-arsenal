# Prisma ORM Quirks

**Context:** Daily use across Rekaliber and Punto Azul

## N+1 Query Prevention

- Prisma doesn't auto-join — use `include` or `select` explicitly
- `findMany` with `include: { property: true }` = 2 queries (not N+1)
- But nested includes can still fan out: `include: { reservations: { include: { guest: true } } }`
- For complex queries, drop to raw SQL with `$queryRaw`

## Transaction Gotchas

- `prisma.$transaction([...])` for sequential operations
- Interactive transactions: `prisma.$transaction(async (tx) => { ... })`
- Default timeout is 5 seconds — increase for long operations
- Transactions hold locks — keep them short

## Type Generation

- Run `prisma generate` after every schema change
- The generated client types are in `node_modules/.prisma/client`
- Import types from `@prisma/client`, not from the generated path
- Use `Prisma.PropertyCreateInput` for typed inputs in services

## Migrations in Production

- `prisma migrate deploy` (not `dev`) in production
- Always test migrations against a copy of production data first
- Add columns as nullable first, backfill, then add NOT NULL constraint
- Never rename columns in a single migration — add new, migrate data, drop old

## Connection Pooling

- Prisma uses a connection pool by default
- For serverless (Railway): use Prisma Accelerate or PgBouncer
- Connection string: `?connection_limit=5` for constrained environments
