---
name: retrospective
description: Run a structured retro after a module ships, a project phase ends, or a notable mistake gets caught — then write the durable lessons to feedback memory so they actually shape future sessions. Different from a casual "what did we learn?" — this enforces the format that turns one-time incidents into persistent rules. Use after rex-qa passes a module, after Spark / Vault / Echo / Pitch deliver a major artifact, after a debugging session that uncovered a non-obvious cause, after a postmortem on something that broke. Triggers: "retro", "retrospective", "what did we learn", "lessons learned", "post-mortem this", "save the learning", "what should we systematize".
---

# Retrospective

A retro that produces durable memory, not just a conversation. The point is to convert one-time incidents into rules that shape future sessions — otherwise the lesson decays the moment the conversation ends.

This skill enforces a strict output format that maps directly to the user's `~/.claude/projects/C--Users-hgonz/memory/` system: every retro produces zero or more **memory writes**, each typed correctly (`feedback`, `project`, or `reference`).

## When to invoke

- After `rex-qa` passes a module (Rex should auto-invoke this for any non-trivial module)
- After Spark / Vault / Echo / Pitch delivers a major artifact and the user has reviewed it
- After a debugging session that uncovered a root cause the user did not expect
- After a postmortem on something that broke in production or in a deliverable
- After the user catches the agent making the same mistake twice — that's the trigger to formalize the rule
- **After the user receives external review of a deliverable** (instructor comments on a brief, client notes on a deck, reviewer feedback on a paper, user feedback on a launched feature). External review is the highest-signal moment for memory writes — the `docx-generation.md` rules were born from exactly this pattern.
- Anytime the user says "retro this" or "save the learning"

Do **not** run after every trivial task. Retros that fire too often produce noise, and noisy memory is worse than no memory.

## How to run

### Step 1 — scope the retro

In one sentence, name what is being retro'd. Examples:
- "The reservations module build (rex-architect → rex-backend → rex-qa, ~6 hours)"
- "The Punto Azul brand guide delivery"
- "The 7-hour debugging session on the Stripe webhook idempotency bug"
- "The Echo policy brief V4 delivery"

Then identify *who* was involved (which agents, which tools, which user actions). This grounds the retro in specifics.

### Step 2 — three buckets

Walk the user through three buckets, in order:

#### Bucket 1: What worked — keep doing this
Specific patterns, tool choices, sequencing, or agent decisions that produced a good outcome. Be concrete. "Rex-architect produced an ADR before delegating to backend / database / frontend, and they all read it — zero cross-agent conflicts."

Quiet wins matter. If the user said "yes exactly" or accepted an unusual choice without pushback, that's a validated approach worth saving.

#### Bucket 2: What broke — don't do this again
Specific corrections, missed context, wrong assumptions, or premature actions. Be concrete. "Wrote the Stripe retry logic without checking the existing webhook handler; ended up duplicating the idempotency check in two places."

Include the user's actual words when they corrected something — that's the signal.

#### Bucket 3: What we now know — context that future sessions need
Project facts, decisions, deadlines, stakeholder constraints, or external dependencies that were learned during the work and should outlive the conversation. "The Q3 mobile release branch cuts on 2026-06-15; merge freeze begins 2026-06-12."

### Step 3 — translate buckets into memory writes

Each item in each bucket becomes zero or one memory write. Most items will not become a memory — only the ones that satisfy:

- **Will this matter in 3 months?** If no, do not save.
- **Is it derivable from the codebase or git history?** If yes, do not save (per the global memory rules).
- **Is it surprising or non-obvious?** If no, probably do not save.

For items that survive, classify them by type and write them in the format the user's MEMORY.md system expects:

| Bucket | Memory type | Why |
|---|---|---|
| Worked / broke (rules about how to work) | `feedback` | Lead with the rule. Include `**Why:**` and `**How to apply:**` lines. |
| Now know (project facts, deadlines, decisions) | `project` | Include `**Why:**` and `**How to apply:**` lines. Convert relative dates to absolute. |
| External system pointer | `reference` | One-line about what's in the external system and when to look there. |

Memory file format (matches the global rule):

```markdown
---
name: {short name}
description: {one-line description used to decide relevance in future conversations}
type: {feedback | project | reference}
---

{Lead with the rule or fact.}

**Why:** {the reason — often a past incident or strong preference}

**How to apply:** {when/where this guidance kicks in}
```

Then add a one-line entry to `~/.claude/projects/C--Users-hgonz/memory/MEMORY.md` under the right section:
`- [Title](file.md) — one-line hook`

### Step 4 — present the retro

```
RETROSPECTIVE: [scope]
══════════════════════

What worked (keep doing):
  1. [specific pattern]
  2. [...]

What broke (don't repeat):
  1. [specific mistake + user correction]
  2. [...]

What we now know:
  1. [project fact / decision / constraint]
  2. [...]

Memory writes (proposed):
  - [feedback] feedback_xyz.md  — "[one-line]"
  - [project]  project_abc.md   — "[one-line]"
  - [reference] reference_def.md — "[one-line]"

Memory writes (rejected as not durable):
  - [item from above] — reason: derivable from codebase / unlikely to matter in 3mo / not surprising

> Confirm before I write these to memory? [y / edit / cancel]
```

The skill **must not** write memory files until the user responds with `y` or provides edits. `cancel` aborts without writing. `edit` opens the proposed entries for revision before write.

### Step 5 — confirm and write

Ask the user to confirm or edit the proposed memory writes. **Do not write to memory without confirmation** — false memories are worse than no memories. Once confirmed:

1. Write each new memory file
2. Update `MEMORY.md` index
3. Check for duplicates — if a similar memory already exists, update it instead of creating a new one

---

## Examples of good vs bad retro outputs

**Good `feedback` write (post-debugging session):**

> Rule: When integrating with Stripe webhooks, always check the existing webhook handler in `apps/api/src/integrations/stripe/webhook.controller.ts` before adding any retry or idempotency logic. The handler centralizes both.
>
> **Why:** On 2026-04-22 we added duplicate idempotency-key checks in `subscription.service.ts` because we missed the existing logic in the webhook handler. Result: hours of debugging a webhook that processed events twice on race conditions.
>
> **How to apply:** Any task that touches Stripe webhook payloads or invoice / subscription state changes — read the webhook handler first.

**Bad `feedback` write (too vague, would fire on every Stripe task):**

> Rule: Be careful with Stripe.

**Good `project` write:**

> Fact: The Lean AI app launches in the App Store on 2026-05-15. TestFlight cutoff is 2026-05-08. After 2026-05-08, only critical bug fixes can ship.
>
> **Why:** App Store review takes 5-7 days; we need build stability before submission.
>
> **How to apply:** For any Lean AI app work after 2026-05-01, push back on scope expansions and prioritize bug fixes.

**Bad `project` write (already in CLAUDE.md or memory):**

> Project: Lean AI is a Duolingo-style micro-learning app.

## Notes for the assistant

- Retros are not a ceremony. If a session genuinely produced no durable lessons, output a short "no memory writes proposed — this was straightforward work" message and stop. Do not invent learnings to look productive.
- Always check existing memory files before proposing a new one. Updating an existing memory is almost always better than creating a near-duplicate.
- For `project` type writes, **always** convert relative dates ("Thursday", "next month", "in two weeks") to absolute dates using today's date as anchor. Memory files outlive the conversation.
- The user's existing `feedback_*.md` and `project_*.md` files in `~/.claude/projects/C--Users-hgonz/memory/` are the canonical examples — match their structure exactly.
- For Rekaliber retros, write directly to memory (per the global memory pattern). For one-off projects (Punto Azul, a single Echo deliverable), consider whether the lesson is project-specific or generalizable — only generalizable lessons go into the global memory directory.
