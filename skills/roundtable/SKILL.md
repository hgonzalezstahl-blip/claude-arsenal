---
name: roundtable
description: Convene multiple orchestrators (Rex, Luna, Spark, Vault, Scout, Auditor, TaskMaster) into one conversation to debate a high-stakes decision from their distinct perspectives. Orchestrators are voiced in-conversation, not spawned as sub-agents — the skill simulates their perspectives in a single session for cost and coherence. Use when a decision crosses orchestrator boundaries — pricing (Vault + Spark + Luna), architecture choices (Rex + Vault for cost), launch readiness (Rex + Luna + Spark), build-vs-buy (Rex + Vault + Scout), inherited-codebase decisions (Auditor + Vault + Rex), cross-domain planning (TaskMaster + relevant orchestrators), or any "should we do X?" where one orchestrator alone can't see the full picture. Triggers: "roundtable", "get the team's opinion", "what does everyone think", "round-robin this", "let's debate this", "all orchestrators weigh in", "convene the team".
---

# Roundtable

Get multiple orchestrators arguing in one room. Most strategic decisions live at the seams between specialties — engineering, finance, UX, market positioning. A single orchestrator gives you a single lens. A roundtable forces real disagreement to surface.

## When to invoke

- A decision crosses two or more orchestrator domains
- The user is stuck between options and needs adversarial perspective
- A pre-launch readiness check (Rex says it works, Luna says users will struggle, Spark says positioning is wrong)
- A pricing or packaging decision (Vault + Spark + Luna at minimum)
- Build vs buy vs partner (Rex feasibility + Vault cost + Scout market)
- Architecture choices with cost or UX implications
- Post-mortems where multiple disciplines own a piece of the failure

Do **not** use for narrow technical questions ("which Postgres index should I add?") — that's a single-orchestrator job.

## How to run

### Step 0 — read the persona files of the cast

Before voicing any orchestrator, read its agent definition file in `~/.claude/agents/`. The quality of a roundtable depends on each orchestrator sounding like *itself* — generic-CFO instead of Vault, generic-engineer instead of Rex, will collapse the value of the skill. Read what each orchestrator's principles, voice, and biases actually are before you make them speak.

If a chosen orchestrator's file cannot be located, drop them from the cast and tell the user — do not invent a stand-in.

### Step 1 — define the question and the cast

State the decision in one sentence. Then pick 3-5 orchestrators whose perspectives matter. Don't invite all of them to every roundtable — too many voices and signal collapses.

Common casts:

| Decision type | Cast |
|---|---|
| Pricing / packaging | Vault, Spark, Luna |
| Build vs buy | Rex, Vault, Scout |
| Pre-launch readiness | Rex, Luna, Spark |
| New feature scope | Rex, Luna, Vault (if it has cost implications) |
| Architecture w/ cost stakes | Rex, Vault |
| Market entry | Scout, Spark, Vault |
| Hiring / org design | Vault (cost), Rex (technical fit) |
| Crisis / incident retro | Rex + every orchestrator that touches the failure |
| Inherited codebase: continue / rebuild / sell | Auditor, Vault, Rex |
| Cross-domain initiative planning | TaskMaster, plus 2-3 domain orchestrators |
| Internal tool / agent design | TaskMaster, Rex, plus the orchestrator that will use it |
| Naming / branding | Spark, Luna |

### Step 2 — opening statements (one round)

Each orchestrator gives a one-paragraph opening from their lens. No diplomacy — they speak in character with their actual specialty's bias.

Example, on "should we charge for the Lean AI app or stay free?":

> **Vault:** Free model means $X annual loss assuming Y users. Even at a $5 conversion rate, paid recovers cost in N months. Free is a real money decision, not a default.
>
> **Spark:** Paid resets positioning. "Lean AI" reads premium today; a $9 app reinforces that. Free apps from solo builders read as "abandoned in 6 months" to the buyer we want.
>
> **Luna:** Real users won't pay until session 3. A 7-day free trial gates conversion behind learned value. Charging at install will halve activation.

### Step 3 — disagreement round

Each orchestrator pushes back on the others. The user does not need to prompt — the orchestrators address each other directly. Surface the actual tensions:

> **Spark → Luna:** "Halve activation" assumes the app is interchangeable. If we positioned it correctly, install is a high-intent action and friction is a feature.
>
> **Luna → Spark:** Disagree. Even high-intent installs drop 60% at first paywall in mobile learning. The data is unambiguous.
>
> **Vault → Spark:** If Luna's right about the 60% drop, your positioning math falls apart — premium is empty if nobody installs.

This is the most important round. Skipping it produces fake consensus.

### Step 4 — convergence attempt

Look for the synthesis. Often there is one option that all three would accept — or one that two would accept and one would tolerate. Surface it explicitly:

> **Synthesis on the table:** 7-day full-feature trial → $9/mo, with one-time $79 lifetime offered after the user completes 5 lessons. Vault clears margin. Luna keeps activation. Spark holds positioning.

If the orchestrators cannot converge, say so clearly. Forced consensus is worse than honest deadlock. When deadlock happens, the next move is one of: (1) run `elicit` with the *constraint removal* method on the deadlock — a hidden constraint is usually what's keeping the cast at odds; (2) escalate to a human decision with the dissents documented; (3) gather missing data (often what one orchestrator is asserting without evidence) and re-convene.

### Step 5 — the user decides

Present the synthesis (if any), the dissents (if any), and the open questions. The user makes the call. Do not push.

```
ROUNDTABLE: [decision]
══════════════════════

Cast: [orchestrators present]

Convergence: [the option all/most can accept, or "no convergence reached"]

Dissents:
  - [orchestrator]: [what they'd still push back on]

Open questions for the user:
  - [...]

Recommended next step:
  - [single concrete action — e.g., "model the 60% drop scenario in Vault before deciding"]
```

---

## Rules for orchestrators participating in a roundtable

- Speak in character. Don't soften your specialty's bias to be polite — the user invoked you for that bias.
- Address other orchestrators by name. Real conversation, not parallel monologues.
- Disagree if you actually disagree. The roundtable fails if every orchestrator nods along.
- Cite numbers and references when you have them. "Industry data shows X" is weaker than "Wong et al. 2021 measured X".
- Stay on the question. Don't drift into adjacent decisions.

## Notes for the assistant

- Pick the cast carefully. Wrong cast = wrong answer. If the user invokes "roundtable" without specifying, propose a cast and ask before convening.
- The disagreement round is where the value is. If you find yourself writing three opening statements that all agree, the cast is wrong or the question is too narrow for a roundtable.
- The user can interrupt at any point: "Vault, dig into the lifetime math" — let Vault expand, then return to the roundtable flow.
- This is a `Skill`, not an `Agent` invocation. The orchestrators are simulated within this conversation — no actual sub-agent spawns. For deeper analysis, the user can spawn the relevant agent separately after the roundtable concludes.
- For Rekaliber-only technical decisions, prefer a normal Rex sub-agent flow over a roundtable. Roundtables are for decisions with cross-domain stakes.
