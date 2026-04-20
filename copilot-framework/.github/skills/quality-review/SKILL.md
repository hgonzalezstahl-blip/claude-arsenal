# Quality Review Skill

Use this skill to perform a senior-engineer-level code review on any change before it merges.

## When to invoke
- Before merging any feature PR
- When you want a second opinion on a new module
- As the first gate in the quality pipeline after implementation

## Preferred model: Claude Sonnet or GPT-4.1
Pattern-matching code review works well on standard models.

---

## CODE REVIEW CHECKLIST

### Type Safety
- [ ] No `any` types — use `unknown` and narrow, or define the type explicitly
- [ ] No unsafe non-null assertions without a comment explaining why
- [ ] No `@ts-ignore` or `@ts-expect-error` without a documented reason
- [ ] All async functions have explicit return types
- [ ] No implicit optional access on potentially-undefined values

### Architecture Patterns
- [ ] Controllers/routes are thin — no business logic, only delegation
- [ ] Services/handlers are stateless — no per-request instance variables
- [ ] Cross-cutting concerns (auth, logging, validation) handled via middleware, not duplicated in each handler
- [ ] No circular dependencies between modules
- [ ] Modules/packages export only what external consumers need

### Naming Conventions
Check that naming follows the established codebase conventions:
- Input models: `Create[Resource]Request` or `Create[Resource]Dto`
- Output models: `[Resource]Response` or `[Resource]Dto`
- Services: `[Resource]Service`
- Events: `[domain].[action]` (kebab-case, past tense: `order.created`, `payment.succeeded`)
- API routes: kebab-case (`/api/v1/direct-booking`)
- Constants: SCREAMING_SNAKE_CASE

### DRY Principle
- [ ] No logic duplicated in 3+ places — extract to shared utility or middleware
- [ ] No repeated response transformation — use shared mappers or interceptors
- [ ] No copy-pasted validation logic — use shared validation schemas

### API Contract Consistency
All APIs must follow a consistent contract:
- List responses: `{ data: T[], meta: { total, page, pageSize } }`
- Single item: `{ data: T }`
- Errors: `{ statusCode, message, error }`
- Dates: ISO 8601 strings
- IDs: strings (UUIDs), never raw integers
- Money: integers (minor units/cents) with currency field

### Complexity Thresholds
- [ ] Functions > 50 lines → flag for extraction with suggestion
- [ ] Nesting > 4 levels → use early returns or extract functions
- [ ] Files > 300 lines → consider splitting
- [ ] Single responsibility: each function/class does one thing

### Code Smell Flags
- [ ] `console.log` in committed code → replace with structured logger
- [ ] Commented-out code → delete (git history preserves it)
- [ ] TODO without a ticket reference → `// TODO: PROJ-123 - description`
- [ ] Magic numbers → named constants
- [ ] Non-descriptive names: `data`, `result`, `temp`, `item` in non-trivial scope

## OUTPUT FORMAT

```
CODE REVIEW: [feature/scope]

MUST FIX — blocks merge
  [File:Line] [Issue]
  → Fix: [exact remediation]

SHOULD FIX — fix this sprint
  [File:Line] [Issue]
  → Suggestion: [recommendation]

MINOR — track as tech debt
  [File:Line] [Note]

LOOKS GOOD
  [Notable good patterns to acknowledge]

VERDICT: APPROVED | APPROVED WITH CHANGES | NEEDS REWORK
```

Must Fix = does not merge until resolved.
