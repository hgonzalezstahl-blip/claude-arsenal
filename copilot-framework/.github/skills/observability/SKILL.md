# Observability Setup Skill

Use this skill to instrument a service for production visibility: structured logging, error tracking, health checks, and metrics.

## When to invoke
- When setting up a new service or module for the first time
- Before a production deployment
- When a service lacks proper logging, health checks, or error tracking

## Preferred model: Claude Sonnet or GPT-4.1

---

## OBSERVABILITY CHECKLIST

### Structured Logging
All logs must be machine-readable JSON — never string interpolation:

```typescript
// BAD
console.log(`User ${userId} logged in from ${ip}`);

// GOOD
logger.info({ event: 'auth.login.success', userId, ip, timestamp: new Date().toISOString() });
```

**Required log events:**
| Domain | Events | Level |
|--------|--------|-------|
| Auth | login.success, login.failure, logout, token.refresh | info/warn |
| Core workflow | [resource].created, [resource].updated, [resource].deleted | info |
| Payments | payment.initiated, payment.succeeded, payment.failed, refund.issued | info/error |
| Jobs | job.started, job.completed, job.failed | info/error |
| External calls | api.call.success, api.call.failed | info/error |

**PII rules — never log:**
- User names, emails, phone numbers → use IDs only
- Card data, payment methods
- Passwords, tokens, API keys
- Government IDs

### Error Tracking
- Unhandled exceptions captured with context (user ID, session, module)
- Error tagged with domain/module for filtering
- PII stripped before events leave the process
- Alert rules: error rate spike → notification

### Health Check Endpoints

```
GET /health        → Liveness (is the process alive?) — returns 200 or 503
GET /health/ready  → Readiness (can it serve traffic?) — checks DB, cache, queue connections
```

Health checks must:
- Respond within 5 seconds
- Require NO authentication
- Return 200 when healthy, 503 when degraded
- Be excluded from access logs (reduce noise)

### Metrics (if applicable)
Expose the following at a scrape endpoint:
- HTTP request duration (histogram by route, method, status)
- Business event counters (orders created, payments processed)
- Queue depth (background job backlog)
- Cache hit/miss ratio
- External API call duration and error rate

### Alerting Thresholds to Document
| Condition | Threshold | Action |
|-----------|-----------|--------|
| HTTP 5xx rate | > 1% over 5min | Page on-call |
| Payment failure rate | > 5% over 5min | Page on-call + notify finance |
| DB connection failures | Any | Page on-call |
| Auth failure rate per IP | > 10/min | Security alert |
| Queue depth | > 500 | Warning alert |
| API p99 latency | > 2s | Warning alert |

## OUTPUT FORMAT

```
OBSERVABILITY SETUP: [service/module]

✅ Configured:
  - [Component]: [what was added/where]

⚠️ Gaps:
  - [Missing instrumentation and priority]

Log Events Covered: [N] of [total required]
PII Audit: CLEAN | VIOLATIONS FOUND
Health Checks: PASSING | FAILING

VERDICT: PRODUCTION READY | NEEDS WORK
```
