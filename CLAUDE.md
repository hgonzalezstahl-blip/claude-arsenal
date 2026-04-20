# Global Orchestration Rules

These rules govern when Claude automatically invokes orchestrators and agents without waiting for the user to name them explicitly. Detect intent from context — do not require the user to say "use Rex" or "use Luna."

---

## Rex — Rekaliber Orchestrator

**Auto-invoke `rex-rekaliber-orchestrator` whenever:**
- The working directory is or references `C:\Users\hgonz\rekaliber`
- The user mentions Rekaliber, the PMS, or any of its modules (reservations, properties, channels, inbox, pricing, financials, portals, direct booking, calendar, OTA, etc.)
- The user says "start", "continue", "keep going", "keep building", "next", "what's next", or "next module" in any Rekaliber context
- The user pastes an error, stack trace, or log from the Rekaliber stack (NestJS, Prisma, Next.js, BullMQ, Railway)
- The user asks to build, fix, debug, scaffold, review, or deploy anything in the Rekaliber project
- The user asks about the state of the project, what modules are done, or what to build next

**Do not wait** for the user to say "use Rex." If the task touches Rekaliber, Rex owns it.

**Rekaliber protocol is in:** `~/.claude/rules/rekaliber-protocol.md` (auto-loaded when working in rekaliber/)

---

## Luna — Dynamic Persona Testing Orchestrator

**Auto-invoke `luna` whenever:**
- Rex has completed a user-facing module and rex-qa has passed
- The user asks "is this good UX?", "how would users feel about this?", "is this intuitive?", "would someone actually use this?", or similar
- The user asks about user experience, user feedback, or user testing for any product
- The user says "test this from a user perspective", "simulate a user", "what would a host/guest/owner think?"
- The user is preparing for a demo, investor presentation, or client onboarding and wants UX validation

**Luna is not Rekaliber-specific.** Invoke it for any product when the user wants persona-based UX feedback.

**Luna dynamically generates personas** via its Persona Factory — no fixed roster. Personas are purpose-built for each evaluation based on the product, feature, and user base being tested. Luna spawns `luna-persona` agents with generated briefs, then `luna-analyst` synthesizes findings.

---

## Rex-RedTeam — Prompt Adversarial Testing

**Auto-invoke `rex-redteam` whenever:**
- A new agent definition is created or significantly modified
- Rex-security completes a code-level audit and prompt-level testing is needed
- The user asks "is this agent secure?", "red team this", "test my agent prompts"
- Any agent is about to handle untrusted user input (portals, chatbots, booking engine)

---

## rex-researcher — Fact Checker

**Auto-invoke `rex-researcher` whenever:**
- A Rex agent is about to assert a specific library version, API method signature, or third-party service behavior
- The user asks a technical question where the answer is version-specific, could be outdated, or depends on external documentation
- A CVE or security advisory is mentioned and needs validation against the current stack
- Any claim is made about what a third-party API (Stripe, Airbnb, Booking.com, Railway) supports

---

## TaskMaster — Planning Orchestrator

**Auto-invoke `TaskMaster` whenever:**
- The user requests big changes, architectural decisions, major refactors, redesigns, or new feature implementations (NOT in Rekaliber — Rex owns that)
- The user says "build", "redesign", "architect", "implement", "refactor", "restructure", or "revamp" in any non-Rekaliber context
- The user describes a multi-step initiative or asks "how should I approach..." or "what's the best way to..."
- The user needs a comprehensive plan before implementation begins

---

## Context Engineering

**On compaction, always preserve:** modified file list, all test commands, current STATE.md contents, agent delegation context, and the active task list.

**Knowledge pointers (load on demand, not upfront):**
- Rekaliber protocol: auto-loaded via `~/.claude/rules/rekaliber-protocol.md`
- NestJS patterns: auto-loaded via `~/.claude/rules/nestjs-backend.md`
- Frontend conventions: auto-loaded via `~/.claude/rules/frontend-react.md`
- Prisma conventions: auto-loaded via `~/.claude/rules/prisma-database.md`
- Deep reference docs: search via knowledge-rag MCP server

---

## General Principle

These orchestrators exist to provide accuracy, fidelity, and trust. Default to invoking them proactively when context matches — the cost of an extra agent invocation is far lower than the cost of building on a false assumption or shipping untested code.
