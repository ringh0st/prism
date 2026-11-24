/**
 * Every sound of the book, made in code: paper turning, a crayon scribbling as a part fills, a soft note for
 * each crayon (a pentatonic scale, so any order of taps sounds pleasant), a music box when a page is finished,
 * and quiet lullaby music. Gentle and low on purpose: this is for little ears and calm moments.
 */
let ctx = null;
let master = null;
let noise = null;
let isOn = true;

function context() {
  if (ctx) return ctx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

/** A burst of paper or wax noise through a band of pitches that may glide. */
function hiss({ at = 0, length = 0.3, from = 1200, to = from, q = 1, gain = 0.2, attack = 0.03, tremolo = 0 }) {
  const c = context();
  if (!c || !isOn) return;
  const t = c.currentTime + at;
  const source = c.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = q;
  band.frequency.setValueAtTime(from, t);
  band.frequency.exponentialRampToValueAtTime(to, t + length);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);
  source.connect(band).connect(env);
  if (tremolo) {
    // A crayon on paper: the wax catches the grain in quick little strokes.
    const wobble = c.createGain();
    wobble.gain.value = 0.5;
    const lfo = c.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = tremolo;
    const depth = c.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(wobble.gain);
    env.connect(wobble).connect(master);
    lfo.start(t);
    lfo.stop(t + length + 0.05);
  } else {
    env.connect(master);
  }
  source.start(t, Math.random());
  source.stop(t + length + 0.05);
}

/** A soft mallet note: a sine with a quick bright overtone. */
function tone({ at = 0, freq = 440, length = 0.9, gain = 0.08, type = 'sine', bright = 0.25 }) {
  const c = context();
  if (!c || !isOn) return;
  const t = c.currentTime + at;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + length);
  env.connect(master);
  const main = c.createOscillator();
  main.type = type;
  main.frequency.value = freq;
  main.connect(env);
  main.start(t);
  main.stop(t + length + 0.05);
  if (bright) {
    const over = c.createOscillator();
    const overEnv = c.createGain();
    over.frequency.value = freq * 4;
    overEnv.gain.setValueAtTime(gain * bright, t);
    overEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    over.connect(overEnv).connect(master);
    over.start(t);
    over.stop(t + 0.2);
  }
}

/** C major pentatonic over two octaves: every crayon has its own note. */
const SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
export const noteOf = (index) => SCALE[index % SCALE.length];

export const sfx = {
  /** Browsers only play sound after a first touch. */
  unlock() {
    const c = context();
    if (c?.state === 'suspended') c.resume();
  },
  setOn(on) {
    isOn = on;
  },
  /** Picking up a crayon: a light wooden tick and its note. */
  pick(index) {
    hiss({ length: 0.05, from: 3800, q: 2, gain: 0.12, attack: 0.004 });
    tone({ freq: noteOf(index) * 2, length: 0.35, gain: 0.035, bright: 0 });
  },
  /** Coloring a part: the crayon scribbles while it fills, with the crayon's note under it. */
  paint(index, seconds = 0.5) {
    hiss({ length: seconds, from: 2600 + Math.random() * 600, to: 2000, q: 0.9, gain: 0.09, attack: 0.04, tremolo: 15 + Math.random() * 4 });
    hiss({ length: seconds * 0.8, from: 5200, q: 3, gain: 0.025, attack: 0.05, tremolo: 23 });
    tone({ freq: noteOf(index), length: 1.1, gain: 0.07 });
  },
  /** A tap that found nothing to color (outside the drawing): a tiny soft tap on paper. */
  tap() {
    hiss({ length: 0.06, from: 900, q: 1.5, gain: 0.06, attack: 0.005 });
  },
  /** Turning a page: paper lifting, sliding through the air and settling. */
  turn() {
    hiss({ length: 0.42, from: 700, to: 2600, q: 0.7, gain: 0.16, attack: 0.08 });
    hiss({ at: 0.06, length: 0.3, from: 4000, to: 6000, q: 2.5, gain: 0.03, attack: 0.05 });
    hiss({ at: 0.36, length: 0.12, from: 380, q: 1.2, gain: 0.08, attack: 0.01 });
  },
  /** Flicking through many pages at once. */
  riffle(count = 6) {
    for (let i = 0; i < count; i++) hiss({ at: i * 0.055, length: 0.1, from: 1400 + i * 120, to: 2600, q: 1, gain: 0.09, attack: 0.01 });
    hiss({ at: count * 0.055 + 0.05, length: 0.14, from: 420, q: 1.2, gain: 0.08, attack: 0.01 });
  },
  /** Opening the hard cover: a slow swoosh and a soft thump on the table. */
  openCover() {
    hiss({ length: 0.7, from: 400, to: 1500, q: 0.6, gain: 0.14, attack: 0.15 });
    tone({ at: 0.55, freq: 82, length: 0.25, gain: 0.16, bright: 0 });
    hiss({ at: 0.55, length: 0.12, from: 300, q: 1, gain: 0.1, attack: 0.005 });
  },
  /** Taking a tap back: a little rub of an eraser. */
  undo() {
    hiss({ length: 0.22, from: 1800, to: 900, q: 1, gain: 0.08, attack: 0.03, tremolo: 9 });
  },
  /** A clean page: a long eraser rub. */
  clean() {
    hiss({ length: 0.6, from: 1600, to: 900, q: 0.9, gain: 0.1, attack: 0.05, tremolo: 8 });
  },
  /** A finished page: a music box plays, then the star sticker goes on. */
  finished() {
    [523.3, 659.3, 784, 1046.5, 784, 1046.5, 1318.5].forEach((freq, i) => tone({ at: i * 0.13, freq, length: 1.4, gain: 0.06, type: 'triangle', bright: 0.4 }));
    for (let i = 0; i < 6; i++) tone({ at: 0.9 + i * 0.07, freq: 2093 * (1 + (i % 3) * 0.25), length: 0.4, gain: 0.02, bright: 0 });
  },
  /** Glitter: a few tiny bells on top of the paint. */
  twinkle() {
    [2093, 2637, 3136, 2349].forEach((freq, i) => tone({ at: 0.05 + i * 0.07, freq, length: 0.35, gain: 0.025, bright: 0 }));
  },
  /** A rubber stamp: a soft thump, then a little pop. */
  stamp() {
    tone({ freq: 140, length: 0.16, gain: 0.14, bright: 0 });
    hiss({ length: 0.06, from: 1800, q: 1.4, gain: 0.08, attack: 0.004 });
    tone({ at: 0.06, freq: 880, length: 0.25, gain: 0.04, bright: 0 });
  },
  sticker() {
    hiss({ length: 0.08, from: 2400, q: 1.2, gain: 0.1, attack: 0.004 });
    tone({ freq: 660, length: 0.22, gain: 0.06, bright: 0 });
  },
};

/**
 * Drawing on the blank sheet: a crayon rubbing on paper for as long as the finger moves, louder and brighter the
 * faster it goes, silent when it rests.
 */
let rub = null;
export const crayonRub = {
  start() {
    const c = context();
    if (!c || !isOn || rub) return;
    const source = c.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const band = c.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 2200;
    band.Q.value = 0.9;
    const level = c.createGain();
    level.gain.value = 0;
    const grain = c.createGain();
    grain.gain.value = 0.6;
    const lfo = c.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 17;
    const depth = c.createGain();
    depth.gain.value = 0.4;
    lfo.connect(depth).connect(grain.gain);
    source.connect(band).connect(level).connect(grain).connect(master);
    source.start(0, Math.random());
    lfo.start();
    rub = { source, band, level, lfo };
  },
  /** `speed` in sheet units per millisecond. */
  speed(speed) {
    if (!rub) return;
    const t = ctx.currentTime;
    rub.level.gain.setTargetAtTime(Math.min(0.13, speed * 0.09), t, 0.04);
    rub.band.frequency.setTargetAtTime(1800 + Math.min(1600, speed * 900), t, 0.06);
  },
  stop() {
    if (!rub) return;
    const { source, level, lfo } = rub;
    rub = null;
    level.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    source.stop(ctx.currentTime + 0.3);
    lfo.stop(ctx.currentTime + 0.3);
  },
};

/**
 * A quiet lullaby: a slow music box wandering on the same scale, never the same twice, with a soft echo.
 * Starts after the first touch, stops while the page is hidden.
 */
let musicTimer = 0;
let echo = null;
export const music = {
  start() {
    const c = context();
    if (!c || musicTimer) return;
    if (!echo) {
      echo = c.createDelay(1);
      echo.delayTime.value = 0.42;
      const back = c.createGain();
      back.gain.value = 0.32;
      const out = c.createGain();
      out.gain.value = 0.5;
      echo.connect(back).connect(echo);
      echo.connect(out).connect(master);
    }
    let step = 4;
    const play = () => {
      if (isOn && document.visibilityState === 'visible') {
        step = Math.max(0, Math.min(SCALE.length - 3, step + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]));
        const t = c.currentTime;
        const env = c.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.028, t + 0.02);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
        const osc = c.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = SCALE[step] * 2;
        osc.connect(env);
        env.connect(master);
        env.connect(echo);
        osc.start(t);
        osc.stop(t + 2.5);
        if (Math.random() < 0.3) tone({ at: 0.6, freq: SCALE[Math.max(0, step - 3)], length: 2.2, gain: 0.02, bright: 0 });
      }
      musicTimer = setTimeout(play, 900 + Math.random() * 900);
    };
    musicTimer = setTimeout(play, 600);
  },
  stop() {
    clearTimeout(musicTimer);
    musicTimer = 0;
  },
};
