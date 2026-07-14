# forgeFit Bible — Comprehensive MVP Build Plan

> **Authoritative source of truth** for architecture, phases, features, and design.
> Read this before any build session. When the Bible and code disagree, update both in the same change.

**Last updated:** 2026-07-14 · **Current phase:** Phase 11 in progress; Phase 12 planned (PWA timer background)

---

## Current State

[forgeFit](https://github.com/chris-712interactive/forgeFit) is a greenfield project being built per this document with **AI-agent-friendly boundaries**: each phase has explicit file paths, schemas, acceptance criteria, and dependencies.

---

## Recommended Tech Stack

| Layer | Choice | Why (budget + margins) |
|-------|--------|------------------------|
| **Frontend** | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | Mobile-first SSR/SSG, excellent PWA support, large AI training corpus |
| **PWA / Offline** | Serwist (Workbox successor) + Dexie.js (IndexedDB) | Free, battle-tested offline sync pattern for gym use |
| **Backend API** | Next.js Route Handlers + Supabase Edge Functions (only when needed) | Single deploy surface; no separate API server cost at MVP |
| **Database** | Supabase PostgreSQL + Row Level Security | Free tier → $25/mo Pro; auth, realtime, storage included |
| **Auth** | Supabase Auth (email, Google, Apple) | Free; Apple Sign-In required for iOS users |
| **File Storage** | Supabase Storage | Progress photos, cached exercise GIFs |
| **Job Queue** | Inngest (free tier) or Supabase cron | Webhook processing, sync jobs, projection recalculation |
| **Charts** | Recharts or Tremor | Projections, measurement trends |
| **Muscle Maps** | body-highlighter or body-muscles | Free, 70+ muscles, intensity heatmaps |
| **Exercise GIFs** | Self-hosted open GIF dataset + optional WorkoutX API ($0–25/mo) at scale | Avoid $499 RapidAPI lock-in at launch |
| **Nutrition DB** | Curated forgeFit whole-foods library (in-repo) + Pro+ restaurant quick-log | Replaced USDA/OFF search (2026-06-19); $0 operating cost |
| **Wearable Integrations** | Direct OAuth for Withings, Fitbit, Strava → Terra API at ~1,000+ paying users | Keeps MVP infra under ~$50/mo |
| **AI Coaching Copy** | Claude Haiku / GPT-4o-mini via structured prompts | ~$0.01–0.05/user/month for hype messages only; **never** for program logic |
| **Hosting** | Vercel (Hobby → Pro $20/mo) | Zero-config Next.js deploy |
| **Monorepo** | Turborepo + pnpm workspaces | Clean package boundaries for AI agents |

**Estimated MVP operating cost (0–500 users):** ~$25–50/mo. **At 1,000 paying users ($12/mo):** ~$12K MRR vs ~$800/mo infra.

---

## Design System — Color Scheme: "Forge Ember"

Ties the **forge** brand (heat, transformation, strength) to **encouragement and excitement to start**, not intimidation.

### Design Principles

- **Warm over cold** — oranges and ambers feel energetic and inviting
- **Bright moments, calm base** — saturated accents on neutral backgrounds
- **Dark-first for gym use** — OLED-friendly; optional light mode for onboarding
- **Never shame with color** — no aggressive red for missed workouts

### Core Palette

| Token | Hex | Role |
|-------|-----|------|
| `forge-ember` | `#FF6B35` | Primary CTA, active nav |
| `forge-glow` | `#FF8C42` | Hover states |
| `forge-gold` | `#FBBF24` | Achievements, PRs, streaks |
| `forge-coral` | `#FF4D6D` | Celebrations, hype messages |
| `forge-steel` | `#38BDF8` | Secondary links, recovery blocks |
| `forge-success` | `#22C55E` | Completed sets, sync success |
| `forge-surface` | `#1C1917` | Dark mode background |
| `forge-surface-raised` | `#292524` | Cards, bottom sheets |
| `forge-cream` | `#FFFBF7` | Light mode background |
| `forge-text` | `#FAFAF9` | Primary text on dark |
| `forge-muted` | `#A8A29E` | Secondary labels |

### Typography

- **Headlines:** Plus Jakarta Sans
- **Body / data:** Inter

**AI build rule:** Never hardcode hex in components — use `bg-forge-ember`, `text-forge-gold`, or CSS variables from `packages/ui`.

See [DESIGN.md](./DESIGN.md) for full semantic mapping.

---

## Architecture Overview

```
Mobile PWA (Next.js + Serwist + Dexie)
    ↓
Next.js API (Route Handlers + Sync + Coaching)
    ↓
Core Packages (evidence-kb, program-engine, projection-engine)
    ↓
Supabase (PostgreSQL, Auth, Storage, Realtime)
    ↓
External APIs (Withings, Fitbit, Strava — Pro+; paid restaurant API deferred)
```

---

## Repository Structure

```
forgeFit/
├── apps/web/                   # Next.js PWA
├── packages/
│   ├── evidence-kb/            # Peer-reviewed rules + citations (YAML)
│   ├── program-engine/         # Deterministic plan generator
│   ├── projection-engine/      # Trajectory forecasting
│   ├── exercise-db/            # Exercises, equipment, muscle mappings
│   ├── nutrition-core/         # USDA/OFF food search + diary logic
│   ├── projection-engine/      # Caliper BF% + weight projections
│   ├── integrations/           # OAuth adapters
│   ├── offline-sync/           # Dexie schema + conflict resolution
│   └── ui/                     # Shared components + Forge Ember tokens
├── docs/
│   ├── BIBLE.md                # THIS FILE — authoritative plan
│   ├── PROGRESS.md             # AI session handoff log (updated every change)
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── phases/                 # Per-phase acceptance criteria
│   └── ADRs/
├── supabase/migrations/
└── turbo.json
```

---

## Evidence Knowledge Base (Requirement 1)

Versioned, citable rule engine in `packages/evidence-kb/`. Program logic is **never** LLM-generated.

### Core Rules (seed first)

| Domain | Rule |
|--------|------|
| Fat loss rate | 0.5–1.0% body weight/week |
| Protein (general) | 1.6–2.4 g/kg/day during deficit; ≥1.3 g/kg overweight |
| Protein (athletes cutting) | 2.2–3.0 g/kg/day, 3–6 meals |
| Exercise + deficit | RT preserves FFM (SMD 0.40), increases fat loss |
| Hypertrophy volume | ~10–20 hard sets/muscle/week; diminishing returns above |
| Recovery | Sleep 7–9h; deload every 4–8 weeks |
| Functional compounds | Bodybuilding: ≥2 multi-joint patterns/session; strength goals: prioritize free-weight compounds + carries |

---

## Database Schema (Core Tables)

- `profiles`, `body_measurements`, `caliper_measurements`
- `equipment_inventory`, `recovery_equipment`
- `programs`, `workout_sessions`, `exercise_sets`, `workout_schedule_overrides`
- `nutrition_logs`, `integrations`, `projections`
- `achievements`, `leaderboard_entries`, `coaching_messages`

---

## Feature Mapping (Requirements 2–16)

1. **Research-backed strategies** — evidence-kb + program-engine
2. **Mobile PWA + offline** — Serwist + Dexie
3. **Beginner → advanced** — experience multipliers + adherence-based promotion (regenerates program on level-up)
4. **All goal types** — fat_loss, bodybuilding, powerlifting, general_strength, recomposition, **sport_performance**, **functional_conditioning**
5. **Body measurements + calipers** — onboarding + Jackson-Pollock
6. **Calorie tracking** — USDA/OFF free; Pro+ restaurant quick-log + saved meals
7. **Sets/reps tracking** — active workout UI, offline-first, RIR autoregulated load progression
8. **Measurement trends + integrations** — charts; Withings/Fitbit/Strava Pro
9. **Exercise animations + muscle maps** — GIFs + body-highlighter
10. **Equipment-aware plans** — filter + substitution engine
11. **Progress projections** — projection-engine, Recharts
12. **Recovery equipment** — mobility blocks in plans
13. **Time-budget scheduling** — sessions/week × minutes/session scaling
14. **Fitness tech integrations** — integration hub + recommendations
15. **Motivational UX** — coaching package, hype tone
16. **Gamification** — opt-in leaderboards, habit-based scoring, rivals, follows (Pro). See [community-expansion-plan.md](./community-expansion-plan.md).
17. **Workout music** — Spotify vibe deep links + OAuth playback control (Phase A & B shipped). All tiers; Spotify Premium for in-app controls. See [spotify-integration-plan.md](./spotify-integration-plan.md).

---

## Freemium Tiers

Three tiers. Full gate matrix: [docs/TIER-GATES.md](./TIER-GATES.md).

| | **Free** | **Pro** ($8.99/mo · $69.99/yr) | **Pro+** ($14.99/mo · $119.99/yr) |
|---|:---:|:---:|:---:|
| Programs, tracking, offline, nutrition (USDA/OFF), GIFs, equipment | ✓ | ✓ | ✓ |
| Projections | 30-day | 90-day + confidence bands + goal date | ✓ |
| Analytics history | 90 days | Unlimited | ✓ |
| Strength / volume / nutrition adherence analytics | — | ✓ | ✓ |
| Export, progress photos, rule-based insights | — | ✓ | ✓ |
| Custom workouts + native CSV import | — | ✓ | ✓ |
| Device integrations (Withings, Fitbit, Strava) | — | — | ✓ |
| Restaurant quick-log & saved meals | — | — | ✓ |
| Full restaurant menu search (paid API) | — | — | Planned |
| Motivation | Templated | Templated + insights | AI-personalized |
| Community (leaderboards, rivals, win feed) | — | Full (opt-in) | ✓ |
| PR celebrations | Templated badges | Templated badges | Celebration modal UX |

Pro+ includes all Pro features. Code gates: `apps/web/src/lib/billing/gates.ts`.

---

## Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Scaffold, design tokens, docs, CI | Complete |
| 1 | Auth + onboarding | Complete |
| 2 | Evidence engine + program generation | Complete |
| 3 | Workout tracking + offline PWA | Complete |
| 4 | Nutrition diary | Complete |
| 5 | Measurements + projections | Complete |
| 6 | Exercise library UI | Complete |
| 7 | Pro integrations (Stripe, OAuth) | Partial — billing + DB on prod; Withings QA + Strava launch |
| 8 | Motivation + gamification + community (Phases 1–2) | Complete |
| 9 | Youth & sport performance (onboarding, age policy, US catalog ≥22 sports, engine, teen community) | Complete | Community roadmap: [docs/community-expansion-plan.md](./community-expansion-plan.md).
| 10 | Functional conditioning (hybrid strength + circuits, AMRAP, finishers, landing) | Complete | [docs/phases/10-functional-conditioning.md](./phases/10-functional-conditioning.md)
| 11 | Custom workouts (Pro builder, templates, CSV import/export) | In progress | [docs/phases/11-custom-workouts.md](./phases/11-custom-workouts.md)
| 12 | PWA timer accuracy when minimized / backgrounded | Planned | [docs/phases/12-pwa-timer-background.md](./phases/12-pwa-timer-background.md)
| — | **Admin console** (operator tools) | Complete (Phases A–D) | [docs/phases/admin-console.md](./phases/admin-console.md) · [ADR 002](./ADRs/002-forgerep-admin-console.md)

---

## Documentation Sync (mandatory)

**Every meaningful change** must update docs in the same session. Enforced by `.cursor/rules/documentation-sync.mdc`.

| Audience | File | When to update |
|----------|------|----------------|
| AI handoff | `docs/PROGRESS.md` | Every session — what was done, what's next, files touched |
| Build authority | `docs/BIBLE.md` | Architecture, phases, features, design, tiers change |
| Developers | `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/phases/` | Matching code changes |
| Customers / new devs | `README.md`, `.env.example` | User-visible features or setup steps change |

Never leave code and docs out of sync.

## AI Agent Instructions

1. Read `docs/BIBLE.md` and `docs/PROGRESS.md` before writing code
2. Read the active phase file in `docs/phases/`
3. Never put program logic in LLM prompts
4. Every evidence rule needs a citation (DOI/PMID/URL)
5. Mobile-first CSS at 375px; Forge Ember tokens only
6. Offline workout logging is mandatory
7. **After every change:** follow Documentation Sync table above

---

## Success Metrics (MVP Launch)

- Onboarding → first workout in <10 minutes
- Offline workout syncs with 100% integrity
- Program matches equipment + time budget
- Projections render <500ms
- Lighthouse PWA score ≥90 mobile
- Evidence KB cites ≥30 peer-reviewed sources
