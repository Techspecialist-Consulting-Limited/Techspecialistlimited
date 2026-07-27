# Product

## Register

product

## Users

Two primary user groups on this codebase, but this file's default lens is the **product** surface — the AI-powered recruitment platform, specifically its HR portal (`src/app/hr/*`):

- **HR staff / recruiters** (primary audience for this register): post jobs, review AI-screened candidates, run the pipeline through to hire/reject, schedule and score interviews, and check recruitment analytics. They use this daily, at a desk, often switching between it and other tabs (candidate emails, calendars). The job to be done on any given screen is almost always "make a decision about a candidate, quickly and with enough evidence to trust the call." Intended to eventually be offered as a product to other companies, not just used internally — see Design Principles below.
- **Job candidates**: apply via a public careers board, complete an AI CV screen and a live AI voice interview, and can self-check status. This is the site's **brand**-register surface (public-facing, first-impression-driven) and is explicitly out of scope for this file's default register — treat `/careers`, `/apply`, `/assessment/*`, and the public marketing pages as brand register per-task if worked on.

## Product Purpose

An in-house recruitment platform that automates the repetitive early stages of hiring (CV screening, first-round interviewing) with AI, so HR's time goes to judgment and final decisions rather than administration. Success looks like: HR can look at any candidate and immediately trust the AI's evidence enough to act on it, the pipeline view makes "what needs my attention right now" obvious at a glance, and the whole thing reads as a serious, defensible system for making real hiring decisions, not a demo.

## Brand Personality

Confident, polished, evidence-driven. A real, deliberate color palette (not zero-color restraint) signals a premium product. The tone throughout the product (copy, error states, empty states) is calm and direct, never cute or exclamation-heavy. No emojis anywhere in the product UI — richness comes from color and craft, not from tone.

## Anti-references

- Toy/consumer-app energy — this handles real hiring decisions about real people; it should never read as playful or casual. Rich color is fine; cutesy is not.
- Fabricated data presented as real — trend deltas, "team member reviewing" activity, or any metric with no backing endpoint must not appear just because a reference screenshot shows one. Real numbers only, sourced from actual data.
- Dead-end / fake CTAs — no "Upgrade to Pro" or similar upsell unless a real tier system exists to back it.

**Revision note (2026-07-25):** an earlier version of this document rejected the vibrant purple/blue gradient SaaS look as an anti-reference, based on an initial "stay muted and professional" answer. After seeing a restrained first pass next to the reference screenshots side by side, the user reversed that decision and asked for the fuller, richer color language instead. That direction is now current — see Design Principles and `DESIGN.md`'s color strategy. Treat this as a real record of how the decision was made, not just a stale note: if a future redesign again suggests "going muted," surface this history before re-litigating it.

## Design Principles

1. **Evidence over verdicts.** Every AI output (score, recommendation, flag) should be presented with the reasoning behind it visible, not just a number — this is already a core value of the existing screening/interview UI and must carry through any redesign.
2. **Confident premium, through a real palette.** A small set of named, deliberately-assigned colors (not one lone accent) carries the interface — blue, purple, amber, green — each reused consistently for the same meaning everywhere it appears (see `DESIGN.md`). Richness comes from color, gradient icon chips, and polished data visualization, not from restraint.
3. **Built for a real workday.** Dense enough that a recruiter doesn't have to scroll or click through five screens to see pipeline state, but never cluttered — this is a tool used dozens of times a day, not admired once.
4. **One system, not per-page decoration.** Components (cards, badges, buttons, modals) already exist and are reused across HR pages (`src/components/recruitment/`); a redesign should refine that shared system, not fork new one-off styles per page.
5. **No system dialogs, ever.** Standing project rule: never use native `confirm()`/`alert()`/`prompt()` — always a proper custom modal (`ConfirmDialog` or purpose-built).
6. **Never fabricate data.** A reference screenshot showing a trend percentage, an activity feed, or a chart is a structural cue, not license to invent numbers. If there's no real endpoint behind it, either wire one (when cheap and honest, e.g. a count that already exists in the data model) or leave it out.

## Accessibility & Inclusion

Standard WCAG AA baseline: solid contrast ratios (body text ≥4.5:1), full keyboard navigability, visible focus states. No additional accommodations specified beyond good practice.
