---
name: adversarial-review
description: Force-find-issues review of any non-code artifact — spec, plan, design doc, prose, agent definition, architecture proposal, launch checklist. Reviewer must find at least one issue; "looks good" is not allowed. Different from code-only adversarial review (`compound-engineering:review:adversarial-reviewer`), prompt-level red team (`rex-redteam`), and financial-model stress tests (`vault-auditor`) — this skill is for the prose-and-structure artifacts where most projects are won or lost. Use after ce-plan / TaskMaster / ce-brainstorm produces a plan, before signing off on a launch checklist, before sending a high-stakes deliverable, or whenever the user says "tear this apart", "what am I missing", "play devil's advocate", or "find the holes".
---

# Adversarial Review

Force genuine analysis on a non-code artifact by removing the "looks good" escape hatch. The reviewer adopts a cynical stance: assume problems exist, find them. Zero findings triggers a halt — re-analyze or explicitly explain why the artifact is genuinely flawless.

This is the discipline pattern, not a tool. The same rule that makes code red-teaming work, applied to specs, plans, prose, and decisions where most real failures hide.

## When to invoke

- A spec or plan just got written (by `ce-plan`, `TaskMaster`, `ce-brainstorm`, or by hand) and needs a stress test before implementation
- A design doc or ADR is up for sign-off
- A financial model from `vault-modeler` is about to inform a real decision
- A piece of prose (cover letter, proposal, policy brief, blog post) is one revision from final
- An agent definition just got created or significantly modified
- A launch checklist or rollout plan needs adversarial scrutiny
- Anytime the user says "find the holes", "tear this apart", "play devil's advocate", "what am I missing"

This skill is artifact-agnostic. Code has dedicated reviewers (`rex-redteam`, `compound-engineering:review:adversarial-reviewer`); use this for everything else.

## The core rule

**You must find at least one issue. Zero findings is not a valid result.**

If the artifact genuinely seems flawless, do one of two things:
1. Re-analyze with a different lens (read it as the most skeptical stakeholder, the most cost-conscious operator, the most distracted user). Issues almost always surface on the second pass.
2. Halt and explain *specifically* why the artifact is exception-grade — citing what would normally be a weakness and why it isn't one here. "Looks good" is never acceptable.

This rule is what makes the skill work. Without it, confirmation bias produces rubber-stamp reviews.

## How to run

### Step 1 — adopt the stance

Before reading the artifact, internally adopt a skeptical persona appropriate to the artifact type:

| Artifact | Adversarial stance |
|---|---|
| Technical spec | A senior engineer who has shipped this kind of system before and watched it fail |
| Product plan | A PM who has seen launches die from the gaps this plan ignores |
| Financial model | A CFO who has been burned by optimistic assumptions |
| Cover letter / proposal | A hiring manager / decision-maker reading 50 of these in one sitting |
| Policy brief / academic doc | A reviewer with the rubric in hand looking for points to deduct |
| Agent definition | A user about to invoke this agent in production with no patience for ambiguity |
| Launch checklist | The on-call engineer who will get paged when this fails |

### Step 2 — read with information asymmetry

Do not look at the original reasoning behind the artifact (commit messages, brainstorm notes, the conversation that produced it). Evaluate the artifact on its own merits, the way the actual recipient will. If you have access to that context, suppress it.

This catches the most common failure mode: artifacts that make sense to the author because they remember the unwritten assumptions, but break for anyone reading them cold.

### Step 3 — produce the findings

Output format:

```
ADVERSARIAL REVIEW: [artifact name]
═══════════════════════════════════
Stance:         [the persona adopted]
Findings count: N

Findings (severity-ordered):

1. [HIGH] — [specific issue, tied to a specific section / line / claim]
   Why it matters: [what breaks if this isn't fixed]
   Suggested fix:  [concrete change]

2. [HIGH] — ...

3. [MEDIUM] — ...

4. [MEDIUM] — ...

5. [LOW] — ...

Things I checked and didn't flag:
  - [areas that looked weak but actually held up — keeps the review honest]

Things I couldn't evaluate:
  - [areas where I lacked context to judge — flagged for the user]
```

**Severity rubric:**
- `HIGH` — would cause real failure, real money loss, real user harm, or rejection by the recipient
- `MEDIUM` — would degrade outcome but not destroy it; should be fixed
- `LOW` — nitpick, polish, or style; fix if cheap

### Step 4 — human filtering

The user reads the findings and decides what's real. Because the AI is *instructed* to find problems, false positives are guaranteed. Expect:
- Misunderstandings of intent (the AI didn't see the constraint that makes the design correct)
- Nitpicks dressed as issues
- Hallucinated concerns (a claimed contradiction that isn't actually there)

The user dismisses noise and acts on signal. Do not push back if the user dismisses every finding — their judgment is the final word. But do log the dismissed findings; if a regression happens later that matches a dismissed finding, surface that pattern.

### Step 5 — second pass (optional)

After the user addresses findings, offer to run the review again. Second passes catch things that only became visible after the first round of fixes. Third passes hit diminishing returns — usually nitpicks and false findings.

---

## Severity calibration examples

A good HIGH finding on a spec:

> [HIGH] — Section 4.2 says "the system retries on failure" but doesn't specify retry count, backoff strategy, or idempotency requirements. Implementer will pick defaults that may double-charge customers or hammer the upstream API.
> **Suggested fix:** Specify retry count (e.g., 3), exponential backoff (e.g., 1s/4s/16s), and require idempotency keys on all mutating retries.

A bad HIGH finding (too vague):

> [HIGH] — Error handling is unclear.

A good MEDIUM on a financial model:

> [MEDIUM] — CAC assumption of $40 is sourced from one industry report from 2022. Two competitors in the same space publicly disclosed CAC >$120 in 2024. Model breaks if real CAC is 3x.
> **Suggested fix:** Add a sensitivity row testing CAC at $40 / $80 / $120.

A bad MEDIUM (no actionability):

> [MEDIUM] — CAC seems low.

## Notes for the assistant

- The "find at least one issue" rule pushes you to *re-read with a fresh stance*, not to fabricate. The order of operations is: (1) first pass produces zero findings, (2) re-read with a different adversarial stance from the table above, (3) if still zero, halt and explicitly explain — citing what would normally be a weakness and why it isn't here. Inventing findings to satisfy the rule is worse than zero findings; the rule exists to defeat lazy reads, not to manufacture noise.
- For agent definitions specifically: check the description triggers, the activation conditions, missing edge cases, and whether the output format will actually be useful to a human or to a downstream agent.
- For prose: check claims that need citation, places where the voice drifts, transitions that hide weak logic, and the executive summary's faithfulness to the body.
- For financial models: check assumption sourcing, sensitivity analysis presence, scenario coverage, and unit consistency.
- This skill complements `elicit` rather than replacing it. `elicit` runs a named reasoning method; `adversarial-review` runs the adversarial stance. Both can run on the same artifact.
