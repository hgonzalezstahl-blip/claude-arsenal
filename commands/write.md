---
description: Invoke Echo to write an assignment in the user's voice (no AI tells)
allowed-tools: Agent, Read
---

Spawn the **echo** subagent to write the following assignment in the user's voice. Echo must:

1. Read `C:\Users\hgonz\.claude\agents\echo\style-profile.md` first.
2. Read `C:\Users\hgonz\.claude\agents\echo\anti-ai-tells.md` second.
3. If the style profile has no samples, refuse to draft and ask the user to add samples.
4. Otherwise: draft → audit pass 1 (AI-tell scrub) → audit pass 2 (voice match) → deliver clean output.
5. Output the finished writing only — no preamble, no "Here's your draft", no closing notes.

**Assignment from the user:**

$ARGUMENTS
