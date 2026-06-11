# ForgeFit Tier Gates

> **Authoritative feature matrix** for Free, Pro, and Pro+.
> Code gates live in `apps/web/src/lib/billing/gates.ts` — keep in sync with this doc.

**Last updated:** 2026-06-09

---

## Tier positioning

| Tier | Price | Pitch |
|------|-------|-------|
| **Free** | $0 | Full training loop — programs, logging, nutrition, 30-day projections |
| **Pro** | $8.99/mo · $69.99/yr | Long-horizon progress intelligence |
| **Pro+** | $14.99/mo · $119.99/yr | Automation, integrations, AI coaching, community |

Pro+ includes **all Pro features**. Upgrade path: Free → Pro → Pro+.

---

## Feature matrix

### Core training (always free)

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| Evidence-based program generation | ✓ | ✓ | ✓ |
| Offline workout logging & sync | ✓ | ✓ | ✓ |
| RIR load progression & 1RM prescription | ✓ | ✓ | ✓ |
| Deload weeks & travel mode | ✓ | ✓ | ✓ |
| Nutrition diary (USDA / Open Food Facts) | ✓ | ✓ | ✓ |
| Body measurements & caliper BF% | ✓ | ✓ | ✓ |
| Exercise library, GIFs, substitutions | ✓ | ✓ | ✓ |
| Workout history (view & log) | ✓ | ✓ | ✓ |
| Templated encouragement (home banner) | ✓ | ✓ | ✓ |
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
| Rule-based trend insights | — | ✓ | ✓ |
| CSV data export | — | ✓ | ✓ |
| Progress photo timeline | — | ✓ | ✓ |

### Integrations & automation (Pro+)

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| Withings weight sync | — | — | ✓ |
| Fitbit activity sync | — | — | ✓ |
| Strava activity sync | — | — | ✓ |
| Nutritionix restaurant / chain search | — | — | ✓ |

### Coaching & community (Pro+)

| Feature | Free | Pro | Pro+ |
|---------|:----:|:---:|:----:|
| AI-personalized motivation & coaching copy | — | — | ✓ |
| PR celebration modal (`gradient-forge-celebrate`) | — | — | ✓ |
| Opt-in leaderboards & gamification | — | — | ✓ |
| Community win feed | — | — | ✓ |

---

## Implementation gates

Use `hasTierFeature(tier, feature)` from `@/lib/billing/gates`.

| Gate key | Minimum tier | UI surface (planned) |
|----------|--------------|----------------------|
| `projection_90d` | Pro | Progress tab — projection chart horizon |
| `projection_confidence_bands` | Pro | Progress tab — shaded band |
| `projection_goal_date` | Pro | Progress tab — goal date callout |
| `strength_analytics` | Pro | Progress or Home — lift charts |
| `pr_history` | Pro | Workout / Profile — PR log |
| `volume_analytics` | Pro | Home / Progress — volume by muscle |
| `nutrition_adherence` | Pro | Nutrition tab — adherence card |
| `unlimited_history` | Pro | All charts — drop 90-day truncation |
| `data_export` | Pro | Profile — export button |
| `progress_photos` | Pro | Progress tab — photo timeline |
| `rule_based_insights` | Pro | Home / Progress — insight cards |
| `device_integrations` | Pro+ | Profile — Integrations hub |
| `nutritionix` | Pro+ | Nutrition — restaurant search |
| `ai_motivation` | Pro+ | Home / pre-workout — AI copy |
| `gamification` | Pro+ | Profile opt-in + leaderboard |
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
| ForgeFit Pro | `STRIPE_PRO_PRICE_ID_MONTHLY` | `STRIPE_PRO_PRICE_ID_ANNUAL` | `pro` |
| ForgeFit Pro+ | `STRIPE_PRO_PLUS_PRICE_ID_MONTHLY` | `STRIPE_PRO_PLUS_PRICE_ID_ANNUAL` | `pro_plus` |

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
| Phase 8 | Pro+ only — AI motivation, gamification, PR celebration |

Pro analytics UI can ship incrementally; gates should land before or with each surface.

---

## Operational margins

See [ADR 001 — Two-Tier Pricing & Operational Margins](./ADRs/001-tier-pricing-margins.md).

| Tier / plan | Gross margin (est.) | Notes |
|-------------|---------------------|-------|
| Pro annual | **~94%** | No paid APIs; single Stripe charge |
| Pro monthly | **~92%** | Higher Stripe fee (12 charges/yr) |
| Pro+ annual | **~82–87%** | Nutritionix + AI variable cost |

The 35% Pro annual discount is a **retention trade**, not a margin problem — annual billing saves ~$4.40/user/yr in Stripe fees vs monthly.

---

## Phase 7 implementation plan

| Step | Status | Scope |
|------|--------|-------|
| 1. Tier matrix + billing lib | ✅ Done | `gates.ts`, Stripe checkout/webhook |
| 2. DB migrations | ⏳ User action | `20260609300000`, `20260609400000` |
| 3. Stripe Dashboard products | ⏳ User action | 4 prices + webhook endpoint |
| 4. Profile upgrade UI | ✅ Done | `subscription-setting.tsx` |
| 5. Progress projection gates | ✅ Done | 30d/90d horizon, confidence bands, 90d history cap |
| 6. Export gate (Pro) | ✅ Done | `/api/account/export` + Profile |
| 7. Strength/volume/adherence analytics UI | ✅ Done | Progress, Nutrition, Home insights |
| 8. Progress photos UI | ✅ Done | `progress_photos` migration + timeline |
| 9. Pro+ integrations | ⏳ Pending | Withings, Fitbit OAuth |
| 10. Phase 8 Pro+ features | ⏳ Pending | AI coaching, gamification |
