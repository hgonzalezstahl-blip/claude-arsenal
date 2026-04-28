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

Correct: `Final Policy Brief V4 [LastName].docx`
Wrong: `Final_Policy_Brief_V4_Gonzalez-Stahl.docx`

Hyphens are fine where they're part of a name (`[LastName]`). Underscores are reserved for code files (Python modules, scripts) where they're syntactically required.

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

## RULE 8 — Template Mutation for Resumes (and any user-format-bound document)

**Problem:** Rebuilding a resume from scratch with python-docx — even carefully — drops formatting fidelity. The user's March 2026 master uses Garamond, 0.30" margins, 10pt body, specific bold-pattern bullets (one "hero" bullet per role gets bolded), centered ALL-CAPS section headers with no horizontal accent line. Rebuilding from scratch with default Calibri/0.7" margins produced a doc that the user immediately spotted as "off."

**Rule:** When generating a document that must match an existing user template (resume, cover letter, formatted memo), **load the source file as a template and mutate text in place** — do not rebuild.

```python
import shutil, copy
from docx import Document

# 1. Copy template to new path
shutil.copy(SOURCE_TEMPLATE, NEW_PATH)
doc = Document(NEW_PATH)

# 2. Replace paragraph text while preserving formatting of the FIRST run.
def replace_para_text(para, new_text):
    if not para.runs:
        para.add_run(new_text); return
    para.runs[0].text = new_text
    for run in para.runs[1:]:
        run._element.getparent().remove(run._element)

# 3. To insert a new bullet, deepcopy a sibling bullet and replace its text.
def clone_paragraph_after(reference_para, new_text):
    new_p = copy.deepcopy(reference_para._p)
    reference_para._p.addnext(new_p)
    from docx.text.paragraph import Paragraph
    new_para = Paragraph(new_p, reference_para._parent)
    replace_para_text(new_para, new_text)
    return new_para

# 4. To remove a paragraph (e.g., dropping a bullet not in the new content):
def remove_paragraph(para):
    para._element.getparent().remove(para._element)
```

**This is non-negotiable for resumes.** The Pitch resume-format.md already specifies it — agents that deviate must be corrected. The rule applies whenever the user has supplied a reference template (e.g., "use my March 2026 master format"). For new artifacts the user hasn't templated (e.g., a new policy brief format), building from scratch with python-docx is fine.

---

## RULE 9 — Spacing Uniformity Audit (run before declaring any resume / template-based docx complete)

**Problem:** Template mutation can leave the document in a state where some role-to-role transitions have 1 empty paragraph (clean) while others have 6 (orphaned from the original's structure when content was removed). The user spots these inconsistencies immediately.

**Rule (ANCHORED TO TEMPLATE, not to a static target):** After every template mutation, audit the new document's empty-paragraph counts at every section/role/project transition by comparing them to the **master template's** counts at the corresponding transitions. The master template is the ground truth — do not enforce a static target like "1 empty between content and section header" because the master may intentionally use 0 at some transitions (e.g., the user's master has 0 empty paragraphs between Core Competencies content and PROFESSIONAL EXPERIENCE, which still looks right because the section header's intrinsic spacing carries the visual weight).

If the new document deviates from the master at a given transition, normalize to the master's count. Add empties where the new document has fewer than the master; remove empties where it has more.

**Common deviation sources** (handle these explicitly):
- **Removed paragraphs leave orphan empties** — e.g., when you remove 2 bullets from a role and the master had 1 empty paragraph after each bullet for visual breathing, the orphans pile up to 6+ between roles. Walk every removal site and clean up orphans afterward.
- **Cloned paragraphs lose their adjacent empty** — when you `clone_paragraph_after()` to add a new bullet, the empty paragraph that originally followed the cloned reference is now between the clone and the next content, not between the original and the clone. Verify the spacing before/after the insertion site.
- **First-time additions inherit no empty** — when a new section is being added (e.g., a Languages line that wasn't in the master), there's no template precedent. Use the spacing pattern of the most similar existing transition as the model.

**Static targets are useful only as a sanity check, not as a hard rule:**

| Transition | Typical pattern (master may differ) |
|---|---|
| Section header → first content | 2 empty paragraphs |
| Last content of section → next section header | 0 OR 1 empty paragraphs (varies by section in this user's master — verify per transition) |
| Role → next role within Professional Experience | 1 empty paragraph |
| Project → next project within Selected Applied AI Projects | 1 empty paragraph |
| Degree → next degree within Academics | 1 empty paragraph |
| Bullet → next bullet within a role | 0 empty paragraphs |
| Role title (italic) → first bullet | 0 empty paragraphs |

**Verification routine — anchored to the master template:**

```python
def build_transition_map(doc):
    """Return a dict mapping (prev_text_signature, curr_text_signature) →
    empty_paragraph_count. Each key represents a transition between two
    non-empty paragraphs; the value is how many empty paragraphs sit between them.
    Use the first 60 chars of each paragraph as a stable signature."""
    paras = list(doc.paragraphs)
    transitions = {}
    prev_text = None
    empty_run = 0
    for p in paras:
        text = p.text.strip()
        if not text:
            empty_run += 1
            continue
        if prev_text is not None:
            key = (prev_text[:60], text[:60])
            transitions[key] = empty_run
        empty_run = 0
        prev_text = text
    return transitions


def audit_spacing_against_template(new_doc_path, template_doc_path,
                                   section_correspondence):
    """Compare the new doc's empty-paragraph counts to the template's at every
    corresponding transition. Returns list of (label, observed, expected) tuples
    where observed != expected.

    section_correspondence: dict mapping new-doc text-prefix → template text-prefix
    for paragraphs that have changed text but represent the same structural
    location (e.g., 'Supply Chain Planning Architecture' → 'AI Workflow Design').
    Lets the comparator align corresponding transitions across the two docs."""
    from docx import Document
    new_doc = Document(new_doc_path)
    tmpl = Document(template_doc_path)
    new_transitions = build_transition_map(new_doc)
    tmpl_transitions = build_transition_map(tmpl)
    # ... compare structural pairs, normalize where they differ ...
```

The pseudocode above is intentionally schematic — implementation depends on the document type. **The principle is what matters:** the master template defines correct spacing, not a static rule.

**Static-target sanity check (use as fallback only):** the audit may run a static check using the typical-pattern table above as a smoke test, but a static target failure should not auto-trigger normalization without checking the master first. The master is authoritative.

If the audit returns issues, normalize them to match the master before saving. Do not deliver a resume with spacing inconsistencies — and do not over-correct by enforcing rules the master doesn't follow.

**For Pitch specifically:** the spacing audit step happens between the Pre-Delivery Checklist (Step 6b in pitch.md) and the ATS + format check (Step 6c). Add as Step 6d. Pitch must run this for every resume / cover letter / template-based docx delivery.

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

- **2026-04-26** — File created from the user's V4 policy brief review. Rules 1–7 added.
