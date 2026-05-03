# Arsenal Full Audit — 2026-05-03

## Executive Summary

**Verdict: YELLOW.** The arsenal is structurally sound and the systems-thinking layer (skills, ADR gate in rex-architect, three-questions in rex-qa) is well-integrated. The previous sanity check fixes have all landed cleanly. However, this deep pass surfaces several real coordination drifts that the surface check could not see — most of them between agent prompts and the rules they are supposed to follow. None will silently produce wrong code today, but each will compound over time.

**Top 3 systemic issues:**
1. **Two agents claim ADR ownership with conflicting locations** — rex-architect writes ADRs to `docs/adr/NNNN-name.md` (matches the rule), rex-docs writes them to `./agents/DECISIONS.md`. This is the highest-priority conflict in the audit because both agents are in the gate pipeline and either can fire on a feature.
2. **All HTTP hooks fire to a non-existent service on port 3001.** Every PreToolUse / PostToolUse / Stop / SubagentStart / etc. hook posts to `http://localhost:3001/hooks/claude` — but no service runs there (the dashboard listens on 3333). 14 hook events fire silently on every tool call.
3. **The solutioning-adr.md rule says "all rex sub-agents read this" and "rex-reviewer flags non-compliance" — but the actual sub-agent and reviewer prompts never reference the rule.** The rule exists; the enforcement doesn't.

**Recommended action sequence:**
1. Fix the rex-architect / rex-docs ADR ownership conflict (Critical #1) — single edit to rex-docs.
2. Decide on the port 3001 HTTP hook situation (Critical #2) — either start a service or strip the hooks.
3. Insert ADR enforcement references into rex-backend / rex-frontend / rex-database / rex-integration / rex-tester / rex-reviewer (Notable #1).
4. Resolve the spark-closer orphan (add to spark.md or document as standalone-only).
5. Apply the smaller drifts in Section 2.

Scope: 51 agent files, 7 rule files, 6 skill files, 2 settings files, 12 hook scripts, 11 memory files, 1 knowledge README. Hooks read in full. ~25 minutes of analysis time.

---

## Section 1: Critical Issues (must fix)

### [#1] Conflicting ADR ownership between rex-architect and rex-docs

**Files:**
- `C:\Users\hgonz\.claude\agents\rex-architect.md` (lines 114–200)
- `C:\Users\hgonz\.claude\agents\rex-docs.md` (lines 195–215, 240, 254)
- `C:\Users\hgonz\.claude\rules\solutioning-adr.md` (line 70: "Only rex-architect writes ADRs.")

**Issue:** Two agents both claim to write ADRs, and they disagree on location.

- rex-architect.md:135 — ADRs live in `C:\Users\hgonz\rekaliber\docs\adr\NNNN-short-name.md`
- rex-docs.md:197 — "Significant architectural decisions → `./agents/DECISIONS.md`" with example ADR-001 / ADR-002 inline
- rex-docs.md:3 (description) — "Generates and maintains ... Architecture Decision Records (ADRs)"
- solutioning-adr.md:70 — "Only `rex-architect` writes ADRs. Other sub-agents read them."

**Why it matters:** rex-docs runs in every gate pipeline (FULL and LIGHT mode per rex-rekaliber-orchestrator.md:317). rex-architect runs only when scaffolding. If rex-docs writes an ADR to `agents/DECISIONS.md` while rex-architect writes one to `docs/adr/0007-x.md`, sub-agents will read the wrong file (or neither). The whole point of the solutioning-adr rule is that sub-agents have a single source of truth.

**Recommended fix — edit rex-docs.md:**

Replace line 3 description segment "and Architecture Decision Records (ADRs)" → "and module-level decision logs".

Replace section 5 (lines 195–215) with:

```markdown
### 5. Module Decision Logs

Significant module-level decisions that don't warrant a full ADR (naming choices, library picks within an established pattern, config tweaks) → `./agents/DECISIONS.md`.

**Architecture Decision Records (ADRs) are NOT written by rex-docs.** ADRs are written by `rex-architect` per `~/.claude/rules/solutioning-adr.md`, and live in `docs/adr/NNNN-short-name.md`. If a decision needs ADR-level documentation, hand off to rex-architect rather than writing one yourself.

The DECISIONS.md log uses a lighter template:

```markdown
## [date] [decision title]
**Module(s):** [list]
**Decision:** [one-sentence summary]
**Why:** [rationale, 1-2 sentences]
```

This is for decisions that survive within one module's lifecycle. Cross-module commitments belong in an ADR.
```

Then update line 240 from `🏗️ ADRs added this session: [N]` to `📝 Decision log entries this session: [N]`. Update rule 6 (line 254): "Decision log entries are written when a non-obvious within-module choice is made. Cross-module decisions go to ADRs (rex-architect)."

**Impact if unfixed:** Sub-agents reading "the ADR" will hit two inconsistent files. The whole solutioning-gate discipline collapses on the first feature where rex-docs is the last writer.

---

### [#2] All HTTP hooks fire to a non-existent service

**File:** `C:\Users\hgonz\.claude\settings.json` (every hook event)

**Issue:** Every hook event in settings.json (SessionStart, PreToolUse, PostToolUse, Stop, Notification, PostToolUseFailure, StopFailure, SubagentStart, SubagentStop, SessionEnd, TeammateIdle, TaskCompleted, WorktreeCreate, WorktreeRemove, Elicitation) posts to `http://localhost:3001/hooks/claude`. No service runs at port 3001 — the dashboard server.js (the only local HTTP service in `~/.claude/`) listens on port 3333.

Verified by reading `C:\Users\hgonz\.claude\dashboard\server.js:17` (`const PORT = ... || 3333`), and grep for `3001` returns zero matches in `~/.claude/hooks/`.

**Why it matters:** Each tool call fires multiple HTTP requests to a dead port. Best case: the HTTP hook type silently swallows ECONNREFUSED. Worst case: the agent harness logs error spam, slows tool dispatch, or (depending on harness implementation) blocks waiting for a timeout per call. Even with silent failure, the hook config is dishonest — it claims observability that doesn't exist.

**Recommended fix — pick one:**

**Option A (preferred if dashboard is the intended target):** Change every `http://localhost:3001/hooks/claude` to `http://localhost:3333/hooks/claude`, then verify the dashboard server.js handles `POST /hooks/claude` (it currently routes `/api/sessions` per server.js:678 — may need a route added).

**Option B (preferred if 3001 is an external observability service the user runs separately):** Add a comment to settings.json explaining what runs on 3001 and a hook readme. Or move the hook URL to an env var `${OBSERVABILITY_URL}` so it can be conditionally enabled.

**Option C (cleanup if neither service exists):** Strip every `http` hook block. The bash/node command hooks (audit-log, agent-audit, tool-audit, session-report) already provide observability via JSONL files. The HTTP fan-out is dead weight.

**Impact if unfixed:** Either the user runs an external service (in which case this is a non-issue — but undocumented) or 14+ hook events fire to nothing on every interaction. Drag on every operation, and the hook system can't be trusted.

---

### [#3] solutioning-adr rule expects enforcement that no agent prompt enforces

**Files:**
- `C:\Users\hgonz\.claude\rules\solutioning-adr.md` (full file)
- `C:\Users\hgonz\.claude\agents\rex-backend.md`
- `C:\Users\hgonz\.claude\agents\rex-frontend.md`
- `C:\Users\hgonz\.claude\agents\rex-database.md`
- `C:\Users\hgonz\.claude\agents\rex-integration.md`
- `C:\Users\hgonz\.claude\agents\rex-tester.md`
- `C:\Users\hgonz\.claude\agents\rex-reviewer.md`
- `C:\Users\hgonz\.claude\agents\rex-rekaliber-orchestrator.md`

**Issue:** solutioning-adr.md:11 says "all rex sub-agents read this before generating code on multi-module work." It also requires sub-agents to (a) read the ADR before coding, (b) cite the ADR in status reports, (c) explicitly disagree rather than silently deviate. solutioning-adr.md:153 ("Quick reference card") is the contract.

But: grep for "ADR" or "solutioning" across rex-backend, rex-frontend, rex-database, rex-integration, rex-tester, rex-reviewer returns zero matches. The rule exists; the enforcement entry-point doesn't.

Likewise, rex-rekaliber-orchestrator.md never instructs Rex to include the ADR path in delegations (rex-architect.md:189 explicitly expects this — "Rex must include the ADR path in the delegation").

rex-reviewer.md is supposed to bounce back work that ignores the ADR (rex-architect.md:191), but rex-reviewer.md never mentions ADR review.

**Why it matters:** A rule that no agent reads is decorative. The whole point of the solutioning gate is to prevent the integration-time conflicts the rule lists at the top. With no enforcement in the agents that generate code, the rule fires only when rex-architect produces an ADR — which is the easy half.

**Recommended fix — add this paragraph to rex-backend, rex-frontend, rex-database, rex-integration, rex-tester (under "## PROJECT CONTEXT" or in a new "## ADR PROTOCOL" section):**

```markdown
## ADR PROTOCOL

For multi-module work, follow `~/.claude/rules/solutioning-adr.md`:

1. If Rex's delegation references an ADR path (e.g., `docs/adr/0007-timezone-handling.md`), read it before generating code.
2. If the work touches more than one module and no ADR is referenced, pause and ask Rex whether one exists or should exist.
3. Honor the **Cross-agent rules** section of the ADR for your sub-agent role exactly. The ADR overrides your default patterns.
4. Cite the ADR in your status report ("Implemented per ADR-0007...").
5. If you disagree with the ADR, stop and report to Rex — never silently deviate.
```

**Add to rex-reviewer.md, in the PASS 1: SPEC COMPLIANCE checklist:**

```markdown
- ADR compliance — if the module/feature has an active ADR (`docs/adr/`), verify the implementation honors the Cross-agent rules. Sub-agents that touched a module with an active ADR but did not cite it are MUST FIX (bounce back to the originating agent).
```

**Add to rex-rekaliber-orchestrator.md, in the ORCHESTRATION PROTOCOL → 3. Execute step:**

```markdown
**ADR hand-off rule:** If the work is multi-module (per the rex-architect ADR criteria), Rex must (a) verify an ADR exists or commission one before delegating, and (b) include the ADR path in every sub-agent's prompt. See `~/.claude/rules/solutioning-adr.md`.
```

**Impact if unfixed:** Multi-module features will produce the exact integration-time conflicts the rule was written to prevent (REST vs GraphQL, naming, locking strategies). The user pays the integration cost the rule was designed to avoid.

---

## Section 2: Notable Issues (fix this week)

### [#1] spark-closer is an orphan in the Spark orchestrator

**Files:**
- `C:\Users\hgonz\.claude\agents\spark.md` (lines 36–43, "YOUR TEAM" table)
- `C:\Users\hgonz\.claude\agents\spark-closer.md`

**Issue:** spark-closer.md exists with full spec (sales proposals, pitch decks, cold outreach, objection handling, sales playbooks). spark.md's YOUR TEAM table lists 5 agents (writer, strategist, designer, analyst, curator) — spark-closer is absent. spark-strategist and spark-curator never reference spark-closer either.

**Why it matters:** When the user says "draft a sales proposal for X" or "write me a cold outreach sequence", Spark won't know to spawn spark-closer. The agent is invocable directly by name but not part of any pipeline. spark-closer.md:10 even claims it's "the sales specialist for the Spark team" — explicitly part of Spark.

**Recommended fix — add to spark.md:36–43:**

```markdown
| Agent | Role | Model | When to Spawn |
|:------|:-----|:-----:|:--------------|
| `spark-writer` | Content creation — any written deliverable | `sonnet` | Blog posts, emails, social media, landing pages, press releases, descriptions |
| `spark-strategist` | Marketing strategy and market research | `opus` | GTM plans, competitive analysis, pricing, personas, content calendars, launch plans |
| `spark-designer` | Visual assets and brand identity | `sonnet` | SVG illustrations, color palettes, typography, icons, brand guides, social templates |
| `spark-analyst` | Performance measurement and forecasting | `sonnet` | Revenue models, pricing analysis, CAC modeling, SEO audits, conversion funnels |
| `spark-closer` | Sales materials (proposals, pitch decks, outreach) | `sonnet` | Sales proposals, pitch decks, cold outreach sequences, objection handling, sales playbooks. Distinct from `spark-writer` (marketing copy) — closer writes sales copy. |
| `spark-curator` | Quality gate — reviews all output before delivery | `opus` | Always last. Reviews every deliverable for accuracy, voice, engagement, actionability |
```

And add a workflow under "## COMMON WORKFLOWS":

```markdown
### Sales Enablement
1. `spark-strategist` → buyer persona, positioning, value prop
2. `spark-analyst` → ROI model, pricing comparison
3. `spark-closer` → proposal / pitch deck / outreach sequence
4. `spark-curator` → review for accuracy and voice
```

---

### [#2] Luna fixed personas (host/guest/owner) are reference-only but still discoverable as spawnable agents

**Files:**
- `C:\Users\hgonz\.claude\agents\luna.md` (line 37)
- `C:\Users\hgonz\.claude\agents\luna-host.md`
- `C:\Users\hgonz\.claude\agents\luna-guest.md`
- `C:\Users\hgonz\.claude\agents\luna-owner.md`

**Issue:** luna.md:37 explicitly says these three agents "exist as canonical reference examples ... reference material, not active casting." But each file has full agent frontmatter (`name: luna-host`, `model: sonnet`, `effort: normal`, `memory: user`) — meaning the agent loader will register them as spawnable agents alongside `luna-persona`. The user (or a confused orchestrator) can still spawn `luna-host` directly.

**Why it matters:** The intent (per luna.md) is that all personas are dynamically generated by Luna's Persona Factory and spawned via `luna-persona`. The fixed personas exist as reference material only. But the current setup leaves both a rigid Marcus-only path and the dynamic path available — agents discovering the roster via list-agents or similar will see four persona-named agents and may pick wrong.

**Recommended fix — pick one:**

**Option A (lightweight, minimal change):** Update each fixed-persona file's `description` field to be unambiguous. Edit luna-host.md:3 to:

```yaml
description: "REFERENCE ONLY — do not spawn directly. Canonical example of a Marcus Chen / Property Manager persona brief. Used by Luna's Persona Factory as a tone-and-depth anchor when generating new property-manager personas. Active persona spawns go through `luna-persona` with a generated brief."
```

Apply the same pattern to luna-guest.md and luna-owner.md.

**Option B (structural, cleaner):** Move all three files to `~/.claude/agents/_reference/luna-personas/` and remove the `name:` field from frontmatter so the loader doesn't register them as agents. Update luna.md:37 to point at the new path. This is the semantically correct fix but requires verifying the loader supports a `_reference/` subdirectory exclusion.

**Option C (rename):** Rename to `luna-host.example.md`, `luna-guest.example.md`, `luna-owner.example.md` so they don't match the standard `*.md` agent loader glob. Riskier — depends on whether the loader uses `*.md` or filters specific patterns.

Recommend Option A — it works with the current loader, surfaces the intent clearly to anyone reading agent descriptions, and requires three line edits.

---

### [#3] knowledge/README.md still references the deleted knowledge-rag MCP

**File:** `C:\Users\hgonz\.claude\knowledge\README.md` (line 3)

**Issue:** Line 3: "It is indexed by the knowledge-rag MCP server for semantic search." CLAUDE.md was just updated to point at `qmd MCP server` — knowledge/README.md is now stale.

Worse: the MCP server-instructions reminder shows qmd has 0 indexed documents ("QMD is your local search engine over 0 markdown documents"). So the pointer in CLAUDE.md is technically correct but the index is empty.

**Recommended fix — edit knowledge/README.md line 3:**

```markdown
This directory is the L3 tier of the agent memory architecture. It is indexed by the **qmd MCP server** for keyword and (after `qmd embed`) semantic search.

Setup:
- The corpus is the markdown files in this directory tree.
- Run `qmd collection list` to confirm this directory is registered.
- Run `qmd embed` once to enable vec/hyde semantic search.
- Run `qmd update` after adding new files.

Usage from agents:
- Lex search: `[{type:'lex', query:'multi-tenant isolation'}]`
- Semantic search (after embed): `[{type:'vec', query:'how do we scope queries by org'}]`
```

This makes the pointer match CLAUDE.md and explicitly tells the user the index is empty until `qmd embed` runs.

---

### [#4] auditor.md rule 7 lists jcodemunch MCP as available, but it's not configured

**Files:**
- `C:\Users\hgonz\.claude\agents\auditor.md` (line 196)
- `C:\Users\hgonz\.claude\settings.json` (no MCP server entry for jcodemunch)
- Also referenced: `~/.claude/skills/three-questions/SKILL.md`, `~/.claude/skills/checkpoint/SKILL.md`, `~/.claude/agents/rex-qa.md`

**Issue:** auditor.md:196 — "Use Read, Glob, Grep, jcodemunch MCP, WebFetch (for dependency CVE checks)." This is stated as a fact, not gated. But settings.json has no jcodemunch entry, no `.mcp.json` at user scope, and grep across `.claude/` finds the name only in agent prompts.

The skills (three-questions, checkpoint) and rex-qa correctly gate jcodemunch usage with "if jcodemunch MCP is available" — auditor does not.

memory: arsenal_audit_2026_04_21.md:23 mentions jcodemunch was added — but it's no longer present.

**Why it matters:** When auditor tries to call jcodemunch tools, they don't exist; the agent stalls or misroutes. Other agents handle the absence gracefully — auditor doesn't.

**Recommended fix — edit auditor.md:196:**

```markdown
7. **Auditor is read-only.** Use Read, Glob, Grep, and WebFetch (for dependency CVE checks). If `jcodemunch` MCP is configured, use `mcp__jcodemunch__get_blast_radius`, `find_importers`, and `get_signal_chains` to ground Layer 1 (architectural coherence) and Layer 5 (failure modes) in real dependency data. Do not write to the codebase.
```

Same gate-pattern other agents already use.

---

### [#5] rex-rekaliber-orchestrator says it spawns `rex-architect`, but the SUPPORT AGENTS table is missing rex-architect entirely

**File:** `C:\Users\hgonz\.claude\agents\rex-rekaliber-orchestrator.md` (lines 51–80)

**Issue:** The BUILD AGENTS table (lines 53–60) lists rex-architect for "Scaffolding, deps, Docker, env." But:
- rex-architect is now also the ADR producer (per the new solutioning gate in rex-architect.md:114). The orchestrator never tells Rex to invoke rex-architect for ADR work specifically.
- The orchestration protocol (lines 295–376) doesn't mention "before delegating multi-module work, spawn rex-architect to write the ADR."

**Why it matters:** The ADR gate is the most important architectural addition since the systems-thinking upgrade. The orchestrator's protocol still describes only the build/gate pipeline as if ADRs don't exist.

**Recommended fix — add a new step to rex-rekaliber-orchestrator.md ORCHESTRATION PROTOCOL between step 2 (Plan) and step 3 (Execute):**

```markdown
### 2.5 Solutioning Gate (ADR check)

Before any multi-module delegation, Rex verifies whether the work crosses module boundaries (≥2 sub-agents in parallel, or any of: auth, payments, multi-tenant scoping, schema with downstream impact, external integration). If yes:

1. Check `C:\Users\hgonz\rekaliber\docs\adr\` for an existing Accepted ADR covering this work.
2. If none, spawn `rex-architect` first with the ADR brief. Wait for the ADR to land before delegating implementation.
3. When delegating, include the ADR path in every sub-agent's prompt:
   > "Implement [feature] per ADR-0007 (`docs/adr/0007-name.md`). Read the Cross-agent rules section before coding."

See `~/.claude/rules/solutioning-adr.md` for the full protocol.
```

---

### [#6] Stale roundtable cast description in arsenal_systems_thinking_2026_04_27.md

**File:** `C:\Users\hgonz\.claude\projects\C--Users-hgonz\memory\arsenal_systems_thinking_2026_04_27.md` (line 15)

**Issue:** Memory says roundtable convenes "3-5 orchestrators (Rex / Vault / Spark / Luna / Scout)". But CLAUDE.md:110 and the roundtable SKILL.md cast table now include Auditor and TaskMaster as eligible.

**Why it matters:** When the agent reads memory to recall what roundtable does, it gets the old cast. Low impact (the skill itself is authoritative) but contributes to drift.

**Recommended fix — edit arsenal_systems_thinking_2026_04_27.md:15:**

Change "Convenes 3-5 orchestrators (Rex / Vault / Spark / Luna / Scout) into one debate" → "Convenes 3-5 orchestrators (Rex / Vault / Spark / Luna / Scout / Auditor / TaskMaster) into one debate. Cast picked per decision type."

---

### [#7] pitch.md says it reads 5 files but lists 7

**File:** `C:\Users\hgonz\.claude\agents\pitch.md` (line 18)

**Issue:** Line 18: "read these five files" — then lists 1, 2, 3, 4, 5, 6, 7 (seven files). Off-by-two error from a previous edit that added `section-expansion-rules.md` and `docx-generation.md`.

**Recommended fix — edit pitch.md:18:**

`Before producing any application material, **read these five files**:` → `Before producing any application material, **read these seven files**:`

---

### [#8] multi-sim.md missing `color:` field

**File:** `C:\Users\hgonz\.claude\agents\multi-sim.md` (frontmatter, lines 1–7)

**Issue:** Every other agent has a `color:` field. multi-sim has none. Cosmetic only — but inconsistent.

**Recommended fix — add to multi-sim.md frontmatter:**

```yaml
color: silver
```

Pick any color the user prefers. Silver fits the meta/utility nature of the agent.

---

### [#9] arsenal-optimizer.md and agentic-architect.md overlap is documented in CLAUDE.md but not in either agent's body

**Files:**
- `C:\Users\hgonz\.claude\agents\arsenal-optimizer.md`
- `C:\Users\hgonz\.claude\agents\agentic-architect.md`
- `C:\Users\hgonz\.claude\CLAUDE.md` (line 163)

**Issue:** CLAUDE.md:163 documents the boundary: "prefer arsenal-optimizer for `~/.claude/` audits and agentic-architect for any other project's agent infrastructure." But neither agent's prompt body mentions the other or self-scopes to its half. A user invoking either directly gets no boundary signal.

**Recommended fix — add to arsenal-optimizer.md after line 16 (before "## AUDIT PROTOCOL"):**

```markdown
## SCOPE BOUNDARY

This agent audits the user's **own arsenal** at `~/.claude/`. For audits of agent infrastructure in any other project (a client codebase, a separate workspace's `.claude/` directory, an inherited agent system), use `agentic-architect` instead. Both agents share methodology — the difference is target scope.
```

**Add to agentic-architect.md after line 12 (before "## Your Core Expertise"):**

```markdown
## Scope Boundary

This agent reviews agent infrastructure for **any project** — a client codebase, a separate workspace's `.claude/`, an inherited agent system. For audits of the user's primary user-scope arsenal at `~/.claude/`, use `arsenal-optimizer` — it has shorthand familiarity with the user's specific agent roster, naming conventions, and rules files.

Both agents share methodology; the boundary is target scope.
```

This is a manual-only pair per CLAUDE.md:157–163, so the boundary is a soft guide, not a hard gate.

---

### [#10] TaskMaster.agent.md filename uses non-standard `.agent.md` infix and CamelCase

**File:** `C:\Users\hgonz\.claude\agents\TaskMaster.agent.md`

**Issue:** All other 50 agent files use `lowercase-name.md`. TaskMaster.agent.md is the only one with `CamelCase` and `.agent.md` infix.

**Verification:** The agent loader registers agents by their frontmatter `name:` field (`name: TaskMaster`), not by filename. CLAUDE.md references `TaskMaster` consistently. Grep across CLAUDE.md and all agents finds zero references to `TaskMaster.agent.md` as a filename — only to the name `TaskMaster`. So functionally, the loader almost certainly picks it up via `*.md` glob.

That said, it is the only agent in the directory with this naming pattern. If a future loader change tightens the glob to `[a-z]*.md` or strips the `.agent.md` infix, TaskMaster will silently disappear.

**Recommended fix — rename the file:**

```
TaskMaster.agent.md  →  taskmaster.md
```

The frontmatter `name: TaskMaster` is preserved, so all CLAUDE.md references continue to work. This brings the file into convention with every other agent.

If the user prefers to keep CamelCase in the filename for some reason, at minimum strip the `.agent.md` infix (rename to `TaskMaster.md`).

**Decision required from user.** This is a flagged-for-decision item, not a unilateral fix.

---

## Section 3: Cross-Agent Drift & Delegation Issues

### Rex orchestrator → sub-agents

| Sub-agent | Listed in rex-rekaliber-orchestrator delegation table? | File exists? | ADR rule referenced? |
|---|---|---|---|
| rex-architect | Yes (BUILD) | Yes | Yes (writes them) |
| rex-database | Yes (BUILD) | Yes | **No** |
| rex-backend | Yes (BUILD) | Yes | **No** |
| rex-frontend | Yes (BUILD) | Yes | **No** |
| rex-integration | Yes (BUILD) | Yes | **No** |
| rex-reviewer | Yes (GATES) | Yes | **No (but should enforce)** |
| rex-security | Yes (GATES) | Yes | N/A (security audit only) |
| rex-tester | Yes (GATES) | Yes | **No** |
| rex-performance | Yes (GATES) | Yes | N/A |
| rex-observability | Yes (GATES) | Yes | N/A |
| rex-docs | Yes (GATES) | Yes | **CONFLICTS with rex-architect** |
| rex-qa | Yes (GATES) | Yes | N/A |
| rex-debugger | Yes (SUPPORT) | Yes | N/A |
| rex-devops | Yes (SUPPORT) | Yes | N/A |
| rex-researcher | Yes (SUPPORT) | Yes | N/A |
| luna | Yes (SUPPORT) | Yes | N/A |
| rex-redteam | **No** | Yes | N/A |

Drift findings:
- **rex-redteam exists but is missing from rex-rekaliber-orchestrator's delegation tables.** CLAUDE.md:38 documents auto-invocation, but the orchestrator can't delegate to an agent it doesn't list. Add to SUPPORT AGENTS:

  ```markdown
  | Adversarial prompt-level testing of agent definitions | `rex-redteam` |
  ```

- ADR enforcement gap (covered in Section 1, #3).
- ADR ownership conflict (covered in Section 1, #1).

### Luna orchestrator → sub-agents

| Sub-agent | Referenced in luna.md? | File exists? |
|---|---|---|
| luna-persona | Yes (canonical spawn target) | Yes |
| luna-analyst | Yes (synthesis at end) | Yes |
| luna-host | Reference only (per luna.md:37) | Yes (but unguarded — see Section 2 #2) |
| luna-guest | Reference only | Yes (unguarded) |
| luna-owner | Reference only | Yes (unguarded) |

Drift: the `_reference/` problem from Section 2 #2.

### Spark orchestrator → sub-agents

| Sub-agent | Referenced in spark.md? | File exists? |
|---|---|---|
| spark-writer | Yes | Yes |
| spark-strategist | Yes | Yes |
| spark-designer | Yes | Yes |
| spark-analyst | Yes | Yes |
| spark-curator | Yes | Yes |
| spark-closer | **No** | Yes |

Drift: orphan spark-closer (Section 2 #1).

### Vault orchestrator → sub-agents

| Sub-agent | Referenced in vault.md? | File exists? |
|---|---|---|
| vault-modeler | Yes | Yes |
| vault-analyst | Yes | Yes |
| vault-auditor | Yes | Yes |

Clean.

### Auditor → sub-agents

Auditor is standalone (no sub-agent spawns). It references the `three-questions` skill and `adversarial-review` skill correctly. Clean.

### TaskMaster → sub-agents

TaskMaster spawns generic Explore sub-agents (line 17), not named arsenal agents. By design — Explore is a built-in primitive. Clean.

---

## Section 4: Hook Script & Permissions Findings

### Per-hook findings

| Hook script | Issue | Severity |
|---|---|---|
| `protect-sensitive-files.sh` | Logic correct. Pattern is comprehensive (.env, credentials, secrets, id_rsa, private.key). | OK |
| `tdd-enforcement.sh` | Hard-codes Rekaliber-specific path detection — fine, scoped intentionally. | OK |
| `detect-prompt-injection.sh` | Comprehensive pattern list. Two regex points: line 17 has `\\u200b` etc. inside double quotes — bash will not interpret these as literal Unicode but as the literal escape sequences. May not match actual zero-width chars in file content. **Minor bug.** | LOW |
| `auto-format.sh` | `npx prettier ... 2>/dev/null \|\| true` — if prettier isn't installed for the file's project, fails silently. Acceptable for an opportunistic format. | OK |
| `audit-log.sh` | Append-only with `\|\| true`. Safe. | OK |
| `session-end.sh` | Logic correct, uses `wc` and `grep` defensively. | OK |
| `notify-windows.sh` | Powershell call to MessageBox. Fine. | OK |
| `dashboard-launch.sh` | Hard-codes port 3333 (correct for dashboard). Conflicts with the 3001 hooks in settings.json — see Critical #2. Otherwise OK. | OK |
| `agent-audit.js` | Defensive try/catch with silent fail. Good. | OK |
| `tool-audit.js` | Same pattern. Good. | OK |
| `truncate-large-output.sh` | Comment line 4 is honest: "This hook does NOT modify the output (can't), but alerts the agent." Good — sets expectation correctly. | OK |
| `ccproxy-start.sh` | Gracefully exits if not installed. Safe. | OK |
| `shogun-launch.sh` | Hard-codes user `hgonz` and Ubuntu distro. Fine for single-user setup, would break if cloned. Already documented. | OK |
| `session-report.js` | Pricing table at line 17–20: cache_write hardcoded as 1.25x of input — verify this matches current Anthropic pricing. Comment line 161–162 already flags this. Good defensive note. | OK |
| `audit-summary.js` | CLI tool, not auto-run. Fine. | OK |

**Bigger issue:** the HTTP hook fan-out to localhost:3001 (Critical #2).

### Permissions audit (settings.local.json — 277 entries)

**Genuinely unsafe permissions:**
- None found. No `Bash(rm -rf *)` or unbounded destructive patterns.
- Most permissions are scoped (`pnpm:*`, `npm install:*`, etc.).
- One entry to note: line 116 `Bash(rm -rf apps/docs apps/web)` — narrow path scope, project-specific to a Punto Azul scaffold action. Inert today, will silently match if a similar path appears later. Recommend deletion.

**Duplicates / overlaps:**
- Line 52 `Bash(./node_modules/.bin/eslint ...)` overlaps with general `Bash(npx:*)` (line 236).
- Lines 243, 245 — different `$UVX` and `$CCPROXY` env var patterns granting nearly identical access. Could consolidate.
- Lines 175–179 — five separate ffmpeg permissions; could be one wildcard `Bash($FFMPEG:*)`.
- Three different forms of `Read(//c/...)` — lines 72, 98, 99, 143, 144, 145, 175 — overlapping paths.

**Permissions for tools/commands that don't exist anymore:**
- Line 14 `Bash(npx create-next-app@latest leanai ...)` — one-time scaffold, project moved to lean-value-lab. Can prune.
- Line 27 `Bash(npx create-next-app@latest lean-ai-site ...)` — same reason.
- Line 28 `Bash(python3 -c "open\\(''C:/Users/hgonz/lean-value-lab/...")` — overly specific one-time read.
- Line 115 `Bash(npx create-turbo@latest . ...)` — one-time scaffold.
- Lines 117–119 — `mkdir -p` for the punto-azul layout, scaffold complete.
- Lines 78–82 — `mkdir -p` for `~/.claude/copilot-framework/.github/skills/...` — verify if these dirs still exist. If yes, prune.

**Top 50 useful patterns to keep if pruning:**

```
1.  Bash(npm --version)
2.  Bash(pnpm --version)
3.  Bash(node:*)
4.  Bash(npx:*)
5.  Bash(npm install:*)
6.  Bash(npm view:*)
7.  Bash(npm search:*)
8.  Bash(npm run:*)
9.  Bash(npm list:*)
10. Bash(pnpm:*)
11. Bash(pnpm typecheck:*)
12. Bash(pnpm lint:*)
13. Bash(pnpm build:*)
14. Bash(npx prisma:*)
15. Bash(npx tsc:*)
16. Bash(npx ts-node:*)
17. Bash(npx vite:*)
18. Bash(npx next:*)
19. Bash(npx vercel:*)
20. Bash(npx netlify:*)
21. Bash(npx cap:*)
22. Bash(npx turbo:*)
23. Bash(python3:*)
24. Bash(python:*)
25. Bash(pip install:*)
26. Bash(pip show:*)
27. Bash(pip index:*)
28. Bash(git:*)
29. Bash(gh repo:*)
30. Bash(gh auth:*)
31. Bash(gh api:*)
32. Bash(gh --version)
33. Bash(docker compose:*)
34. Bash(docker --version)
35. Bash(grep:*)
36. Bash(wc:*)
37. Bash(ls:*)
38. Bash(cd:*)
39. Bash(find src:*)
40. Bash(curl:*)
41. Bash(curl --version)
42. Bash(claude update:*)
43. Bash(claude --version)
44. Bash(claude mcp:*)
45. Bash(claude plugin:*)
46. Bash(qmd collection:*)
47. Bash(qmd embed:*)
48. Bash(qmd update:*)
49. Bash(wsl:*)
50. WebFetch(domain:github.com)
```

Plus the MCP-specific ones (Gamma, Playwright) which the agent uses.

The user can delete the ~225 one-time and stale-project entries. Sub-claim: a fat permission list increases the chance of accidental matches; pruning is real risk reduction, not just polish.

---

## Section 5: Skill / Auto-Invoke Trigger Drift

CLAUDE.md auto-invoke rules cross-checked against each skill's self-description.

| Skill | CLAUDE.md trigger phrases | Skill self-description triggers | Drift? |
|---|---|---|---|
| `three-questions` | "is this coherent?", "did I actually understand what I just shipped?" | "three questions", "systems check", "is this coherent", "did I actually understand what I just shipped", "what did I miss" | Aligned. CLAUDE.md is a subset. |
| `checkpoint` | "walk me through this", "what should I look at first" | "checkpoint", "walk me through this", "review this with me", "what should I look at first", "I shipped this — what did I miss?" | Aligned. CLAUDE.md is a subset. |
| `elicit` | "stress test this", "pre-mortem", "what could go wrong", "rethink this", "second pass", "challenge this" | "elicit", "stress test this", "pre-mortem", "what could go wrong", "rethink this", "second pass", "challenge this" | Fully aligned. |
| `adversarial-review` | "tear this apart", "find the holes", "play devil's advocate", "what am I missing" | Same set. Plus "tear this apart" appears in skill but `find the holes` only in CLAUDE.md — wait, recheck: skill says "find the holes". | Aligned. |
| `roundtable` | "roundtable", "what does everyone think", "round-robin this", "convene the team" | "roundtable", "get the team's opinion", "what does everyone think", "round-robin this", "let's debate this", "all orchestrators weigh in", "convene the team" | Aligned. CLAUDE.md is a subset. |
| `retrospective` | "save the learning", "what should we systematize" | "retro", "retrospective", "what did we learn", "lessons learned", "post-mortem this", "save the learning", "what should we systematize" | Aligned. CLAUDE.md subset. |

No drift. All six skills are consistent between their self-descriptions and CLAUDE.md routing.

**One nuance worth flagging (not drift, but design):** CLAUDE.md:108 has tiebreakers ("if the user phrasing looks like a financial-model stress test, vault-auditor wins over elicit"). The elicit SKILL.md:3 also encodes the same tiebreakers. Good — they agree. Keep them in sync if either is edited.

---

## Section 6: Memory File Audit

Each MEMORY.md pointer verified. All 10 files exist at `C:\Users\hgonz\.claude\projects\C--Users-hgonz\memory\`:

| File | Exists | Description match | Notes |
|---|---|---|---|
| `project_rekaliber.md` | Yes | Yes | Memory is 30 days old per system reminder. Project active — content likely still mostly accurate but worth refreshing. |
| `project_leanlogic.md` | Yes | Yes | Not read in detail — Lean AI Content Ecosystem. |
| `project_leanai_app.md` | Yes | Yes | "May 2026 launch" — today is 2026-05-03. Active routing applies. Memory captures pre-launch state. |
| `project_puntoazul.md` | Yes | Yes | 16 days old. Active. |
| `feedback_visual_standards.md` | Yes | Description in MEMORY.md is a one-line hook ("UI/design quality expectations"); content not fully verified but file exists. | OK |
| `feedback_design_principles.md` | Yes | Same | OK |
| `feedback_brand_fidelity.md` | Yes | Same | OK |
| `arsenal_upgrade_2026_04_17.md` | Yes | Yes | OK |
| `arsenal_audit_2026_04_21.md` | Yes | Yes | OK |
| `arsenal_systems_thinking_2026_04_27.md` | Yes | **Mostly yes** — but stale roundtable cast (Section 2 #6). | Fix per Section 2 #6. |

**MEMORY.md itself:** Index format clean, under 200 lines (currently ~17 lines). One-line entries with hooks. Good.

---

## Section 7: Recommendations Requiring User Decision

These items have a clear improvement path but the user should pick the direction:

1. **TaskMaster filename rename** (Section 2 #10). Options: `taskmaster.md` (full convention match), `TaskMaster.md` (CamelCase preserved, infix dropped), or status quo. Recommend `taskmaster.md`.

2. **Luna fixed-persona handling** (Section 2 #2). Options: A (description rewrite — minimal), B (`_reference/` move — clean), or C (filename suffix). Recommend A.

3. **Port 3001 HTTP hook fan-out** (Critical #2). Options: A (point at dashboard 3333 if intended target), B (document the external service), or C (strip the hooks). Recommend C unless the user runs an external observer.

4. **arsenal-optimizer vs agentic-architect consolidation** (Section 2 #9 and CLAUDE.md:163). Boundary now documented, but the user previously flagged consolidation as still an open question. With the proposed scope-boundary text added to each agent, the overlap becomes explicit and manageable — but a true consolidation (deleting one) is also defensible. Recommend keeping both with the boundary text added.

5. **Permission list pruning** (Section 4). The 50-item recommendation is conservative. The user can prune ~225 entries. Recommend a one-shot pruning session.

6. **Memory refresh on stale entries.** project_rekaliber.md is 30 days old; project_puntoazul.md 16 days; project_leanai_app.md 14 days. Not broken — but the project memories age fast. Optional: schedule a memory refresh (run `retrospective` after the next major delivery in each project).

---

## Section 8: What Was Audited / Time Budget Used

**Files read in full:**
- All 51 agent files in `C:\Users\hgonz\.claude\agents\` (sampled bodies after frontmatter for the rex sub-agents and large files; full body for all orchestrators, all skills, the persona reference files in part).
- All 7 rule files in `C:\Users\hgonz\.claude\rules\`.
- All 6 skill SKILL.md files.
- `CLAUDE.md` (full).
- `settings.json` (full).
- `settings.local.json` (full — 277 permissions inventoried).
- All 12 hook scripts in `C:\Users\hgonz\.claude\hooks\` (full).
- `dashboard/server.js:1-20, 758-760` (port verification).
- `knowledge/README.md` (full).
- `MEMORY.md` and the 4 referenced project memories sampled.
- `arsenal_systems_thinking_2026_04_27.md` (cast verification).

**Files not exhaustively read:**
- The trailofbits and compound-engineering plugin skills under `C:\Users\hgonz\.claude\plugins\marketplaces\` — sampled for stale Claude version references only. No findings worth flagging at the plugin level (those are external marketplaces; the user doesn't own the upstream).
- `C:\Users\hgonz\.claude\copilot-framework\` — referenced by arsenal-optimizer.md but not in scope of this user-arsenal audit. Skipped.

**Time spent (rough):**
- Inventory + frontmatter sweep: ~5 min
- Orchestrator full reads (Rex, Luna, Spark, Vault, Auditor, TaskMaster, Scout, Multi-Sim, Echo, Pitch, agentic-architect, arsenal-optimizer): ~10 min
- Skill files: ~5 min
- Hook scripts + settings: ~5 min
- Cross-reference + write report: ~10 min

Total: ~35 minutes. Within budget.

**What was NOT done in this pass (out of scope or low-yield):**
- Full read of pitch sub-files (master-cv, resume-format, etc.) — these are the user's data templates, not agent definitions. Not audit targets.
- Full read of echo sub-files (style-profile, anti-ai-tells) — same.
- Permission diff against an audit baseline — would require historical state.
- Token-cost estimation per agent prompt — possible but would require actual tokenization. The orchestrator agents (Rex, Luna, Spark, Vault) are the heaviest — Rex is ~2,200 lines including tables and templates, Luna ~250, Spark ~180, Vault ~120. Rex is the only candidate for trim, but its tables are operationally load-bearing. Skip.

---

End of report.
