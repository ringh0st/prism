// Tiny Web Audio synth: every sound is generated, so there are no files to load.

let context = null;
let enabled = true;
let hapticsEnabled = true;

function audio() {
  if (!enabled) return null;
  try {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(from, to, duration, { type = 'sine', volume = 0.15, delay = 0 } = {}) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function vibrate(pattern) {
  if (hapticsEnabled) navigator.vibrate?.(pattern);
}

const PENTATONIC = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

export const sfx = {
  configure({ sound, haptics }) {
    enabled = sound;
    hapticsEnabled = haptics;
  },
  unlock() {
    audio();
  },
  rotate() {
    tone(420, 620, 0.07, { type: 'triangle', volume: 0.08 });
    vibrate(6);
  },
  gemLit(count) {
    const note = PENTATONIC[Math.min(count, PENTATONIC.length - 1)];
    tone(note, note * 1.01, 0.28, { type: 'sine', volume: 0.14 });
    tone(note * 2, note * 2.02, 0.2, { type: 'triangle', volume: 0.04, delay: 0.03 });
    vibrate(12);
  },
  warning() {
    tone(220, 150, 0.22, { type: 'sawtooth', volume: 0.05 });
    vibrate([20, 40, 20]);
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((note, i) =>
      tone(note, note * 1.01, 0.32, { type: 'triangle', volume: 0.12, delay: i * 0.08 }),
    );
    vibrate([15, 30, 15, 30, 40]);
  },
  star(index) {
    const note = [783.99, 987.77, 1174.66][index] ?? 1174.66;
    tone(note, note * 1.5, 0.18, { type: 'sine', volume: 0.12 });
    vibrate(10);
  },
  sparkle() {
    tone(1400, 2200, 0.12, { type: 'sine', volume: 0.05 });
  },
  tap() {
    tone(660, 760, 0.05, { type: 'sine', volume: 0.05 });
  },
};
