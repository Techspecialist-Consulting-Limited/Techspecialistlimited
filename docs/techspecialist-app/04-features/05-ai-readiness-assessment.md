# AI Readiness Assessment (Lead Magnet)

## What it does

A public, self-serve quiz at `/ai-readiness-assessment` that scores a visitor's organization on "AI readiness" across several pillars, shows them results, and offers to email them a full PDF report — capturing their email as a marketing lead in the process. This feature is **entirely independent of the recruitment platform** — different AI provider, different data, no shared tables.

## Walkthrough

1. `src/app/ai-readiness-assessment/page.tsx` runs a client-side phase state machine: `landing → questions → results`, persisting progress to `localStorage['ts-ai-assessment']` so a visitor can resume if they navigate away.
2. `AssessmentLanding.tsx` — pillar selection. `AssessmentQuestions.tsx` (with `AssessmentStepper.tsx`/`AssessmentProgress.tsx`) — question flow, driven by question data in `src/data/assessment`. `AssessmentResults.tsx` — computes and displays the score.
3. On reaching results, `sendAssessmentLeadEmail()` (`src/lib/emailjs.ts`) fires a client-side EmailJS notification, and the results are posted to `POST /api/assessment` → proxied to backend `POST /api/ai-readiness/submit`, which stores an `AiReadinessAssessment` row.
4. If the visitor requests the full report, `POST /api/assessment/send-report` runs:
   - `generateAIReport()` (`src/lib/ai-report.ts`) — calls Anthropic Claude (`claude-sonnet-4-6`, strict JSON-schema output) to write the report content; falls back to Groq (`llama-3.3-70b-versatile`) if Anthropic isn't configured; returns `null` if neither is.
   - `ReportDocument` (`src/lib/pdf-report.tsx`, built with `@react-pdf/renderer`) renders that content into a formatted PDF (executive summary, priority gaps, pillar analysis, action plan, success metrics, branded footer).
   - The PDF is emailed via Resend from `reports@techspecialistlimited.com`.
   - This work is deferred with Next.js's `after()` so the visitor's HTTP request returns immediately and the slow AI+PDF+email work happens after the response.

## Where to make changes

| Change | File |
|---|---|
| Quiz questions/pillars | `src/data/assessment` |
| Scoring logic | `AssessmentResults.tsx` |
| Report content/prompt | `src/lib/ai-report.ts` (`buildPrompt`) |
| PDF layout/branding | `src/lib/pdf-report.tsx` |
| Lead storage | `backend/app/routers/ai_readiness.py` |

## Things worth knowing

- This is the only feature in the codebase that calls Anthropic or Groq — everything else AI-related (screening, interviews) goes through Azure OpenAI.
- If neither `ANTHROPIC_API_KEY` nor `GROQ_API_KEY` is configured, report generation silently returns `null` — confirm the request-flow handles that gracefully (i.e. doesn't send a broken email) before assuming this path always works.
