# Phase 7 — Pro Integrations

**Status:** Partial (2026-06-19)  
**Depends on:** Phase 6

## Production ops ✅

- [x] Supabase migrations applied on production (full stack through community + Spotify)
- [x] Stripe Pro / Pro+ products and prices configured
- [x] Stripe webhook live on production (`/api/stripe/webhook`)

## Goal

Stripe Pro + Pro+ billing, Pro analytics gates, Withings + Fitbit OAuth, webhook sync.

Tier matrix: [docs/TIER-GATES.md](../TIER-GATES.md)

## Done When

- [x] Stripe checkout upgrades user to Pro or Pro+ (monthly + annual each)
- [x] Webhook maps Stripe price ID → `subscription_tier` (`pro` | `pro_plus`)
- [x] Profile upgrade UI (`subscription-setting.tsx`)
- [x] Pro gates: 90-day projections, confidence bands, goal date, 90-day history cap
- [x] Data export gated to Pro
- [ ] Withings OAuth + weight sync (Pro+) — UI enabled; finish Partner Hub + production env, then QA ([setup guide](../integrations/withings-setup.md))
- [x] Fitbit activity sync via Google Health API — steps, active calories, active minutes (Pro+)
- [x] Fitbit activity depth — AZM, sedentary time, total calories (Pro+)
- [x] Fitbit sleep sync — duration + stages via Google Health sleep scope (Pro+)
- [x] Fitbit recovery sync — resting HR + HRV via Google Health metrics scope (Pro+)
- [x] Fitbit workout correlation — exercise sessions matched to logged workouts; intensity recap + readiness (Pro+)
- [ ] Strava workout sync (Pro+) — code ready; launch when prioritized
- [x] Restaurant quick-log — curated US chains + saved meals (Pro+, $0 API)
- [ ] Full restaurant menu API (deferred — evaluate when Pro+ MAU supports ~$6k/yr vendor)
- [x] Strength/volume/adherence analytics UI (Pro)
- [x] Progress photos timeline (Pro)
- [x] CSV export (Pro) + rule-based insights + weekly scorecard (Home + Progress)

## Pricing (Stripe Dashboard)

| Product | Monthly | Annual |
|---------|---------|--------|
| ForgeRep Pro | $8.99 | $69.99 |
| ForgeRep Pro+ | $14.99 | $119.99 |
