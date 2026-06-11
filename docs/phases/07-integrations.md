# Phase 7 — Pro Integrations

**Status:** Pending  
**Depends on:** Phase 6

## Goal

Stripe Pro + Pro+ billing, Pro analytics gates, Withings + Fitbit OAuth, webhook sync.

Tier matrix: [docs/TIER-GATES.md](../TIER-GATES.md)

## Done When

- [x] Stripe checkout upgrades user to Pro or Pro+ (monthly + annual each)
- [x] Webhook maps Stripe price ID → `subscription_tier` (`pro` | `pro_plus`)
- [x] Profile upgrade UI (`subscription-setting.tsx`)
- [x] Pro gates: 90-day projections, confidence bands, goal date, 90-day history cap
- [x] Data export gated to Pro
- [ ] Withings weight syncs to `body_measurements` (Pro+)
- [ ] Fitbit activity syncs successfully (Pro+)
- [x] Strength/volume/adherence analytics UI (Pro)
- [x] Progress photos timeline (Pro)
- [x] CSV export (Pro) + rule-based insights (Home + Progress)

## Pricing (Stripe Dashboard)

| Product | Monthly | Annual |
|---------|---------|--------|
| ForgeFit Pro | $8.99 | $69.99 |
| ForgeFit Pro+ | $14.99 | $119.99 |
