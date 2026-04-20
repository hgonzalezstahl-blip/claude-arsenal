<p align="center">
  <img src="https://img.shields.io/badge/Agents-39-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Plugins-22-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Copilot_Skills-8-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/MCP_Servers-6-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Hooks-6-red?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Rules-4-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Dashboard-Live-brightgreen?style=for-the-badge" />
</p>

# Claude Arsenal

> A production-grade multi-agent system for Claude Code — 39 specialized agents across 5 teams, 22 plugins, lifecycle hooks, a live session dashboard, path-scoped rules, a RAG knowledge vault, and a GitHub Copilot framework port. Engineering standards enforced automatically, every session.

Built by [Hector Gonzalez-Stahl](https://github.com/hgonzalezstahl-blip)

---

## What's New

### v2 — April 20, 2026

| Change | Details |
|:-------|:--------|
| **Live Session Dashboard** | Real-time multi-session monitor at `localhost:3333` — track tokens, costs, context window, tool calls, and agent invocations across all active sessions with one-click switching |
| **Vault Team** (4 new agents) | `vault`, `vault-modeler`, `vault-analyst`, `vault-auditor` — financial modeling, market sizing, pricing strategy, and audit with 3-scenario analysis |
| **Scout Agent** | Competitive intelligence and market research — monitors competitors, analyzes trends, evaluates technologies, produces structured intel briefs |
| **Spark-Closer Agent** | Sales specialist — proposals, pitch decks, cold outreach sequences, objection handling, and deal analysis |
| **6 Lifecycle Hooks** (was 4) | Added SessionStart dashboard auto-launch, TDD enforcement warnings, and prompt injection detection on file reads |
| **Context Window Fix** | Dashboard now shows actual context fill (last message), not cumulative tokens |
| **39 Agents** (was 33) | 5 teams: Rex (17), Luna (6), Spark (7), Vault (4), General (5) |

### v1 — April 17, 2026

| Change | Details |
|:-------|:--------|
| **Rex Team** (17 agents) | Full engineering lifecycle — build, review, red-team, test, performance audit, deploy |
| **Luna Redesign** | Dynamic Persona Factory generates 2-4 custom personas per evaluation (no fixed roster) |
| **Rex-RedTeam** | 74 attack techniques across 7 categories, aligned with OWASP LLM/Agentic Top 10 |
| **Spark Team** (6 agents) | Full-service marketing agency — strategy, content, design, analytics, curation |
| **22 Plugins** | 13 Trail of Bits security, 8 Anthropic official, 1 community |
| **Path-Scoped Rules** | Auto-loading conventions for NestJS, React, Prisma, Rekaliber |
| **Knowledge Vault** | 3-tier RAG architecture (L1 always-loaded, L2 on-demand, L3 deep reference) |
| **Copilot Framework** | 8 skills ported to GitHub Copilot |
| **Persistent Agent Memory** | All agents have `memory: user` for cross-session learning |

---

## Quick Start

```bash
git clone https://github.com/hgonzalezstahl-blip/claude-arsenal.git
cd claude-arsenal
bash install.sh
```

Restart Claude Code. All 39 agents + the live dashboard are immediately available.

```bash
# Also install orchestration rules + hooks template
bash install.sh --with-claude-md
```

<details>
<summary>Manual Install</summary>

Copy any `.md` file from `agents/` into `~/.claude/agents/`. Done.

For the dashboard: `cp -r dashboard ~/.claude/dashboard`

For Copilot: `cp -r copilot-framework/.github /path/to/your/repo/`
</details>

---

## What's Inside

```
claude-arsenal/
├── agents/
│   ├── rex/                 # 17 project orchestration agents
│   ├── luna/                # 6 UX persona testing agents
│   ├── spark/               # 7 creative/marketing agency agents
│   ├── vault/               # 4 financial analysis agents
│   └── general/             # 5 general-purpose agents
├── dashboard/               # Live multi-session monitor (Node.js)
├── rules/                   # Path-scoped rules (auto-load by file type)
├── knowledge/               # RAG-indexed knowledge vault
├── copilot-framework/       # GitHub Copilot port (8 skills)
├── templates/               # CLAUDE.md + settings.json templates
└── install.sh               # One-command installer
```

---

## System Architecture

```
                            User Request
                                 │
                                 ▼
                  ┌─────────────────────────┐
                  │   CLAUDE.md Orchestrator │
                  │   (auto-detects intent)  │
                  └─────────────────────────┘
                                 │
      ┌──────────┬──────────┬────┴────┬──────────┬──────────┬──────────┐
      ▼          ▼          ▼         ▼          ▼          ▼          ▼
 ┌─────────┐┌────────┐┌─────────┐┌─────────┐┌──────────┐┌──────────┐┌──────────┐
 │  Rex    ││ Luna   ││ Spark   ││ Vault   ││  Task    ││  Red     ││ Research │
 │17 agents││6 agents││7 agents ││4 agents ││  Master  ││  Team    ││  +Scout  │
 │Build +  ││Dynamic ││Content +││Finance +││Planning  ││Prompt   ││Intel +   │
 │Quality  ││Persona ││Marketing││Analysis ││& Design  ││Security ││Fact-Check│
 └─────────┘└────────┘└─────────┘└─────────┘└──────────┘└──────────┘└──────────┘
                                 │
                                 ▼
                  ┌─────────────────────────┐
                  │   Live Session Dashboard │
                  │   http://localhost:3333  │
                  └─────────────────────────┘
```

---

## Live Session Dashboard

> Real-time multi-session monitoring — track tokens, costs, context window usage, tool calls, and agent invocations across all active Claude Code sessions simultaneously.

The dashboard auto-starts via a SessionStart hook and discovers all active sessions automatically.

### Features

| Feature | Description |
|:--------|:-----------|
| Multi-session sidebar | See all active sessions with live status indicators |
| Session switching | Click any session to view its detailed stats in real-time |
| Token tracking | Input, output, cache read, cache write — with per-category cost |
| Cost monitoring | Running total + cost-per-minute rate |
| Context window gauge | Visual gauge with color-coded alerts (green/yellow/red) |
| Tool call breakdown | Horizontal bar chart of all tool calls by type |
| Agent invocations | Which agents were spawned, how many times, with descriptions |
| Live alerts | Flashing alerts for context window > 80%, session cost > $10 |
| Auto-refresh | SSE-based live updates, no polling from the browser |

### How It Works

```
SessionStart hook
      │
      ▼
┌──────────────┐     ┌──────────────┐
│ server.js    │────▶│ Scans all    │
│ (Node.js)    │     │ project dirs │
│ Port 3333    │     │ for .jsonl   │
└──────────────┘     └──────────────┘
      │                     │
      ▼                     ▼
┌──────────────┐     ┌──────────────┐
│ Poll each    │     │ Re-scan for  │
│ session 1s   │     │ new sessions │
│ (incremental)│     │ every 10s    │
└──────────────┘     └──────────────┘
      │
      ▼
┌──────────────┐
│ SSE stream   │──▶ Browser (index.html)
│ to clients   │    Session switcher + live stats
└──────────────┘
```

```bash
# Manual start (auto-starts via hook normally)
node ~/.claude/dashboard/server.js --port 3333
```

---

## Rex — Project Orchestration Engine

> 17 agents that form a complete engineering team. Build, review, red-team, test, and deploy — with an 8-gate quality pipeline that nothing bypasses.

### Agent Roster

| Agent | Role | Model | When It Runs |
|:------|:-----|:-----:|:-------------|
| `rex-rekaliber-orchestrator` | CTO-level orchestrator, delegates & coordinates | `opus` | Any project work |
| `rex-architect` | Scaffolding, module setup, dependency management | `sonnet` | New modules |
| `rex-database` | Prisma schema, migrations, seeds, indexes | `sonnet` | Schema changes |
| `rex-backend` | NestJS controllers, services, DTOs, jobs | `sonnet` | Backend features |
| `rex-frontend` | Next.js pages, components, hooks, stores | `sonnet` | Frontend features |
| `rex-integration` | Stripe, OTA channels, S3, email/SMS, iCal | `sonnet` | External services |
| `rex-reviewer` | TypeScript strict, patterns, DRY, complexity | `sonnet` | After build |
| `rex-security` | OWASP Top 10, tenant isolation, PCI-DSS, CVEs | `opus` | After backend |
| `rex-redteam` | Prompt injection, jailbreak, adversarial (74 techniques) | `opus` | After security |
| `rex-tester` | Jest unit, Supertest integration, Playwright E2E | `sonnet` | After redteam |
| `rex-performance` | N+1 queries, indexes, caching, SLA verification | `opus` | After tests |
| `rex-observability` | Pino logging, Sentry, health checks, Prometheus | `sonnet` | Before deploy |
| `rex-docs` | Swagger, module READMEs, changelogs, ADRs | `haiku` | After QA |
| `rex-qa` | Smoke tests, format compliance, regression check | `sonnet` | Final gate |
| `rex-debugger` | Root cause diagnosis, stack trace analysis | `opus` | When things break |
| `rex-devops` | Docker, Railway, CI/CD, environment management | `sonnet` | Infrastructure |
| `rex-researcher` | Fact-check libs, APIs, CVEs before building | `opus` | Before assertions |

### Quality Gate Pipeline (8 Gates)

```
 ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
 │ 1. Code  │→ │2. Securi-│→ │3. Red    │→ │4. Test   │→ │5. Perf   │→ │6. Observ-│→ │ 7. Docs  │→ │ 8. QA    │
 │  Review  │  │ty Audit  │  │  Team    │  │  Suite   │  │  Audit   │  │ability   │  │          │  │          │
 │ (sonnet) │  │ (opus)   │  │ (opus)   │  │ (sonnet) │  │ (opus)   │  │ (sonnet) │  │ (haiku)  │  │ (sonnet) │
 └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
                                                                                                        │
                                                                                                        ▼
                                                                                              PASS  or  FAIL
```

> Any **Critical** or **High** finding = pipeline fails. Nothing ships until resolved.

### Rex-RedTeam: Prompt Adversarial Testing

74 named attack techniques across 7 categories, aligned with **OWASP LLM Top 10 2025** + **OWASP Agentic Top 10 2026**.

| Category | # | What It Tests | Example Techniques |
|:---------|:-:|:-------------|:-------------------|
| Prompt Leakage | 10 | System prompt extraction resistance | Direct extraction, completion bait, translation trick |
| Prompt Injection | 10 | Instruction override resistance | System role impersonation, delimiter injection, sandwich attack |
| Obfuscation Bypass | 16 | Encoding evasion (3 tiers) | Leetspeak, base64, unicode homoglyphs, ASCII art, invisible chars |
| Role Confusion | 10 | Identity stability | DAN, dev mode, authority impersonation, emotional manipulation |
| Multi-Agent Trust | 10 | Cross-agent manipulation | Goal hijack, privilege escalation, memory poisoning |
| Instruction Bypass | 10 | Boundary erosion | Scope escape, crescendo, gradual erosion, guardrail inversion |
| Data Exfiltration | 8 | Data leakage & tool abuse | PII extraction, credential harvesting, file traversal |

**Plus 8 ready-to-paste defense patterns** for hardening any agent.

---

## Luna — Dynamic Persona Testing

> No fixed roster. Luna's **Persona Factory** generates 2-4 purpose-built personas per evaluation based on the product, feature, and user base being tested.

### How It Works

```
          Luna Orchestrator
          Analyzes product & users
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
   ┌──────────┐┌──────────┐┌──────────┐
   │ Persona  ││ Persona  ││ Persona  │
   │ (auto-   ││ (auto-   ││ (auto-   │
   │generated)││generated)││generated)│
   └──────────┘└──────────┘└──────────┘
         │          │          │
         └──────────┼──────────┘
                    ▼
           Luna Analyst
           Synthesizes findings
                    │
                    ▼
          SHIP / GAPS / NEEDS WORK
```

### Persona Diversity Axes

| Axis | Why It Matters |
|:-----|:--------------|
| **Technical skill** | Power user vs. novice find completely different friction |
| **Frequency of use** | Daily user vs. occasional visitor have different expectations |
| **Motivation** | Chose this vs. forced to use it = different behavior |
| **Domain expertise** | Industry insider vs. outsider see different gaps |
| **Emotional stakes** | Browsing vs. "this involves my money" changes trust thresholds |
| **Accessibility** | Age, device, language comfort, disability context |

### Evaluation Dimensions

| Dimension | Question |
|:----------|:---------|
| Discoverability | Could they find the feature without being told? |
| Learnability | Could they figure it out on first try? |
| Efficiency | How many steps? Are any unnecessary? |
| Error Recovery | Do they understand what went wrong and how to fix it? |
| Trust | Would they use this with real data / real money? |
| Completeness | Is anything missing for their goal? |
| Delight | Are there moments that feel genuinely great? |

### Finding Severity

| Level | Meaning |
|:------|:--------|
| Blocker | Cannot complete primary goal |
| Critical Friction | Struggled significantly, nearly abandoned |
| Gap | Needed something that doesn't exist |
| Minor Friction | Annoying but not blocking |
| Delight | Exceeded expectations — protect this |

---

## Spark — Creative & Marketing Agency

> 7 agents that form a full-service marketing team. Strategy, content creation, visual design, sales enablement, performance analysis, and quality curation — with every deliverable reviewed before it ships.

### How It Works

```
          Spark Orchestrator
          Sets the brief, coordinates the team
                    │
     ┌──────────────┼──────────────┐──────────────┐
     ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Strategist│  │  Writer  │  │ Designer │  │  Closer  │
│ (opus)   │  │ (sonnet) │  │ (sonnet) │  │ (sonnet) │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
     │              │              │              │
     ▼              └──────┬───────┘              │
┌──────────┐               │                     │
│ Analyst  │───────────────┘─────────────────────┘
│ (sonnet) │
└──────────┘
                    │
                    ▼
           Spark Curator
           Quality gate — scores & approves
                    │
                    ▼
          APPROVED  or  REVISION REQUIRED
```

### Agent Roster

| Agent | Role | Model | When It Runs |
|:------|:-----|:-----:|:-------------|
| `spark` | Creative director & orchestrator | `opus` | Any content/marketing request |
| `spark-writer` | Publication-ready content (all formats) | `sonnet` | Blog, email, social, landing pages, PR |
| `spark-strategist` | Market research, GTM, campaigns, positioning | `opus` | Strategy, research, planning |
| `spark-designer` | Visual assets, brand identity, SVG illustrations | `sonnet` | Brand work, illustrations, templates |
| `spark-analyst` | Revenue models, pricing, SEO/ASO, benchmarks | `sonnet` | Financial projections, audits, metrics |
| `spark-closer` | Sales proposals, pitches, outreach, objection handling | `sonnet` | Proposals, cold outreach, deal prep |
| `spark-curator` | Quality gate — reviews all output before delivery | `opus` | Always last — nothing ships without review |

### Quality Scoring

Every deliverable is scored 1-10 on four dimensions:

| Dimension | What It Measures |
|:----------|:----------------|
| **Accuracy** | Factual correctness, sourced claims, no fabricated data |
| **Voice** | Brand voice match, tone consistency, audience appropriateness |
| **Engagement** | Hook quality, scannability, momentum, would the audience care? |
| **Actionability** | Clear next steps, executable plans, usable models |

> Content scoring below 7/10 on any dimension gets sent back with specific revision notes.

---

## Vault — Financial Analysis Team

> 4 agents that handle all financial modeling, market research, and business analysis. Every model includes base/optimistic/pessimistic scenarios, every claim is sourced, and every deliverable passes audit before shipping.

### How It Works

```
          Vault Orchestrator
          Routes financial requests
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
   ┌──────────┐┌──────────┐┌──────────┐
   │ Modeler  ││ Analyst  ││ (both    │
   │ Builds   ││ Market   ││ can run  │
   │ models   ││ research ││ together)│
   └──────────┘└──────────┘└──────────┘
         │          │
         └──────────┘
                │
                ▼
         Vault Auditor
         Validates assumptions, stress-tests
                │
                ▼
         APPROVED  or  REVISE
```

### Agent Roster

| Agent | Role | Model | When It Runs |
|:------|:-----|:-----:|:-------------|
| `vault` | Financial orchestrator, routes & coordinates | `opus` | Any financial/pricing request |
| `vault-modeler` | P&L, cash flow, unit economics, pricing models | `sonnet` | Revenue models, budgets, ROI |
| `vault-analyst` | TAM/SAM/SOM, competitive pricing, fundraising comps | `sonnet` | Market research, benchmarks |
| `vault-auditor` | Stress-tests models, validates assumptions, checks math | `opus` | Always last — nothing ships without audit |

### What Vault Handles

| Category | Examples |
|:---------|:---------|
| **Revenue Modeling** | P&L projections, cash flow forecasts, MRR/ARR modeling |
| **Unit Economics** | CAC, LTV, payback period, contribution margin |
| **Pricing Strategy** | Sensitivity analysis, competitive benchmarks, tier design |
| **Fundraising Prep** | Valuation comps, cap table modeling, investor metrics |
| **Market Sizing** | TAM/SAM/SOM with sourced data, not guesses |
| **Budget Planning** | Cost structures, burn rate, runway calculations |

> Every model includes 3 scenarios (base/optimistic/pessimistic). Every number is sourced or explicitly marked as an assumption.

---

## General Purpose Agents

| Agent | Model | Purpose |
|:------|:-----:|:--------|
| `TaskMaster` | `opus` | Planning & architecture orchestrator (discovery -> design -> critique -> plan) |
| `agentic-architect` | `opus` | Reviews agent infrastructure, prompt quality, context design |
| `arsenal-optimizer` | `opus` | Audits ALL agent definitions for redundancy, gaps, inconsistency |
| `multi-sim` | `opus` | Monte Carlo simulation — runs any agent N times for robust results |
| `scout` | `opus` | Competitive intelligence, market monitoring, technology research |

### Scout — Competitive Intelligence

Scout proactively maps the competitive landscape and surfaces opportunities and threats. Unlike `rex-researcher` (which verifies specific claims reactively), Scout gathers raw intelligence that strategies are built on.

| Capability | Description |
|:-----------|:-----------|
| Competitor monitoring | Track what competitors ship, price, and position |
| Market trend analysis | Identify emerging patterns and shifts |
| Technology scouting | Evaluate new tools, frameworks, and platforms |
| Partnership evaluation | Assess potential integrations and partnerships |
| Intelligence briefs | Structured reports with actionable takeaways |

---

## Infrastructure Layer

### Lifecycle Hooks

| Event | What It Does |
|:------|:-------------|
| `SessionStart` | Starts the live dashboard server + opens browser |
| `PreToolUse` -> Edit/Write | Blocks edits to `.env`, credentials, secrets, private keys |
| `PreToolUse` -> Edit/Write | TDD warning when writing implementation without tests |
| `PostToolUse` -> Read | Prompt injection detection in file content |
| `PostToolUse` -> Edit/Write | Auto-formats with Prettier on every file change |
| `PostToolUse` -> Bash | Audit logs every command to `~/.claude/audit.log` |
| `Stop` | Session end summary logged for tracking |
| `Notification` | Windows popup when Claude needs attention |

### Path-Scoped Rules (Auto-Load)

| Rule File | Triggers On | What It Enforces |
|:----------|:-----------|:-----------------|
| `rekaliber-protocol.md` | `rekaliber/**` | 7-section feature protocol, API contracts, module isolation |
| `nestjs-backend.md` | `*.service.ts`, `*.controller.ts`, `*.dto.ts` | Controller->Service pattern, DI, response format |
| `frontend-react.md` | `*.tsx`, `*.jsx`, `components/**` | Service layer, TanStack Query, shadcn/ui, App Router |
| `prisma-database.md` | `*.prisma`, `migrations/**` | Index conventions, soft deletes, multi-tenant scoping |

### Plugins (22 Installed)

<details>
<summary><b>Trail of Bits Security (13)</b></summary>

| Plugin | What It Does |
|:-------|:-------------|
| `insecure-defaults` | Finds dangerous default configurations |
| `static-analysis` | Multi-tool static analysis pipeline |
| `supply-chain-risk-auditor` | Dependency risk assessment |
| `sharp-edges` | Dangerous API pattern detection |
| `second-opinion` | Adversarial code review from a different angle |
| `entry-point-analyzer` | Maps attack surfaces and entry points |
| `semgrep-rule-creator` | Generates custom Semgrep security rules |
| `variant-analysis` | Finds similar bugs across the codebase |
| `differential-review` | Security-focused diff review |
| `mutation-testing` | Tests the quality of your tests |
| `property-based-testing` | Generates edge-case tests automatically |
| `audit-context-building` | Builds context for security audits |
| `skill-improver` | Meta-skill: improves other skills and agents |
</details>

<details>
<summary><b>Anthropic Official (8)</b></summary>

| Plugin | What It Does |
|:-------|:-------------|
| `security-guidance` | Security best practices and vulnerability guidance |
| `code-review` | Structured code review workflow |
| `pr-review-toolkit` | PR analysis and review automation |
| `feature-dev` | Feature development orchestration |
| `typescript-lsp` | TypeScript language server integration |
| `hookify` | Hook generation and management |
| `session-report` | Session summary and progress reporting |
| `claude-code-setup` | Setup advisor for optimal Claude Code configuration |
</details>

<details>
<summary><b>Community (1)</b></summary>

| Plugin | What It Does |
|:-------|:-------------|
| `compound-engineering` | Cross-session learning, Figma verification, Slack context search |
</details>

### MCP Servers

| Server | Purpose | Status |
|:-------|:--------|:------:|
| Playwright | Browser automation and E2E testing | Active |
| Gamma | AI presentations and documents | Active |
| GitHub MCP | Issues, PRs, CI/CD, releases | Active |
| Prisma MCP | Database management via natural language | Active |
| Sentry MCP | Production error tracking and analysis | Active |
| Context Portal | Persistent project knowledge graph | Active |

### Knowledge Vault (3-Tier RAG Architecture)

| Tier | Location | Loading | Purpose |
|:-----|:---------|:--------|:--------|
| **L1** | `MEMORY.md` | Always loaded | Index, pointers, critical rules |
| **L2** | `memory/*.md` | On demand | Project summaries, patterns |
| **L3** | `knowledge/` | Via RAG MCP | Deep reference docs, ADRs, API specs |

```
knowledge/
├── sources/      <- Raw notes, articles, snippets
├── wiki/         <- LLM-compiled concept pages
├── decisions/    <- Architecture Decision Records
├── apis/         <- API documentation & contracts
└── patterns/     <- Code patterns & conventions
```

---

## Copilot Framework (8 Skills)

The same quality methodology, ported to GitHub Copilot as skill files. Drop into any repo.

| Skill | Model | Purpose |
|:------|:-----:|:--------|
| `quality-review` | `sonnet` | Types, DRY, patterns, complexity |
| `security-gate` | `opus` | OWASP, tenant isolation, secrets, PCI |
| `test-suite` | `sonnet` | Unit, integration, E2E with real database |
| `performance-gate` | `opus` | N+1, indexes, caching, SLA targets |
| `observability` | `sonnet` | Logging, health checks, Sentry, Prometheus |
| `docs-gate` | `haiku` | Swagger, ADRs, changelogs, .env docs |
| `persona-testing` | `opus` | Power user, non-tech, consumer simulation |
| `research-verify` | `opus` | Fact-check libs, CVEs, APIs |

```
"Run the security gate on the payments module"
#file:.github/skills/security-gate/SKILL.md
```

---

## Full Summary

| Category | Count | What |
|:---------|:-----:|:-----|
| **Rex** (orchestration) | 17 | Full dev lifecycle: build, review, red-team, test, deploy |
| **Luna** (personas) | 6 | Dynamic persona generation, UX simulation, synthesis |
| **Spark** (marketing) | 7 | Content creation, strategy, visual design, sales, performance |
| **Vault** (finance) | 4 | Revenue modeling, market sizing, pricing, fundraising, audit |
| **General** | 5 | Planning, agent review, self-improvement, simulation, intelligence |
| **Dashboard** | 1 | Live multi-session monitor with token/cost/context tracking |
| **Plugins** | 22 | Security auditing, code review, testing, session intelligence |
| **MCP Servers** | 6 | GitHub, Prisma, Sentry, Playwright, Gamma, Context Portal |
| **Hooks** | 6 | Dashboard launch, file protection, TDD, prompt injection detection, auto-format, audit logging |
| **Rules** | 4 | Path-scoped conventions (NestJS, React, Prisma, Rekaliber) |
| **Copilot Skills** | 8 | Same quality gates for GitHub Copilot |
| | **39 agents + 22 plugins + 8 skills + dashboard** | |

---

## Customizing

### Adapt Rex for Your Stack

The Rex agents reference a NestJS + Next.js monorepo. To adapt:
- Update project paths and stack descriptions in each agent
- Adjust the module list and STATE.md references
- Keep the quality gate pipeline — it's stack-agnostic

### Luna Persona Generation

Luna generates personas dynamically — no manual customization needed:
- Describe your product and target users when invoking Luna
- Luna generates 2-4 purpose-built personas with realistic names, goals, and benchmarks
- Built-in archetype templates for PMS, e-commerce, SaaS, and consumer apps

### Create New Agents

```markdown
---
name: your-agent-name
description: "One-line description for auto-invocation"
model: sonnet
effort: normal
memory: user
---

# Agent Name

[Role description]

## Protocol
[Step-by-step workflow]

## Rules
[Non-negotiable constraints]

## Output Format
[Structured template]
```

Save to `~/.claude/agents/your-agent-name.md`.

### Add Plugins

```bash
# Browse official marketplace
claude plugin list --available

# Install from official marketplace
claude plugin install <plugin-name>

# Add a new marketplace
claude plugin marketplace add <github-org>/<repo>

# Install from specific marketplace
claude plugin install <plugin>@<marketplace>
```

---

## Contributing

1. Run `arsenal-optimizer` to find improvement opportunities
2. Use `multi-sim` to validate changes with multiple passes
3. Follow the agent template pattern (frontmatter + role + protocol + rules + output)
4. Test new agents with `agentic-architect` for prompt quality review
5. Run `rex-redteam` on any agent handling user input

---

## License

MIT
