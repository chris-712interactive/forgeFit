/**
 * Dichotic tone engine — independent left/right OscillatorNodes
 * via ChannelMergerNode for true stereo channel assignment.
 */

const PRESETS = {
  unison: { left: 200, right: 200 },
  binaural4: { left: 200, right: 204 },
  binaural10: { left: 200, right: 210 },
  wide: { left: 180, right: 420 },
};

class DichoticToneEngine {
  constructor() {
    this.ctx = null;
    this.leftOsc = null;
    this.rightOsc = null;
    this.leftGain = null;
    this.rightGain = null;
    this.master = null;
    this.merger = null;
    this.playing = false;
    this.leftMuted = false;
    this.rightMuted = false;
    this.leftHz = 220;
    this.rightHz = 240;
    this.waveform = "sine";
    this.masterVolume = 0.18;
  }

  async ensureGraph() {
    if (this.ctx) return;

    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();

    this.leftOsc = this.ctx.createOscillator();
    this.rightOsc = this.ctx.createOscillator();
    this.leftGain = this.ctx.createGain();
    this.rightGain = this.ctx.createGain();
    this.master = this.ctx.createGain();
    this.merger = this.ctx.createChannelMerger(2);

    this.leftOsc.type = this.waveform;
    this.rightOsc.type = this.waveform;
    this.leftOsc.frequency.value = this.leftHz;
    this.rightOsc.frequency.value = this.rightHz;

    this.leftGain.gain.value = this.leftMuted ? 0 : 1;
    this.rightGain.gain.value = this.rightMuted ? 0 : 1;
    this.master.gain.value = 0;

    this.leftOsc.connect(this.leftGain);
    this.rightOsc.connect(this.rightGain);
    this.leftGain.connect(this.merger, 0, 0);
    this.rightGain.connect(this.merger, 0, 1);
    this.merger.connect(this.master);
    this.master.connect(this.ctx.destination);

    this.leftOsc.start();
    this.rightOsc.start();
  }

  async start() {
    await this.ensureGraph();
    await this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.masterVolume, now + 0.08);
    this.playing = true;
  }

  stop() {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.06);
    this.playing = false;
  }

  setLeftHz(hz) {
    this.leftHz = clamp(hz, 20, 1500);
    if (this.leftOsc) {
      this.leftOsc.frequency.setTargetAtTime(this.leftHz, this.ctx.currentTime, 0.015);
    }
  }

  setRightHz(hz) {
    this.rightHz = clamp(hz, 20, 1500);
    if (this.rightOsc) {
      this.rightOsc.frequency.setTargetAtTime(this.rightHz, this.ctx.currentTime, 0.015);
    }
  }

  setWaveform(type) {
    this.waveform = type;
    if (this.leftOsc) this.leftOsc.type = type;
    if (this.rightOsc) this.rightOsc.type = type;
  }

  setMasterVolume(norm) {
    this.masterVolume = clamp(norm, 0, 1);
    if (this.master && this.playing) {
      this.master.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  setLeftMuted(muted) {
    this.leftMuted = muted;
    if (this.leftGain) {
      this.leftGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }

  setRightMuted(muted) {
    this.rightMuted = muted;
    if (this.rightGain) {
      this.rightGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }

  get delta() {
    return Math.abs(this.leftHz - this.rightHz);
  }
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function sampleWave(type, phase) {
  switch (type) {
    case "square":
      return phase < Math.PI ? 1 : -1;
    case "sawtooth":
      return 2 * (phase / (2 * Math.PI)) - 1;
    case "triangle":
      return 1 - 4 * Math.abs(phase / (2 * Math.PI) - 0.5);
    default:
      return Math.sin(phase);
  }
}

function paintWave(canvas, engine, t) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 720;
  const cssH = 120;
  if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
  }

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const mid = h / 2;
  ctx.strokeStyle = "rgba(200, 210, 203, 0.12)";
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.moveTo(0, mid);
  ctx.lineTo(w, mid);
  ctx.stroke();

  const drawChannel = (hz, color, muted, phaseOffset) => {
    if (muted) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 * dpr;
    const amp = h * 0.28;
    const cycles = Math.max(2, Math.min(18, hz / 40));
    for (let x = 0; x <= w; x += 2 * dpr) {
      const phase =
        ((x / w) * cycles * Math.PI * 2 + t * (hz / 60) + phaseOffset) % (Math.PI * 2);
      const y = mid + sampleWave(engine.waveform, phase) * amp * (engine.playing ? 1 : 0.35);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawChannel(engine.leftHz, "rgba(126, 184, 255, 0.9)", engine.leftMuted, 0);
  drawChannel(engine.rightHz, "rgba(255, 184, 107, 0.85)", engine.rightMuted, Math.PI / 3);
}

function syncPair(slider, number, hz) {
  slider.value = String(hz);
  number.value = String(hz);
}

function boot() {
  const engine = new DichoticToneEngine();

  const playBtn = document.getElementById("playBtn");
  const playText = playBtn.querySelector(".play-text");
  const masterVol = document.getElementById("masterVol");
  const leftHz = document.getElementById("leftHz");
  const rightHz = document.getElementById("rightHz");
  const leftHzNum = document.getElementById("leftHzNum");
  const rightHzNum = document.getElementById("rightHzNum");
  const leftReadout = document.getElementById("leftReadout");
  const rightReadout = document.getElementById("rightReadout");
  const deltaReadout = document.getElementById("deltaReadout");
  const waveform = document.getElementById("waveform");
  const canvas = document.getElementById("waveCanvas");
  const leftEar = document.querySelector('.ear[data-ear="left"]');
  const rightEar = document.querySelector('.ear[data-ear="right"]');

  function refreshReadouts() {
    leftReadout.textContent = String(Math.round(engine.leftHz));
    rightReadout.textContent = String(Math.round(engine.rightHz));
    deltaReadout.textContent = String(Math.round(engine.delta));
  }

  async function togglePlay() {
    if (engine.playing) {
      engine.stop();
      playBtn.setAttribute("aria-pressed", "false");
      playText.textContent = "Play";
    } else {
      await engine.start();
      playBtn.setAttribute("aria-pressed", "true");
      playText.textContent = "Stop";
    }
  }

  playBtn.addEventListener("click", () => {
    togglePlay().catch((err) => {
      console.error(err);
      playText.textContent = "Unavailable";
    });
  });

  masterVol.addEventListener("input", () => {
    engine.setMasterVolume(Number(masterVol.value) / 100);
  });

  function onLeft(value) {
    const hz = Number(value);
    if (!Number.isFinite(hz)) return;
    engine.setLeftHz(hz);
    syncPair(leftHz, leftHzNum, engine.leftHz);
    refreshReadouts();
  }

  function onRight(value) {
    const hz = Number(value);
    if (!Number.isFinite(hz)) return;
    engine.setRightHz(hz);
    syncPair(rightHz, rightHzNum, engine.rightHz);
    refreshReadouts();
  }

  leftHz.addEventListener("input", () => onLeft(leftHz.value));
  rightHz.addEventListener("input", () => onRight(rightHz.value));
  leftHzNum.addEventListener("change", () => onLeft(leftHzNum.value));
  rightHzNum.addEventListener("change", () => onRight(rightHzNum.value));

  waveform.addEventListener("change", () => {
    engine.setWaveform(waveform.value);
  });

  document.querySelectorAll("[data-mute]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const side = btn.getAttribute("data-mute");
      const next = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", String(next));
      if (side === "left") {
        engine.setLeftMuted(next);
        leftEar.classList.toggle("is-muted", next);
      } else {
        engine.setRightMuted(next);
        rightEar.classList.toggle("is-muted", next);
      }
    });
  });

  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-preset");
      const preset = PRESETS[key];
      if (!preset) return;
      engine.setLeftHz(preset.left);
      engine.setRightHz(preset.right);
      syncPair(leftHz, leftHzNum, engine.leftHz);
      syncPair(rightHz, rightHzNum, engine.rightHz);
      refreshReadouts();
    });
  });

  engine.setMasterVolume(Number(masterVol.value) / 100);
  refreshReadouts();

  let start = performance.now();
  function frame(now) {
    paintWave(canvas, engine, (now - start) / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
