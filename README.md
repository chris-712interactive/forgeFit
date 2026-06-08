# forgeFit

Evidence-based fitness and nutrition — mobile-first web app that works offline in the gym.

## Features

**Live now (Phase 1):**
- Email + Google sign up / sign in
- 7-step onboarding (goal, experience, measurements, equipment, recovery, schedule, motivation)
- Mobile app shell with bottom navigation

**Coming soon:**
- **Personalized programs** — fat loss, bodybuilding, powerlifting, strength, recomposition
- **Offline workouts** — log sets and reps with no signal
- **Nutrition tracking** — USDA + Open Food Facts food diary
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
| `packages/evidence-kb` | Peer-reviewed fitness rules |
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
