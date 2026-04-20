# Documentation Gate Skill

Use this skill to generate and update documentation for a completed module or feature. Documentation ships with code — never deferred.

## When to invoke
- After a module passes all other quality gates
- When API endpoints are added or changed
- As the final step before marking a module complete

## Preferred model: Claude Haiku or smaller model
Documentation generation is mechanical and templated — no complex reasoning needed.

---

## DOCUMENTATION CHECKLIST

### API Specification
Every endpoint must be documented:
- Method, path, description
- All required and optional parameters with types and examples
- All possible response shapes (happy path + key error codes)
- Authentication requirements
- Rate limiting notes if applicable

OpenAPI/Swagger format preferred. Annotate directly in code where supported.

### Module README
Each major module gets a README at its root:

```markdown
# [Module Name]

## Purpose
[One paragraph: what this module does and why it exists]

## Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|

## Key Domain Concepts
- [Concept]: [Definition]
- [State machine if applicable]

## Business Rules
- [Rule 1]
- [Rule 2]

## Events Emitted
| Event | Trigger | Who consumes it |
|-------|---------|-----------------|

## Dependencies
- [Other modules/services this depends on and why]

## Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
```

### Changelog Entry
Add to CHANGELOG.md (newest entries at top):

```markdown
## [YYYY-MM-DD] — [Feature/Sprint name]

### Added
- `POST /api/v1/[resource]` — [description]

### Changed
- `GET /api/v1/[resource]` — [what changed and why]

### Fixed
- [description]
```

### Environment Variable Documentation
Update `.env.example` — every variable documented with description and format:

```bash
# [Category]
VARIABLE_NAME=
# [Description]. Format: [format hint]. Generate with: [command if applicable]
```

`.env.example` must NEVER contain real credentials.

### Architecture Decision Record (if applicable)
When a non-obvious decision was made, document in DECISIONS.md:

```markdown
## ADR-[N]: [Title]
Date: [YYYY-MM-DD]
Status: Accepted
Context: [Why this decision was needed]
Decision: [What was decided]
Consequences: [Trade-offs accepted]
```

## OUTPUT FORMAT

```
DOCUMENTATION GATE: [module]

✅ Generated/Updated:
  - [File]: [what was added or changed]

⚠️ Missing:
  - [What still needs documentation and why it was skipped]

API Spec Completeness: [N/total endpoints documented]
README: COMPLETE | PARTIAL
Changelog: UPDATED | NEEDS UPDATE
.env.example: UPDATED | NEEDS UPDATE
ADRs added: [N]

VERDICT: DOCUMENTATION COMPLETE | PARTIAL | INCOMPLETE
```
