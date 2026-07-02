# Presenting the AI Recruitment System to HR — Presentation Plan

**Format:** Written doc / presenter notes
**Length:** 10–15 minutes
**Audience:** HR team
**Angle:** Efficiency — how much manual work this removes from the hiring pipeline

---

## 1. One-line framing (30 sec)

> "This is a recruitment system that handles job posting, CV screening, and a first-round interview automatically — so the HR team only steps in to make the final calls, not to do the repetitive screening work."

---

## 2. The problem, stated in HR's terms (1–2 min)

Today, for every job opening, HR (or a hiring manager) has to:
- Read every CV/cover letter that comes in, even the obviously unqualified ones
- Manually shortlist candidates against the job requirements
- Schedule and conduct first-round screening calls/interviews just to filter for basics
- Take notes, compare candidates from memory, and write up a recommendation

That's hours of repetitive work per role before a hiring manager ever sees a true shortlist.

**The system replaces steps 1–3 with AI, and gives HR a structured, scored shortlist instead of a folder of CVs.**

---

## 3. The pipeline (2 min) — show this as a simple diagram/list

```
1. HR posts a job  →  2. Candidate applies (CV + cover letter)
        ↓
3. AI screens the CV against the job requirements (score + written feedback)
        ↓
4. HR reviews the score and approves/rejects in one click
        ↓
5. Approved candidates get an email invite to a short AI voice interview
        ↓
6. AI interviews the candidate (push-to-talk, topic-by-topic)
        ↓
7. AI produces a scorecard: per-topic scores, strengths, weaknesses, recommendation
        ↓
8. HR reviews the scorecard and makes the final approve/reject decision
```

**Key message: AI does the first pass at every stage. HR makes every decision that matters.**

---

## 4. Live demo (5–6 min) — the core of the presentation

Walk through the dashboard live rather than describing it. Suggested order:

1. **`/hr` dashboard** — show stats at a glance (active jobs, applicants, pending review)
2. **Create a job** (`/hr/jobs`) — point out the fields HR fills in once per role:
   - Title, description, requirements, department, location, type
   - CV screening instructions (tells the AI what to weigh)
   - Stage 2 assessment instructions + questions + topic labels (sets up the AI interview)
   - *Talking point: this is the only manual setup — after this, the pipeline runs itself per candidate.*
3. **Open an existing job's applicants** (`/hr/jobs/[id]/applicants`) — show the pipeline view
4. **Open a candidate with CV screening done** — show the AI score circle + strengths/concerns/evidence
   - *Talking point: the "evidence" field quotes the CV directly, so HR isn't trusting a black box.*
5. **Approve the candidate live** — show the one-click approve, mention the email + interview link goes out automatically
6. **Open a candidate who has completed Stage 2** — show:
   - Full interview transcript
   - Per-topic score bars
   - Overall score + recommendation (e.g., "Strong Pass")
   - Strengths / weaknesses lists
7. *(Optional, if time allows)* Show 30 seconds of the candidate-side AI interview experience itself — push-to-talk, topic progress — so HR can picture what the candidate goes through.

---

## 5. What HR still controls (1–2 min) — addresses the unspoken concern

This section matters even if no one asks — say it proactively:

- **The AI never rejects or hires anyone.** It only scores and recommends. Every approve/reject is an HR click.
- **CV evidence is shown, not hidden** — every AI score is backed by a quote from the actual CV or interview transcript.
- **The job-specific instructions are written by HR** — the AI screens against *your* criteria, not generic ones.
- **Nothing is final until HR says so** — candidates only move stages after explicit approval.

---

## 6. The efficiency case (1–2 min) — close on this

Frame as before/after:

| Today (manual) | With this system |
|---|---|
| Read every CV individually | AI pre-scores and flags strengths/concerns in seconds |
| Schedule and run a first-round screening call | AI conducts a structured first interview automatically, any time of day |
| Take notes, compare candidates from memory | Structured scorecards, side-by-side, always consistent |
| Hours per role before a shortlist exists | A reviewed shortlist as soon as candidates apply |

> "The goal isn't to remove HR from hiring — it's to remove the repetitive first-pass work, so HR's time goes into judgment calls on a pre-qualified shortlist instead of sorting through everyone who applied."

---

## 7. Anticipated questions (have answers ready, don't present this slide)

- **"Can candidates game the AI interview?"** — It's voice-based and conversational (not multiple choice), and HR reviews the full transcript, not just the score.
- **"What if the AI gets it wrong?"** — That's exactly why HR approves every stage — the AI narrows the pool, it doesn't decide.
- **"Is candidate data secure?"** — Candidates explicitly consent before the AI interview (data use, guidelines, device check) — point this out if asked.
- **"What's the candidate experience like?"** — Mention the push-to-talk design, clear instructions page, and that it takes roughly the length of a short phone screen.

---

## 8. Next steps / close (30 sec)

End with a concrete ask, e.g.:
- "I'd like to run the next open role through this system end-to-end so you can see real results."
- "Let me know which roles you'd want to pilot this with first."

---

## Presenter prep checklist

- [ ] Have a job already created and one or two test applicants in each stage (screened-only, and fully interviewed) so you're not demoing on empty data
- [ ] Pre-test the dashboard loads cleanly (no console errors, no stale `.next` cache issues)
- [ ] Have the candidate-side interview link ready in a second tab in case Step 7 (optional demo) comes up
- [ ] Know your two or three best example transcripts/scores ahead of time — pick ones with a clear, well-justified recommendation to show off CV-evidence and transcript quality
