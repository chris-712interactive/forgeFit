# forgeFit

Evidence-based fitness and nutrition — mobile-first web app that works offline in the gym.

## Features

**Live now (Phase 1–4):**
- Email + Google sign up / sign in
- 7-step onboarding (goal, experience, measurements, equipment, recovery, schedule, motivation)
- Mobile app shell with bottom navigation
- **Personalized programs** — evidence-based plans for fat loss, bodybuilding, powerlifting, strength, recomposition
- **Home dashboard** — weekly workout schedule + macro targets with cited evidence rules
- **Offline workouts** — log sets, reps, and RIR in the gym; syncs when back online
- **Rest timer** — auto-starts between sets with Forge Gold pulse
- **Nutrition diary** — USDA + Open Food Facts search, daily macro tracking vs evidence-based targets

**Coming soon:**
- **Body measurements** — trends and projections
- **Exercise demos** — GIF animations + muscle activation maps
- **Device sync** — Withings, Fitbit, Strava (Pro tier)

See [docs/BIBLE.md](./docs/BIBLE.md) for the full build plan.

## Quick start

```bash
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Monorepo

| Path | Description |
|------|-------------|
| `apps/web` | Next.js 15 PWA |
| `packages/ui` | Forge Ember design tokens |
| `packages/evidence-kb` | 30 peer-reviewed fitness rules |
| `packages/exercise-db` | Seed exercise library |
| `packages/program-engine` | Program + nutrition generator |
| `packages/offline-sync` | Dexie offline workout store + sync |
| `packages/nutrition-core` | USDA/OFF food search + macro helpers |
| `docs/` | Bible, progress log, architecture |

## Environment

Copy `.env.example` to `apps/web/.env.local` and follow [docs/supabase-setup.md](./docs/supabase-setup.md).

## Documentation

- **[BIBLE.md](./docs/BIBLE.md)** — authoritative build plan
- **[PROGRESS.md](./docs/PROGRESS.md)** — AI session handoff log (updated every change)
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — developer reference
- **[DESIGN.md](./docs/DESIGN.md)** — Forge Ember design system

## Scripts

```bash
pnpm dev          # Start web app
pnpm build        # Production build
pnpm typecheck    # TypeScript check all packages
pnpm lint         # ESLint
```

## License

Private — All rights reserved.
