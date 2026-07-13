# TechSpecialist Limited — System Documentation

This is the reference documentation for the TechSpecialist Limited web application: the public marketing site, the AI-powered recruitment platform, and the AI Readiness Assessment lead-generation tool. It exists so that anyone — a new engineer, a future vendor, or a non-technical stakeholder — can understand what the system does, how it's built, where data lives, and how it's configured, without having to reverse-engineer it from the code.

**Audience:** Written in two layers. Each document opens with a plain-language summary for executives/non-technical readers, then goes into full technical depth for engineers. Read the summaries for the big picture; read the full documents when you need to build, debug, or hand this system off.

**Last verified against codebase:** 2026-07-13. This documentation describes what the code actually does, not what it was intended to do — including gaps and inconsistencies found along the way. If the code changes, this documentation will drift; treat it as a snapshot, and re-verify anything security- or data-critical before relying on it.

## Contents

| Doc | Covers |
|---|---|
| [00-executive-overview.md](00-executive-overview.md) | What the system is, who uses it, and the major components — no jargon. |
| [01-architecture.md](01-architecture.md) | How the two applications (Next.js frontend, Python backend) fit together, request flow, environments. |
| [02-data-model-and-storage.md](02-data-model-and-storage.md) | Every database table and storage location, what's stored where and why. |
| [03-configuration-and-integrations.md](03-configuration-and-integrations.md) | Every environment variable, every third-party service, what each is for. |
| [04-features/](04-features/) | End-to-end walkthroughs of each major feature, one file per feature. |
| [05-api-reference.md](05-api-reference.md) | Every API route in both the frontend and backend, grouped by area. |
| [06-security-and-known-gaps.md](06-security-and-known-gaps.md) | How auth actually works, and specific, verified gaps worth knowing about. |
| [07-deployment-and-operations.md](07-deployment-and-operations.md) | How to run it locally, how it's deployed, and known operational debt. |

## The system in one paragraph

TechSpecialist Limited's site is actually **two applications working together**: a Next.js 15 frontend (marketing pages, careers board, an HR back-office, an AI-readiness quiz, and a leads admin panel) and a separate Python/FastAPI backend that owns the recruitment data and runs the AI screening and AI voice-interview logic. The frontend talks to the backend over HTTP/WebSocket, and falls back to writing directly to Supabase for a couple of flows if the backend is unreachable. See [01-architecture.md](01-architecture.md) for the full picture.
