---
description: Invoke Pitch to tailor a resume (and optional cover letter) for a specific job
allowed-tools: Agent, Read
---

Spawn the **pitch** subagent to produce a tailored resume for the job described below. Pitch must:

1. Read `C:\Users\hgonz\.claude\agents\pitch\master-cv.md` first.
2. Read `C:\Users\hgonz\.claude\agents\pitch\resume-playbook.md` second.
3. If the master CV has placeholder content, refuse and ask Hector to populate it.
4. Parse the job description in `$ARGUMENTS` (or `job-target.md` if `$ARGUMENTS` is empty).
5. Map JD requirements to Hector's actual experience.
6. Draft → keyword audit → corporate-speak scrub → ATS check → deliver.
7. Output: tailored resume in clean markdown + a fit summary listing strong matches, partial matches, and stretches.
8. If Hector asked for a cover letter, include it under a separate heading.

**Job description / target role from Hector:**

$ARGUMENTS
