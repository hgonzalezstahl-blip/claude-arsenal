# Solutioning & ADRs (cross-agent contract)

This rule governs how Rex sub-agents (`rex-backend`, `rex-frontend`, `rex-database`, `rex-integration`, `rex-tester`, `rex-docs`) coordinate on multi-module features. Read this in full before generating code on any feature that crosses module boundaries.

The single sentence: **For multi-agent work, the ADR is the source of truth. Read it first. Disagree with it explicitly, never silently.**

---

## Why this exists

Without an explicit shared decision document, parallel agents make independent technical choices that conflict at integration time:

- One agent picks REST, another assumes GraphQL → integration fails
- One uses snake_case, another camelCase → schema mismatch
- One assumes optimistic locking, another pessimistic → race conditions in production
- One returns ISO 8601 UTC, another returns local strings → timezone bugs in every report

Each conflict costs hours to debug, often days to fully untangle. The ADR prevents this for ~10 minutes of upfront cost.

The architectural decision matters more than the architectural document. The doc just makes the decision survive the hand-off between agents.

---

## When an ADR exists for the work you've been delegated

### 1. Read it before generating code

If Rex's delegation references an ADR path (e.g., `docs/adr/0007-timezone-handling.md`), read it. Not skim — read.

If Rex did not reference an ADR but the work touches more than one module (or any of: auth, payments, multi-tenant scoping, external integrations, schema changes), pause and ask Rex whether an ADR exists or should exist before generating code.

### 2. Honor the cross-agent rules

Every ADR has a **Cross-agent rules** section. Find the rules for your sub-agent role. Follow them exactly.

If a rule conflicts with your default pattern (e.g., the ADR says "use Redis for session state" but your default is JWT-only), the ADR wins. Implement per the ADR.

### 3. Reference the ADR in your output

In your status report back to Rex, name the ADR you followed:

> "Implemented per ADR-0007 (timezone handling). All timestamps emitted as ISO 8601 UTC."

This makes `rex-reviewer`'s job trivial — they verify your work matches the cited ADR rather than re-deriving the right answer.

### 4. Disagree explicitly, never silently

If you read the ADR and you think it's wrong — say so. Stop work. Report to Rex:

> "ADR-0007 says X, but X breaks for case Y. Recommending Rex reconsider with rex-architect before I implement."

Silently deviating from the ADR is the worst outcome — you create the exact integration conflict the ADR exists to prevent, but now without the documentation trail.

---

## When no ADR exists but you think one should

If you're generating code on a multi-module feature and there is no ADR, do not proceed. Report to Rex:

> "This feature touches [modules]. Recommending rex-architect produce an ADR before parallel implementation begins."

Rex decides whether to commission the ADR or proceed without one. You do not make that call.

---

## ADR location and naming

ADRs live in: `C:\Users\hgonz\rekaliber\docs\adr\NNNN-short-name.md`

- Numbering is strictly sequential (`0001-`, `0002-`, ...)
- File names use kebab-case (`0007-timezone-handling.md`, not `0007 Timezone Handling.md`)
- Only `rex-architect` writes ADRs. Other sub-agents read them.

---

## ADR lifecycle (sub-agents need to know this much)

- **Proposed** — under review, do not implement against this yet
- **Accepted** — current source of truth; implement against this
- **Superseded by ADR-XXXX** — outdated; switch to the new ADR

If you find yourself reading a Proposed or Superseded ADR for active implementation, stop and check with Rex which ADR is canonical.

---

## What does NOT need an ADR

The ADR is not for every decision. Skip it for:

- Single-file changes
- Single-module features (no parallel sub-agent work)
- Bug fixes that don't change contracts
- Pure refactors within a module
- Documentation-only changes
- Test additions

Over-ADR'ing produces the same dead-document problem as under-ADR'ing. Use it where it pays for itself.

---

## Quick reference card

| You are about to ... | Do this |
|---|---|
| Generate code on a multi-module feature | Read the ADR first |
| Generate code and Rex didn't mention an ADR | Ask Rex if one exists |
| Disagree with the ADR | Stop, report to Rex, do not silently deviate |
| Finish the work | Cite the ADR in your status report |
| Touch auth / payments / multi-tenant / schema / external integration | An ADR is required |
| Fix a typo or do a single-file change | No ADR needed |
