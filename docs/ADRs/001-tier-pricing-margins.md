# ADR 001 — Two-Tier Pricing & Operational Margins

**Status:** Accepted  
**Date:** 2026-06-09  
**Related:** [TIER-GATES.md](../TIER-GATES.md), Phase 7

## Context

ForgeFit splits paid features into **Pro** ($8.99/mo · $69.99/yr) and **Pro+** ($14.99/mo · $119.99/yr). Pro annual offers a **35% discount** vs monthly. We need confidence that annual pricing preserves healthy margins.

## Decision

1. **Lead with annual** in upgrade UI (better retention, lower Stripe fees).
2. **Pro** carries API-free features only (projections, analytics, export, photos).
3. **Pro+** carries all paid APIs (Nutritionix, AI, device sync).
4. Annual discount is a **retention investment**, not a margin risk, for Pro.

## Per-user economics (Pro)

| Line item | Pro monthly (per year) | Pro annual (per year) |
|-----------|------------------------|------------------------|
| Gross revenue | $107.88 | $69.99 |
| Stripe (2.9% + $0.30) | ~$6.72 | ~$2.33 |
| Variable COGS (~$0.15/mo) | ~$1.80 | ~$1.80 |
| **Contribution margin** | **~$99 (92%)** | **~$66 (94%)** |

Pro annual has **higher gross margin %** than monthly because Stripe charges once, not twelve times.

## Per-user economics (Pro+)

| Line item | Est. annual |
|-----------|-------------|
| Gross (annual plan) | $119.99 |
| Stripe | ~$3.48 |
| Variable APIs (moderate use, ~$1.50/mo) | ~$18 |
| **Contribution margin** | **~$98 (82%)** |

Pro+ margin is lower but still healthy; API costs justify the higher price.

## Fixed infra (amortized)

| Scale | Fixed/mo | Per paying user/mo (illustrative) |
|-------|----------|-----------------------------------|
| 0–500 users | $25–50 | $0.14–0.45 |
| 1,000 paid (Bible ref) | ~$800 | ~$0.80 |

Even with early-stage fixed allocation, **Pro annual stays above ~86% net margin**.

## Annual discount break-even

- Monthly list annualized: $107.88 vs annual $69.99 → **$37.89 foregone** per user who would pay monthly for 12 months.
- Break-even churn: **~8 months** ($69.99 ÷ $8.99). If monthly subscribers churn before month 8, annual wins.
- Annual subscribers typically retain 2–3× longer than monthly in fitness apps.

## Floor price (Pro annual)

Pro annual remains viable above **~$48/yr (~$4/mo effective)** before margin pressure at small scale. Current $69.99/yr is well above floor.

## Consequences

- Upgrade UI defaults to **annual** for both tiers.
- Pro features must avoid paid API calls.
- Monitor Pro+ Nutritionix/AI cost per active user; adjust Pro+ price before discounting Pro+ annual below ~$99/yr.
