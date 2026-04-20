# Performance Gate Skill

Use this skill to audit a feature or module for performance issues before shipping to production.

## When to invoke
- After completing any feature that touches the database or serves a public API endpoint
- Before merging any PR that adds new queries, list endpoints, or background jobs
- When reviewing data-heavy features like reports, dashboards, or bulk operations

## Preferred model: Claude Opus or GPT-4o
Performance analysis requires reasoning about scaling implications. Use a capable model.

---

## PRODUCTION SLA TARGETS

| Operation | Target |
|-----------|--------|
| Simple CRUD (GET/POST) | < 100ms p99 |
| List with filters/pagination | < 200ms p99 |
| Dashboard load | < 2s |
| Report generation | < 3s or async |
| Background job | < 30s per unit |

Anything that cannot reliably meet its SLA synchronously must be offloaded to a queue.

---

## PERFORMANCE AUDIT CHECKLIST

### N+1 Query Detection
Look for database calls inside loops:
```
// BAD: N+1
const items = await db.findMany();
for (const item of items) {
  const related = await db.findRelated(item.id); // N queries
}

// GOOD: single query with join/include
const items = await db.findMany({ include: { related: true } });
```
Flag every loop containing a database call. Require batch loading.

### Missing Index Analysis
Every column used in WHERE clauses or ORDER BY must be indexed:
- All foreign key columns
- Status/enum columns used in filters
- Date range columns (createdAt, scheduledAt, etc.)
- Composite indexes for common multi-column query patterns
Flag: any findMany/SELECT WHERE on an unindexed column.

### Unbounded Queries
- [ ] All list endpoints paginate — default page size ≤ 50, max ≤ 100
- [ ] No queries without a LIMIT or equivalent
- [ ] No `SELECT *` on tables that will grow large

### Caching Strategy
Identify cacheable data and verify cache exists:
- Configuration/settings: TTL 60min, invalidate on update
- Computed aggregates: TTL 15min, invalidate on source change
- External API responses: TTL per provider guidance
Flag: hot read paths with no cache.

### Async Offload Candidates
These MUST NOT run synchronously inside request handlers:
- Email/SMS sending
- Report or PDF generation
- Bulk data imports or exports
- External API sync operations
- Image processing
Flag any of these running synchronously.

### Frontend Bundle (if applicable)
- No single JS chunk > 300KB uncompressed
- Heavy libraries loaded dynamically, not at module level
- Server-side rendering used for data-heavy, non-interactive pages

## OUTPUT FORMAT

```
PERFORMANCE AUDIT: [feature/module]

CRITICAL — SLA BLOCKER
- [Issue] | [File:Line] | Impact: [estimated] | Fix: [remediation]

HIGH — WILL DEGRADE AT SCALE
- [Issue] | [File:Line] | Fix: [remediation]

MEDIUM — SUBOPTIMAL
- [Issue] | Fix: [suggestion]

RECOMMENDATIONS
- Indexes to add: [list]
- Caches to add: [key + TTL]
- Async offloads: [operations to queue]

VERDICT: PASS | NEEDS OPTIMIZATION | CRITICAL BLOCKER
```
