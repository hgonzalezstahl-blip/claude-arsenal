---
name: checkpoint
description: Human-in-the-loop review of a code change after autonomous work completes. Walks the user through the change in concern-order (not file-order), identifies the 2-5 highest blast-radius spots tagged by risk category, and suggests manual observations that no test suite can replace. Use after Rex (or any agent) finishes a multi-file implementation, after Lovable / Bolt / Cursor produces something the user didn't write, before approving a PR with more than ~10 files changed, or anytime the user says "checkpoint", "walk me through this", "review this with me", "what should I look at first", or "I shipped this — what did I miss?".
---

# Checkpoint Preview

A structured walkthrough of a code change. Designed for the moment when autonomous work has finished and the human needs to take back the wheel. The diff in file order doesn't build understanding — this skill reorders it for comprehension.

## When to invoke

- After `rex-qa` passes and Rex hands the module back
- After Lovable / Bolt / Cursor / any AI tool generates something multi-file
- Before approving a PR with >10 changed files or >300 changed lines
- When the user just shipped and wants to verify they actually understood what was shipped (comprehension-debt check)
- Anytime the user says "checkpoint" or asks to be walked through a change

## Inputs the skill accepts

- A PR number / URL
- A commit SHA or commit range
- A branch name (defaults to current branch vs `main` / `master`)
- A spec file path (if one exists from `ce-plan`, TaskMaster, or rex-architect)
- Nothing — defaults to current uncommitted git state

If multiple inputs are present (spec + PR), prefer the spec — it carries the author's intent.

---

## The five steps

### 1. Orientation

Before reading any code, identify the change and produce surface-area stats. The user needs to confirm "this is what I think it is" before going deeper.

Output:
```
ORIENTATION
═══════════
Intent (one line):  [what this change does, in plain English]
Surface area:
  - Files changed:        N
  - Modules touched:      [list]
  - Lines added/removed:  +X / -Y
  - New public interfaces: [list any new endpoints, exports, schema fields]
  - Boundary crossings:   [any module-to-module new dependencies]

Source of truth: [PR / spec / commit range used]
```

If the surface area looks bigger than the user expected, flag it explicitly. "This was supposed to be a bug fix but touches 14 files in 3 modules — worth confirming the scope."

### 2. Walkthrough — by concern, not by file

Group the change by *cohesive design intent*, not by file. Examples of concerns: "input validation", "API contract change", "schema migration", "new background job", "auth middleware update".

**Cap concerns at 5.** If you find more than 5 concerns in a single change, the change is doing too much — the right output is **not** an 8-concern walkthrough (that's no better than reading the diff). Instead, surface scope sprawl in Orientation: "This change spans 8 unrelated concerns — recommend splitting before review." Then walk through the top 3-5 concerns with the highest blast radius and stop.

For each concern:
- One short paragraph: *what* changed and *why this approach* (not just what the code does — the diff already shows that)
- Numbered stops: `path:line` references the user can click through, in the order that builds understanding (high-level intent first, then supporting details)
- Never reference a piece of code the user hasn't seen yet

Output template:
```
WALKTHROUGH
═══════════

Concern 1: [name]
  Why this approach: [1-2 sentences on the design choice]
  Stops:
    1. path/to/file.ts:42  — [what you see here]
    2. path/to/file.ts:89  — [what builds on stop 1]
    3. path/to/other.ts:15 — [the supporting piece]

Concern 2: [name]
  ...
```

This is the **design judgment** step, not a bug hunt. The user evaluates whether the *approach* is right.

### 3. Detail pass — blast-radius hotspots

Surface 2-5 spots where being wrong has the highest cost. Tag each by risk category. Common tags:
- `[auth]` — authentication / authorization changes
- `[schema]` — database schema or migration
- `[billing]` — anything touching money or invoicing
- `[public-api]` — externally consumed contracts
- `[security]` — input handling, secrets, sanitization
- `[multi-tenant]` — orgId scoping, tenant isolation
- `[concurrency]` — race conditions, locks, idempotency
- `[data-loss]` — destructive operations, deletes, overwrites

If you have access to the `jcodemunch` MCP server, call `get_blast_radius`, `get_dependency_cycles`, and `find_dead_code` to ground the hotspot list in actual dependency data.

Order by blast radius descending. For each spot, write one sentence on what breaks if it's wrong.

```
DETAIL PASS — high blast radius
═══════════════════════════════

1. [billing] apps/api/src/invoices/service.ts:104
   If the rounding logic is wrong here, every invoice from now on charges the wrong amount.

2. [multi-tenant] apps/api/src/properties/controller.ts:38
   The orgId is read from the request body instead of the JWT — any user can read any org's properties.

3. [schema] prisma/migrations/20260427_add_balance/migration.sql:12
   Adding a NOT NULL column without a default on a 100k-row table will lock writes during migration.

4. [auth] apps/api/src/auth/jwt.strategy.ts:22
   Token expiry was relaxed from 1h to 7d — confirm this was intentional.
```

This is **not** a comprehensive bug hunt. CI handles correctness. This pass activates risk awareness on the spots where being wrong costs the most.

### 4. Manual observation tests

Suggest 2-5 ways the user can manually observe the change working. Not unit tests — observations. A UI interaction to try. A `curl` request to send. A log to tail. A SQL query to run. With the expected result.

If the change has no user-visible behavior, say so. Do not invent busywork.

```
MANUAL TESTS
════════════

1. Open the dashboard → Reservations → click "New". Form should load with property dropdown populated.
2. POST /api/reservations with valid payload, missing JWT → expect 401.
3. POST /api/reservations with valid JWT but mismatched orgId in body → expect 403 (NOT 200).
4. tail -f apps/api/logs/app.log → trigger a reservation create → expect a "reservation.created" event.
```

### 5. Decision

Three options, presented at the end:
- **Approve / ship** — the user is satisfied
- **Rework** — something is wrong; help diagnose whether the issue is the spec, the approach, or the implementation
- **Dig deeper** — pick one concern or hotspot and re-review with more focus

If the user picks rework, help draft actionable feedback tied to specific `path:line` locations. If approving a PR, offer to run `gh pr review --approve`.

---

## How this skill behaves in conversation

- It is a conversation, not a report. Between any two steps the user can interrupt: "wait, why did you choose that approach in concern 2?" — answer, then continue.
- The user can pull in other skills mid-flow: "run elicit pre-mortem on the schema change" or "run roundtable on whether this billing logic is safe".
- The five steps are the default order, but if the user says "skip orientation, jump to hotspots" — do that.
- Do not lecture. Surface what matters and let the user steer.

## Notes for the assistant

- The walkthrough is the most important step. If the diff is small (<5 files), you can compress orientation and walkthrough into one section, but never skip the design-judgment framing.
- If a spec exists with a "Suggested Review Order" or "Reviewer Notes" section, use it directly. Author-written trails always beat generated ones.
- For Rekaliber work specifically, always **check** for multi-tenant issues if any controller / service was touched — this is the most common Rekaliber bug class. If you find an issue, tag it `[multi-tenant]`. If the check is clean, do not invent a tag — note in the orientation that multi-tenant scoping was verified and move on.
- Be honest if you can't tell why a change was made. "I can't reconstruct the intent here — was this from a specific bug report?" is a better step than inventing rationale.
