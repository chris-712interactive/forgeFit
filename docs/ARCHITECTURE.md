# forgeFit Architecture

> Developer reference. Authoritative plan: [BIBLE.md](./BIBLE.md) · Build log: [PROGRESS.md](./PROGRESS.md)

## Overview

forgeFit is a **mobile-first Next.js PWA** in a **Turborepo monorepo**, backed by **Supabase**, with deterministic fitness logic in shared packages (not LLMs).

```
apps/web          → Next.js 15 UI + API route handlers
packages/ui       → Forge Ember design tokens
packages/evidence-kb → Peer-reviewed rules + citations
packages/program-engine → (Phase 2) Plan generator
packages/offline-sync   → (Phase 3) Dexie + sync
supabase/         → PostgreSQL migrations + RLS
```

## Package Boundaries

| Package | Responsibility | Phase |
|---------|----------------|-------|
| `@forgefit/ui` | CSS tokens, shared components | 0 |
| `@forgefit/evidence-kb` | Citable fitness/nutrition rules | 0–2 |
| `@forgefit/program-engine` | Goal templates, volume, scheduling | 2 |
| `@forgefit/projection-engine` | Weight/strength forecasts | 5 |
| `@forgefit/exercise-db` | Exercises, GIFs, muscle maps | 6 |
| `@forgefit/nutrition-core` | USDA/OFF diary | 4 |
| `@forgefit/integrations` | OAuth device adapters | 7 |
| `@forgefit/offline-sync` | IndexedDB + conflict resolution | 3 |

## Data Flow

1. User completes onboarding → `profiles` + equipment + goals in Supabase
2. `program-engine` reads `evidence-kb` + profile → `ProgramPlan` JSON stored in `programs`
3. Workout UI writes `exercise_sets` to Dexie offline → syncs to Supabase on reconnect
4. `projection-engine` reads measurement history → `projections` table
5. `coaching` package triggers messages on milestones (Phase 8)

## API Surface (planned)

| Route | Purpose | Phase |
|-------|---------|-------|
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
