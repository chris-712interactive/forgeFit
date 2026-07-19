# ForgeRep Tier Gates

> **Authoritative feature matrix** for Free, Pro, and Pro+.
> Code gates live in `apps/web/src/lib/billing/gates.ts` — keep in sync with this doc.

**Last updated:** 2026-07-19

---

## Tier positioning

| Tier | Price | Pitch |
|------|-------|-------|
| **Free** | $0 | Full training loop — programs, logging, nutrition, 30-day projections |
| **Pro** | $8.99/mo · $69.99/yr | Long-horizon progress intelligence + custom workouts + community |
| **Pro+** | $14.99/mo · $119.99/yr | Wearable sync, restaurant quick-log, personalized coaching copy |

Pro+ includes **all Pro features**. Upgrade path: Free → Pro → Pro+.

---

## Feature matrix

### Core training (always free)

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| Evidence-based program generation | ✓ | ✓ | ✓ |
| Offline workout logging & sync | ✓ | ✓ | ✓ |
| RIR load progression & 1RM prescription / test mode | ✓ | ✓ | ✓ |
| Deload weeks & travel mode | ✓ | ✓ | ✓ |
| Nutrition diary (curated whole-foods + barcode OFF) | ✓ | ✓ | ✓ |
| Body measurements & caliper BF% | ✓ | ✓ | ✓ |
| Exercise library, demos, substitutions | ✓ | ✓ | ✓ |
| Workout history (view & log) | ✓ | ✓ | ✓ |
| Workout music — Spotify vibe deep links | ✓ | ✓ | ✓ |
| Workout music — Spotify connect + in-session controls | ✓ | ✓ | ✓ |
| Templated encouragement (home banner) | ✓ | ✓ | ✓ |
| In-session PR toast (lightweight) | ✓ | ✓ | ✓ |
| Experience promotion & consistency nudges | ✓ | ✓ | ✓ |

### Projections & forecasting

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| 30-day weight projection | ✓ | ✓ | ✓ |
| 90-day weight projection | — | ✓ | ✓ |
| Confidence bands on projections | — | ✓ | ✓ |
| Goal date ("at this pace, hit X by…") | — | ✓ | ✓ |
| Waist / strength projection overlays | — | ✓ | ✓ |

### Analytics & history

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| Chart & analytics history window | 90 days | Unlimited | Unlimited |
| Strength progression charts (per lift) | — | ✓ | ✓ |
| PR history & badges (templated) | — | ✓ | ✓ |
| Volume & training-load trends | — | ✓ | ✓ |
| Nutrition adherence dashboard (7/30/90d) | — | ✓ | ✓ |
| Adaptive TDEE from intake + weight logs | — | ✓ | ✓ |
| Rule-based trend insights | — | ✓ | ✓ |
| CSV data export | — | ✓ | ✓ |
| Custom workouts (build, log, templates) | — | ✓ | ✓ |
| Workout CSV import (native ForgeRep format) | — | ✓ | ✓ |
| Progress photo timeline | — | ✓ | ✓ |

### Community & competition (Pro)

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| Community preview (bucket stats before opt-in) | — | ✓ | ✓ |
| Opt-in leaderboards & habit score | — | ✓ | ✓ |
| Community win feed & cheers | — | ✓ | ✓ |
| Rank delta, weekly recap, `/community` tab | — | ✓ | ✓ |
| Weekly rival, follow/friends board | — | ✓ | ✓ |
| In-app community notifications | — | ✓ | ✓ |

### Integrations & automation (Pro+)

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| Withings weight sync | — | — | QA / coming soon |
| Fitbit / Google Health sync | — | — | ✓ |
| Strava activity sync | — | — | Coming soon |
| Restaurant quick-log (curated chains) | — | — | ✓ |
| Saved meals (My Meals) | — | — | ✓ |
| Full restaurant menu API search | — | — | Planned |

### Coaching (Pro+)

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| Personalized coaching copy (pre-workout hype) | — | — | ✓ |
| PR celebration modal (`gradient-forge-celebrate`) | — | — | ✓ |

---

## Implementation gates

Use `hasFeature(snapshot, feature)` from `@/lib/billing/gates` (includes tier + admin flag overrides on `SubscriptionSnapshot.adminFeatureFlags`).

### Admin feature flag overrides

Set per user in `/admin/users/[id]` → Feature flags. Loaded with `getSubscriptionForUser()` and honored by `hasFeature()`.

| Flag key | Grants gate | Notes |
|----------|-------------|-------|
| `beta_integrations` | `device_integrations` | Early wearable access below Pro+ |
| `early_ai_coach` | `ai_motivation` | Personalized coaching copy preview below Pro+ |
| `internal_tester` | — | QA marker only (no gate override yet) |

| Gate key | Minimum tier | UI surface (planned) |
|----------|--------------|----------------------|
| `projection_90d` | Pro | Progress tab — projection chart horizon |
| `projection_confidence_bands` | Pro | Progress tab — shaded band |
| `projection_goal_date` | Pro | Progress tab — goal date callout |
| `strength_analytics` | Pro | Progress or Home — lift charts |
| `pr_history` | Pro | Workout / Profile — PR log |
| `volume_analytics` | Pro | Home / Progress — volume by muscle |
| `nutrition_adherence` | Pro | Nutrition tab — adherence card |
| `tdee_adaptive` | Pro | Nutrition tab — personalized TDEE from logs |
| `unlimited_history` | Pro | All charts — drop 90-day truncation |
| `data_export` | Pro | Profile — export button |
| `custom_workouts` | Pro | Workout hub — custom builder, templates |
| `workout_import` | Pro | Custom builder — CSV import |
| `progress_photos` | Pro | Progress tab — photo timeline |
| `rule_based_insights` | Pro | Home / Progress — insight cards |
| `device_integrations` | Pro+ | Profile — Integrations hub; workout device intensity + readiness |
| `restaurant_search` | Pro+ | Nutrition — eating out quick-log |
| `saved_meals` | Pro+ | Nutrition — My Meals library |
| `gamification` | Pro | Profile opt-in, Home community, `/community` tab (hidden for Free), rivals, notifications |
| `ai_motivation` | Pro+ | Pre-workout personalized coaching copy |
| `pr_celebration` | Pro+ | Workout — celebration modal |

### Free-tier limits (constants)

| Constant | Value | Applies to |
|----------|-------|------------|
| `FREE_PROJECTION_HORIZON_DAYS` | 30 | Projection engine output |
| `FREE_ANALYTICS_HISTORY_DAYS` | 90 | Chart queries, trend windows |

Logging itself is **never** capped — only analytics views and projection horizon.

---

## Stripe mapping

| Product | Monthly price ID env | Annual price ID env | `subscription_tier` |
|---------|---------------------|---------------------|---------------------|
| ForgeRep Pro | `STRIPE_PRO_PRICE_ID_MONTHLY` | `STRIPE_PRO_PRICE_ID_ANNUAL` | `pro` |
| ForgeRep Pro+ | `STRIPE_PRO_PLUS_PRICE_ID_MONTHLY` | `STRIPE_PRO_PLUS_PRICE_ID_ANNUAL` | `pro_plus` |

Webhook `syncSubscriptionToProfile` resolves tier from the subscription's active price ID.

Also handles **`checkout.session.completed`** (reliable backup when subscription metadata is on the session).

Checkout success redirect calls **`POST /api/stripe/sync`** to pull the active subscription immediately (covers webhook delays / misconfigured endpoints).

Checkout accepts `{ tier: "pro" | "pro_plus", interval: "monthly" | "annual" }`.

### Legacy env vars

`STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_ANNUAL` map to **Pro** if the new `STRIPE_PRO_*` vars are unset (backward compatible).

---

## Upgrade & downgrade rules

- **Free → Pro / Pro+:** Stripe Checkout; webhook sets tier on `active` or `trialing`.
- **Pro ↔ Pro+:** `POST /api/stripe/subscription/change` updates the existing Stripe subscription (no second subscription).
- **Return to Free:** `POST /api/stripe/subscription/cancel` sets `cancel_at_period_end` (access until period end) or immediate cancel.
- **Resume cancel:** `POST /api/stripe/subscription/resume` clears `cancel_at_period_end`.
- **Payment method / invoices:** `POST /api/stripe/portal` → Stripe Customer Portal.
- **Cancel (webhook):** `customer.subscription.deleted` → tier `free`, status `canceled`.
- **Pro+ subscriber** always passes Pro gates (`hasProAccess` is true for both `pro` and `pro_plus`).

---

## Phase ownership

| Phase | Tier scope |
|-------|------------|
| Phase 7 | Stripe billing, Pro gates (projections, analytics), Pro+ integrations |
| Phase 8 | Pro — community/gamification; Pro+ — AI motivation, PR celebration |

Pro analytics UI can ship incrementally; gates should land before or with each surface.

---

## Operational margins

See [ADR 001 — Two-Tier Pricing & Operational Margins](./ADRs/001-tier-pricing-margins.md).

| Tier / plan | Gross margin (est.) | Notes |
|-------------|---------------------|-------|
| Pro annual | **~94%** | No paid APIs; single Stripe charge |
| Pro monthly | **~92%** | Higher Stripe fee (12 charges/yr) |
| Pro+ annual | **~82–87%** | Device sync + AI variable cost (restaurant MVP is $0) |

The 35% Pro annual discount is a **retention trade**, not a margin problem — annual billing saves ~$4.40/user/yr in Stripe fees vs monthly.

---

## Phase 7 implementation plan

| Step | Status | Scope |
|------|--------|-------|
| 1. Tier matrix + billing lib | ✅ Done | `gates.ts`, Stripe checkout/webhook |
| 2. DB migrations | ✅ Done (production) | All migrations applied via `supabase db push` |
| 3. Stripe Dashboard products | ✅ Done (production) | Pro / Pro+ prices + webhook → `forge-rep.com` |
| 4. Profile upgrade UI | ✅ Done | `subscription-setting.tsx` |
| 5. Progress projection gates | ✅ Done | 30d/90d horizon, confidence bands, 90d history cap |
| 6. Export gate (Pro) | ✅ Done | `/api/account/export` + Profile |
| 7. Strength/volume/adherence analytics UI | ✅ Done | Progress, Nutrition, Home insights |
| 8. Progress photos UI | ✅ Done | `progress_photos` migration + timeline |
| 9. Pro+ integrations | ⏳ Partial | Fitbit + Withings live; Strava coming soon |
| 10. Phase 8 features | ✅ Done | Pro community; Pro+ coaching hype + PR celebration |
