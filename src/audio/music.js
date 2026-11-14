// Quiet background music for levels, made on the fly in each world's voice (its scale and instrument):
// a slow, soft pad under a few sparse music-box notes that wander up and down the scale, so it never
// repeats exactly. Kept far below the sound effects, it fades in and out and stops while the app is hidden.
import { mainOutput, sharedAudio } from './audioContext.js';
import { voiceFor } from './worldVoices.js';

const VOLUME = 0.045;
const BEAT = 0.95; // seconds, about 63 beats a minute
const BEATS_PER_CHORD = 8;
const NOTE_CHANCE = 0.3;
const LOOKAHEAD = 0.8; // seconds of music scheduled ahead
const TICK_MS = 250;
const FADE_IN = 3;
const FADE_OUT = 1.2;
// Chord roots as steps up the world's scale: a gentle loop that never lands too hard.
const PROGRESSION = [0, 3, 1, 4];
const TRIANGLE_TIMBRES = new Set(['wood', 'pluck', 'marimba']);

let isOn = true;
let isWanted = false;
let wantedTheme = null;
let session = null;

/** The world's scale moved down so it starts just under C5: low enough to stay in the background. */
function scaleFor(theme) {
  const { notes, timbre } = voiceFor(theme);
  let shift = 1;
  while (notes[0] * shift >= 520) shift /= 2;
  return { notes: notes.map((frequency) => frequency * shift), wave: TRIANGLE_TIMBRES.has(timbre) ? 'triangle' : 'sine' };
}

function tone({ ctx, bus }, frequency, at, { volume, attack, duration, wave = 'sine' }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain).connect(bus);
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

/** One beat: a new pad chord every few bars, and now and then a soft note a step or two from the last one. */
function playBeat(song, at) {
  if (song.beat % BEATS_PER_CHORD === 0) {
    const root = PROGRESSION[(song.beat / BEATS_PER_CHORD) % PROGRESSION.length];
    const length = BEAT * BEATS_PER_CHORD + 2; // overlaps the next chord for a smooth change
    tone(song, song.notes[root] / 2, at, { volume: 0.5, attack: 2.5, duration: length });
    tone(song, song.notes[root + 2] / 2, at, { volume: 0.28, attack: 3, duration: length });
  }
  if (Math.random() >= NOTE_CHANCE) return;
  const leap = [-2, -1, 1, 2][Math.floor(Math.random() * 4)];
  song.step = Math.max(3, Math.min(9, song.step + leap));
  const frequency = song.notes[song.step];
  tone(song, frequency, at, { volume: 0.55, attack: 0.01, duration: 2.2, wave: song.wave });
  tone(song, frequency * 2, at, { volume: 0.1, attack: 0.01, duration: 0.8 });
}

function schedule(song) {
  while (song.nextBeat < song.ctx.currentTime + LOOKAHEAD) {
    playBeat(song, song.nextBeat);
    song.nextBeat += BEAT;
    song.beat += 1;
  }
}

function start(theme) {
  const ctx = sharedAudio();
  const output = mainOutput();
  if (!ctx || !output) return;
  const bus = ctx.createGain();
  const soften = ctx.createBiquadFilter();
  soften.type = 'lowpass';
  soften.frequency.value = 2400;
  bus.gain.setValueAtTime(0.0001, ctx.currentTime);
  bus.gain.exponentialRampToValueAtTime(VOLUME, ctx.currentTime + FADE_IN);
  bus.connect(soften).connect(output);
  const song = { ctx, bus, theme, ...scaleFor(theme), beat: 0, step: 5, nextBeat: ctx.currentTime + 0.3 };
  song.timer = setInterval(() => schedule(song), TICK_MS);
  schedule(song);
  session = song;
}

function stop() {
  if (!session) return;
  const { ctx, bus, timer } = session;
  session = null;
  clearInterval(timer);
  const now = ctx.currentTime;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), now);
  bus.gain.exponentialRampToValueAtTime(0.0001, now + FADE_OUT);
  setTimeout(() => bus.disconnect(), FADE_OUT * 1000 + 300);
}

function refresh() {
  const shouldPlay = isOn && isWanted && !document.hidden;
  if (!shouldPlay) {
    stop();
    return;
  }
  if (session?.theme === wantedTheme) return;
  stop();
  start(wantedTheme);
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', refresh);

export const music = {
  /** Music plays only while both sound and music are on in Settings. */
  configure({ sound, music: musicOn }) {
    isOn = sound && musicOn;
    refresh();
  },
  /** Start (or switch to) a world's music; null is the voice for daily puzzles and events. */
  play(theme) {
    isWanted = true;
    wantedTheme = theme ?? null;
    refresh();
  },
  stop() {
    isWanted = false;
    refresh();
  },
};
