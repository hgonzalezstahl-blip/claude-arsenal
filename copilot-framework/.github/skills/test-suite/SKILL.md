# Test Suite Skill

Use this skill to write a real, production-quality test suite for a module or feature.

## When to invoke
- After completing any backend module or frontend feature
- Before a module can be marked complete
- When test coverage is below threshold and needs to be brought up

## Preferred model: Claude Sonnet or GPT-4.1

---

## TESTING PHILOSOPHY

- **Real infrastructure for integration tests.** Never mock the database. Mock/production divergence causes real incidents.
- **Unit test pure business logic**: calculations, algorithms, rules engines, date utilities.
- **Integration tests own the HTTP contract**: correct status codes, correct response shapes, correct auth rejection.
- **E2E tests own critical user journeys**: auth flow, checkout flow, core workflow.
- **Never test framework behavior.** Test your code.
- **A test that always passes is worse than no test.** Write tests that can fail.

## COVERAGE TARGETS

| Layer | Target |
|-------|--------|
| Business logic (services/utils) | 85% line coverage |
| API endpoints | 100% happy path + 80% error paths |
| Critical user journeys (E2E) | 100% of defined flows |

---

## WHAT TO TEST (PER MODULE TYPE)

### Auth / Identity
```
Register:        valid → creates user | duplicate email → 409 | weak password → 400
Login:           valid → tokens | wrong password → 401 | unverified → 403
Protected route: missing token → 401 | expired token → 401 | wrong tenant resource → 403
```

### CRUD Resource
```
Create:   valid → 201 with correct shape | missing fields → 400 | unauthorized → 401/403
Read:     exists → 200 | not found → 404 | wrong tenant → 403 (not 404)
Update:   valid mutation → 200 | invalid fields → 400 | wrong tenant → 403
Delete:   exists → 204 | already deleted → 404 | wrong tenant → 403
List:     paginated | filtered correctly | only own tenant's records returned
```

### Business Logic (Unit)
```
- Happy path with canonical inputs
- Boundary conditions (zero, one, maximum values)
- Edge cases specific to the algorithm (e.g., leap years, zero-value transactions)
- Invalid inputs that should throw/return error
- Idempotency where required
```

### Payment/Webhook Flows
```
- Successful payment → correct state transition
- Failed payment → correct error state
- Duplicate webhook event → idempotent (no double-processing)
- Missing/invalid signature → 400 (not 500)
```

---

## TEST FILE STRUCTURE

```
src/[module]/
  __tests__/
    [module].service.spec.ts      # Unit: business logic
    [module].controller.spec.ts   # Unit: HTTP layer with mocked service
    [module].integration.spec.ts  # Integration: real DB/infrastructure

e2e/
  [flow].spec.ts                  # Critical user journeys
```

## INTEGRATION TEST SETUP PATTERN

```typescript
beforeAll(async () => {
  // Real app, real database
  app = await createTestApp();
  db = app.get(DatabaseService);
});

beforeEach(async () => {
  await seedTestData(db);
  authToken = await authenticateTestUser(app);
});

afterEach(async () => {
  await cleanupTestData(db);
});

afterAll(async () => {
  await db.disconnect();
  await app.close();
});
```

## OUTPUT FORMAT

```
TEST SUITE: [module]

Unit Tests:        [N] written | [N] passing
Integration Tests: [N] written | [N] passing
E2E Tests:         [N] written | [N] passing

Coverage:
  Business logic: [X]% / 85% target → PASS|FAIL
  API contract:   [X]% / 100% target → PASS|FAIL

Gaps (with reason):
  - [What's not tested and why]

VERDICT: COVERAGE MET | BELOW TARGET
```
