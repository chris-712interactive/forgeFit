# forgeFit Design System — Forge Ember

> Customer-facing feel: **encouragement and excitement to start**, not intimidation.

Tokens live in `packages/ui/src/tokens/`. **Never hardcode hex in components.**

## Colors

| Token | Hex | Use |
|-------|-----|-----|
| `forge-ember` | `#FF6B35` | Primary CTA, active nav |
| `forge-glow` | `#FF8C42` | Hover states |
| `forge-gold` | `#FBBF24` | PRs, streaks, achievements |
| `forge-coral` | `#FF4D6D` | Celebrations, hype banners |
| `forge-steel` | `#38BDF8` | Info, recovery blocks |
| `forge-success` | `#22C55E` | Completed sets, sync OK |
| `forge-surface` | `#1C1917` | Dark background (default) |
| `forge-surface-raised` | `#292524` | Cards |
| `forge-cream` | `#FFFBF7` | Light mode background |
| `forge-text` | `#FAFAF9` | Body text on dark |
| `forge-muted` | `#A8A29E` | Secondary text |

### Tailwind classes

```
bg-forge-ember  text-forge-gold  border-[var(--border)]
gradient-forge-ignite  gradient-forge-celebrate
```

## Typography

- **Display:** Plus Jakarta Sans (`font-display`)
- **Body:** Inter (default `font-sans`)

## Principles

1. **Dark-first** — gym-friendly, OLED
2. **Warm primaries** — orange/amber, not clinical blue
3. **No shame-red** for missed workouts — use `forge-muted`
4. **Touch targets** ≥ 52px height on primary actions
5. **375px first** — design mobile, enhance for tablet

## Logo

| Asset | Path | Use |
|-------|------|-----|
| Full wordmark | `apps/web/public/logo.svg` | Header, marketing, splash |
| App icon | `apps/web/public/logo-icon.svg` | PWA manifest, favicon |
| Concept reference | `docs/assets/logo-concept-reference.png` | Design source (not for production) |

The SVG logo recreates the forged metallic **F** with ember glow, weight plates, dumbbell, rivets, and **ForgeFit** wordmark. Vector format scales to any resolution.

## PWA

- `theme_color`: `#FF6B35`
- `background_color`: `#1C1917`
- Manifest: `apps/web/public/manifest.json`
- Icon: `logo-icon.svg`

## Onboarding measurements

- Single **unit system** tile row above all body measurements: **Metric (cm/kg)** or **Imperial (ft/in/lbs)**
- All inputs switch together when the tile is selected
- Values convert to **kg** and **cm** before save; height (imperial) uses feet + inches

## Do / Don't

| Do | Don't |
|----|-------|
| Use CSS variables from `@forgefit/ui` | Hardcode `#FF6B35` in JSX |
| Use gradients on hero/hype surfaces only | Gradient everything |
| Pulse `forge-gold` on rest timer | Flash red on missed day |
