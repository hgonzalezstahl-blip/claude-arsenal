---
title: "Arsenal Efficiency Patterns"
type: pattern
module: general
tags: [arsenal, efficiency, tokens, context, agents, optimization]
related: [anthropic-api-cost-optimization]
confidence: 0.95
last_verified: 2026-04-21
summary: "Patterns for running Claude Code arsenal efficiently: agent delegation, context management, token discipline"
---

# Arsenal Efficiency Patterns

## Agent Delegation Discipline

- **Don't spawn agents for simple tasks** — Grep/Glob/Read directly if you know the file
- **Use Explore agent** only when >3 queries are needed or the search space is unclear
- **Prefer Haiku model override** for mechanical agents (docs, boilerplate, changelog)
- **Run independent agents in parallel** — always batch independent Agent calls in a single message
- **Set run_in_background for non-blocking work** — don't wait for research agents when you can continue

## Context Pressure Management

- **Read specific line ranges** — never read a full file if you only need 20 lines
- **Use Grep with head_limit** — default 250 results, reduce for targeted searches
- **Pipe Bash output through head/tail** — `command | head -20` instead of dumping thousands of lines
- **Prefer Glob over Bash(find)** — Glob is optimized, find can timeout on large repos

## Token Discipline

- **Be concise in agent prompts** — strip redundant context, don't repeat what's in CLAUDE.md
- **Use targeted tool calls** — Read(file, offset=100, limit=20) instead of Read(file)
- **Don't re-read files you already read** — note important information in your response
- **Summarize agent results** — when reporting back to user, condense, don't paste raw agent output

## Audit Trail

- **agent-audit.jsonl** logs every Agent spawn with type, prompt, result size
- **tool-audit.jsonl** logs every tool call with input summary, result token estimate
- **session-reports/** has per-session token/cost breakdowns
- Run `node ~/.claude/hooks/audit-summary.js` for weekly efficiency review

## Available Infrastructure

- **ccproxy** at `~/.local/bin/ccproxy.exe` — model routing proxy. Start with `ccproxy start`, launch Claude with `ccproxy run claude`
- **claude-mem** — automatic session memory. View at http://localhost:37777. Search with /mem-search
- **multi-agent-shogun** at `~/tools/multi-agent-shogun/` — tmux-based parallel execution. Launch with `./shutsujin_departure.sh` in WSL2
- **Ctrl daemon** — `npx @bulletproof-sh/ctrl-daemon@latest` for visual agent monitoring + token tracking at ctrl.bulletproof.sh
- **Audit summary** — `node ~/.claude/hooks/audit-summary.js [days]` for usage report
