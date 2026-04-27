# Resume Format Reference — Match the Master Resume Exactly

> Pitch reads this every time the deliverable is a Word resume. The output must be visually identical to `Master Resume Hector G-Stahl March 2026.docx`. Only the *content* changes per application — the format never does.

---

## SOURCE OF TRUTH

The reference file is `C:\Users\hgonz\Downloads\Resume, Cover Letters, Awards\Master Resume Hector G-Stahl March 2026.docx`. When in doubt, open it and match.

---

## STRUCTURE (top to bottom)

```
1. NAME (large, bold, centered or left)
2. CONTACT LINE (City, State • phone • email • LinkedIn URL)
3. POSITIONING TAGLINE (e.g. "Business Transformation & Applied AI Leader")
4. PROFESSIONAL SUMMARY (one paragraph, 4–6 sentences, tailored)
5. SIGNATURE ACHIEVEMENTS (5 bullets, top-hits, tailored)
6. CORE COMPETENCIES (single line, pipe-separated, tailored to JD vocabulary)
7. PROFESSIONAL EXPERIENCE (reverse chronological)
   For each role:
   - Company name, City, State + Date range (start – end)
   - Title
   - 3–6 achievement bullets, tailored
8. SELECTED APPLIED AI PROJECTS (optional — include if relevant to JD; this is a hidden differentiator)
9. ACADEMICS (degrees + dates + institutions)
10. TECHNICAL SKILLS (single line, pipe-separated)
```

Some roles or applications may also include a CERTIFICATIONS line, AWARDS line, or LANGUAGES line — add only when relevant to the JD.

---

## TYPOGRAPHY

- **Name:** ~16–18pt, bold, dark color (likely navy or black)
- **Section headers (SIGNATURE ACHIEVEMENTS, etc.):** ~11pt, bold, ALL CAPS, possibly with a horizontal accent line under
- **Job titles within Experience:** italic, ~11pt
- **Body text:** 10.5–11pt, Calibri or similar professional sans-serif
- **Contact line:** ~10pt, single line, bullet separators (•)
- **Tagline:** italic or bold-italic, ~11pt, centered or left-aligned with the name

Match the existing master file's exact font choices and sizes — open it and inspect.

---

## SECTION-BY-SECTION RULES

### Header
Single line of contact info. Format: `City, State • phone • email • LinkedIn URL`

Example (from master): `Houston, Texas • 832-613-2751 • hgonzalezstahl@gmail.com • www.linkedin.com/in/hector-gonz`

### Positioning tagline
Sits below contact line. One short phrase that names the target role family.

Example (from master): `Business Transformation & Applied AI Leader`

Tailor this per JD. If applying to a Director of Operations role, the tagline becomes "Operations & Transformation Leader" or similar — pulled from the alternates listed in `master-cv.md`.

### Professional summary
4–6 sentence paragraph. The opening sentence should name the target role family and core years of experience. The body covers the main impact areas. The close adds a differentiator (graduate program, fluent Spanish, cross-industry, etc.).

The default summary in `master-cv.md` is the starting point. Adjust the opening clause and any keyword emphasis per JD.

### Signature achievements
Five bullets. Each bullet:
- Starts with a strong action verb (Led, Built, Achieved, Generated, Reduced — never "Spearheaded", "Championed", "Leveraged")
- Includes a specific metric ($, %, scale, headcount, time)
- Is one sentence, ~20–35 words

The five bullets are chosen and ordered to match what the JD weights most. Reorder per application; don't keep the master order by default.

### Core competencies
One line, pipe-separated. ~10–15 items. Pull from `master-cv.md` and reorder to put the most JD-relevant items first. Use the JD's exact vocabulary where possible (for ATS keyword matching).

### Professional experience
Reverse chronological. Each role:

```
Company, City, State                                Mon YYYY – Mon YYYY
Title (italic)
- Achievement bullet 1 (verb-led, quantified, business outcome)
- Achievement bullet 2
- Achievement bullet 3
[etc, 3–6 bullets per role]
```

Format conventions from the master:
- Company name on line 1, dates right-aligned on the same line
- Title on the next line, italic
- Bullets follow

The most recent role gets the most bullets (4–6). Older roles can be trimmed to 2–3 bullets if not directly relevant to the JD.

### Selected applied AI projects (optional)
Include this section when the JD touches AI, automation, GenAI, transformation, or innovation. This is the differentiator that makes Hector stand out from typical process-engineering candidates.

Default content (from master):
- LeanLogic.org — AI Lean Operations Assistant
- Google Sheets Accounting Automation — AI-Assisted JavaScript Development

Add or substitute new projects as Hector ships them.

### Academics
Three lines (degree + institution + date), no bullet detail unless GPA was 3.5+ or there's an honor worth noting.

### Technical skills
Single pipe-separated line. Same format as Core Competencies — pull from `master-cv.md` and reorder per JD.

---

## LENGTH

The Master Resume runs 1.5–2 pages. Default to a 2-page format unless:
- The JD is for an early-career or mid-career role where 1 page is expected → use the `1 Page Process March 2025.docx` template format
- The JD is from a company / industry where 1-page is the norm (consulting, finance MBB) → use 1 page

For 1-page tailoring, the priority cuts are:
1. Trim older roles (Fike, NKT) to 2 bullets each
2. Drop the Selected Applied AI Projects section unless absolutely critical
3. Tighten the professional summary to 3–4 sentences
4. Reduce signature achievements to 3–4 bullets

---

## FILE NAMING

Per global rule (`~/.claude/CLAUDE.md`), all output files use **spaces, not underscores**.

Pattern: `Resume Gonzalez-Stahl - [Company] - [Role] - [YYYY-MM].docx`

Examples:
- `Resume Gonzalez-Stahl - Atlassian - Senior PM - 2026-04.docx`
- `Resume Gonzalez-Stahl - Microsoft - Program Manager Supply Chain - 2026-04.docx`
- `Cover Letter Gonzalez-Stahl - Atlassian - Senior PM - 2026-04.docx`

---

## DOCX GENERATION

When producing a `.docx`, use python-docx and follow `~/.claude/rules/docx-generation.md` for:
- File naming (spaces, not underscores)
- Visual verification before declaring done
- No table-based layouts that ATS parsers choke on
- Standard fonts (Calibri / Arial)
- Single column

The reference template is the Master Resume. The cleanest path is to **load the master file as a starting point and mutate it** — replace the summary, replace the signature achievements, reorder competencies, modify role bullets — rather than building from scratch. This guarantees visual fidelity.

---

## COVER LETTER FORMAT

When a cover letter is drafted, follow Hector's existing format (per `JP Morgan Cover Letter.docx` reference):

```
HECTOR EDUARDO GONZALEZ-STAHL
City, ZIP | phone | email | LinkedIn

Dear Hiring Manager,

[Paragraph 1: 2–3 sentences. State the role applied for, years of experience, and core fit claim.]

[Paragraph 2: 4–5 bullets summarizing the most JD-relevant accomplishments from the current role. Use a "Currently, as a [Title] at [Company], I lead..." opener.]
- Bullet 1
- Bullet 2
- Bullet 3
- Bullet 4

[Paragraph 3: 2–3 sentences. Pull a specific past role / accomplishment that maps to a major JD requirement.]

[Paragraph 4: 1–2 sentences. Cultural fit angle — why this specific company.]

[Closing: 2 sentences. Direct close, gratitude, ask for the conversation.]

Sincerely,
Hector Gonzalez-Stahl
```

**Note for Pitch:** This format is what Hector currently uses. The Pitch playbook has slightly different opener guidance ("don't start with 'I am writing to express my interest'"). When tailoring, default to Hector's existing format unless a specific employer / industry calls for a different style. Mention the trade-off in the fit summary if you want to suggest a stronger opener.

Length: keep to one page. ~300–400 words.

---

## CHANGE LOG

- **2026-04-26** — Format reference created from Master Resume March 2026 + JP Morgan Cover Letter as reference.
