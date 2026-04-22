---
title: "Shogun Parallel Execution Guide"
type: procedure
module: general
tags: [shogun, parallel, wsl, tmux, agents, safety]
related: [arsenal-efficiency]
confidence: 0.95
last_verified: 2026-04-21
summary: "Safe usage guide for multi-agent-shogun: when to use, how to launch, safety boundaries"
---

# Shogun — Parallel Execution Guide

## What It Is

10 concurrent Claude Code CLI sessions in WSL2, orchestrated via tmux and YAML-based task queues:
- **Shogun** (Opus) — receives your commands
- **Karo** (Sonnet) — decomposes into subtasks
- **7x Ashigaru** (Sonnet) — parallel workers
- **Gunshi** (Opus) — QA analyst

All agents run with `--dangerously-skip-permissions` — zero human confirmation.

## When to Use

Use Shogun when ALL of these are true:
- Task decomposes into 3+ independent workstreams
- Speed matters more than per-action review
- Target code is NOT security-sensitive (no auth, payments, secrets)
- You've already approved the general approach

Good candidates:
- Large refactors across many files/modules
- Bulk test writing for an existing codebase
- Parallel feature implementation across independent modules
- Documentation generation across a project
- Multi-file migrations or renames

## When NOT to Use

- Authentication, authorization, or payment code
- Anything touching `.env`, credentials, API keys, or secrets
- Security audits or red-teaming (use rex-security / rex-redteam)
- Production deployments
- Small focused tasks (Claude Code subagents are sufficient)
- Code that requires careful human review per change

## First-Time Setup

### 1. Set your WSL password
```bash
wsl -d Ubuntu -u root -- passwd hgonz
```

### 2. Authenticate Claude Code in WSL
```bash
wsl -d Ubuntu -u hgonz
source ~/.bashrc
claude --dangerously-skip-permissions
# Browser opens → login → accept → /exit
```

### 3. Verify
```bash
wsl -d Ubuntu -u hgonz -- bash -lc 'source ~/.nvm/nvm.sh && claude --version'
```

## Launching Safely

### Option A: Safe launcher (recommended)
```bash
bash ~/.claude/hooks/shogun-launch.sh /path/to/project
```
This checks WSL, auth, and sensitive files before launching.

### Option B: Direct launch
```bash
wsl -d Ubuntu -u hgonz -- bash -lc 'cd ~/multi-agent-shogun && ./shutsujin_departure.sh'
```

### Startup flags
```bash
./shutsujin_departure.sh           # Full launch (default)
./shutsujin_departure.sh -s        # Sessions only (Claude not started)
./shutsujin_departure.sh -c        # Clean task queues first
./shutsujin_departure.sh -k        # Battle mode (all agents on Opus)
```

## Connecting

```bash
# Talk to Shogun (give commands here)
wsl -d Ubuntu -u hgonz -- bash -lc 'tmux attach -t shogun'

# Watch the 9-agent worker grid
wsl -d Ubuntu -u hgonz -- bash -lc 'tmux attach -t multiagent'

# Detach (agents keep running): Ctrl+B then D
```

## Monitoring

While Shogun runs:
- **Ctrl dashboard** at `ctrl.bulletproof.sh` shows all 10 agents as pixel characters
- **Dashboard.md** in `~/multi-agent-shogun/` is the human-readable status board
- **Audit log** at `~/.claude/audit.log` records the launch

## Safety Boundaries

1. Shogun's CLAUDE.md takes precedence over your global CLAUDE.md inside its directory
2. Your Rex/Luna/Spark/Vault orchestrators are NOT active inside Shogun — it has its own hierarchy
3. Agents communicate via YAML files on disk (zero API calls for coordination)
4. Each agent runs in its own tmux pane — you can kill individual agents with `Ctrl+C`
5. Kill everything: `tmux kill-server` in WSL
