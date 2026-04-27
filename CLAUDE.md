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

## Shogun — Parallel Execution (ASK FIRST, NEVER AUTO-INVOKE)

**Shogun runs with `--dangerously-skip-permissions`. NEVER auto-invoke. ALWAYS ask the user first.**

**Suggest Shogun when ALL of these are true:**
- The task can be decomposed into 3+ independent workstreams
- Speed matters more than per-action review
- The task does NOT touch: authentication, payments, credentials, secrets, or security-sensitive code
- The user has already approved the general approach (e.g., via a plan)

**How to suggest:**
> "This task has [N] independent workstreams that could run in parallel. Want me to use Shogun for this? It runs 10 agents simultaneously in WSL but skips all permission prompts — only use it for trusted, non-sensitive work."

**Never suggest Shogun for:**
- Security audits or red-teaming (use rex-security / rex-redteam instead)
- Anything touching `.env`, credentials, API keys, or secrets
- Payment or auth code
- Production deployments
- Small focused tasks (subagents within Claude Code are sufficient)

**Repo:** `https://github.com/hgonzalezstahl-blip/multi-agent-shogun` (upstream: `yohey-w/multi-agent-shogun`)
**Launch:** `wsl -d Ubuntu -u hgonz -- bash -lc 'cd ~/multi-agent-shogun && ./shutsujin_departure.sh'`
**Connect:** `wsl -d Ubuntu -u hgonz -- bash -lc 'tmux attach -t shogun'`

---

## Context Engineering

**On compaction, always preserve:** modified file list, all test commands, current STATE.md contents, agent delegation context, and the active task list.

**Knowledge pointers (load on demand, not upfront):**
- Rekaliber protocol: auto-loaded via `~/.claude/rules/rekaliber-protocol.md`
- NestJS patterns: auto-loaded via `~/.claude/rules/nestjs-backend.md`
- Frontend conventions: auto-loaded via `~/.claude/rules/frontend-react.md`
- Prisma conventions: auto-loaded via `~/.claude/rules/prisma-database.md`
- DOCX generation rules: auto-loaded via `~/.claude/rules/docx-generation.md` (Echo, Pitch, any agent producing Word documents)
- Deep reference docs: search via knowledge-rag MCP server

---

## File Naming (Global Rule)

All user-facing output files — Word documents, PDFs, deliverable markdown, generated artifacts that land in `Downloads/` or on the desktop — use **spaces, not underscores**, between words.

- Correct: `Final Policy Brief V4 [LastName].docx`
- Wrong: `Final_Policy_Brief_V4_[LastName].docx`

Hyphens are fine where they're part of a name (`[LastName]`). Underscores are reserved for code files (Python modules, shell scripts) where the syntax requires them.

---

## General Principle

These orchestrators exist to provide accuracy, fidelity, and trust. Default to invoking them proactively when context matches — the cost of an extra agent invocation is far lower than the cost of building on a false assumption or shipping untested code.
