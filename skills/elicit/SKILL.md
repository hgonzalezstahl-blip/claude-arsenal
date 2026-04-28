---
name: elicit
description: Force a structured second pass on something just generated — a spec, plan, design decision, financial model, code architecture, prose. Use when output looks "fine" but you suspect there's more depth, when a decision is high-stakes, when stress-testing assumptions, or when a workflow hits a fork and you want to think through alternatives before committing. Picks one of nine reasoning methods (pre-mortem, inversion, first principles, red team / blue team, Socratic, constraint removal, stakeholder mapping, analogical, second-order effects) and applies it to the recent output. Triggers: "elicit", "stress test this", "pre-mortem", "what could go wrong", "rethink this", "second pass", "challenge this". Note: for financial-model stress tests, defer to `vault-auditor`. For code adversarial review, defer to `compound-engineering:review:adversarial-reviewer`. For agent prompts, defer to `rex-redteam`.
---

# Advanced Elicitation

A structured second pass on something just generated. The point is not to ask the LLM to "try again" — vague requests produce vague revisions. Instead, pick a *named reasoning method* and force the AI to re-examine its own output through that specific lens. Different methods surface different blind spots.

## When to invoke

- A spec, plan, design, or model just got generated and the user wants to push deeper
- A high-stakes decision is about to be made (architecture, pricing, hiring, launch timing)
- The output reads "fine" but the user suspects gaps
- A workflow hits a fork — pick approach A or B
- Before committing to a multi-day implementation

## How to run

### Step 0 — direct invocation shortcut

If the user names a method directly (`elicit pre-mortem`, `run inversion on this`, `red team this spec`), skip Step 1 entirely and run that method. Only render the menu if the user invokes the skill without naming a method.

### Step 1 — surface 3-5 relevant methods

Look at what was just generated. Choose 3-5 methods from the list below that fit the artifact. Don't offer all nine — too much choice paralyzes. Present them as a numbered list with one-line descriptions tailored to *this* artifact.

Example, after generating a pricing model:

> Pick a method to stress-test this:
> 1. **Pre-mortem** — assume the pricing failed in 12 months, work backward to why
> 2. **Inversion** — design pricing guaranteed to fail, then invert
> 3. **Stakeholder mapping** — re-evaluate from buyer / champion / finance / competitor perspective
> 4. **Second-order effects** — what does this pricing cause that we didn't intend?
> 5. **Constraint removal** — drop the "must be profitable in year 1" constraint, what changes?

### Step 2 — apply the method

The user picks one (or asks for a reshuffle if none fit). Apply it rigorously to the original output. Produce specific, actionable findings — not vague concerns. Each finding ties to a part of the original artifact.

### Step 3 — present the delta

Show what changed or what should change. Format:

```
ELICITATION: [method name]
═══════════════════════════

Findings:
  1. [specific issue / insight tied to original artifact]
  2. [...]

Recommended changes:
  - [concrete edit to spec / plan / design]
  - [...]

Open questions for the user:
  - [...]
```

### Step 4 — accept, discard, or repeat

The user decides what to act on. Offer to run a second method if the user wants more depth. Three passes is usually the cap before diminishing returns.

---

## The nine methods

### 1. Pre-mortem analysis
Assume the project / spec / decision already failed 6-18 months out. Work backward to find why. Forces consideration of failure modes the optimistic plan glossed over.

**Best for:** specs, launch plans, architecture decisions, financial projections, hiring decisions.

### 2. Inversion
Instead of asking "how do we succeed?", ask "how do we guarantee failure?" — then invert each failure mode into a thing to avoid. Catches risks that forward thinking misses.

**Best for:** strategy, security review, UX decisions.

### 3. First principles
Strip away every assumption. Rebuild the conclusion from ground truth (physics, math, user behavior, business reality). Catches reasoning that inherited assumptions from convention rather than truth.

**Best for:** architecture, pricing, anything that "everyone does it this way".

### 4. Red team vs blue team
Attack your own work as the red team — find every weakness. Then defend it as the blue team. Two passes, opposite stances. Surfaces both vulnerabilities and the legitimate reasons the original choice still wins.

**Best for:** security architecture, competitive positioning, contentious technical decisions.

### 5. Socratic questioning
Challenge every claim with "why?" and "how do you know?" — recursively, three to five layers deep. Exposes claims that rest on assumption rather than evidence.

**Best for:** product claims, market sizing, "this will obviously work" reasoning.

### 6. Constraint removal
Identify every constraint the original output assumed. Drop them one at a time. See what the design becomes without each. Then add them back selectively. Reveals which constraints are real and which are inherited.

**Best for:** architecture, scope decisions, budget planning.

### 7. Stakeholder mapping
List every stakeholder affected by the decision. Re-evaluate the output from each perspective: their goals, their fears, what they'd push back on, what they'd amplify. Surfaces hidden veto holders and amplifiers.

**Best for:** launches, internal-tools rollouts, pricing changes, anything multi-party.

### 8. Analogical reasoning
Find parallels in other domains where this same problem was solved (or failed). Apply the lessons. The closer the analogy, the stronger the transfer.

**Best for:** novel products, new market entry, organizational design.

### 9. Second-order effects
For each first-order effect of the decision, ask "and then what?" — two layers out. Catches consequences the original analysis treated as someone else's problem.

**Best for:** policy decisions, pricing changes, platform rule changes, hiring patterns.

---

## Notes for the assistant

- The user picks the method. Do not pick for them unless they explicitly ask.
- The first pre-mortem is almost always the right starting point for any spec or plan. If the user is unsure, recommend it.
- Be specific. "There might be edge cases" is not a finding. "If the user submits a webhook with a duplicate idempotency key while the original request is still in-flight, you'll double-charge them" is a finding.
- After applying the method, surface the changes the artifact actually needs — don't just list problems.
- If the user discards every finding, do not push back. Their judgment is the final word. Note the dismissed findings in the response so they're visible if a regression occurs later.
- This skill is portable. It works on any artifact: code, prose, financial models, designs, plans, hiring decisions, partnership terms.
