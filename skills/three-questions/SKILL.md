---
name: three-questions
description: Force the systems-thinking gate before any non-trivial code change ships. Three questions every builder should answer about the code in plain English — Where does state live? Where does feedback live? What breaks if I delete this? Originally framed by Hak (AgentiveStack) as the systems-thinking discipline AI builders need on day one. Use as the final gate inside rex-qa, before approving a multi-file PR, before declaring a Lovable / Bolt / Cursor build "done", or anytime the user says "three questions", "systems check", "is this coherent", or "did I actually understand what I just shipped". Different from rex-qa's compilation / smoke / regression checks — those verify the code runs; this verifies the human (or agent) understood the system they built.
---

# Three Questions

A systems-thinking gate, not a code-quality gate. The compiler tells you the code runs. Tests tell you it does what you wrote. Neither tells you whether the system is coherent, observable, and safe to change. These three questions do.

If any answer is "I don't know" or "everywhere" or "I haven't checked," the work is not done — regardless of what CI says.

## When to invoke

- Inside `rex-qa` as the final pass after compilation / startup / smoke / regression
- Before approving a PR with >5 files changed
- Before declaring a Lovable / Bolt / Cursor / non-tech-built feature done
- Before the user signs off on AI-generated code they didn't write themselves
- Anytime the user says "three questions", "systems check", "is this coherent", "what did I miss"
- For non-code artifacts (financial models, marketing plans, written deliverables), translate the questions per the table below before running.

## Branch — code vs non-code artifact

If the artifact under review is **code**, use the question framing as written below (state owners, observability layers, blast radius for service / table / controller / hook / job).

If the artifact under review is **not code** (financial model from `vault-modeler`, marketing plan from `spark-strategist`, policy brief from `Echo`, resume from `Pitch`, design system, etc.), translate before running:

| Question | Code framing | Non-code framing |
|---|---|---|
| Q1 — State / source of truth | Who owns this state? Any split-brain? | Who owns the source numbers / facts / claims? Any contradicting source elsewhere in the artifact? Any number repeated in two places that could drift? |
| Q2 — Feedback / observability | Logs, metrics, errors, events accounted for? | How will we know this artifact is achieving its goal? What is the success signal? What would tell us it's failing — and would we see it before the damage is done? |
| Q3 — Blast radius | What breaks if I delete this component? | What downstream decisions depend on this artifact? If a number / claim / recommendation is wrong, what gets decided incorrectly? Who carries the blast? Is there a recovery path? |

Adjust the output format accordingly — the verdict structure (PASS / NEEDS WORK / FAIL) stays the same.

## The three questions

### Question 1 — Where does state live?

Who owns the truth in this system?

For each piece of state the change introduces or touches, identify the **single owner** — the place that is the source of truth. Then check that no other piece of code thinks it owns it.

Look for:
- Two services that each maintain their own copy of the same field (split-brain)
- State held in both the database and an in-memory cache without invalidation rules
- A frontend store and a backend table that can drift
- A column with a default value computed in two places (DB default + service code)
- Configuration read from both env vars and a database table

If two things own it, you already have a bug. You just haven't triggered it yet.

For Rekaliber specifically, also check:
- `orgId` always read from the JWT, never from request body / query params
- Any pricing / availability / inventory state has exactly one owner

### Question 2 — Where does feedback live?

How do you know whether the system is working?

For the change, identify:
- **Logs** — what gets logged, at what level, with what correlation ID
- **Metrics** — what counters / gauges / histograms are emitted
- **Errors** — what failure modes raise alerts, and where those alerts go
- **Events** — what observable side effects happen (webhooks, queue messages, audit records)

Then check that something tells you when each layer is broken. If the answer is "nothing" — the code is not working; it is *pretending* to work. Silent failures are the worst kind of bug because they pass every test until the day they don't.

For Rekaliber specifically, verify:
- Pino structured logs include `orgId`, `userId`, `requestId`
- Sentry captures unhandled exceptions
- Health endpoint reflects real readiness (DB + Redis + critical deps)
- BullMQ jobs emit events on failure, not just on success

### Question 3 — What breaks if I delete this?

Can you trace the blast radius of any new component without running the code?

Pick the largest new piece — a service, a table, a controller, a hook, a job. Ask:
- What downstream code depends on this?
- What upstream code calls this?
- What would the user experience if this returned `null` / threw / never returned?
- What's the worst thing that happens if a malicious actor exploits it?
- Is there a soft-delete / feature-flag path that lets you disable this without a deploy?

If you can't answer in plain English, the change is not done — the **theory** of it isn't built yet (in Peter Naur's framing, you have the code without the program).

If `jcodemunch` MCP is available, this question can be answered with real data:
- `mcp__jcodemunch__get_blast_radius` — exact downstream impact
- `mcp__jcodemunch__find_importers` — who depends on this symbol
- `mcp__jcodemunch__get_signal_chains` — how data flows through the change

Use the tool if it's available — but the user (or agent) must still translate the data into plain English. Tool output isn't understanding.

## Output format

```
THREE QUESTIONS: [module / change name]
═══════════════════════════════════════

1. Where does state live?
   PASS | NEEDS WORK | FAIL
   [Plain English answer. List each piece of state and its single owner.]
   [If NEEDS WORK or FAIL: list the specific split-ownership / drift risks.]

2. Where does feedback live?
   PASS | NEEDS WORK | FAIL
   Logs:    [what, where, with what context]
   Metrics: [what, where] — or "none" if applicable
   Errors:  [how raised, where surfaced]
   Events:  [what side effects, where observable]
   [If NEEDS WORK or FAIL: list the silent-failure modes.]

3. What breaks if I delete this?
   PASS | NEEDS WORK | FAIL
   Largest new piece: [name]
   Downstream impact: [...]
   Upstream callers:  [...]
   Failure mode if it errors: [...]
   Disable path: [feature flag / soft-delete / none]

VERDICT: PASS | NEEDS WORK | FAIL

[If NEEDS WORK or FAIL: list the specific gaps and what to do before re-running this gate.]
```

## Verdict thresholds

- **PASS** — all three questions answered confidently in plain English; no split ownership, no silent failures, blast radius is known
- **NEEDS WORK** — answers exist but have gaps (e.g., logs are present but missing `orgId`); fixable in one short pass
- **FAIL** — at least one question gets "I don't know" or "everywhere" — the change is not coherent and should not ship

A FAIL is not a failure of the code — it is a failure of the theory behind the code. The fix is to build the theory: trace the dependencies, name the owners, add the observability — *then* re-run the gate.

## Notes for the assistant

- This is a thinking gate, not a tooling gate. Even with `jcodemunch` data, the user / agent must answer in plain English. "The blast radius tool says X, Y, Z import this" is not an answer — "if this service breaks, every reservation create will fail and users will see 500s" is.
- Be honest. If you cannot answer one of the three, say "I don't know" — that is the entire point of the gate. Inventing an answer to look productive defeats the skill.
- For Rekaliber, this skill complements `rex-qa` rather than replacing it. `rex-qa` checks the code runs; this checks the system is coherent. Both must pass.
- For non-Rekaliber work (a Vault financial model, a Spark campaign plan, a Pitch resume), the questions translate:
  - State → who owns the source numbers / facts
  - Feedback → how do we know the artifact is achieving its goal
  - Blast radius → what happens to dependent decisions if the artifact is wrong
- Inspired by the systems-thinking framing in Hak's "Why we've been focused on the wrong skill" (2026), itself rooted in Peter Naur's *Programming as Theory Building* (1985).
