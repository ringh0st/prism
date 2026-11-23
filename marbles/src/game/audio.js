// The sounds of a marbles game, all made in the browser (no files): glass clacking on glass, a marble knocking a
// pebble or the kerb, the hollow plop into the hole, the hiss of marbles rolling on packed earth, and a few notes
// for good and bad moments.
let ctx = null;
let out = null;
let rolling = null;
let isOn = true;

function ac() {
  try {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -12;
      limiter.connect(ctx.destination);
      out = ctx.createGain();
      out.connect(limiter);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, to, dur, { type = 'sine', vol = 0.15, delay = 0 } = {}) {
  const a = ac();
  if (!a || !isOn) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

let noise = null;
function noiseBuffer(a) {
  if (!noise) {
    noise = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

function hiss(dur, { freq = 2000, q = 1, vol = 0.1, type = 'bandpass' } = {}) {
  const a = ac();
  if (!a || !isOn) return;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a);
  const filter = a.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = a.createGain();
  gain.gain.setValueAtTime(vol, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  src.start(a.currentTime, Math.random() * 0.5, dur + 0.02);
}

/** How loud a knock is for how hard it was (0…1). */
const loud = (force, full) => Math.min(1, Math.max(0.08, force / full));

export const sfx = {
  unlock: () => ac(),
  setOn(on) {
    isOn = on;
    if (!on) sfx.roll(0);
  },
  /** Glass on glass: a bright double "tk" that rings for a moment. Harder hits are louder and a little lower. */
  clack(force) {
    const k = loud(force, 700);
    tone(3300 - k * 500, 2900 - k * 500, 0.05, { vol: 0.22 * k });
    tone(5200, 4700, 0.03, { vol: 0.12 * k, type: 'triangle' });
    tone(1700, 1650, 0.09, { vol: 0.05 * k });
    hiss(0.015, { freq: 6500, vol: 0.2 * k, type: 'highpass' });
  },
  /** A marble on a pebble: duller, shorter. */
  stone(force) {
    const k = loud(force, 700);
    tone(900, 600, 0.05, { vol: 0.16 * k, type: 'triangle' });
    hiss(0.03, { freq: 2600, vol: 0.18 * k });
  },
  /** The kerb: a low thud. */
  kerb(force) {
    const k = loud(force, 800);
    tone(180, 90, 0.1, { vol: 0.2 * k, type: 'triangle' });
    hiss(0.04, { freq: 900, vol: 0.1 * k });
  },
  /** Into the hole: a hollow plop and a short rattle at the bottom. */
  sunk() {
    tone(520, 140, 0.16, { vol: 0.2 });
    tone(260, 200, 0.08, { vol: 0.1, delay: 0.14, type: 'triangle' });
    hiss(0.06, { freq: 700, vol: 0.08 });
  },
  /** A high shot lands. */
  land(force) {
    sfx.kerb(force * 0.7);
  },
  /** The flick itself: a nail on glass. */
  flick(power) {
    hiss(0.05, { freq: 3000 + power * 2000, vol: 0.08 + power * 0.1 });
    tone(1400, 2000, 0.03, { vol: 0.05 });
  },
  /** Marbles rolling on earth: a soft hiss that follows how fast they go (0…1). Call every frame. */
  roll(level) {
    const a = ac();
    if (!a) return;
    if (!rolling) {
      const src = a.createBufferSource();
      src.buffer = noiseBuffer(a);
      src.loop = true;
      const filter = a.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 0.7;
      const gain = a.createGain();
      gain.gain.value = 0;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      src.start();
      rolling = { filter, gain };
    }
    const k = isOn ? Math.min(1, level) : 0;
    rolling.gain.gain.setTargetAtTime(k * 0.07, a.currentTime, 0.05);
    rolling.filter.frequency.setTargetAtTime(500 + k * 1500, a.currentTime, 0.05);
  },
  /** "Bakol!": a broom sweeps the pebbles away. */
  sweep() {
    hiss(0.35, { freq: 1800, q: 0.5, vol: 0.2 });
    hiss(0.3, { freq: 3200, q: 0.5, vol: 0.1 });
  },
  /** A marble won. */
  win() {
    [660, 880].forEach((f, i) => tone(f, f, 0.14, { vol: 0.1, delay: i * 0.09, type: 'triangle' }));
  },
  /** A foul, or a turn lost: two soft notes down. */
  miss() {
    [330, 262].forEach((f, i) => tone(f, f, 0.16, { vol: 0.07, delay: i * 0.1, type: 'triangle' }));
  },
  /** The game is won. */
  cheer() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, f, 0.26, { vol: 0.11, delay: i * 0.09, type: 'triangle' }));
  },
  click() {
    tone(700, 900, 0.04, { vol: 0.05 });
  },
};
