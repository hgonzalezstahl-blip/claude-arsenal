# Persona Testing Skill

Use this skill to validate a user-facing feature from the perspective of real users — not engineers.
This skill answers: "Would a real human actually use this?"

## When to invoke
- After a user-facing feature passes all technical gates
- Before a demo, client presentation, or stakeholder review
- When the question is about usability, not technical correctness
- When asked "is this intuitive?" or "how would users feel about this?"

## Preferred model: Claude Opus or GPT-4o
Persona simulation requires reasoning about human psychology and user behavior.

---

## HOW TO RUN A PERSONA SESSION

### Step 1 — Select relevant personas
Not every persona applies to every feature. Select the 1-3 most relevant for what's being tested.

### Step 2 — Define a realistic scenario
Give each persona a real goal — not a test script.
```
BAD:  "Test that the reservation create button works"
GOOD: "You just got an inquiry from a guest and want to block those dates and confirm the booking"
```

### Step 3 — Simulate the session
Walk through the flow as that persona. Think out loud. Notice friction.

### Step 4 — Classify findings and produce verdict

---

## PERSONA ARCHETYPES

Adapt these to your product. Replace role descriptions with your actual user types.

### The Power User
- Uses the product daily as a core part of their job
- Has used 3-5 competitor tools and has strong benchmarks
- Values speed, keyboard shortcuts, bulk operations, multi-item views
- Will notice immediately if a task takes more clicks than necessary
- Evaluates on: efficiency, reliability, multi-tasking capability

### The Occasional Non-Technical User
- Uses the product weekly or monthly, not daily
- Low technical tolerance — afraid of breaking things
- Judges the product by clarity, trust signals, and financial accuracy
- Gets confused by jargon and industry-specific terminology
- Evaluates on: clarity, confidence, does not feel overwhelming

### The End Consumer
- Uses the product once or occasionally (booking, checkout, form submission)
- Benchmarks against the best consumer apps they use (Airbnb, Stripe, Apple Pay)
- Trust breaks fast during sensitive flows (payment, account creation)
- Will abandon and go elsewhere if friction is too high
- Evaluates on: conversion (will they complete the action or not?)

### The New Employee / First-Time User
- No prior context, starting fresh
- Evaluates the onboarding and discoverability of features
- Needs clarity without hand-holding
- Will highlight missing labels, confusing defaults, absent help text

---

## EVALUATION DIMENSIONS

For each persona, evaluate:

| Dimension | Question |
|-----------|---------|
| **Discoverability** | Could they find the feature without being told where it is? |
| **Learnability** | Could they figure out how to use it on first try? |
| **Efficiency** | How many steps to accomplish the goal? Are any unnecessary? |
| **Error Recovery** | When something goes wrong, do they understand what happened and how to fix it? |
| **Trust** | Does the system communicate clearly enough that they'd use it with real data? |
| **Completeness** | Is anything missing that they would need to complete their goal? |
| **Delight** | Are there moments that genuinely feel good? |

---

## FINDING CLASSIFICATION

- **Blocker** — persona cannot complete their primary goal. Core use case fails.
- **Critical Friction** — persona struggled significantly or nearly abandoned. High risk.
- **Gap** — feature or information the persona needed that doesn't exist.
- **Minor Friction** — small annoyance, doesn't prevent completion.
- **Delight** — moment that exceeded expectations. Protect this as you iterate.

---

## OUTPUT FORMAT

```
PERSONA TESTING: [feature]
Personas: [which were simulated]

[PERSONA NAME] SESSION
Goal: [what they were trying to do]
Walkthrough:
  → Step 1: [action] — [reaction/friction/success]
  → Step 2: ...

Findings:
  BLOCKER: [description] — Severity: Critical
  FRICTION: [description] — Severity: High/Medium/Low
  GAP: [description]
  DELIGHT: [description]

---

SYNTHESIS
Consensus issues (2+ personas): [list]
Contradictions: [persona A wants X, persona B wants opposite — flag the trade-off]
Dependency chains: [where one persona's success depends on another flow working]

Priority:
  P0 (Ship Blocker): [N findings]
  P1 (Fix This Cycle): [N findings]
  P2 (Next Cycle): [N findings]
  P3 (Backlog): [N findings]
  Delights (Protect): [N moments]

SHIP VERDICT: READY | READY WITH KNOWN GAPS | NEEDS WORK BEFORE SHIP
```
