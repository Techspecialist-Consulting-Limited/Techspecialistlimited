# Executive Overview

## What this system is

TechSpecialist Limited's web presence is not just a marketing website — it's a working business application with three distinct products living under one domain:

1. **The public website** — homepage, services, case studies, insights (blog), consultation booking, legal pages, and a privacy/data-deletion page for a separate mobile app ("ICE", built for NSIA).
2. **An AI-powered recruitment platform** — a careers board where candidates apply for jobs, an AI that automatically screens every CV against the job requirements, an AI that conducts a first-round voice interview with shortlisted candidates, and an internal HR portal where staff manage jobs, review candidates, schedule final interviews, and see recruitment analytics.
3. **An AI Readiness Assessment** — a public, self-serve quiz that scores a visitor's organization on "AI readiness," used as a marketing lead-generation tool, plus an internal dashboard to review the leads it captures.

## Who uses it, and how

| User | What they do | Where |
|---|---|---|
| Website visitor / prospect | Browses services and case studies, books a discovery call, takes the AI Readiness quiz | Public pages |
| Job candidate | Finds a job, applies with CV + cover letter, later completes an AI voice interview by email link | `/careers`, `/apply`, `/assessment/[token]` |
| HR staff | Posts jobs, reviews AI-screened candidates, approves/rejects, schedules final interviews, views analytics, manages other HR accounts | `/hr/*` (login required) |
| Marketing/sales staff | Reviews AI Readiness quiz leads, exports them, marks them as followed up | `/admin/assessments` |

## The recruitment pipeline, in plain terms

This is the most complex part of the system, and the one that does the most work:

```
1. HR posts a job
        ↓
2. Candidate applies (CV + cover letter, no account needed)
        ↓
3. AI reads the CV against the job requirements and produces a score + written strengths/concerns
        ↓
4. HR reviews the AI's assessment and approves or rejects — this is a human decision, not automated
        ↓
5. Approved candidates get an emailed link to a short AI-conducted voice interview
        ↓
6. The AI interviews the candidate by voice, topic by topic, and produces a scorecard
        ↓
7. HR reviews the scorecard and schedules a final (human) interview, or rejects
```

The AI never makes a final decision — it only produces scores and recommendations that a human reviews at two checkpoints (step 4 and step 7). Every action taken on a candidate (approved, rejected, interview scheduled, flagged for suspicious behavior during the AI interview) is written to an audit log.

## Major components (non-technical summary)

- **The website you see** is built with Next.js, a modern web framework, and is what visitors' and candidates' browsers load directly.
- **A separate backend service** (built in Python) does the actual work of storing recruitment data, running the AI screening, and running the AI voice interviews. The website talks to this backend behind the scenes.
- **Two databases exist**: the Python backend's own database (the primary store for jobs, applications, interviews, HR accounts), and a Supabase (cloud Postgres) database that the website falls back to for job listings and applications if the backend is temporarily unreachable. See [02-data-model-and-storage.md](02-data-model-and-storage.md) for why there are two, and what that implies.
- **AI providers**: Azure OpenAI (GPT-4o) powers CV screening and the voice interview; Anthropic's Claude (with Groq as a fallback) generates the AI Readiness Assessment reports. These are different AI systems for different features.
- **Email** is sent through Resend (recruitment notifications, reports) and EmailJS (marketing lead notifications on the public site).

## What to know before relying on this system

A full, itemized list of verified gaps is in [06-security-and-known-gaps.md](06-security-and-known-gaps.md), but the two most important for decision-makers:

- **The AI Readiness Assessment leads dashboard (`/admin/assessments`) has no login or access control at all.** Anyone who finds the URL can view, export, or delete the captured leads.
- **Some recruitment data-entry paths bypass authentication** when the Python backend is unreachable, because the website's fallback path writes straight to Supabase without checking who's asking.

Neither of these affects candidates' CVs being screened incorrectly or interviews being scored unfairly — they are access-control gaps in administrative surfaces, not flaws in the AI logic itself.
