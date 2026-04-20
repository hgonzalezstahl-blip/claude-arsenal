# AI Engineering Orchestrator Framework — GitHub Copilot Edition

A port of the Rex/Luna multi-agent framework to GitHub Copilot.
Built by Hector Gonzalez-Stahl.

---

## What This Is

This framework brings the Rex/Luna methodology to any repository using GitHub Copilot.
It encodes production-grade engineering standards as Copilot instructions and skills —
so every feature you build with Copilot passes the same quality bar as the original Claude Code agent system.

---

## What's Included

```
.github/
├── copilot-instructions.md        ← Master framework instructions (auto-loaded by Copilot)
└── skills/
    ├── security-gate/SKILL.md     ← OWASP audit, multi-tenant isolation, CVE scan
    ├── performance-gate/SKILL.md  ← N+1 detection, index analysis, SLA audit
    ├── quality-review/SKILL.md    ← Code review: types, patterns, conventions, DRY
    ├── test-suite/SKILL.md        ← Unit, integration, and E2E test writing
    ├── persona-testing/SKILL.md   ← UX validation via simulated user personas
    ├── research-verify/SKILL.md   ← Fact-checking before building
    ├── observability/SKILL.md     ← Logging, health checks, metrics, alerting
    └── docs-gate/SKILL.md         ← API spec, changelogs, READMEs, ADRs
```

---

## How to Deploy to Any Repo

### Step 1 — Copy the .github folder
```bash
cp -r .github /path/to/your/repo/
```
Or manually copy the files. The `.github/copilot-instructions.md` and `.github/skills/` folder are all you need.

### Step 2 — Copilot auto-detects the instructions
GitHub Copilot automatically reads `.github/copilot-instructions.md` for every chat session in that workspace.
No configuration needed.

### Step 3 — Use skills in Copilot Chat
Reference skill files directly in chat with `#file`:
```
Run the security gate on the new payments module.
#file:.github/skills/security-gate/SKILL.md
```

Or just describe what you want — Copilot will find relevant skills:
```
"Audit this endpoint for security issues"
"Write tests for the reservations module"
"Check if this feature is ready from a user perspective"
```

---

## How to Invoke Each Skill

| What you want | How to ask Copilot |
|---|---|
| Security audit | "Run a security gate on [module]. Use #file:.github/skills/security-gate/SKILL.md" |
| Performance audit | "Audit [module] for performance. #file:.github/skills/performance-gate/SKILL.md" |
| Code review | "Review this code. #file:.github/skills/quality-review/SKILL.md" |
| Write tests | "Write tests for [module]. #file:.github/skills/test-suite/SKILL.md" |
| UX validation | "Test this from a user perspective. #file:.github/skills/persona-testing/SKILL.md" |
| Verify a claim | "Verify that [claim]. #file:.github/skills/research-verify/SKILL.md" |
| Observability | "Set up logging and health checks. #file:.github/skills/observability/SKILL.md" |
| Documentation | "Document this module. #file:.github/skills/docs-gate/SKILL.md" |

---

## Quality Gate Pipeline

Run these in order after completing any feature. Nothing is done until all gates pass.

```
Code Review → Security → Testing → Performance → Observability → Documentation → Final Check
```

Ask Copilot: "Run the full quality gate pipeline on [module]" and reference each skill file in sequence,
or ask it to run them all at once with all skill files attached.

---

## Model Selection

GitHub Copilot supports Claude Opus, Sonnet, and Haiku (as well as GPT-4o and Gemini).
Each skill file specifies the recommended model. Match complexity to capability:

| Task | Recommended model |
|------|------------------|
| Security, performance, persona testing, research | Claude Opus 4.6 or GPT-4o |
| Implementation, code review, testing, observability | Claude Sonnet 4.5 or GPT-4.1 |
| Documentation, changelogs, Swagger decoration | Claude Haiku 4.5 |

Switch models in Copilot Chat using the model selector dropdown.

---

## What Maps from Rex/Luna → Copilot

| Rex/Luna (Claude Code) | Copilot Equivalent | Notes |
|---|---|---|
| Agent spec files (`.claude/agents/*.md`) | Skill files (`.github/skills/*/SKILL.md`) | Must be invoked manually vs. auto-spawned |
| Auto-invocation (proactive) | Manual `#file` reference in chat | Copilot doesn't auto-spawn |
| Rex orchestrator (STATE.md, planning) | `copilot-instructions.md` + your workflow | You manage STATE.md manually |
| Model routing (per-agent) | Model selector dropdown in Copilot Chat | Manual per-conversation |
| Prompt optimization | Encoded in instructions as guidance | Copilot follows the principle |
| Luna persona orchestrator | `persona-testing/SKILL.md` | Same methodology, manual invocation |
| rex-researcher | `research-verify/SKILL.md` | Same methodology, manual invocation |

---

## Customizing for Your Project

1. **Add project-specific rules** to `copilot-instructions.md` under a "Project-Specific Rules" section
2. **Add domain-specific gates** (compliance, accessibility, localization) as new skill files in `.github/skills/`
3. **Customize personas** in `persona-testing/SKILL.md` to match your actual user types
4. **Add your stack's conventions** to `quality-review/SKILL.md` (naming patterns, framework specifics)

---

## For GitHub Copilot Enterprise

If your organization uses Copilot Enterprise:
- Work with your GitHub admin to set org-level default instructions
- Skills in `.github/skills/` are available to the Copilot Coding Agent for automated PRs
- Consider creating a shared internal repo with this framework that teams fork from

---

## Maintaining STATE.md

Create a `STATE.md` at your repo root and update it manually each session:

```markdown
# Project State — [date]
## Phase: [current phase]

## Modules
- [x] Completed module
- [ ] In progress module
- [ ] Not started module

## In Progress
[current work]

## Open Bugs
| # | Description | Severity | Status |

## Recent Changes (last 5)
- [date] [what changed]
```

Start each Copilot session by referencing it: "Read STATE.md and continue from where we left off."
