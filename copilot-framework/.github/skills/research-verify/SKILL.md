# Research & Verify Skill

Use this skill to verify any technical claim, library API, version, CVE, or third-party behavior before it influences the build.

## When to invoke
- Before asserting a specific library API or method exists in a given version
- When a CVE or security advisory is mentioned — verify it affects the actual version in use
- Before choosing a dependency — verify it is maintained and has no known critical issues
- When third-party documentation needs to be confirmed (payment processor, cloud provider, external API)
- Any time the answer could be version-specific or has a knowledge cutoff risk

## Preferred model: Claude Opus or GPT-4o with web search enabled
Research requires access to current documentation.

---

## RESEARCH PROTOCOL

### Step 1 — State the claim clearly
Before searching, articulate exactly what is being verified:
> "Claim: Express.js v5 supports native async error handling without try/catch wrappers"

### Step 2 — Source hierarchy
Always prefer in this order:
1. Official documentation (framework docs, provider docs)
2. Official GitHub repository (README, CHANGELOG, releases)
3. Package registry (npm, PyPI, Maven — for versions, maintenance status)
4. CVE databases (nvd.nist.gov, github.com/advisories, snyk.io)
5. Standards bodies (MDN, RFC documents, OWASP)

Avoid: blog posts, tutorials, StackOverflow answers older than 2 years unless cross-validated.

### Step 3 — Cross-reference
- Verify against at least 2 sources for any critical claim
- Note which version the claim applies to
- Note the date of the source

---

## CVE INVESTIGATION CHECKLIST

When a CVE is mentioned:
- [ ] What is the CVE ID and CVSS score?
- [ ] Which package and version range is affected?
- [ ] Is the version in the current project's lockfile affected?
- [ ] Does the project's usage pattern actually trigger the vulnerability?
- [ ] What is the fixed version?
- [ ] Is the fix a drop-in upgrade or does it require API changes?

---

## PACKAGE HEALTH CHECKLIST

Before adopting a new dependency:
- [ ] Last publish date (>2 years with no activity = red flag)
- [ ] Weekly download count (activity signal)
- [ ] TypeScript support (native types or @types/)
- [ ] Open security advisories (check npm audit or snyk)
- [ ] Active maintainers (check GitHub contributor activity)
- [ ] License compatible with the project

---

## VERDICT DEFINITIONS

| Verdict | Meaning |
|---------|---------|
| **CONFIRMED** | Verified against ≥2 authoritative sources. Safe to proceed. |
| **UNCONFIRMED** | Cannot find authoritative confirmation. Do not proceed on assumption. |
| **FALSE** | Claim is factually incorrect. Report the truth. |
| **OUTDATED** | Was true in a prior version but is no longer accurate. |
| **PARTIALLY TRUE** | True under specific conditions — report the conditions. |
| **INSUFFICIENT DATA** | Not enough public information to verify. Flag the uncertainty. |

---

## OUTPUT FORMAT

```
RESEARCH REPORT
Query: [exact claim or question being verified]

VERDICT: CONFIRMED | UNCONFIRMED | FALSE | OUTDATED | PARTIALLY TRUE | INSUFFICIENT DATA

FINDING:
[Accurate statement of what is actually true. Be precise about versions and conditions.]

SOURCES:
1. [Source name] — [URL or doc reference] — [Date/Version]
2. [Source name] — [URL or doc reference] — [Date/Version]

VERSION CONTEXT:
[Which versions this applies to. Call out if behavior differs between versions.]

CAVEATS:
[Nuances, edge cases, version-specific behavior, known issues.]

RECOMMENDATION:
[Concrete action: use X version, use Y approach instead, this CVE does/doesn't affect the project, etc.]
```
