# ForgeRep Instagram — 31-Day Content Calendar

> **Printable field guide:** [forge-rep.com/docs/marketing/ig31](https://forge-rep.com/docs/marketing/ig31) — open on phone or desktop → Print (⌘P). Source: `apps/web/content/marketing/ig31-print.html`

> **Account:** [@forgerep](https://instagram.com/forgerep)  
> **Goal:** Grow followers quickly → convert to app signups at `https://forge-rep.com/signup`  
> **Cadence:** 1 Reel + 1 Carousel/static daily + 5–8 Stories (~2 feed touchpoints/day)  
> **Time budget:** ~45–60 min/day after batch setup; ~4 hours on batch days (Days 0, 7, 14, 21)  
> **Founder journey account (separate):** [@repwithchris](https://instagram.com/repwithchris) — see [founder-instagram-channel-launch.md](./founder-instagram-channel-launch.md)

**Last updated:** 2026-07-14

---

## Table of contents

1. [Profile setup](#profile-setup)
2. [Pre-launch setup (Day 0)](#pre-launch-setup-day-0)
   - [Batch Day 0 screen recording playbook](#batch-day-0--screen-recording-playbook-4-hours)
   - [Demo account tier](#demo-account-tier-free-vs-pro-vs-pro)
3. [Content system](#content-system)
4. [Daily rhythm](#daily-rhythm)
5. [Week themes](#week-themes)
6. [Phone-first production guide](#phone-first-production-guide)
7. [Day-by-day calendar](#day-by-day-calendar)
8. [Speed systems](#speed-systems)
9. [Hook bank](#hook-bank)
10. [Hashtag groups](#hashtag-groups)
11. [Growth accelerators](#growth-accelerators)
12. [Promo assets (CTV + Phone)](#promo-assets-ctv--phone)
13. [Metrics](#metrics)
14. [First 48 hours checklist](#first-48-hours-checklist)
15. [Brand references (in-repo)](#brand-references-in-repo)

---

## Profile setup

### Bio (119 characters)

```
Evidence-based fitness that keeps you accountable.
Programs, macros & offline gym logging — one app.
Start free ↓
```

### Link

`https://forge-rep.com/signup`

Add UTM for tracking: `?utm_source=instagram&utm_medium=bio`

### Story highlights

| Highlight   | Contents |
|-------------|----------|
| START HERE  | What is ForgeRep → Free to start → Link |
| APP TOUR    | Screen recordings from Batch Day 0 |
| EVIDENCE    | Myth vs fact carousels |
| OFFLINE     | Gym / no-signal demos |
| FREE        | What's included free |

**Cover style:** Orange `#FF6B35` on dark `#1C1917`

### Pinned posts (publish Days 1, 3, 5 — pin when live)

1. “What is ForgeRep?” (60s Reel) — Day 1
2. “Works offline in the gym” (demo Reel) — Day 3
3. “Start free in 60 seconds” (signup Carousel) — Day 5

---

## Pre-launch setup (Day 0)

### Brand kit (Canva — free)

| Token | Hex | Use |
|-------|-----|-----|
| forge-ember | `#FF6B35` | Primary CTA, accents |
| forge-surface | `#1C1917` | Dark background |
| forge-surface-raised | `#292524` | Cards |
| forge-text | `#FAFAF9` | Body text |
| forge-gold | `#FBBF24` | PRs, highlights |
| forge-success | `#22C55E` | Checkmarks |

**Fonts (Canva):** Montserrat (headlines) + Open Sans (body) — see [canva-template-guide.md](./canva-template-guide.md#typography-in-canva)

**Logos:** `apps/web/public/logo.svg`, `apps/web/public/logo-icon.svg`

### Master templates (build once)

Visual mockups and step-by-step Canva instructions: **[Canva template guide](./canva-template-guide.md)**  
Reference images: `docs/marketing/assets/template-*.png`

1. **Carousel** — 1080×1350, dark bg, orange accent bar left
2. **Myth vs Fact carousel** — cover + content + CTA slides ([guide](./canva-template-guide.md#template-5--myth-vs-fact-carousel))
3. **Reel cover** — 1080×1920, logo top-left, bold hook center
4. **Story** — 1080×1920, big text + link sticker area bottom
5. **Quote card** — 1080×1080, raised card panel, myth-bust or stat line

### Batch Day 0 — Screen recording playbook (~4 hours)

Record everything in **one sitting** using a **demo account** (not your personal account). You will cut these long recordings into Reels, carousels, and Stories later — do not worry about perfection on the first take.

#### Demo account tier (Free vs Pro vs Pro+)

**Use two accounts, not one** — so your “Start free” content shows the real free experience.

| Account | Tier | Purpose |
|---------|------|---------|
| **`demo+free@…`** (primary) | **Free** | Recordings **1–7**, onboarding, and any clip that sells the free tier |
| **`demo+pro@…`** (secondary) | **Pro+** recommended (or **Pro** if you only need community) | Recordings **8–10** — community, pro analytics, integrations |

**Why Free for the main account**

Your CTAs say “Start free.” Most Batch Day 0 clips should show what a new signup actually gets:

- Home, workout logging, offline sync, nutrition, onboarding, exercise library, evidence — **all Free**
- **30-day** weight projection on Progress — **Free**

**When you need a paid demo account**

| Recording | Minimum tier | Why |
|-----------|--------------|-----|
| **8 — Progress** (Training tab) | **Pro** | Strength/volume charts, PR history — gated on Pro |
| **9 — Community** | **Pro** + **opt-in** | Leaderboards, rivals, habit score require `gamification` (Pro). Free users only see upgrade/opt-in surfaces |
| **10 — Integrations B-roll** | **Pro+** | Full Fitbit / Withings connect cards; Free/Pro see “Pro+ integrations” upgrade prompt |

**Pro vs Pro+ for the secondary account**

- Choose **Pro** if you only need Recording **9** (community) and can skip full integrations UI.
- Choose **Pro+** if you also want Recording **10** and Day **27** content without upgrade prompts — Pro+ includes all Pro features.

**How to set tier on demo accounts (dev/staging)**

1. **Stripe test mode** — sign in as `demo+pro@…` → Profile → Subscription → checkout with [Stripe test card](https://docs.stripe.com/testing) (`4242…`). Pick Pro or Pro+ price.
2. **Supabase dashboard** (local/staging only) — `profiles` table → set `subscription_tier` to `pro` or `pro_plus` and `subscription_status` to `active` for the demo user UUID.

Do **not** fake a paid tier on production marketing screenshots without labeling posts “Pro” or “Pro+” in caption or on-screen text.

**Posting rule:** If a Reel uses the **paid** demo account, add one line in caption or on-screen text: e.g. “Community — Pro feature” or “Integrations — Pro+”. Core training clips should always come from the **Free** account.

#### Before you record (30 min setup)

1. **Create demo accounts** — e.g. `demo+free@yourdomain.com` (Free) and optionally `demo+pro@yourdomain.com` (Pro+).
2. **Use a realistic but fake profile** on the **Free** account — first name only visible in community (e.g. “Alex”), generic goal like **General strength** or **Fat loss**, **Intermediate** experience, **Commercial gym**, common equipment (barbell, dumbbells, cables, bench).
3. **Complete full onboarding** (10 steps) so Home, Workout, and Nutrition are populated.
4. **Log at least one partial workout** and **one nutrition entry** ahead of time — makes Home and Progress look alive when you film those screens.
5. **Install as PWA** (optional but best for “real app” feel): Safari → Share → Add to Home Screen, then record from the home-screen icon.
6. **Phone settings:**
   - Dark mode ON (matches Forge Ember default)
   - Do Not Disturb ON
   - Battery ≥ 50%, Low Power Mode OFF
   - Hide notifications (or use Focus)
   - Screen recording ON (include mic only if you plan voiceover later — silent is fine)
   - **Portrait orientation**, 375px-width feel (standard iPhone — don’t record landscape)

#### How to record (all clips)

| Setting | Value |
|---------|--------|
| Tool | iOS: Control Center → Screen Recording · Android: built-in recorder |
| Tap highlights | Enable “Show touches” if your OS supports it — helps viewers follow |
| Pace | Slow, deliberate taps — 1–2 sec pause on key UI |
| Length | Record **long continuous takes** per section below; trim in CapCut |
| File naming | `batch-01-home.mov`, `batch-02-workout.mov`, etc. |

---

#### Recording 1 — Home dashboard (~5 min) → Days 1, 8, 15, 22, 29

**Route:** Open app → `/home` (Home tab in bottom nav)

**What to capture on screen:**

| Step | Action | Why / what viewers should see |
|------|--------|-------------------------------|
| 1 | Land on Home — pause 2s on greeting (“Hey, Alex”) | Human, personalized feel |
| 2 | Scroll slowly past **encouragement banner** (orange-tinted card) | “Accountability” messaging |
| 3 | Pause on **This week** card — workouts completed X/Y + gold % bar | Weekly accountability hook |
| 4 | Pause on **Today** card — **macro progress bars** (Protein / Carbs / Fat) | Nutrition tied to plan |
| 5 | Tap **Log food →** briefly, then back — optional | Shows macro link |
| 6 | Scroll to **Body of work** — expand if collapsed | Volume / training stats |
| 7 | Scroll past **Community** preview section if visible | Teaser for Day 20 |
| 8 | Slow scroll back to top | B-roll for montages |

**Do not show:** Profile email, real weight if sensitive, notification content with private info.

**Target clips to cut later:** 3s greeting · 5s This week · 5s Today macros · 3s Body of work

---

#### Recording 2 — Workout hub + active logging (~15 min) → Days 2, 9, 16

**Route:** Bottom nav → **Workout** → `/workout`

**Part A — Week plan (hub view)**

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Pause on **week plan card** — session name, day label (e.g. “Day 2 — Upper”) | Structured program, not random list |
| 2 | Scroll through **Workout phase cards** (warm-up / main / finisher if shown) | Program detail |
| 3 | Tap **Start** (or **Continue** if session in progress) on today’s session | Transition to active mode |

**Part B — Active workout (`ActiveWorkout` screen)**

| Step | Action | What to show |
|------|--------|--------------|
| 4 | Pause on first exercise name + set rows | “Log every rep” hook |
| 5 | Tap into **weight** field — enter a value (e.g. 135 / 60 kg) | Prescription logging |
| 6 | Tap into **reps** field — enter reps | |
| 7 | Tap **Easy / Good / Hard** effort buttons (RIR-based) — select **Good** | RIR without jargon — “1–2 reps left” |
| 8 | Mark set **complete** (checkmark / complete control) | Completion feedback |
| 9 | If **rest timer** appears — let it run 3–5 seconds | Gym-realistic |
| 10 | Log **one more set** on same exercise OR skip to next exercise | Shows flow |
| 11 | Scroll to show **progression note** (blue-tinted hint) if visible | Evidence-based progression |
| 12 | **Do not finish workout yet** — leave in progress for offline clip OR finish and use recap for bonus B-roll | |

**Optional Part C — Workout recap**

If you complete the session: pause on recap / rank delta card if community is enabled.

**Target clips:** Start button · set row close-up · effort picker · rest timer · progression hint

---

#### Recording 3 — Offline mode (~10 min) → Days 3, 10, 17

**This is your highest-value differentiator clip — record carefully.**

**Prerequisites:** Active workout **in progress** (from Recording 2) OR start a new session and log one set first.

| Step | Action | What to show |
|------|--------|--------------|
| 1 | With active workout open, **enable Airplane Mode** (or turn off WiFi + cellular) | “No signal” hook |
| 2 | Show status bar / control center briefly with no connectivity | Visual proof |
| 3 | Return to ForgeRep — app should still respond | Offline still works |
| 4 | Log **another set** (weight + reps + effort) while offline | Core demo |
| 5 | Navigate to **Workout** hub while still offline — week plan should load from cache | Offline PWA |
| 6 | **Disable Airplane Mode** — wait for connection | |
| 7 | If **sync banner** appears (“X items waiting to sync” gold banner) — pause on it | Pending sync UI |
| 8 | Tap **Sync now** if shown — or wait for auto-sync | Success state |
| 9 | Confirm set still visible after sync | Data preserved |

**Fallback if sync banner doesn’t appear:** Pull to refresh or reopen app — show workout history with logged sets.

**Target clips:** Airplane mode ON · logging offline · sync banner · synced confirmation

---

#### Recording 4 — Nutrition diary (~12 min) → Days 4, 11, 18

**Route:** Bottom nav → **Nutrition** → `/nutrition`

**Part A — Log tab (default)**

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Pause on **macro summary bars** at top (calories + protein/carbs/fat vs targets) | Targets from YOUR plan |
| 2 | Scroll to **Quick macro log** — enter a simple entry: Name “Chicken & rice”, protein/carbs/calories | Fast logging |
| 3 | Tap **Add / Log** — watch bars update | Instant feedback |
| 4 | Pause on updated **macro bars** | Before/after for split-screen edits |

**Part B — Browse tab**

| Step | Action | What to show |
|------|--------|--------------|
| 5 | Tap **Browse** tab | |
| 6 | Expand **Example plates** — scroll one breakfast/lunch example with whole foods + portions | Curated nutrition (not generic calculator) |
| 7 | Optional: scroll **Food search** (USDA / Open Food Facts) — search “eggs”, tap a result | Search flow if enabled |

**Part C — My Meals (optional, 30s)**

| Step | Action | What to show |
|------|--------|--------------|
| 8 | Tap **My Meals** → show saved meal or **Build meal** from ingredients | Power-user feature |

**Target clips:** Macro bars · log entry · bars updating · example plate scroll

---

#### Recording 5 — Onboarding (~20 min raw → ~60s edited) → Days 5, 12

**Use a second fresh demo account OR reset onboarding account** so the progress bar fills from 0%.

**Route:** Sign out → `/signup` → create account → auto-redirect to `/onboarding`

**Record all 10 steps** — tap through at steady pace; speed up 2× in CapCut later:

| Step | Screen title | What to tap / show |
|------|--------------|-------------------|
| 1 | Health disclaimer | Check acknowledge box → Continue |
| 2 | What’s your main goal? | Select one goal (e.g. **Fat loss**) |
| 3 | How experienced are you? | Select **Intermediate** |
| 4 | About you | Enter demo first/last name + DOB |
| 5 | Your measurements | Toggle unit system once · enter height + weight |
| 6 | What equipment do you have? | Location: **Commercial gym** · select 4–6 equipment chips |
| 7 | Recovery tools | Select 1–2 optional items (foam roller, etc.) |
| 8 | How much time do you have? | **3×** sessions · **45 min** |
| 9 | Why did you start? | Type 1–2 sentences (generic motivation) |
| 10 | Almost done | PWA install prompt — scroll → **Finish** / generate program |

**After finish:** Pause 3s on Home or Workout loading with **new program visible**.

**Do not show:** Real email, real DOB, real body measurements you’re uncomfortable sharing.

**Target clip:** 45–60s fast-cut montage of all 10 steps + “program ready” landing

---

#### Recording 6 — Exercise library (~8 min) → Days 6, 13

**Route:** Navigate to `/exercises` (from workout exercise link, search, or type URL if logged in on desktop)

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Pause on **Exercise Library** header + count | “800+ exercises” claim |
| 2 | Use **search** — type “bench press” or “squat” | Search UX |
| 3 | Tap an exercise from results list | |
| 4 | On detail page — pause on **animated demo / GIF** playing | Visual demos |
| 5 | Scroll to **muscle heatmap** (body diagram highlighted) | Muscle map |
| 6 | Scroll to **Equipment swaps** — show 1–2 substitutions | Substitution feature |
| 7 | Tap a substitution link — show alternate exercise | |

**Good exercises to film:** Barbell bench press, Back squat, Romanian deadlift — widely recognized.

**Target clips:** Search · GIF · muscle map · substitution list

---

#### Recording 7 — Evidence page (~5 min) → Days 7, 14, 21

**Route:** `/evidence` (link from Workout hub “See your evidence basis” or Profile, or type URL)

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Pause on page header: **Evidence behind your plan** | Trust / not-AI hook |
| 2 | Read subtitle area — “never guesses in a chatbot” copy visible | |
| 3 | Tap **Your plan (N)** filter chip | Personalized rules |
| 4 | Slow scroll through **2–3 rule cards** — pause on confidence badge + citation line | Citable science |
| 5 | Tap **Full library** — scroll 2–3 more rules | Depth of knowledge base |
| 6 | Optional: tap domain filter (Protein, Volume, etc.) | Organization |

**Target clips:** Header · rule card close-up with citation · scroll of multiple rules

---

#### Recording 8 — Progress / projections (~8 min) → Days 17, 18

**Route:** Bottom nav → **Progress** → `/progress`

| Step | Action | What to show |
|------|--------|--------------|
| 1 | **Trends** tab (default) — pause on **weight projection chart** (30-day line) | Projections feature |
| 2 | Scroll to measurement / waist trends if present | Not just scale |
| 3 | Tap **Training** tab — strength progression or volume chart if Pro demo account; otherwise show free-tier view | |
| 4 | Tap **Log** tab — show **log measurement** form briefly (don’t need to submit) | Body tracking |

**Note:** If charts are empty, log a weight measurement first in **Log** tab, then return to **Trends**.

**Target clips:** Projection chart · strength/volume chart · log form

---

#### Recording 9 — Community (~8 min) → Days 20, 27

**Route:** Bottom nav → **Community** → `/community`

**Requires:** Pro-tier demo account with **gamification opt-in** for full experience. Free account still films opt-in hero + preview.

| Step | Action | What to show |
|------|--------|--------------|
| 1 | Pause on **Community** header + hero (opt-in state) | Accountability layer |
| 2 | If opted in: **This week** tab — leaderboard standings, your rank | Competition |
| 3 | Scroll to **Weekly rival** card — “points to pass” | Rival feature |
| 4 | Scroll to **Habit score breakdown** (training / protein / quality) | Transparent scoring |
| 5 | Optional: **Squad** tab — crew panel · **Feed** tab — win feed | Phase 3 content |

**If not opted in:** Record opt-in CTA hero — still usable for “train with accountability” messaging with caption “Pro feature”.

**Target clips:** Leaderboard scroll · rival card · habit score

---

#### Recording 10 — Bonus B-roll (~15 min) → montages, relatable Reels

Record these **short 5–10s clips** for Week 2–4 editing:

| Clip | How |
|------|-----|
| Bottom nav tap through all 6 tabs | Home → Workout → Nutrition → Progress → Community → Profile |
| **Profile → Integrations** | Fitbit / Spotify / Withings cards (don’t connect — just show UI) |
| Workout **music picker** | Spotify vibe selection (Focus / Pump / Cardio / Cooldown) |
| **Sync status** on Workout tab when online | Clean state (no banner) vs pending banner from Recording 3 |
| PWA **Add to Home Screen** prompt | From onboarding step 10 or Home install card |
| Phone **lock screen → tap ForgeRep icon** | “Real app” open |

---

#### After recording — organize files

```
batch/
├── 01-home.mp4
├── 02-workout-active.mp4
├── 03-offline-sync.mp4
├── 04-nutrition.mp4
├── 05-onboarding.mp4
├── 06-exercises.mp4
├── 07-evidence.mp4
├── 08-progress.mp4
├── 09-community.mp4
└── 10-broll.mp4
```

Upload to iCloud/Google Drive. Import into CapCut project **ForgeRep Batch Day 0** for the month.

#### Quick reference — calendar mapping

| Batch recording | Used on calendar days |
|-----------------|----------------------|
| Home dashboard | 1, 8, 15, 22, 29 |
| Workout + active logging | 2, 9, 16 |
| Offline + sync | 3, 10, 17 |
| Nutrition diary | 4, 11, 18 |
| Onboarding | 5, 12 |
| Exercise library | 6, 13 |
| Evidence page | 7, 14, 21 |
| Progress / projections | 17, 18 |
| Community | 20, 27 |
| Bonus B-roll | 8, 10, 14, 22, 26, 29 |

### Tools

| Tool | Use |
|------|-----|
| CapCut | Reels — auto-captions, templates |
| Canva | Carousels + stories |
| Meta Business Suite | Schedule feed + stories |

### Repurpose rule

**1 screen recording → 3 posts:**

- Full demo Reel (30–45s)
- 3-slide Carousel (Step 1/2/3)
- 3 Story frames with text overlays

---

## Content system

### Pillars

| Pillar | Purpose | % of feed |
|--------|---------|-----------|
| Evidence / education | Saves, shares, trust | 30% |
| App demo / feature | Conversion | 30% |
| Relatable gym humor | Reach, follows | 25% |
| Accountability / mindset | Comments, community | 15% |

**CTA on every post:** “Link in bio — free to start” or “Save this for leg day.”

### Format legend

- 🎬 = Reel
- 📱 = Carousel or static
- 📖 = Stories (5–8 frames)
- ⏱ = Est. production time (if not batched)

---

## Daily rhythm

| Time | Format | Purpose |
|------|--------|---------|
| 7–9 AM | Reel | Reach — hook in first 1.5s |
| 12–2 PM | Carousel or static | Saves + education |
| 5–9 PM | 5–8 Stories | Polls, Q&A, link reminders |
| Story frame 1 | “New post ↑” sticker | Drives Reel views |

### Caption formula

```
[Hook — problem or bold claim]

[2–3 lines: what ForgeRep does]

[Soft CTA: Link in bio — free to start]

[5–8 hashtags]
```

### Engagement routine (10 min/day)

- Reply to every comment in the first hour
- Reply to 5–10 posts under `#fitnessapp` / `#macrotracking` (helpful, not spammy)
- Share best Story replies to feed

---

## Week themes

| Week | Theme | Focus |
|------|-------|-------|
| 1 | Launch & identity | Who ForgeRep is, 3 differentiators |
| 2 | Pain → solution | Problems generic apps cause |
| 3 | Feature proof | Deep demos + evidence |
| 4 | Convert & urgency | Free tier, signup push |

---

## Phone-first production guide

Use this section with the day-by-day specs below. **Goal:** most days you only touch your phone — CapCut for Reels, Canva for carousels/statics, Instagram for Stories. Batch Day 0 screen recordings live in Photos (or iCloud); trim the same files all month.

### Batch clip library (Day 0 — keep in Photos album “ForgeRep Batch”)

| File | Recording | Route | Trim these clips (filename hint) |
|------|-----------|-------|----------------------------------|
| **batch-01-home** | 1 — Home | `/home` | `greeting` 3s · `this-week` 5s · `today-macros` 5s · `body-of-work` 3s |
| **batch-02-workout** | 2 — Workout | `/workout` | `week-plan` 3s · `start-btn` 2s · `set-row` 4s · `effort-rir` 3s · `rest-timer` 4s · `progression-hint` 3s |
| **batch-03-offline** | 3 — Offline | Airplane + workout | `airplane-on` 2s · `log-offline` 5s · `sync-banner` 3s · `synced` 2s |
| **batch-04-nutrition** | 4 — Nutrition | `/nutrition` | `macro-bars` 4s · `quick-log` 5s · `bars-update` 3s · `example-plate` 4s |
| **batch-05-onboarding** | 5 — Onboarding | `/signup` → 10 steps | Full take → speed **1.5×** in CapCut to 45–60s montage |
| **batch-06-exercises** | 6 — Library | `/exercises` | `search` 3s · `gif-demo` 4s · `muscle-map` 3s · `substitution` 4s |
| **batch-07-evidence** | 7 — Evidence | `/evidence` | `header` 3s · `rule-card` 5s · `citation` 3s · `scroll-rules` 4s |
| **batch-08-progress** | 8 — Progress | `/progress` | `projection-chart` 5s · `strength-chart` 4s (Pro demo) · `log-form` 3s |
| **batch-09-community** | 9 — Community | `/community` | `leaderboard` 4s · `rival-card` 3s · `habit-score` 4s — **Pro demo account** |
| **batch-10-broll** | 10 — B-roll | Various | `nav-tabs` 6s · `integrations` 4s · `music-picker` 4s · `pwa-icon` 3s |

**Demo account rule:** Clips from **batch-09**, **batch-08** (Training tab), and **batch-10** (integrations) = paid demo account. Label “Pro” or “Pro+” on screen or in caption.

### Audio legend

| Code | When to use | How (phone) |
|------|-------------|-------------|
| **VO** | Explainer Reels, trust/education | CapCut → **Text-to-speech** (fast) OR record voiceover in quiet room · add **auto-captions** |
| **CAP** | Screen demos where UI tells the story | No music, or CapCut **Ambient** bed at **8–12%** volume · **auto-captions required** |
| **TREND** | Relatable/humor, reach plays | CapCut → **Sounds** → trending fitness/gym clip · bold **text hooks** on screen (no VO needed) |
| **BEAT** | Montage / energy / feature demos | CapCut → **Music** → search “gym phonk” or “motivation instrumental” · no lyrics · CAP optional |
| **CAM** | Skits, founder story, gym B-roll | Phone camera · TREND or BEAT underneath · text overlays |
| **—** | Carousels, statics, Stories | N/A |

**Default if unsure:** screen recording = **CAP** or **BEAT + CAP** · skit = **TREND** · educational myth-bust = **VO**.

### Phone workflow (repeat daily)

| When | Task | App | Time |
|------|------|-----|------|
| **Batch days 0, 7, 14, 21** | Record or film B-roll; write next week captions | Camera + Notes | 2–4 hrs |
| **7–9 AM** | Trim batch clips → audio → captions → export Reel | **CapCut** | 15–25 min |
| **12–2 PM** | Duplicate Canva template → swap text/screenshot → post Carousel/static | **Canva** | 15–25 min |
| **5–9 PM** | Poll → link sticker → reshare feed post | **Instagram** | 10 min |
| **Weekly** | Schedule feed in advance | **Meta Business Suite** app | 30 min |

**Carousel screenshots on phone:** Pause batch video in Photos → screenshot → AirDrop to self → Canva **Uploads** → drop on slide.

**CapCut project tip:** One project per week (`ForgeRep W1`) with subfolders per batch file — duplicate timeline, swap clip order per day.

### Production spec columns (under each day)

| Column | Meaning |
|--------|---------|
| **Batch** | Which `batch-XX` file(s) — or **Canva** / **CAM** / **Repurpose** |
| **Clips** | Exact trims or slide content |
| **Audio** | VO · CAP · TREND · BEAT · CAM · — |
| **Tool** | CapCut · Canva · IG · Camera · MBS (Meta Business Suite) |

---

## Day-by-day calendar

### Week 1 — Launch & identity

#### Day 1 — What is ForgeRep?

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **01** + **02** + **04** | 01: `greeting` 3s → `this-week` 5s → 02: `start-btn` + `set-row` 5s → 04: `macro-bars` 4s → logo end card | **VO** (preferred) or **BEAT** + CAP · on-screen hook first 2s | CapCut | 20m |
| 📱 Carousel | **Canva** — Carousel template | 5 text slides (table below) — optional 01 `this-week` screenshot on slide 2 | — | Canva | 25m |
| 📖 Stories | **01** screenshot + IG | Poll “Track macros?” → reshare Reel → link sticker → question “#1 goal?” | — | IG | 10m |

**🎬 Reel — “Not another workout list” (60s)** ⏱ 20 min

| Step | Instruction |
|------|-------------|
| 1 | CapCut → import logo, home screen, workout log, macro screen |
| 2 | Hook (0–2s): “Stop downloading apps that only give you random workouts.” |
| 3 | Text/voiceover: evidence-based program + nutrition + progress; offline; free |
| 4 | Clips: 3s home → 5s workout → 4s macros → 3s logo |
| 5 | Auto-captions; highlight “evidence-based” and “offline” in orange |
| 6 | Cover: “Not another workout list” |

**Caption:**

```
Most fitness apps give you workouts. ForgeRep gives you a plan that holds you accountable.

✓ Personalized programs (fat loss, strength, bodybuilding & more)
✓ Macro tracking tied to YOUR plan
✓ Offline logging in the gym
✓ Backed by research — not AI guesswork

Start free — link in bio.

#fitnessapp #evidencebasedtraining #gym #accountability #workouttracker
```

**📱 Carousel — “3 reasons ForgeRep exists” (5 slides)** ⏱ 25 min

| Slide | Headline | Body |
|-------|----------|------|
| 1 | 3 problems with most fitness apps | Swipe → |
| 2 | Random workouts, no nutrition link | Training and macros should talk to each other |
| 3 | Dies when gym WiFi dies | Logs offline and syncs later |
| 4 | “AI wrote your leg day” | Peer-reviewed rules — not random templates |
| 5 | Try it free | forge-rep.com/signup |

**📖 Stories:** Poll “Do you track macros?” → reshare Reel → link sticker → question box “#1 fitness goal?” → reply with plan fit + link

---

#### Day 2 — Offline gym logging

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **03** | `airplane-on` 2s → `log-offline` 6s → `sync-banner` 3s → `synced` 2s → text end card | **TREND** (POV format) + CAP · or **VO** 1 sentence | CapCut | 15m |
| 📱 Static | **Canva** — Quote card | Text only: “Works offline. Syncs when signal returns.” · optional 03 `log-offline` screenshot bg | — | Canva | 10m |
| 📖 Stories | **03** + IG | Split frame: screenshot `airplane-on` / `log-offline` → link sticker | — | IG | 5m |

**🎬 Reel — “POV: gym has no signal” (25s)** ⏱ 15 min

- Hook: “POV: your gym’s WiFi gave up but your workout didn’t”
- Show: airplane mode → log set → sync ✓
- End: “ForgeRep — works offline”

**Caption:** Gym dead zones aren’t an excuse anymore. Log sets offline; sync when you’re back. Free — link in bio.

**📱 Static:** “Works offline. Syncs when signal returns.” — ForgeRep · Free to start

**📖 Stories:** Split “No signal 😤” / “Still logging 💪” → link sticker

---

#### Day 3 — Evidence-based (trust)

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **07** | `header` 3s → `rule-card` + `citation` 8s → `scroll-rules` 6s → logo | **VO** (trust tone) + CAP · hook text 0–2s on screen | CapCut | 20m |
| 📱 Carousel | **Canva** — Myth vs Fact template | 6 slides (table below) — no capture required | — | Canva | 30m |
| 📖 Stories | **Canva** + IG | Quiz slide “Deload optional?” → answer story with 07 `rule-card` screenshot | — | Canva + IG | 10m |

**🎬 Reel — “Your plan isn’t from ChatGPT” (35s)** ⏱ 20 min

- Screen record Evidence page
- Hook: “We don’t let AI write your program.”
- Beats: protein targets, deficit rates, volume rules, sports science

**📱 Carousel — Myth vs Fact (6 slides)** ⏱ 30 min

| Slide | Myth | Fact |
|-------|------|------|
| 1 | MYTH vs FACT | Evidence edition |
| 2 | More sets = always better | ~10–20 hard sets/muscle/week |
| 3 | Cut protein when dieting | 1.6–2.4 g/kg/day |
| 4 | Deloads are lazy weeks | Planned every ~6 weeks |
| 5 | Any workout app is the same | Citable rules, not random templates |
| 6 | Get a plan built on evidence | Link in bio — free |

**📖 Stories:** Quiz — “Deload weeks are optional: True/False” (Answer: False)

---

#### Day 4 — Nutrition accountability

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **04** + **01** | Split: generic calculator graphic (Canva 2s) → 04: `macro-bars` + `bars-update` 8s → 01: `today-macros` 4s | **VO** or **CAP** · emphasize protein bar | CapCut | 15m |
| 📱 Carousel | **04** screenshots | Slide 1–4: `quick-log` → food selected → `bars-update` → 01 `today-macros` | — | Photos + Canva | 20m |
| 📖 Stories | **04** | `example-plate` scroll + “What I ate today” text overlay | — | IG | 10m |

**🎬 Reel — “Macros that match your program” (30s)** ⏱ 15 min

- Hook: “Generic macro calculators vs targets from YOUR plan.”

**📱 Carousel — “Log a meal in 4 taps” (4 slides + CTA)** ⏱ 20 min

Step screenshots from batch: search food → select → see macros update → home dashboard % bars.

**📖 Stories:** “What I ate today” format using demo diary

---

#### Day 5 — Onboarding / signup push

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **05** | Full onboarding montage — trim to 45s · **1.5× speed** in CapCut | **BEAT** (upbeat) + CAP · hook “Free in 60 seconds” | CapCut | 10m |
| 📱 Carousel | **Canva** + **05** screenshots | 4 slides: pick 4 onboarding steps as backgrounds | — | Canva | 15m |
| 📖 Stories | IG native | “Free — no credit card” text × 3 frames + link sticker each | — | IG | 5m |

**🎬 Reel — “Free account in under 60 seconds” (45s, 1.5× speed)** ⏱ 10 min

Hook: “Your personalized program is one signup away.” Fast-cut onboarding screens from batch.

**📱 Carousel — How it works (4 slides):**

1. Share your starting point
2. Get evidence-based plan
3. Log & stay accountable
4. Start free

**📖 Stories:** “Free — no credit card” + link sticker × 3

---

#### Day 6 — Exercise library

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **06** | `search` 3s → `gif-demo` 4s → `muscle-map` 3s → `substitution` 4s | **BEAT** + CAP · fast cuts | CapCut | 10m |
| 📱 Static | **06** screenshot | `substitution` frame + text “Equipment busy? Substitutions built in.” | — | Canva | 10m |
| 📖 Stories | **06** | Poll Bench/Squat/Deadlift → reply story with matching `gif-demo` clip | — | IG | 10m |

**🎬 Reel — “800+ exercises with demos” (20s)** ⏱ 10 min

Quick montage: search exercise → GIF plays → muscle heatmap → substitution swap.

**📱 Static:** “Equipment busy? ForgeRep suggests substitutions.”

**📖 Stories:** Poll Bench / Squat / Deadlift → show demo

---

#### Day 7 — Week 1 recap + Batch Day 2

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **07** + **03** + **01** | 3s each: evidence → offline sync → `this-week` · 15s total | **BEAT** montage + CAP | CapCut | 20m |
| 📱 Carousel | **Canva** | 7 bullet slides (list below) — icons only, no capture | — | Canva | 25m |
| 📖 Stories | IG poll | “What next week?” Offline / Macros / Programs / Community | — | IG | 5m |
| ⏱ Batch | **CAM** | Film 10× gym B-roll clips (5s each): bad WiFi, gym bag, meal prep, bench, phone on rack | TREND optional | Camera | 2 hrs |

**🎬 Reel — “Week 1 in 15 seconds”** ⏱ 20 min — montage: Evidence · Offline · Accountability

**📱 Carousel — Start free: what’s included (7 slides):**

- Personalized program generation
- Offline workout logging & sync
- Nutrition diary with macro targets
- Measurements, trends & 30-day projections
- Full exercise library with animations
- No credit card required

**📖 Stories:** Poll — demo Offline / Macros / Programs / Community next week

**Batch Day 2 (~2 hrs):** Gym B-roll — bad WiFi, gym bag, meal prep, 10 clips × 5s

---

### Week 2 — Pain → solution

#### Day 8 — No plan

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **CAM** + **01** + **02** | Scenes 1–4: you on bench looking lost (CAM) → Scene 5: 02 `week-plan` + 01 `this-week` 5s | **TREND** (“oh no” / relatable) + text overlays per scene | Camera + CapCut | 25m |
| 📱 Carousel | **Canva** | 6 text slides “5 signs you need a real program” | — | Canva | 25m |
| 📖 Stories | **01** | Reshare Reel + “Which scene is you?” poll | — | IG | 5m |

**🎬 Reel — Relatable skit (30s)** ⏱ 25 min

| Scene | Text |
|-------|------|
| 1 | Monday: I’ll start fresh |
| 2 | Tuesday: random YouTube workout |
| 3 | Wednesday: still sore |
| 4 | Thursday: no idea what to train |
| 5 | ForgeRep: actual program. Free. Link in bio. |

Film: sitting on bench looking at phone; cut between angles. CapCut “oh no” trending sound.

**📱 Carousel — “5 signs you need a real program” (6 slides)** ⏱ 25 min

---

#### Day 9 — RIR / logging

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **02** | `set-row` 4s → `effort-rir` 4s → `rest-timer` 4s → `progression-hint` 3s | **CAP** + quiet **BEAT** · label “RIR = reps in reserve” text | CapCut | 10m |
| 📱 Static | **02** screenshot | `set-row` close-up + text “Active workout &gt; Notes app” | — | Canva | 10m |
| 📖 Stories | IG | Poll “Log RIR?” → follow-up text story explaining Good = 1–2 left | — | IG | 5m |

**🎬 Reel — “Log every rep” (25s)** ⏱ 10 min

Show sets, reps, rest timer, RIR if visible in UI.

**📱 Static:** “Active workout mode > Notes app”

**📖 Stories:** Poll — “Do you log RIR?” — educate in follow-up story

---

#### Day 10 — Offline (algorithm boost)

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **03** + **10** | List format text slides (Canva) #1 #2 → #3 `log-offline` 5s from batch-03 | **TREND** “things that make sense” + CAP | CapCut + Canva | 15m |
| 📱 Carousel | **CAM** + **Canva** | Gym bag photos 4 slides → last slide phone with ForgeRep (10 `pwa-icon` or 03 screenshot) | — | Camera + Canva | 20m |
| 📖 Stories | **03** | Reshare Reel + link | — | IG | 5m |

**🎬 Reel — Trend format (20s)** ⏱ 15 min — “Things that just make sense” → offline logging as #3 in list

**📱 Carousel — “Gym bag essentials” — last slide: ForgeRep on your phone

---

#### Day 11 — Nutrition pain

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **01** + **04** | Hook text → 01: `today-macros` pause on **protein bar** 6s → 04: `bars-update` after high-protein log | **VO** (short) or **CAP** · “calories ≠ protein” text | CapCut | 15m |
| 📱 Carousel | **Canva** | 5 slides protein science + disclaimer footer | — | Canva | 25m |
| 📖 Stories | **04** | `macro-bars` screenshot + “Protein goal today?” sticker | — | IG | 5m |

**🎬 Reel — “Tracking macros without a plan” (30s)** ⏱ 15 min

Hook: “You hit your calories but miss your protein — every time.” → show ForgeRep protein bar on home.

**📱 Carousel — “Protein targets from science” (5 slides)** — include “Educational — not medical advice”

---

#### Day 12 — Time budget

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **05** | Onboarding step 8 only: sessions/week + minutes — loop 3× or slow zoom | **VO** or **CAP** · “3 days? 45 min? Program adapts.” | CapCut | 15m |
| 📱 Static | **05** screenshot | Step 8 screen + headline text overlay in Canva | — | Canva | 10m |
| 📖 Stories | IG poll | 2–3 / 4–5 / 6+ training days | — | IG | 5m |

**🎬 Reel — “Only 3 days a week?” (25s)** ⏱ 15 min

Show onboarding schedule screen: program scales to your time budget.

**📱 Static:** “Your plan fits YOUR schedule — not a bodybuilder’s 6-day split.”

**📖 Stories:** Poll — 2-3 / 4-5 / 6+ training days

---

#### Day 13 — Equipment-aware

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **05** + **06** | 05 step 6 equipment chips → 06 `substitution` 5s | **BEAT** + CAP | CapCut | 15m |
| 📱 Carousel | **06** screenshots | `substitution` list + 3 text slides home vs commercial gym | — | Canva | 20m |
| 📖 Stories | **06** | Show one `substitution` swipe as 3-frame story | — | IG | 5m |

**🎬 Reel — “Home gym vs commercial gym” (30s)** ⏱ 15 min

Show equipment selection in onboarding → program adapts.

**📱 Carousel — “No barbell? No problem.” — substitutions feature

---

#### Day 14 — Week 2 recap + Batch Day 3

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **Repurpose** | Re-trim best clip from Days 8–13 (Insights → top Reel) · new hook text “Stop winging it” | Same as original or **TREND** | CapCut | 10m |
| 📱 Carousel | **Canva** | FAQ 6 slides (all text) | — | Canva | 25m |
| 📖 Stories | IG | AMA sticker — answer in replies | — | IG | 15m |
| ⏱ Batch | **Notes** + **MBS** | Write Week 3 captions in Notes · schedule in Meta Business Suite app | — | Phone | 2 hrs |

**🎬 Reel — “Stop winging it” (20s)**

**📱 Carousel — FAQ (6 slides):** Is it free? Offline? iOS/Android? Evidence? AI? Credit card?

**📖 Stories:** AMA — answer FAQ in story replies

**Batch Day 3:** Write Week 3 captions; schedule in Meta Business Suite

---

### Week 3 — Feature proof & evidence

#### Day 15 — Dashboard accountability

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **01** | Full scroll: `greeting` → `this-week` → `today-macros` → `body-of-work` · 25–30s | **VO** or **CAP** · “One screen. Full picture.” | CapCut | 10m |
| 📱 Carousel | **01** screenshot | Single home screenshot — add arrows in Canva (annotate) | — | Canva | 20m |
| 📖 Stories | **01** | `this-week` screenshot + “How’s your week going?” poll | — | IG | 5m |

**🎬 Reel — “Open the app. Know where you stand.” (30s)** ⏱ 10 min

Home screen: macros + weekly workouts + body of work.

**📱 Carousel — “Accountability at a glance” — annotate screenshot with arrows

---

#### Day 16 — Progressive overload

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **02** + **08** | 02: `progression-hint` 5s → `effort-rir` 3s → 08: `strength-chart` 5s (Pro demo) or 02 history | **VO** (explain progression) + CAP | CapCut | 20m |
| 📱 Static | **02** screenshot | `progression-hint` card + headline | — | Canva | 10m |
| 📖 Stories | **02** | Clip `effort-rir` with text “Good = 1–2 reps left” | — | IG | 5m |

**🎬 Reel — “How ForgeRep progresses your weights” (35s)** ⏱ 20 min

Screen record progression/RIR suggestion; or text over workout history chart.

**📱 Static:** “Progressive overload — tracked automatically”

---

#### Day 17 — Projections

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **08** | `projection-chart` 8s slow zoom → optional `log-form` 3s | **VO** or **CAP** · “30-day forecast” text | CapCut | 10m |
| 📱 Carousel | **08** screenshots | Trends tab + measurement list — 4–5 slides | — | Canva | 20m |
| 📖 Stories | **08** | `projection-chart` screenshot + link | — | IG | 5m |

**🎬 Reel — “30-day weight projection” (25s)** ⏱ 10 min

Show projection chart from progress tab.

**📱 Carousel — “Progress isn’t just the scale” — measurements, calipers, photos, trends

---

#### Day 18 — Deload weeks

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **07** + **02** | 07: rule card mentioning deload → 02: `week-plan` showing deload session name if visible | **VO** required · cite “~every 6 weeks” · educational tone | CapCut | 20m |
| 📱 Carousel | **Canva** | Recovery slides — deload, sleep, mobility (text + icons) | — | Canva | 25m |
| 📖 Stories | **07** | Reshare Day 3 quiz or new “Deload = recovery week” text | — | IG | 5m |

**🎬 Reel — “Why your program includes deload weeks” (30s)** ⏱ 20 min

Educational voiceover; cite “every ~6 training weeks” from marketing evidence points.

**📱 Carousel — “Recovery is programmed in” — sleep, deload, mobility blocks

---

#### Day 19 — Goals showcase

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **05** | Step 2 goal selection — cut between 5 goal taps (split into 5 clips) | **BEAT** + text labels per goal | CapCut | 15m |
| 📱 Static | **Canva** | 5 goal icons + “One app. Every goal.” | — | Canva | 15m |
| 📖 Stories | **05** | 5 stories — poll one goal type each | — | IG | 10m |

**🎬 Reel — “Pick your goal” (20s)** ⏱ 15 min

Fast cuts: Fat loss · Bodybuilding · Powerlifting · Strength · Recomposition

**📱 Static:** “One app. Every goal.” with five goal icons in Canva

**📖 Stories:** Poll each goal type across 5 stories

---

#### Day 20 — Community teaser (Pro)

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **09** | `leaderboard` 4s → `rival-card` 4s → `habit-score` 4s · on-screen **“Pro feature”** | **BEAT** + CAP | CapCut | 15m |
| 📱 Carousel | **09** screenshots | Habit score breakdown simplified — 4 slides | — | Canva | 20m |
| 📖 Stories | **09** | `rival-card` screenshot · “Train with a rival” text | — | IG | 5m |

**🎬 Reel — “Train with rivals, not alone” (30s)** ⏱ 15 min

Community tab: leaderboard, rank strip, weekly rival — “Pro feature — core training still free”

**📱 Carousel — “Accountability layer” — habit score simplified (training/protein/quality)

---

#### Day 21 — Week 3 recap + Batch Day 4

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **Repurpose** | Instagram → Insights → top Reel → repost with sticker “Missed this?” | Keep original audio | IG native | 5m |
| 📱 Carousel | **07** + **Canva** | 5 slides: screenshot `rule-card` + citation text from evidence page | — | Canva | 25m |
| ⏱ Batch | **CAM** | Film 10 hook clips (15s each) — you to camera OR gym B-roll for Week 4 | **TREND** or **VO** hook only | Camera | 2 hrs |

**🎬 Reel — Repost best performer with new hook** (check Insights → repost best Reel with “In case you missed it”)

**📱 Carousel — “Evidence-backed rules we use” — 5 rule examples from evidence-kb

**Batch Day 4:** Film 10 hook clips (15s each) for Week 4

---

### Week 4 — Convert & scale

#### Day 22 — Built for real gym sessions

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **03** + **02** + **10** | Montage: `log-offline` → `set-row` → `rest-timer` → `synced` → 10 `nav-tabs` | **VO** founder tone or **BEAT** + CAP | CapCut | 15m |
| 📱 Carousel | **Canva** + **CAM** | 5 slides founder story — optional gym photo as bg | — | Canva | 25m |
| 📖 Stories | Reshare | Reel + link | — | IG | 5m |

**🎬 Reel — “Built for real gym sessions” (30s)** ⏱ 15 min

Montage: offline, logging, rest timer, sync — “We built this because spreadsheets and random PDFs weren’t enough.”

**📱 Carousel — “Why we built ForgeRep” (5 slides) — founder story

---

#### Day 23 — Comparison

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **02** + **CAM** | Split screen: Notes app messy list (CAM/Canva) vs 02 `set-row` + `week-plan` | **TREND** or **CAP** · no competitor names | CapCut | 20m |
| 📱 Static | **Canva** | Text-only comparison graphic | — | Canva | 10m |
| 📖 Stories | **02** | `week-plan` screenshot + “Structured &gt; random” | — | IG | 5m |

**🎬 Reel — “Spreadsheet vs ForgeRep” (25s)** ⏱ 20 min

Split: messy notes app vs clean workout UI — don’t name competitors.

**📱 Static:** “Your program + macros + progress = one app”

---

#### Day 24 — Free tier push

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **01** + **02** + **03** + **04** + **06** | 2s each feature + green ✓ overlays in CapCut · 35s total | **BEAT** + CAP checklist style | CapCut | 10m |
| 📱 Carousel | **Canva** | Free vs Pro vs Pro+ — 4 slides (text matrix) | — | Canva | 20m |
| 📖 Stories | **Canva** | “Everything below is free” list sticker | — | IG | 5m |

**🎬 Reel — “Everything you need to train seriously — $0” (35s)** ⏱ 10 min

Rapid list with checkmarks (green `#22C55E`) over app clips.

**📱 Carousel — Free vs Pro vs Pro+ simplified (4 slides)** — end “Start on Free”

---

#### Day 25 — Hard CTA

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **05** + **02** | 05: signup → onboarding fast cuts → 02: `week-plan` “Monday’s session ready” | **VO** direct · “Starting Monday? Do this today.” | CapCut | 10m |
| 📱 Static | **Canva** | Bold CTA graphic — logo + “Create free account” | — | Canva | 10m |
| 📖 Stories | **05** | 8 frames: 2 onboarding screenshots alternating link stickers | — | IG | 15m |

**🎬 Reel — “If you’re starting Monday…” (20s)** ⏱ 10 min

Hook: “If you’re starting Monday, do this today.” → signup → onboarding → first workout scheduled.

**📱 Static:** Bold CTA: “Create free account → link in bio”

**📖 Stories:** 8-frame signup walkthrough; link sticker every 2nd frame

---

#### Day 26 — Workout music

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **10** | `music-picker` 6s → optional 02 `start-btn` with music playing | **BEAT** (show vibe names on screen) + CAP | CapCut | 10m |
| 📱 Carousel | **Canva** + **10** | 4 vibe cards: Focus / Pump / Cardio / Cooldown | — | Canva | 15m |
| 📖 Stories | **10** | Poll “Training music?” Spotify / Apple / None | — | IG | 5m |

**🎬 Reel — “Pick a vibe. Hit play.” (20s)** ⏱ 10 min

Show workout music picker + Spotify deep link — “All tiers. Spotify Premium for in-app controls.”

**📱 Carousel — 4 vibes: Focus / Pump / Cardio / Cooldown

---

#### Day 27 — Integrations (Pro+)

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|------|------|---|
| 🎬 Reel | **10** | `integrations` 8s scroll Fitbit/Withings cards · label **Pro+** on screen | **CAP** + soft **BEAT** | CapCut | 15m |
| 📱 Static | **10** screenshot | Integrations card + “Free to train. Upgrade for sync.” | — | Canva | 10m |
| 📖 Stories | **10** | One integration card + link | — | IG | 5m |

**🎬 Reel — “Connect Fitbit / wearables” (25s)** ⏱ 15 min

Integrations screen — positions Pro+ without blocking free signup message.

**📱 Static:** “Free to train. Upgrade when you want automation.”

---

#### Day 28 — Objection handling

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **05** | Step 3 experience levels — tap Beginner → Intermediate → Advanced | **VO** · “Beginner to advanced — program scales” | CapCut | 15m |
| 📱 Carousel | **Canva** | 5 beginner tips (text slides) | — | Canva | 20m |
| 📖 Stories | IG | Question box “What’s holding you back?” | — | IG | 10m |

**🎬 Reel — “Is this for beginners?” (30s)** ⏱ 15 min

Onboarding experience levels + program scaling — “Beginner to advanced.”

**📱 Carousel — “Beginner mistakes ForgeRep helps you avoid” (5 tips)

---

#### Day 29 — Best-of montage

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **All batch** | 1–2s best clip from each batch-01 through batch-07 · 45s | **BEAT** epic montage + CAP | CapCut | 30m |
| 📱 Carousel | **Canva** | 10 slides — one lesson per week/day (text recap) | — | Canva | 30m |
| 📖 Stories | IG | Countdown “Day 30 tomorrow” + link | — | IG | 5m |

**🎬 Reel — 45s montage Days 1–28** — “31 days of ForgeRep — day 30 is your turn”

**📱 Carousel — “Month 1 recap” — 10 slides, one lesson per slide

---

#### Day 30 — Conversion day

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **01** + **03** + **05** | 3s each: home → offline sync → onboarding · text CTA end | **VO** short direct sell or **BEAT** + bold text | CapCut | 10m |
| 📱 Static | **Canva** | Logo + “Start free today” + URL | — | Canva | 5m |
| 📖 Stories | IG all day | Link sticker every story · reshare feed · “DM GOAL” | — | IG | 20m |

**🎬 Reel — Direct CTA (15s):** Free account. Evidence-based plan. Offline gym logging. Link in bio.

**Optional swap:** If you have **`ForgeRep Promo - Phone.mp4`** (9:16 · ~15s), you may use it **instead of** the CapCut batch Reel on Day 30 — see [Promo assets (CTV + Phone)](#promo-assets-ctv--phone). Default remains batch clips (better native feed fit).

**📱 Static:** Minimal — logo + “Start free today” + URL

**📖 Stories:** All day — link sticker, reshare every post, “DM me GOAL for which plan fits you”

---

#### Day 31 — Next month tease

| Piece | Batch | Clips | Audio | Tool | ⏱ |
|-------|-------|-------|-------|------|---|
| 🎬 Reel | **CAM** | You to camera OR text-on-dark — ask “Month 2 topics?” | **VO** or **TREND** | Camera + CapCut | 10m |
| 📱 Carousel | **Canva** | 5-step checklist (signup → onboarding → workout → meal → progress) | — | Canva | 15m |
| 📖 Stories | IG | Poll Month 2 topics + thank you + link | — | IG | 10m |

**🎬 Reel — “What should Month 2 cover?” (20s)** ⏱ 10 min

Ask audience: form tips, meal prep, program breakdowns — comment CTA.

**📱 Carousel — Day 31 checklist:**

1. Sign up
2. Complete onboarding
3. Log first workout
4. Log first meal
5. Check progress

**📖 Stories:** Poll for Month 2 content + thank you + link

---

## Speed systems

### 15-minute Reel factory (when behind)

1. Pick hook from [Hook bank](#hook-bank)
2. One screen recording (3–10s)
3. CapCut auto-captions
4. Logo end card
5. Post

---

## Hook bank

Copy/paste for Reels:

- Your gym has no WiFi. Your app shouldn’t care.
- This isn’t a workout generator.
- Macros that match your program — not a random calculator.
- Evidence-based > Instagram hype.
- Log the set. Sync later. Keep training.
- Free doesn’t mean fake program.
- Accountability the second you open the app.
- 800+ exercises. One tap demos.
- Deload weeks are built in — on purpose.
- Stop starting over every Monday.

---

## Hashtag groups

Rotate one group per post (8–12 tags):

**A — Broad:** `#fitness #gym #workout #fitnessmotivation #gymlife #fitfam #training #health`

**B — Niche:** `#evidencebasedtraining #macrotracking #progressiveoverload #workouttracker #fitnessapp #offlinefitness #strengthtraining #nutrition`

**C — Intent:** `#fitnessjourney #accountability #fatloss #bodybuilding #powerlifting #mealprep #gymtok #fitnesstips`

---

## Growth accelerators

| Tactic | How |
|--------|-----|
| Collabs | DM 5 micro accounts (1–10k): free Pro month for honest Reel review |
| Giveaway (Day 15) | Follow + tag 1 gym buddy + signup screenshot (check local promo rules) |
| Cross-post | Same Reels to TikTok & YouTube Shorts same day |
| Alt text | “ForgeRep fitness app offline workout tracker evidence-based” |

---

## Promo assets (CTV + Phone)

Polished promo spots (e.g. MNTN QuickFrame exports) are **not** part of the daily organic Reel factory. This calendar’s reach engine is **Batch Day 0 screen recordings + CapCut**. Use promo files for **conversion moments and paid media** — not as a replacement for demo/skit Reels.

### Asset inventory

| File (example) | Aspect | Length | Primary channel |
|----------------|--------|--------|-----------------|
| `ForgeRep Promo.mp4` | 16:9 (1920×1080) | ~15s | **MNTN / CTV** — not Instagram feed |
| `ForgeRep Promo - Phone.mp4` | 9:16 (1080×1920) | ~15s | **Instagram Reels (optional organic)** · **Meta Ads Manager (paid)** |

Store exports outside the repo (e.g. Desktop or ad account asset library). Re-export with burned-in captions if the promo VO is hard to follow without sound.

### Organic Instagram — when to post

| Do | Don’t |
|----|-------|
| Post **Phone** promo **once** on **Day 30** (optional swap for batch CTA Reel) | Replace daily Reels (Days 1–29) with the promo |
| Cross-post Phone promo to **TikTok / YouTube Shorts** same day if you post organically | Expect promo to outperform screen-recording demos on reach |
| Pin only if it converts — otherwise keep pinned slots for Days 1, 3, 5 batch Reels | Post 16:9 CTV file to the Reels feed (letterboxed) |

**Default Day 30 Reel:** batch **01 + 03 + 05** in CapCut (native app demo feel). **Alternate:** Phone promo if you want a polished direct-response spot.

### Paid — Ads Manager vs Boost

**Prefer Meta Ads Manager** for signup campaigns. **Boost** is OK for small Y1 tests only (see `docs/business/forgeRep-5-year-business-plan.md` — modest boosted posts).

| | **Meta Ads Manager** | **Boost existing Reel** |
|--|----------------------|-------------------------|
| **Best for** | Signups, measurable ROAS | Quick $20–50 test |
| **Targeting** | Full (interests, lookalikes, retarget) | Limited |
| **Landing URL** | Dedicated UTM per campaign | Often bio link only |
| **Creative** | Upload Phone promo **without** organic post required | Must post first, then promote |
| **When to use** | **Primary** for Phone promo | Optional learning spend |

**Do not scale paid** until product metrics hit business-plan gates (90-day retention ≥40%, free→paid ≥8%).

### UTM & tracking

| Placement | Landing URL |
|-----------|-------------|
| Bio (organic) | `https://forge-rep.com/signup?utm_source=instagram&utm_medium=bio` |
| Meta Ads (Phone promo) | `https://forge-rep.com/signup?utm_source=meta&utm_medium=paid_social&utm_campaign=promo_phone` |
| MNTN (CTV) | `https://forge-rep.com/signup?utm_source=mntn&utm_medium=ctv&utm_campaign=quickframe` |

Use **`signup_source`** (or equivalent analytics) to compare organic calendar signups vs paid promo vs CTV — not Reel views alone.

### Recommended workflow

```
Weeks 1–4   Organic calendar only (batch Reels + carousels)
Day 30      Default: batch CTA Reel · Optional: post Phone promo once
Paid test   Upload Phone promo in Ads Manager (conversion → signup)
CTV         Run 16:9 promo on MNTN separately — do not cross-post to IG feed
Review      Weekly: link clicks + signups by UTM · pause paid if CAC > guardrails
```

### Quick decision tree

1. **Growing followers / trust?** → Batch screen-recording Reels (this calendar).
2. **One strong conversion post?** → Day 30 batch Reel **or** optional Phone promo organic post.
3. **Paying for signups?** → **Ads Manager + Phone promo + UTM** (not boost-first).
4. **TV viewers?** → **16:9 CTV promo on MNTN** — separate from Instagram.

---

## Metrics

Track weekly:

| Metric | Target (new account) |
|--------|----------------------|
| Reel views | 500+ Week 2; 2k+ Week 4 |
| Profile visits | Spikes after Reels |
| Link clicks | UTM on bio link |
| Saves | Education carousels > likes |
| Signups | 5–10/week = content working |

---

## First 48 hours checklist

- [ ] Profile + bio + link + highlights
- [ ] Canva templates + brand kit
- [ ] Batch Day 0 screen recordings
- [ ] Publish Day 1 Reel + Carousel
- [ ] Schedule Week 1 in Meta Business Suite
- [ ] Pin posts when Days 3 & 5 go live

---

## Brand references (in-repo)

| Asset | Path |
|-------|------|
| Promo spots (CTV + Phone) | External exports — see [Promo assets (CTV + Phone)](#promo-assets-ctv--phone) |
| Logo | `apps/web/public/logo.svg` |
| App icon | `apps/web/public/logo-icon.svg` |
| Marketing copy | `apps/web/src/components/marketing/` |
| SEO tagline | `apps/web/src/lib/seo/landing-metadata.ts` |
| Tier matrix | `docs/TIER-GATES.md` |
| Design tokens | `docs/DESIGN.md` |
