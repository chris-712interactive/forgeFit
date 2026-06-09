# forgeFit Architecture

> Developer reference. Authoritative plan: [BIBLE.md](./BIBLE.md) · Build log: [PROGRESS.md](./PROGRESS.md)

## Overview

forgeFit is a **mobile-first Next.js PWA** in a **Turborepo monorepo**, backed by **Supabase**, with deterministic fitness logic in shared packages (not LLMs).

```
apps/web          → Next.js 15 UI + API route handlers
packages/ui       → Forge Ember design tokens
packages/evidence-kb → 30 peer-reviewed rules + citations
packages/exercise-db → Seed exercise library + equipment tags
packages/program-engine → Goal splits, volume, nutrition targets
packages/offline-sync   → Dexie workout store + sync client
supabase/         → PostgreSQL migrations + RLS
```

## Package Boundaries

| Package | Responsibility | Phase |
|---------|----------------|-------|
| `@forgefit/ui` | CSS tokens, shared components | 0 |
| `apps/web` auth + onboarding | Supabase Auth, 7-step wizard, bottom nav | 1 |
| `@forgefit/evidence-kb` | Citable fitness/nutrition rules | 0–2 |
| `@forgefit/program-engine` | Goal templates, volume, scheduling | 2 |
| `@forgefit/projection-engine` | Weight/strength forecasts | 5 |
| `@forgefit/exercise-db` | Seed exercises, equipment tags (500+ GIFs in Phase 6) | 2 |
| `@forgefit/nutrition-core` | USDA/OFF diary | 4 |
| `@forgefit/integrations` | OAuth device adapters | 7 |
| `@forgefit/offline-sync` | Dexie sessions/sets + `/api/sync` client | 3 |

## Data Flow

1. User completes onboarding → `profiles` + equipment + goals in Supabase
2. `program-engine` reads `evidence-kb` + profile → `ProgramPlan` JSON stored in `programs`
3. Workout UI writes `exercise_sets` to Dexie offline → syncs to Supabase on reconnect
4. `projection-engine` reads measurement history → `projections` table
5. `coaching` package triggers messages on milestones (Phase 8)

## Auth Flow (Phase 1)

1. User signs up via `/signup` (email or Google OAuth)
2. `handle_new_user` trigger creates `profiles` row
3. Middleware redirects incomplete profiles to `/onboarding`
4. `completeOnboarding` server action saves profile + equipment + generates program
5. User lands on `/home` with week schedule and macro targets

## Program Generation (Phase 2)

1. `generateProgram()` in `@forgefit/program-engine` reads profile + `evidence-kb` rules
2. Equipment inventory filters `@forgefit/exercise-db` picks per movement pattern
3. Goal-based weekly split scaled by sessions/week and minutes/session
4. Nutrition targets (Mifflin-St Jeor + protein/fat/carbs from matched rules)
5. `ProgramPlan` JSON stored in `programs.plan` with `appliedRuleIds` for traceability
6. `ensureActiveProgram()` auto-generates on first `/home` visit if none exists

## Workout Tracking (Phase 3)

1. User starts a session from `/workout` → `startWorkoutSession()` writes to Dexie (IndexedDB)
2. Active workout at `/workout/[clientId]` logs sets/reps/RIR per exercise
3. Rest timer auto-starts after each completed set (program `restSeconds`)
4. `SyncManager` in app layout calls `syncWorkoutData()` on load and `online` event
5. `POST /api/sync` upserts `workout_sessions` + `exercise_sets` by `client_id`
6. Serwist service worker at `/serwist/sw.js` precaches shell + workout routes

## API Surface

| Route | Purpose | Phase |
|-------|---------|-------|
| `/auth/callback` | OAuth code exchange | 1 |
| Server action `completeOnboarding` | Save onboarding | 1 |
| `/api/sync` | Offline batch upload | 3 |
| `/api/programs/generate` | Create program from profile | 2 |
| `/api/nutrition/search` | Food lookup | 4 |
| `/api/integrations/*` | OAuth callbacks | 7 |

## Security

- Supabase Row Level Security on all user tables
- OAuth tokens encrypted at rest
- No program logic in LLM prompts

## Documentation Sync

Every change must update [PROGRESS.md](./PROGRESS.md). See `.cursor/rules/documentation-sync.mdc`.
