# forgeFit

Evidence-based fitness and nutrition — mobile-first web app that works offline in the gym.

## Features

**Live now:**
- Email + Google sign up / sign in
- 7-step onboarding (goal, experience, measurements, equipment, recovery, schedule, motivation)
- **Personalized programs** — evidence-based plans for fat loss, bodybuilding, powerlifting, strength, recomposition
- **Offline workouts** — log sets, reps, and RIR in the gym; syncs when back online
- **Workout music** — curated Spotify vibe playlists + optional OAuth playback controls (all tiers; Spotify Premium for in-app controls)
- **Nutrition diary** — USDA + Open Food Facts, restaurant quick-log (Pro+), macro tracking vs program targets
- **Progress tracking** — 30/90-day projections (Pro), strength/volume analytics, caliper BF%, progress photos
- **Exercise library** — 800+ demos, muscle heatmaps, equipment swaps (library + in-session **Equipment busy?** during workouts)
- **Stripe billing** — Free, Pro ($8.99/mo), Pro+ ($14.99/mo)
- **Fitbit / Google Health sync** (Pro+) — activity, sleep, recovery, workout intensity correlation
- **Community** (Pro) — opt-in bucket leaderboards, rivals, follows, win feed, in-app notifications
- **Coaching** (Pro+) — pre-workout hype, PR celebration modal

**Coming soon:**
- Withings weight sync, Strava cardio sync (Pro+)

See [docs/BIBLE.md](./docs/BIBLE.md) and [docs/community-expansion-plan.md](./docs/community-expansion-plan.md) for the full roadmap.

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
| `packages/exercise-db` | 873-exercise catalog + substitution engine |
| `packages/program-engine` | Program + nutrition generator |
| `packages/offline-sync` | Dexie offline workout store + sync |
| `packages/nutrition-core` | USDA/OFF food search + macro helpers |
| `packages/projection-engine` | Caliper BF% + weight projections |
| `packages/coaching` | Pre-workout hype + PR celebration copy |
| `packages/integrations` | Fitbit / Google Health, Withings, Strava |
| `docs/` | Bible, progress log, architecture, tier gates |

## Environment

Copy `.env.example` to `apps/web/.env.local` and follow [docs/supabase-setup.md](./docs/supabase-setup.md).

## Documentation

- **[BIBLE.md](./docs/BIBLE.md)** — authoritative build plan
- **[PROGRESS.md](./docs/PROGRESS.md)** — AI session handoff log (updated every change)
- **[TIER-GATES.md](./docs/TIER-GATES.md)** — Free / Pro / Pro+ feature matrix
- **[community-expansion-plan.md](./docs/community-expansion-plan.md)** — community roadmap
- **[fitbit-expansion-plan.md](./docs/fitbit-expansion-plan.md)** — device sync roadmap
- **[spotify-integration-plan.md](./docs/spotify-integration-plan.md)** — workout music roadmap
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
