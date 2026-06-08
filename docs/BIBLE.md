# forgeFit Bible — Comprehensive MVP Build Plan

> **Authoritative source of truth** for architecture, phases, features, and design.
> Read this before any build session. When the Bible and code disagree, update both in the same change.

**Last updated:** 2026-06-08 · **Current phase:** Phase 0 (Scaffold — nearly complete)

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
| **Nutrition DB** | USDA FoodData Central + Open Food Facts (free, self-hosted cache) | $0 operating cost; restaurant menus deferred to Pro tier via Nutritionix |
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
External APIs (Withings, Fitbit, Terra, Nutritionix — Pro tier)
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

---

## Database Schema (Core Tables)

- `profiles`, `body_measurements`, `caliper_measurements`
- `equipment_inventory`, `recovery_equipment`
- `programs`, `workout_sessions`, `exercise_sets`
- `nutrition_logs`, `integrations`, `projections`
- `achievements`, `leaderboard_entries`, `coaching_messages`

---

## Feature Mapping (Requirements 2–16)

1. **Research-backed strategies** — evidence-kb + program-engine
2. **Mobile PWA + offline** — Serwist + Dexie
3. **Beginner → advanced** — experience level multipliers
4. **All goal types** — fat_loss, bodybuilding, powerlifting, general_strength, recomposition
5. **Body measurements + calipers** — onboarding + Jackson-Pollock
6. **Calorie tracking** — USDA/OFF free; Nutritionix Pro
7. **Sets/reps tracking** — active workout UI, offline-first
8. **Measurement trends + integrations** — charts; Withings/Fitbit/Strava Pro
9. **Exercise animations + muscle maps** — GIFs + body-highlighter
10. **Equipment-aware plans** — filter + substitution engine
11. **Progress projections** — projection-engine, Recharts
12. **Recovery equipment** — mobility blocks in plans
13. **Time-budget scheduling** — sessions/week × minutes/session scaling
14. **Fitness tech integrations** — integration hub + recommendations
15. **Motivational UX** — coaching package, hype tone
16. **Gamification** — opt-in leaderboards, habit-based scoring

---

## Freemium Tiers

| Feature | Free | Pro ($12.99/mo) |
|---------|------|-----------------|
| Programs, tracking, offline, measurements, nutrition (USDA/OFF), GIFs, equipment plans | ✓ | ✓ |
| Motivation | Templated | AI-personalized |
| Projections | 30-day | 90-day + confidence bands |
| Device integrations | — | Withings, Fitbit, Strava |
| Restaurant nutrition | — | Nutritionix |
| Gamification | — | ✓ |

---

## Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Scaffold, design tokens, docs, CI | In progress |
| 1 | Auth + onboarding | Pending |
| 2 | Evidence engine + program generation | Pending |
| 3 | Workout tracking + offline PWA | Pending |
| 4 | Nutrition diary | Pending |
| 5 | Measurements + projections | Pending |
| 6 | Exercise library UI | Pending |
| 7 | Pro integrations (Stripe, OAuth) | Pending |
| 8 | Motivation + gamification | Pending |

See `docs/phases/` for per-phase acceptance criteria.

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
