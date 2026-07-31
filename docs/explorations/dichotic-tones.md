# Exploration — Dichotic / Per-Ear Frequency Player

> **Status:** Feasibility confirmed · interactive prototype at `prototypes/dichotic-tones/`  
> **Date:** 2026-07-31  
> **Scope:** Standalone exploration — **not** part of forgeFit product phases

---

## Verdict

**Yes — this is straightforward to build.** The browser Web Audio API can generate independent oscillators routed to left and right channels, with live frequency control per ear. Headphones (or earbuds) are required for the effect to work; speakers mix both channels into the room.

A working proof of concept lives in [`prototypes/dichotic-tones/index.html`](../../prototypes/dichotic-tones/index.html) — open it in a desktop browser with headphones.

---

## What “different frequency per ear” means

| Mode | Left ear | Right ear | Perceived effect |
|------|----------|-----------|------------------|
| **Dichotic tones** | Any Hz | Any Hz | Two distinct pitches (independent control) |
| **Binaural beats** | Carrier Hz | Carrier ± Δ Hz | Brain interprets |L−R| as a low “beat” (typically 1–30 Hz) |
| **Isochronic / monaural** | Same signal both ears | Same | Pulsing amplitude; no stereo split needed |

This exploration targets **dichotic tones with independent per-ear frequency** (which also covers binaural-beat use by setting a small Δ).

---

## Technical approach (recommended: Web)

### Signal graph

```
[Oscillator L] → [Gain L] → ChannelMerger(0) ─┐
                                               ├→ [Master Gain] → destination
[Oscillator R] → [Gain R] → ChannelMerger(1) ─┘
```

- `OscillatorNode.frequency` is an `AudioParam` — set or ramp independently per ear.
- `ChannelMergerNode` assigns left → output channel 0, right → channel 1.
- Alternative: two `StereoPannerNode`s at `pan = -1` and `pan = +1`.

### Core API surface (already in every modern browser)

| Need | API |
|------|-----|
| Tone generation | `OscillatorNode` (sine / square / sawtooth / triangle) |
| Per-ear routing | `ChannelMergerNode` or dual `StereoPannerNode` |
| Volume | `GainNode` |
| Smooth frequency changes | `frequency.setTargetAtTime` / `linearRampToValueAtTime` |
| User gesture gate | `AudioContext.resume()` on first Play click (autoplay policy) |

### Prototype features

- Independent left / right frequency sliders (20–1500 Hz)
- Live |L−R| “beat difference” readout
- Per-ear mute + shared master volume
- Waveform select
- Presets (pure dichotic, classic binaural deltas, unison)
- Soft start/stop ramps to avoid clicks

---

## Platform options

| Target | Feasibility | Notes |
|--------|-------------|-------|
| **Static web / PWA** | Excellent | Prototype path; works offline once cached; no backend required |
| **Next.js route in forgeFit** | Easy | Could live under a labs/tools page; keep out of workout program logic |
| **iOS / Android native** | Excellent | `AVAudioEngine` / `AudioTrack` stereo buffers; better background playback |
| **Capacitor wrap of web** | Good | Reuses Web Audio; still needs headphone UX copy |

**MVP recommendation:** ship as a single-page web app (or PWA). No server, no auth, no database.

---

## Constraints & UX requirements

1. **Headphones required** — show a clear prompt; stereo speakers collapse the effect.
2. **User gesture to start** — browsers block audio until click/tap.
3. **Safe defaults** — start muted or quiet (~10–20% gain); warn on high volume / very low or very high Hz.
4. **Frequency ranges** — human hearing ~20–20,000 Hz; for comfort keep carriers ~100–600 Hz for binaural use; allow wider for experimentation.
5. **Background playback** — mobile browsers may suspend `AudioContext` when backgrounded (same class of issues as forgeFit Phase 12 timers). Native or media-session + silent keep-alive patterns help if long sessions matter.
6. **No medical claims** — binaural “focus/sleep” marketing is lightly evidenced; treat as a tone tool, not therapy.

---

## Product fit with forgeFit

| Option | Fit | Effort shape |
|--------|-----|--------------|
| **A. Keep as standalone prototype** | Clean separation | Zero impact on phases 11–14 |
| **B. forgeFit “Focus tones” lab** (Pro+) | Optional wellness during rest / recovery | New UI surface + freemium gate; still no program-engine changes |
| **C. Separate product / subdomain** | Independent brand | Own deploy; shared design tokens optional |

**Recommendation for now:** Option A — validate UX with the prototype. Only promote into forgeFit if users ask for focus/recovery audio during rest timers. Program logic must remain in `program-engine` + `evidence-kb` (Bible rule); tones would be a pure client audio accessory.

---

## Implementation sketch (production)

```ts
export class DichoticToneEngine {
  private ctx: AudioContext;
  private leftOsc: OscillatorNode;
  private rightOsc: OscillatorNode;
  private leftGain: GainNode;
  private rightGain: GainNode;
  private master: GainNode;
  private merger: ChannelMergerNode;

  async start() {
    await this.ctx.resume();
    // create graph once; start oscillators; ramp master gain up
  }

  setLeftHz(hz: number) {
    this.leftOsc.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.01);
  }

  setRightHz(hz: number) {
    this.rightOsc.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.01);
  }
}
```

Rough production surface area: **~1 audio engine module + 1 UI screen** (sliders, play/stop, presets). No schema, no migrations.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Users expect clinical benefits | Copy: “tone generator,” not “therapy” |
| Ear fatigue / loud volume | Soft default gain, optional session timer |
| iOS background suspend | Document limitation; optional native later |
| Accidental merge into forgeFit roadmap | Keep under `prototypes/` + this exploration doc |

---

## What’s next (if pursued)

1. Open `prototypes/dichotic-tones/index.html` with headphones and validate L/R independence.
2. Decide product home: standalone PWA vs forgeFit lab vs defer.
3. If productizing: extract `DichoticToneEngine`, add presets, session timer, PWA install, volume safety.
4. Optional: save favorite L/R pairs to `localStorage` (no backend needed).

---

## Files

| Path | Role |
|------|------|
| `docs/explorations/dichotic-tones.md` | This feasibility note |
| `prototypes/dichotic-tones/index.html` | Interactive Web Audio POC |
| `prototypes/dichotic-tones/app.js` | Tone engine + UI wiring |
| `prototypes/dichotic-tones/styles.css` | Prototype UI |
