# DOCX Generation Rules

> Lessons learned from real document deliveries. Any agent generating Word documents (Echo, Pitch, future writers) must follow these rules. Update when human review surfaces a new pattern.

---

## RULE 1 — APA Reference Italics (highest priority)

**Problem:** Markdown italic markers (`*text*`) converted to docx by character offset land in the middle of words. Italics bleed into the wrong tokens.

**Rule:** Never use markdown italic markers in references and convert. Build references as docx paragraph runs directly, applying `italic = True` to specific `Run` objects.

**APA 7 italic rules — exactly what gets italicized:**

| Element | Italicized? |
|---|---|
| Author names | No |
| Year (in parentheses) | No |
| Article title | No |
| Journal name | **Yes** |
| Volume number | **Yes** |
| Issue number (in parentheses) | No |
| Page numbers | No |
| DOI / URL | No |
| Book title | **Yes** (when standalone work) |
| Report title (NIST, FDA guidance, government reports) | **Yes** |
| Federal Register name (used as a journal) | **Yes**, plus volume |

**Correct pattern in python-docx:**

```python
def add_apa_reference(doc, parts):
    """parts: list of (text, italic_bool) tuples in order"""
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Inches(-0.4)
    p.paragraph_format.left_indent = Inches(0.4)
    for text, italic in parts:
        run = p.add_run(text)
        run.italic = italic
        run.font.size = Pt(10.5)
```

**Worked example — Wong et al. 2021:**

```python
add_apa_reference(doc, [
    ("Wong, A., Otles, E., Donnelly, J. P., Krumm, A., et al. (2021). External validation of a widely implemented proprietary sepsis prediction model in hospitalized patients. ", False),
    ("JAMA Internal Medicine, ", True),
    ("181", True),
    ("(8), 1065–1070. https://doi.org/10.1001/jamainternmed.2021.2626", False),
])
```

**Verification step:** After generating, render the docx to PDF (or open in Word and screenshot the references page) and visually inspect. The italics should be confined to journal names and volume numbers — not bleeding into article titles, author names, page numbers, or URLs. If they bleed, the offset logic is wrong; rewrite as runs.

---

## RULE 2 — Stat Callouts vs. Data Tables

**Problem:** Treating a "key numbers at a glance" callout as a generic 3-column data table strips the visual punch. The numbers should be the first thing the eye lands on.

**Rule:** Distinguish two visual patterns:

### When to use a STAT CALLOUT
Trigger phrases: "Evidence at a Glance", "Key Numbers", "By the Numbers", "At a Glance" (when the body content is statistics, not categories).

**Pattern:** Single-row table with N columns (one per stat). Each cell contains:
- **Big bold number:** 40–44pt, bold, accent color, centered (e.g. `0.63`, `17.7% → 46.5%`, `~3×`)
- **Descriptive label:** 10–11pt, body color, centered, 1–2 lines (what the number means)
- **Source attribution:** 8–9pt, italic, muted gray, centered (e.g. `Wong et al., 2021`)

No header row. The numbers themselves are the headers.

### When to use a DATA TABLE
Categorical or comparative content where rows and columns both carry meaning. Federal Frameworks at a Glance, Implementation Sequence, Policy Options Comparison — all data tables.

**Pattern:** Header row in accent fill with white bold text. Body rows in white or alternating tint. Each cell contains body-size text (10–11pt). Bold the first column when it serves as a row label.

**Decision rule:** Ask "Are the numbers the message?" If yes → stat callout. If the relationships between rows and columns are the message → data table.

---

## RULE 3 — Default to Rubric-Preferred Format

**Problem:** When a rubric expresses a preference between two acceptable options ("footnotes preferred, APA in-text allowed"), agents picked the second-best option without flagging it.

**Rule:**
1. Read the rubric for explicit format preferences before any formatting decision.
2. Default to the preferred option. Always.
3. If there is a real reason to deviate (e.g., the rendering is broken, the document type doesn't support it), surface the trade-off to the user and ask before deviating. Do not bury the decision in a memo.

**For citations specifically:**
- "Footnotes preferred" → use Word footnotes, not APA in-text
- "APA preferred" → use APA in-text
- "Either acceptable" → ask the user, or default to the more visually clean option for the document type

---

## RULE 4 — Flag Page-Count Overages

**Problem:** Adding good content silently pushed a deliverable past a stated page guideline ("approximately 5–6 pages").

**Rule:** Whenever a revision pushes a deliverable past a stated length (page count, word count, character count):

1. Estimate the final page count BEFORE delivering.
2. If it exceeds the guideline, flag it explicitly in the response.
3. Offer the user a choice: keep the new content and accept the overage, or tighten elsewhere to stay within the guideline.
4. Never silently exceed a stated guideline.

For policy briefs and academic assignments, page guidelines are usually rubric items. For business documents (one-pagers, memos), they're audience expectations. Both matter.

---

## RULE 5 — Voice Sampling for New Content

**Problem:** When agents add new content to a document the user has been writing in their own voice, the new content drifts smoother / more polished than the surrounding paragraphs. Reads as AI-authored.

**Rule:** Before generating any new prose to add to an existing user document:

1. Sample 2–3 paragraphs of the user's existing writing in that document.
2. Note: sentence length distribution, register (casual / professional / formal), hedging patterns ("in my opinion", "I think", "this tells me"), transition word choices, contraction usage, paragraph length variance.
3. Match those patterns in the new prose.
4. Self-check: does the new prose read noticeably smoother or more "polished" than the surrounding text? If yes, rewrite it to match.

This is especially important for inserted sections (a new appendix, a new callout, an expanded paragraph). The reader should not be able to tell where the user's prose ends and the agent's begins.

---

## RULE 6 — File Naming

**Rule:** All output files (Word documents, PDFs, markdown deliverables, generated artifacts) use **spaces, not underscores**, between words in the filename.

Correct: `Final Policy Brief V4 Gonzalez-Stahl.docx`
Wrong: `Final_Policy_Brief_V4_Gonzalez-Stahl.docx`

Hyphens are fine where they're part of a name (`Gonzalez-Stahl`). Underscores are reserved for code files (Python modules, scripts) where they're syntactically required.

This rule applies to filenames the user will see in Downloads, on their desktop, or anywhere they interact with the file outside of code. It does not apply to internal config files, scripts, or git-tracked source code.

---

## RULE 7 — Verification Before Declaring Done

For any generated docx that includes:
- A reference list with italic formatting
- Stat callouts
- Multi-column tables
- Footnotes / endnotes

**Always verify by visual inspection** before declaring the document complete. Either render to PDF and inspect, or open in Word and screenshot the relevant pages. A docx that "looks fine in markdown" can still ship broken italics, broken table column widths, or missed accent colors.

---

## RULES THAT WORKED — KEEP DOING

These are patterns that were praised in human review and should be the default going forward:

- **Implementation Sequence tables** for phased rollouts (Phase / Timeframe / What gets done / Why first columns)
- **Comparison tables in callout boxes** for at-a-glance summaries above prose discussion
- **Bolded sub-recommendations (a) through (n)** for breaking complex recommendations into scannable parts
- **Expanded executive summaries that name the recommendations** — front-loads the decision
- **Candid AI Use Memos** that acknowledge real limitations (hallucinated citations, prose softening, weak at substantive reasoning) — read more credibly than generic "AI helped me brainstorm" boilerplate
- **Diplomatic but firm handling of mismatched feedback** ("flagged with the instructor for resolution") — shows the user took action

---

## CHANGE LOG

- **2026-04-26** — File created from Hector's V4 policy brief review. Rules 1–7 added.
