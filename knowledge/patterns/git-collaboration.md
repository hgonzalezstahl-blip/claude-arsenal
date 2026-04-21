# Git Collaboration Conventions

**Used in:** All projects (Rekaliber, Punto Azul, Lean AI, Claude Arsenal)

## Branching Strategy

```
main              <- production-ready, always deployable
├── feat/xxx      <- new features (branch from main)
├── fix/xxx       <- bug fixes (branch from main)
├── refactor/xxx  <- refactors with no behavior change
└── docs/xxx      <- documentation only
```

- Branch names: `type/short-description` (e.g., `feat/guest-portal`, `fix/reservation-overlap`)
- One concern per branch — don't mix features with refactors
- Delete branches after merge

## Commit Messages

```
<type>: <what changed and why>

Types: feat, fix, refactor, docs, test, chore, perf
```

- Present tense, imperative mood: "Add guest portal" not "Added guest portal"
- First line under 72 chars
- Body for complex changes explaining WHY, not WHAT (the diff shows what)

## Pull Request Flow

1. Create branch from `main`
2. Make changes, commit with clear messages
3. Push branch, create PR with `/git-commit-push-pr` or `gh pr create`
4. PR description: Summary bullets + test plan
5. Rex quality gates run (light or full mode based on scope)
6. Merge to main (squash for feature branches, merge for multi-commit work)

## For Arsenal Contributors

- Fork the repo, work on your fork
- PRs against `main` branch
- Run `node tools/validate-agents.js` before submitting agent changes
- New agents need: frontmatter (name, description, model), Protocol section, Rules section
- Test with `arsenal-optimizer` or `agentic-architect` for prompt quality review

## When Claude Code Handles Git

Claude Code natively handles: staging, committing, pushing, PR creation, branch management.
Use the compound-engineering skills for streamlined workflows:
- `/git-commit` — commit with well-structured message
- `/git-commit-push-pr` — commit, push, and open PR in one shot
- `/git-worktree` — isolated parallel development
- `/git-clean-gone-branches` — prune stale local branches
