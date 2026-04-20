# Security Gate Skill

Use this skill to run a full security audit on a feature, module, or set of endpoints before shipping.

## When to invoke
- After completing any backend feature or API endpoint
- Before merging any PR that touches auth, payments, or data access
- When reviewing a feature that handles PII, financial data, or multi-tenant resources

## Preferred model: Claude Opus or GPT-4o
Security analysis requires deep reasoning. Do not use a smaller model for this skill.

---

## SECURITY AUDIT CHECKLIST

### Multi-Tenant Isolation
- [ ] Every database query on tenant-scoped data includes tenant/org ID filter
- [ ] Tenant ID sourced from authenticated session only — never from request body or URL params
- [ ] No cross-tenant data leakage possible in aggregate queries or reports
- [ ] Soft-deleted records excluded from all tenant queries

### Authentication & Authorization
- [ ] All endpoints are protected — verify no accidental public routes
- [ ] Role-based access control enforced via middleware/guards, not ad hoc if-statements
- [ ] JWT or session tokens have appropriate expiry (access ≤ 15min, refresh ≤ 7d)
- [ ] No sensitive data in token payload (passwords, raw PII)
- [ ] Password hashing uses bcrypt or equivalent with sufficient rounds (≥ 12)

### OWASP Top 10
- **Injection**: All DB queries use parameterized/ORM queries — no string interpolation
- **Broken Access Control**: Object-level authorization checked before any mutation
- **Sensitive Data Exposure**: PII never logged, financial data not exposed in list endpoints
- **Security Misconfiguration**: Security headers applied (Helmet or equivalent), CORS restricted
- **XSS**: Output sanitized, no raw HTML rendering without sanitization
- **CSRF**: State-changing operations protected, SameSite cookie flags set
- **Vulnerable Components**: Check dependencies for known CVEs
- **Logging Failures**: Auth failures and permission denials always logged

### Secrets & Configuration
- [ ] No secrets in source code, comments, or git history
- [ ] .env in .gitignore
- [ ] All env vars in .env.example without values but with descriptions

### Input Validation
- [ ] All incoming data validated and typed
- [ ] File uploads: MIME type validation, size limits, no path traversal
- [ ] Pagination params have maximum limits (no take=99999)

### Rate Limiting
- [ ] Auth endpoints rate-limited per IP
- [ ] Webhook endpoints validate signatures (HMAC or provider-specific)

### PCI-DSS (if payments involved)
- [ ] No raw card data stored or logged
- [ ] Payment intents created server-side only
- [ ] Webhook processing is idempotent

## OUTPUT FORMAT

```
SECURITY AUDIT: [feature/module]

CRITICAL — SHIP BLOCKED
- [Finding] | [File:Line] | Fix: [exact remediation]

HIGH — MUST FIX BEFORE MERGE
- [Finding] | [File:Line] | Fix: [exact remediation]

MEDIUM — FIX THIS SPRINT
- [Finding] | [File:Line]

PASSED
- [List of checks that passed]

VERDICT: PASS | PASS WITH WARNINGS | FAIL
```

FAIL = any Critical or High finding. Nothing ships until resolved.
