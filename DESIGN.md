---
name: TechSpecialist HR Portal
description: Restrained, evidence-first recruitment dashboard for HR staff running the hiring pipeline
colors:
  primary: "#4584ed"
  primary-hover: "#2d65c4"
  role-people: "#7c5cff"
  role-time: "#f59e0b"
  role-success: "#22c55e"
  secondary-orange: "#ef6526"
  deep-navy: "#080e1e"
  ink: "#2f2f2f"
  body-text: "#5f6368"
  neutral-bg: "#ffffff"
  neutral-surface: "#f7f9fc"
  neutral-border: "#e5e7eb"
  status-new: "#f59e0b"
  status-screening: "#3b82f6"
  status-approved: "#22c55e"
  status-rejected: "#ef4444"
  status-assessment: "#a855f7"
  status-completed: "#06b6d4"
  dark-ink: "#ffffff"
  dark-body-text: "#9ca3af"
  dark-neutral-bg: "#0b1020"
  dark-neutral-surface: "#1a1f2e"
  dark-neutral-border: "#2d3548"
typography:
  display:
    fontFamily: "'Roboto Slab', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Roboto Slab', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "10.5px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  pill: "100px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "13px 26px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  badge-status:
    rounded: "{rounded.pill}"
    padding: "4px 10px"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
  modal:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.lg}"
    padding: "28px"
---

# Design System: TechSpecialist HR Portal

## 1. Overview

**Creative North Star: "The Briefing Room"**

HR staff open this product dozens of times a day to make real decisions about real people. The system is built like a briefing room, not a showroom: evidence laid out clearly, scored and labeled, ready for a fast and confident call. Nothing here performs for a viewer — every score circle, badge, and panel exists to answer one question ("can I trust this candidate's file enough to act on it right now") as fast as possible.

The palette is a real, named system: Working Blue, People Purple, Time Amber, and Outcome Green, each assigned to a specific kind of content and reused consistently everywhere that content appears — stat card icon chips, quick-action icons, chart series, avatar accents. Color carries real information (a purple icon always means "people," an amber icon always means "pending/time") rather than decoration for its own sake, but there's no rule limiting it to one accent. It still explicitly rejects reading as a generic admin-dashboard template — icon-in-a-circle stat cards are fine when the color is meaningful and consistent, but no borrowed identity, no fabricated metrics (trend deltas, activity feeds) without a real endpoint behind them.

**Key Characteristics:**
- Four named role colors (blue/purple/amber/green), each meaning the same thing everywhere they appear — not a single restrained accent, but not an arbitrary rainbow either
- Heavy, tight-tracked slab-serif display type paired with a plain system sans body — confidence in headings, no-nonsense readability in data
- Evidence-first component design: scores are always shown with their reasoning (strengths/concerns, competency breakdowns), never as a bare number
- Elevation responds to interaction (hover lift + shadow) and to genuine hierarchy (a richer stat-card treatment can justify a resting shadow); not decoration applied uniformly
- Every destructive or blocking action routes through a real modal component; the browser's native `confirm()`/`alert()`/`prompt()` never appear
- Every number on screen is real — sourced from an actual endpoint, never a plausible-looking placeholder

## 2. Colors

**Revision (2026-07-25):** the original version of this system used a single restrained blue accent against near-monochrome neutrals. After a side-by-side comparison against reference screenshots, that direction was reversed in favor of a fuller, named palette — richness now comes from color itself, not just from spacing and type. The status/score semantics below are unchanged; what's new is a set of **role colors** used deliberately for navigation, icon chips, and data visualization.

### Primary
- **Working Blue** (`#4584ed`): the primary/brand color — primary buttons, links, the active nav item, focus rings, and the "jobs" role wherever content is grouped by role color (stat card icon chips, quick-action icon chips, chart series).
- **Working Blue, Pressed** (`#2d65c4`): hover/active state for primary blue surfaces.

### Secondary (role palette)
Four named roles, each reused consistently for the same *kind* of content everywhere it appears — this is a "Full palette" strategy, not a rainbow of one-off choices:
- **Working Blue** (`#4584ed`) — jobs, primary actions, brand.
- **People Purple** (`#7c5cff`) — candidates, applicants, people-related counts and icons.
- **Time Amber** (`#f59e0b`) — anything pending, in-progress, or time-based (also doubles as the "New/Mid-score" status color — this is intentional overlap, not a conflict, since both mean "attention, not yet resolved").
- **Outcome Green** (`#22c55e`) — completion, success, hired (also the "Approved/High-score" status color, for the same reason above).

### Tertiary
- **Signal Orange** (`#ef6526`): the marketing-site brand accent, carried into the product only for the rare two-color gradient pairing (e.g. logo mark) — not used as an interactive or role color inside HR pages.

### Neutral
- **Charcoal Ink** (`#2f2f2f`): all heading and primary text.
- **Slate Body** (`#5f6368`): secondary/body text, labels, meta information. Meets 4.5:1+ against both white and the soft neutral surface.
- **Paper White** (`#ffffff`): the default page and card background.
- **Quiet Surface** (`#f7f9fc`): the one-step-off-white used for section backgrounds, hover states on rows, and to separate a card from its container without a border.
- **Hairline Border** (`#e5e7eb`): all 1px borders and dividers.
- **Deep Navy** (`#080e1e`): the one deliberate dark surface — used for the candidate-facing assessment portal and any full-bleed dark panel, not for HR-portal chrome itself.

### Dark mode (product surfaces only)
- Ink → `#ffffff`, Body → `#9ca3af`, Background → `#0b1020`, Surface → `#1a1f2e`, Border → `#2d3548`. Same role mapping as light mode; only values swap.

### Status & Score Semantics
- **New / Mid-score** — Time Amber (`#f59e0b`)
- **Screening** — Signal Blue (`#3b82f6`, a distinct blue used only for the "screening in progress" state, kept separate from Working Blue so "brand/primary action" and "this specific status" never get visually confused)
- **Approved / High-score / Hired** — Outcome Green (`#22c55e`)
- **Rejected / Low-score** — Red (`#ef4444`)
- **In Assessment** — People Purple (`#a855f7` for status pills specifically — a slightly deeper purple than People Purple's `#7c5cff` role-color use, so status pills stay visually distinct from role icon chips)
- **Completed** — Cyan (`#06b6d4`)

Status/score pills stay tinted (~10% opacity background under the solid color as text/dot) — that part didn't change. What changed is role colors (stat cards, icon chips, chart series) may now appear as fuller, more saturated tinted fills (15–20% opacity) or gradient chips, not just thin accents.

### Named Rules
**The Named Role Rule.** Every role color means the same thing everywhere: blue is always jobs/primary, purple is always people, amber is always pending/time, green is always success/completion. Don't assign a fifth ad-hoc color, and don't swap which role gets which color between pages.

**The Honest Chart Rule.** Any donut, funnel, or trend chart must be backed by a real endpoint. If a reference shows a metric with no real data behind it (a trend percentage, an activity feed), either wire a real one from data that already exists, or omit it — never fabricate a plausible-looking number.

**The Non-Adjacent Pair Rule.** Green (`#22c55e`) and amber (`#f59e0b`) are both load-bearing status colors in this system and can't be dropped, but validated (`dataviz` skill's palette checker) as below the colorblind-safe separation floor next to each other. Whenever both appear in the same donut/pie, order the segments so green and amber are never adjacent (there's always a re-ordering that achieves this in a 4+ segment chart) — on top of, not instead of, direct labels and a legend.

## 3. Typography

**Display Font:** "Roboto Slab" (serif slab), with a ui-sans-serif/system fallback stack
**Body Font:** system sans-serif stack (`ui-sans-serif, system-ui, -apple-system, "Segoe UI"`) — no webfont loaded for body text, by design, for load speed and native-feeling density
**Character:** A heavy, confident slab serif for anything that needs to command attention (page titles, key numbers), paired with an entirely plain, fast-reading system sans for everything else. The contrast is deliberate: gravity where it's earned, total transparency everywhere data needs to be scanned quickly.

Note for implementation: the codebase's `.font-syne` utility class is a legacy name — it resolves to Roboto Slab, not the Syne typeface. Treat it as the display-font utility; do not introduce an actual Syne font family.

### Hierarchy
- **Display** (800, 28px, 1.15 line-height, -0.02em tracking): page titles ("Applicants", candidate names on detail pages).
- **Title** (700, 15–16px, 1.3 line-height, -0.01em tracking): card headers, section titles, modal titles.
- **Body** (400, 12.5–13px, 1.6 line-height): the dominant size across tables, cards, form inputs, descriptions. Cap prose blocks at ~70ch.
- **Label** (700, 10–11px, uppercase, 0.06–0.08em tracking): field labels, status-badge micro-text, section eyebrows inside cards (not page-level marketing eyebrows — see Do's and Don'ts).

### Named Rules
**The Density Rule.** Body copy runs small (12.5–13px) and tight (1.5–1.6 line-height) everywhere data needs to be scanned — tables, score breakdowns, transcript logs. This is a working tool used all day; airy 16px body text belongs on the marketing site, not here.

## 4. Elevation

Mostly flat, with shadow used both as a response to interaction and, now, as a deliberate signal on the highest-priority content (stat cards, hero panels) even at rest — the difference from the original restrained version is that a resting shadow is allowed when it's reinforcing real hierarchy, not applied uniformly to every card on the page.

### Shadow Vocabulary
- **Ambient Small** (`0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)`): resting elevation for secondary cards and media cards.
- **Interactive Medium** (`0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)`): the hover state for cards and list rows — pairs with a 1–4px `translateY` lift.
- **Overlay Large** (`0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)`): modals, dropdowns, and anything rendered above the page content.
- **Role Glow** (`drop-shadow` or soft box-shadow in a role color at 15–20% opacity): resting elevation on the primary content of a page — stat card icon chips, the highest-priority panel — colored to match its role (blue/purple/amber/green). This is the richer, "not everything is flat" exception; use it for content that should visually lead, not everywhere.
- **Score Glow** (`drop-shadow(0 0 6px <status-color at 10% opacity>)`): soft glow behind score-circle rings, colored to match the score's semantic color.

### Named Rules
**The Deliberate Elevation Rule.** Shadow now marks two things: interaction (hover, focus) and genuine content priority (the page's lead stat cards, hero panels). It's still not applied uniformly to every card just to look premium — secondary/tertiary content (list rows, table cells) stays flat until hovered.

## 5. Components

### Buttons
- **Shape:** 6px radius (`--rounded.sm`) — deliberately tighter than the card radius, so buttons read as controls, not containers.
- **Primary:** solid Working Blue, white text, 13px/700, `13px 26px` padding.
- **Hover / Focus:** background steps to Working Blue Pressed, `translateY(-1px)`, a soft blue glow shadow (`0 6px 20px rgba(69,132,237,0.3)`). Focus-visible must show an equivalent visible ring for keyboard users.
- **Secondary / Ghost:** transparent background, 1px hairline border, ink or body-color text; hover shifts border and text to Working Blue. Used for "Cancel," secondary actions, and toolbar buttons (e.g. "+ Add Candidate").
- **Danger:** same shape as primary, solid status-rejected red, used only inside confirm dialogs and destructive actions (never as a default toolbar button color).

### Badges (status pills)
- **Style:** fully rounded (100px), ~10%-opacity tint of the status color as background, solid status color as text, a small 5–6px dot in the same solid color leading the label.
- **Sizes:** sm (10px label, 4×10px padding) for dense table/card contexts; md (12px label, 5×14px padding) for standalone emphasis.
- **State:** one badge per status value; unknown/new statuses fall back to the "pending" (amber, "New") treatment rather than rendering unstyled.

### Cards / Containers
- **Corner Style:** 12–16px radius, larger radius for higher-level containers (modals, page panels) than nested content.
- **Background:** Paper White on Quiet Surface page backgrounds (or the reverse — a white card on a soft-gray page — never white-on-white with only a border to separate them).
- **Shadow Strategy:** flat at rest (hairline border only); Interactive Medium shadow + 1–5px lift on hover for anything clickable.
- **Border:** 1px Hairline Border at rest; on hover, cards that lead to more detail (e.g. applicant cards) tint the border toward Working Blue at ~20% opacity rather than changing its weight.

### Modals (Confirm Dialog / purpose-built)
- **Style:** centered overlay, `rgba(0,0,0,0.5)` scrim with `blur(4px)` backdrop-filter, 16px-radius panel, Overlay Large shadow, `fadeUp` entrance (opacity + `translateY` from below, ~0.2–0.25s ease).
- **Interaction:** Escape key and click-on-scrim both dismiss (cancel), matching the project's standing rule that native `confirm()`/`alert()`/`prompt()` are never used — this is the one and only dialog primitive, or a purpose-built variant of it (e.g. `AddCandidateModal`, `ScheduleInterviewModal`).
- **Danger variant:** confirm button becomes solid status-rejected red instead of Working Blue, used for delete/reject confirmations.

### Score Circle (signature component)
- SVG ring gauge, track in Hairline Border gray, progress arc in the score's semantic color (green ≥75, amber ≥50, red <50), animated `stroke-dashoffset` transition (~1s ease) on mount, bold centered number (800 weight), small "AI Score" or custom label beneath. The Score Glow shadow (above) sits behind the ring. This is the product's most distinctive visual signature — reuse it anywhere a 0–100 evidence-backed score needs a single at-a-glance read (CV screening score, interview score, combined score).

### Navigation
- Persistent left sidebar (icons + labels), logo mark uses a two-color gradient chip (Working Blue → People Purple or → Signal Orange, either reads as intentional). Active nav item is a solid, filled Working Blue pill (not just an 8% tint) with white text — bold enough to find at a glance. Muted icon color at rest, brightening to Ink (not necessarily blue) on hover for inactive items.

## 6. Do's and Don'ts

### Do:
- **Do** use the four named role colors (blue/purple/amber/green) consistently — the same role always gets the same color across every page.
- **Do** pair every score or AI verdict with its reasoning visible nearby (strengths/concerns, competency bars, written recommendation) — a bare number is never sufficient on its own, per PRODUCT.md's "evidence over verdicts" principle.
- **Do** use a resting shadow deliberately on the page's lead content (stat cards, hero panels), and keep secondary content (list rows, table cells) flat until hovered.
- **Do** use the existing Score Circle, StatusBadge, and ConfirmDialog components as the base for any new UI needing those patterns, rather than inventing parallel one-off styles.
- **Do** keep body copy dense (12.5–13px, tight line-height) — this is a working tool used all day, not a marketing page.
- **Do** back every chart, trend, or activity indicator with a real endpoint — wire one if it's cheap and honest, otherwise omit the element entirely.

### Don't:
- **Don't** let this read as a generic admin-dashboard template — icon-in-a-circle stat cards are fine now that color is meaningful, but avoid a stock dashboard-kit identity borrowed wholesale with no distinctive touches (the Score Circle, the pipeline stepper, the evidence-first cards).
- **Don't** use `border-left`/`border-right` as a colored accent stripe on cards or list items.
- **Don't** use gradient text (`background-clip: text` with a gradient) anywhere in the product UI.
- **Don't** use a native `confirm()`, `alert()`, or `prompt()` anywhere — always `ConfirmDialog` or a purpose-built modal.
- **Don't** use emojis anywhere in the product UI (per PRODUCT.md's brand personality) — even where a reference screenshot includes one.
- **Don't** fabricate a metric (trend percentage, activity feed, "team member reviewing") that has no real data behind it, no matter how good it looks in the reference.
- **Don't** ship a dead-end CTA (e.g. "Upgrade to Pro") with no real system behind it.
