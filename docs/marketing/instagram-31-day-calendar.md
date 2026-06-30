# ForgeRep Instagram — 31-Day Content Calendar

> **Printable field guide:** [forge-rep.com/docs/marketing/ig31](https://forge-rep.com/docs/marketing/ig31) — open on phone or desktop → Print (⌘P). Source: `apps/web/content/marketing/ig31-print.html`

> **Account:** [@forgerep](https://instagram.com/forgerep)  
> **Goal:** Grow followers quickly → convert to app signups at `https://forge-rep.com/signup`  
> **Cadence:** 1 Reel + 1 Carousel/static daily + 5–8 Stories (~2 feed touchpoints/day)  
> **Time budget:** ~45–60 min/day after batch setup; ~4 hours on batch days (Days 0, 7, 14, 21)

**Last updated:** 2026-06-26

---

## Table of contents

1. [Profile setup](#profile-setup)
2. [Pre-launch setup (Day 0)](#pre-launch-setup-day-0)
   - [Batch Day 0 screen recording playbook](#batch-day-0--screen-recording-playbook-4-hours)
   - [Demo account tier](#demo-account-tier-free-vs-pro-vs-pro)
3. [Content system](#content-system)
4. [Daily rhythm](#daily-rhythm)
5. [Week themes](#week-themes)
6. [Day-by-day calendar](#day-by-day-calendar)
7. [Speed systems](#speed-systems)
8. [Hook bank](#hook-bank)
9. [Hashtag groups](#hashtag-groups)
10. [Growth accelerators](#growth-accelerators)
11. [Metrics](#metrics)
12. [First 48 hours checklist](#first-48-hours-checklist)
13. [Brand references (in-repo)](#brand-references-in-repo)

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

## Day-by-day calendar

### Week 1 — Launch & identity

#### Day 1 — What is ForgeRep?

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

**🎬 Reel — “POV: gym has no signal” (25s)** ⏱ 15 min

- Hook: “POV: your gym’s WiFi gave up but your workout didn’t”
- Show: airplane mode → log set → sync ✓
- End: “ForgeRep — works offline”

**Caption:** Gym dead zones aren’t an excuse anymore. Log sets offline; sync when you’re back. Free — link in bio.

**📱 Static:** “Works offline. Syncs when signal returns.” — ForgeRep · Free to start

**📖 Stories:** Split “No signal 😤” / “Still logging 💪” → link sticker

---

#### Day 3 — Evidence-based (trust)

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

**🎬 Reel — “Macros that match your program” (30s)** ⏱ 15 min

- Hook: “Generic macro calculators vs targets from YOUR plan.”

**📱 Carousel — “Log a meal in 4 taps” (4 slides + CTA)** ⏱ 20 min

Step screenshots from batch: search food → select → see macros update → home dashboard % bars.

**📖 Stories:** “What I ate today” format using demo diary

---

#### Day 5 — Onboarding / signup push

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

**🎬 Reel — “800+ exercises with demos” (20s)** ⏱ 10 min

Quick montage: search exercise → GIF plays → muscle heatmap → substitution swap.

**📱 Static:** “Equipment busy? ForgeRep suggests substitutions.”

**📖 Stories:** Poll Bench / Squat / Deadlift → show demo

---

#### Day 7 — Week 1 recap + Batch Day 2

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

**🎬 Reel — “Log every rep” (25s)** ⏱ 10 min

Show sets, reps, rest timer, RIR if visible in UI.

**📱 Static:** “Active workout mode > Notes app”

**📖 Stories:** Poll — “Do you log RIR?” — educate in follow-up story

---

#### Day 10 — Offline (algorithm boost)

**🎬 Reel — Trend format (20s)** ⏱ 15 min — “Things that just make sense” → offline logging as #3 in list

**📱 Carousel — “Gym bag essentials” — last slide: ForgeRep on your phone

---

#### Day 11 — Nutrition pain

**🎬 Reel — “Tracking macros without a plan” (30s)** ⏱ 15 min

Hook: “You hit your calories but miss your protein — every time.” → show ForgeRep protein bar on home.

**📱 Carousel — “Protein targets from science” (5 slides)** — include “Educational — not medical advice”

---

#### Day 12 — Time budget

**🎬 Reel — “Only 3 days a week?” (25s)** ⏱ 15 min

Show onboarding schedule screen: program scales to your time budget.

**📱 Static:** “Your plan fits YOUR schedule — not a bodybuilder’s 6-day split.”

**📖 Stories:** Poll — 2-3 / 4-5 / 6+ training days

---

#### Day 13 — Equipment-aware

**🎬 Reel — “Home gym vs commercial gym” (30s)** ⏱ 15 min

Show equipment selection in onboarding → program adapts.

**📱 Carousel — “No barbell? No problem.” — substitutions feature

---

#### Day 14 — Week 2 recap + Batch Day 3

**🎬 Reel — “Stop winging it” (20s)**

**📱 Carousel — FAQ (6 slides):** Is it free? Offline? iOS/Android? Evidence? AI? Credit card?

**📖 Stories:** AMA — answer FAQ in story replies

**Batch Day 3:** Write Week 3 captions; schedule in Meta Business Suite

---

### Week 3 — Feature proof & evidence

#### Day 15 — Dashboard accountability

**🎬 Reel — “Open the app. Know where you stand.” (30s)** ⏱ 10 min

Home screen: macros + weekly workouts + body of work.

**📱 Carousel — “Accountability at a glance” — annotate screenshot with arrows

---

#### Day 16 — Progressive overload

**🎬 Reel — “How ForgeRep progresses your weights” (35s)** ⏱ 20 min

Screen record progression/RIR suggestion; or text over workout history chart.

**📱 Static:** “Progressive overload — tracked automatically”

---

#### Day 17 — Projections

**🎬 Reel — “30-day weight projection” (25s)** ⏱ 10 min

Show projection chart from progress tab.

**📱 Carousel — “Progress isn’t just the scale” — measurements, calipers, photos, trends

---

#### Day 18 — Deload weeks

**🎬 Reel — “Why your program includes deload weeks” (30s)** ⏱ 20 min

Educational voiceover; cite “every ~6 training weeks” from marketing evidence points.

**📱 Carousel — “Recovery is programmed in” — sleep, deload, mobility blocks

---

#### Day 19 — Goals showcase

**🎬 Reel — “Pick your goal” (20s)** ⏱ 15 min

Fast cuts: Fat loss · Bodybuilding · Powerlifting · Strength · Recomposition

**📱 Static:** “One app. Every goal.” with five goal icons in Canva

**📖 Stories:** Poll each goal type across 5 stories

---

#### Day 20 — Community teaser (Pro)

**🎬 Reel — “Train with rivals, not alone” (30s)** ⏱ 15 min

Community tab: leaderboard, rank strip, weekly rival — “Pro feature — core training still free”

**📱 Carousel — “Accountability layer” — habit score simplified (training/protein/quality)

---

#### Day 21 — Week 3 recap + Batch Day 4

**🎬 Reel — Repost best performer with new hook** (check Insights → repost best Reel with “In case you missed it”)

**📱 Carousel — “Evidence-backed rules we use” — 5 rule examples from evidence-kb

**Batch Day 4:** Film 10 hook clips (15s each) for Week 4

---

### Week 4 — Convert & scale

#### Day 22 — Built for real gym sessions

**🎬 Reel — “Built for real gym sessions” (30s)** ⏱ 15 min

Montage: offline, logging, rest timer, sync — “We built this because spreadsheets and random PDFs weren’t enough.”

**📱 Carousel — “Why we built ForgeRep” (5 slides) — founder story

---

#### Day 23 — Comparison

**🎬 Reel — “Spreadsheet vs ForgeRep” (25s)** ⏱ 20 min

Split: messy notes app vs clean workout UI — don’t name competitors.

**📱 Static:** “Your program + macros + progress = one app”

---

#### Day 24 — Free tier push

**🎬 Reel — “Everything you need to train seriously — $0” (35s)** ⏱ 10 min

Rapid list with checkmarks (green `#22C55E`) over app clips.

**📱 Carousel — Free vs Pro vs Pro+ simplified (4 slides)** — end “Start on Free”

---

#### Day 25 — Hard CTA

**🎬 Reel — “If you’re starting Monday…” (20s)** ⏱ 10 min

Hook: “If you’re starting Monday, do this today.” → signup → onboarding → first workout scheduled.

**📱 Static:** Bold CTA: “Create free account → link in bio”

**📖 Stories:** 8-frame signup walkthrough; link sticker every 2nd frame

---

#### Day 26 — Workout music

**🎬 Reel — “Pick a vibe. Hit play.” (20s)** ⏱ 10 min

Show workout music picker + Spotify deep link — “All tiers. Spotify Premium for in-app controls.”

**📱 Carousel — 4 vibes: Focus / Pump / Cardio / Cooldown

---

#### Day 27 — Integrations (Pro+)

**🎬 Reel — “Connect Fitbit / wearables” (25s)** ⏱ 15 min

Integrations screen — positions Pro+ without blocking free signup message.

**📱 Static:** “Free to train. Upgrade when you want automation.”

---

#### Day 28 — Objection handling

**🎬 Reel — “Is this for beginners?” (30s)** ⏱ 15 min

Onboarding experience levels + program scaling — “Beginner to advanced.”

**📱 Carousel — “Beginner mistakes ForgeRep helps you avoid” (5 tips)

---

#### Day 29 — Best-of montage

**🎬 Reel — 45s montage Days 1–28** — “31 days of ForgeRep — day 30 is your turn”

**📱 Carousel — “Month 1 recap” — 10 slides, one lesson per slide

---

#### Day 30 — Conversion day

**🎬 Reel — Direct CTA (15s):** Free account. Evidence-based plan. Offline gym logging. Link in bio.

**📱 Static:** Minimal — logo + “Start free today” + URL

**📖 Stories:** All day — link sticker, reshare every post, “DM me GOAL for which plan fits you”

---

#### Day 31 — Next month tease

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
| Logo | `apps/web/public/logo.svg` |
| App icon | `apps/web/public/logo-icon.svg` |
| Marketing copy | `apps/web/src/components/marketing/` |
| SEO tagline | `apps/web/src/lib/seo/landing-metadata.ts` |
| Tier matrix | `docs/TIER-GATES.md` |
| Design tokens | `docs/DESIGN.md` |
