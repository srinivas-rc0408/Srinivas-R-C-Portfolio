import type { RarityId } from "./case-items";

/* ═══════════════════════════════════════════════════════════════
   CASE-OPENING SOUND DESIGN — Web Audio API, fully synthesized.
   No audio files: every sound is an oscillator/noise burst built at
   call time. Lazily creates one AudioContext per CaseOpening mount.
   ═══════════════════════════════════════════════════════════════ */

const MUTE_KEY = "case-audio-muted";
const MASTER_GAIN = 0.6;

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean) {
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

export class CaseAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  private ensure(): { ctx: AudioContext; master: GainNode } | null {
    if (isMuted()) return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = MASTER_GAIN;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return { ctx: this.ctx, master: this.master! };
  }

  dispose() {
    this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  /** Filtered noise burst + high sine blip. `pitchLift` (0-1) raises pitch over the final ticks. */
  tick(pitchLift: number) {
    const a = this.ensure();
    if (!a) return;
    const { ctx, master } = a;
    const now = ctx.currentTime;
    const semitoneUp = Math.pow(2, (pitchLift * 2) / 12);

    const blip = ctx.createOscillator();
    const blipGain = ctx.createGain();
    blip.type = "sine";
    blip.frequency.value = 1800 * semitoneUp;
    blipGain.gain.setValueAtTime(0.18, now);
    blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    blip.connect(blipGain).connect(master);
    blip.start(now);
    blip.stop(now + 0.06);

    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 4000 * semitoneUp;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start(now);
  }

  /** Low thump + soft click on landing. */
  landing() {
    const a = this.ensure();
    if (!a) return;
    const { ctx, master } = a;
    const now = ctx.currentTime;

    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "sine";
    thump.frequency.value = 80;
    thumpGain.gain.setValueAtTime(0.5, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    thump.connect(thumpGain).connect(master);
    thump.start(now);
    thump.stop(now + 0.25);

    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = "square";
    click.frequency.value = 400;
    clickGain.gain.setValueAtTime(0.08, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    click.connect(clickGain).connect(master);
    click.start(now);
    click.stop(now + 0.02);
  }

  /** Rarity-tiered reveal stinger. */
  reveal(rarity: RarityId) {
    const a = this.ensure();
    if (!a) return;
    const { ctx, master } = a;
    const now = ctx.currentTime;

    const note = (freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.2) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain).connect(master);
      osc.start(now + start);
      osc.stop(now + start + dur);
    };

    if (rarity === "blue") {
      note(523.25, 0, 0.3);
      note(659.25, 0.12, 0.35);
    } else if (rarity === "pink" || rarity === "purple") {
      note(523.25, 0, 0.25);
      note(659.25, 0.1, 0.25);
      note(783.99, 0.2, 0.4);
    } else if (rarity === "red") {
      note(392, 0, 0.3);
      note(523.25, 0.1, 0.3);
      note(659.25, 0.2, 0.3);
      note(987.77, 0.32, 0.6);
      // shimmer tail: detuned saw pad
      const pad = ctx.createOscillator();
      const pad2 = ctx.createOscillator();
      const padGain = ctx.createGain();
      pad.type = "sawtooth";
      pad2.type = "sawtooth";
      pad.frequency.value = 659.25;
      pad2.frequency.value = 661.5;
      padGain.gain.setValueAtTime(0, now + 0.3);
      padGain.gain.linearRampToValueAtTime(0.06, now + 0.4);
      padGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      pad.connect(padGain).connect(master);
      pad2.connect(padGain).connect(master);
      pad.start(now + 0.3);
      pad2.start(now + 0.3);
      pad.stop(now + 1.5);
      pad2.stop(now + 1.5);
    } else if (rarity === "gold") {
      // riser: filtered noise sweep into the reveal
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const riser = ctx.createBufferSource();
      riser.buffer = buffer;
      const riserFilter = ctx.createBiquadFilter();
      riserFilter.type = "bandpass";
      riserFilter.frequency.setValueAtTime(200, now);
      riserFilter.frequency.exponentialRampToValueAtTime(6000, now + 0.8);
      const riserGain = ctx.createGain();
      riserGain.gain.setValueAtTime(0.001, now);
      riserGain.gain.exponentialRampToValueAtTime(0.3, now + 0.75);
      riserGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      riser.connect(riserFilter).connect(riserGain).connect(master);
      riser.start(now);

      // bright major arpeggio into a long shimmering tail
      note(523.25, 0.8, 0.3, "triangle", 0.25);
      note(659.25, 0.92, 0.3, "triangle", 0.25);
      note(783.99, 1.04, 0.3, "triangle", 0.25);
      note(1046.5, 1.18, 1.2, "triangle", 0.3);

      const tail = ctx.createOscillator();
      const tail2 = ctx.createOscillator();
      const tailGain = ctx.createGain();
      tail.type = "sawtooth";
      tail2.type = "sawtooth";
      tail.frequency.value = 1046.5;
      tail2.frequency.value = 1050;
      tailGain.gain.setValueAtTime(0, now + 1.2);
      tailGain.gain.linearRampToValueAtTime(0.05, now + 1.3);
      tailGain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
      tail.connect(tailGain).connect(master);
      tail2.connect(tailGain).connect(master);
      tail.start(now + 1.2);
      tail2.start(now + 1.2);
      tail.stop(now + 2.6);
      tail2.stop(now + 2.6);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   CUBIC-BEZIER SOLVER
   Standard CSS-style cubic-bezier(x1,y1,x2,y2) evaluated via
   Newton-Raphson. Used to sample-lock tick timing to the same curve
   driving the roulette's translateX animation.
   ═══════════════════════════════════════════════════════════════ */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (time: number): number => {
    let t = time;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(t) - time;
      const derivative = sampleDX(t);
      if (Math.abs(derivative) < 1e-6) break;
      t -= dx / derivative;
    }
    return sampleY(t);
  };
}

export interface TickEvent {
  /** ms from animation start */
  delay: number;
  /** 0-1, raised only over the final 10 ticks */
  pitchLift: number;
}

/**
 * Samples the roulette's own easing curve to find the moments the strip
 * crosses each card boundary, so ticks are sample-locked to the motion
 * instead of firing on a fixed interval.
 */
export function buildTickSchedule(
  distance: number,
  itemWidth: number,
  durationMs: number,
  bezierPoints: [number, number, number, number]
): TickEvent[] {
  const ease = cubicBezier(...bezierPoints);
  const steps = 600;
  const delays: number[] = [];
  let lastBoundary = 0;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const traveled = ease(t) * distance;
    const boundary = Math.floor(traveled / itemWidth);
    if (boundary > lastBoundary) {
      lastBoundary = boundary;
      delays.push(t * durationMs);
    }
  }

  const total = delays.length;
  return delays.map((delay, i) => ({
    delay,
    pitchLift: i >= total - 10 ? (i - (total - 10)) / 10 : 0,
  }));
}
