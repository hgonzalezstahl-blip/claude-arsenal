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

## Project Routing (non-Rekaliber projects)

The user works on multiple projects beyond Rekaliber. Route as follows when the project is mentioned and no orchestrator is specified:

| Project | Default routing |
|---|---|
| **Lean AI app** (Capacitor / mobile, May 2026 launch) | TaskMaster for planning + features. Spark for marketing / ASO / launch. Auditor for any code review (if reviewing past work). Mobile-specific concerns (TestFlight, App Store review, Capacitor plugins, Apple/Google policy) live with TaskMaster — flag explicitly when these come up. |
| **Lean AI Content Ecosystem** (leanlogic.org templates, courses, consulting) | Spark for content + marketing. Vault for pricing / unit economics. Echo for written deliverables. Pitch for any role applications. |
| **Punto Azul Ecosystem** (three-brand padel/gear, `C:\Users\hgonz\punto-azul`) | Spark for branding + marketing across the three brands. Vault for pricing / financials. Auditor for any inherited code review. TaskMaster for any cross-brand build-out. |
| **Echo / Pitch deliverables** (one-off) | The agent that produced the artifact owns it; `retrospective` fires when external feedback comes back. |

When the project is unclear and the request is generic, ask which project before routing.

---

## Auditor — External Codebase Audit

**Auto-invoke `auditor` whenever:**
- The user wants a structural / safety review of a codebase they did not write (Lovable, Bolt, Cursor, v0, junior-built, inherited)
- The user asks "is this safe to scale?", "what's broken in this code?", "review this codebase", "is this production-ready?"
- A non-technical founder shows code and asks for a risk assessment
- Anyone mentions an inherited codebase or vibe-coded app shipped to real customers
- The user pastes code from an unfamiliar codebase and asks for review

**Do NOT auto-invoke `auditor` for Rekaliber-internal audits** — those go to `rex-reviewer` + `rex-security` + `rex-qa` (project-specific protocol). **Rex's working-directory match (Rekaliber) takes precedence over every other auto-invocation in this file**, including auditor — even if the user types "audit this codebase" inside `C:\Users\hgonz\rekaliber`.

---

## Systems-Thinking Skills (auto-invoke when context matches)

These skills enforce systems-thinking discipline across all projects. Auto-invoke when context matches — don't wait for the user to name them.

**`three-questions`** — Auto-invoke as the final gate inside `rex-qa`, before approving multi-file PRs, before declaring AI-generated code "done", or when the user says "is this coherent?", "did I actually understand what I just shipped?". Forces plain-English answers on state ownership, feedback presence, blast radius.

**`checkpoint`** — Auto-invoke after `rex-qa` PASSes a non-trivial module, after Lovable / Bolt / Cursor produces something the user did not write, before approving a PR with >10 files changed, or when the user says "walk me through this", "what should I look at first". Concern-ordered walkthrough with blast-radius hotspots.

**`elicit`** — Auto-invoke after `ce-plan`, `TaskMaster`, `vault-modeler`, `spark-strategist`, or any agent produces a high-stakes spec / model / plan, or when the user says "stress test this", "pre-mortem", "what could go wrong", "rethink this", "second pass", "challenge this". Picks one of 9 reasoning methods.

**`adversarial-review`** — Auto-invoke before signing off on specs, plans, prose, financial models, or agent definitions, or when the user says "tear this apart", "find the holes", "play devil's advocate", "what am I missing". Force-find-issues review on non-code artifacts. Different from `rex-redteam` (prompts) and `compound-engineering:review:adversarial-reviewer` (code).

**Tiebreakers:** if the user phrasing looks like a financial-model stress test ("stress test this revenue model", "stress test the pricing"), `vault-auditor` wins over `elicit` and `adversarial-review`. If the artifact is code, `compound-engineering:review:adversarial-reviewer` wins. If the artifact is an agent definition or prompt, `rex-redteam` wins. `elicit` and `adversarial-review` are for everything else (specs, plans, prose, models reviewed structurally).

**`roundtable`** — Auto-invoke for high-stakes decisions that cross orchestrator boundaries: pricing (Vault + Spark + Luna), build vs buy (Rex + Vault + Scout), launch readiness (Rex + Luna + Spark), architecture with cost stakes (Rex + Vault), inherited-codebase decisions (Auditor + Vault + Rex), cross-domain planning (TaskMaster + relevant orchestrators). Convenes 3-5 orchestrators in one debate. Eligible cast: Rex, Vault, Spark, Luna, Scout, Auditor, TaskMaster. Orchestrators are voiced in-conversation, not spawned as sub-agents — read their persona files first. Trigger words: "roundtable", "what does everyone think", "round-robin this", "convene the team".

**`retrospective`** — Auto-invoke after `rex-qa` passes a notable module, after Spark / Vault / Echo / Pitch deliver a major artifact, after a debugging session uncovered a non-obvious cause, **after the user receives external review of a deliverable (instructor, client, reviewer, user feedback)**, when the user catches the agent making the same mistake twice, or when the user says "save the learning", "what should we systematize". Three-bucket retro that writes durable memory.

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
- Solutioning / ADR contract: auto-loaded via `~/.claude/rules/solutioning-adr.md` (all rex sub-agents read this before generating code on multi-module work)
- Deep reference docs: search via qmd MCP server (local markdown index)

---

## Manual-only agents (do not auto-invoke)

These exist in the arsenal but require explicit user invocation — context detection alone is insufficient signal:

- **`multi-sim`** — Monte Carlo simulation runner. Invoke when the user wants N independent passes of the same prompt/agent for variance analysis. Suggest (don't auto-invoke) after a Luna persona test if the user asks "how reliable is this finding?" or "would another persona group reach the same conclusion?".
- **`arsenal-optimizer`** — Audits this arsenal. Manual only.
- **`agentic-architect`** — General-purpose agent infrastructure review. Manual only. Overlaps with `arsenal-optimizer` — consolidation candidate; for now, prefer `arsenal-optimizer` for `~/.claude/` audits and `agentic-architect` for any other project's agent infrastructure.

---

## File Naming (Global Rule)

All user-facing output files — Word documents, PDFs, deliverable markdown, generated artifacts that land in `Downloads/` or on the desktop — use **spaces, not underscores**, between words.

- Correct: `Final Policy Brief V4 [LastName].docx`
- Wrong: `Final_Policy_Brief_V4_[LastName].docx`

Hyphens are fine where they're part of a name (`[LastName]`). Underscores are reserved for code files (Python modules, shell scripts) where the syntax requires them.

---

## General Principle

These orchestrators exist to provide accuracy, fidelity, and trust. Default to invoking them proactively when context matches — the cost of an extra agent invocation is far lower than the cost of building on a false assumption or shipping untested code.
