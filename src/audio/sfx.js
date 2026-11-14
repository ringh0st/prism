// Tiny Web Audio synth: every sound is generated, so there are no files to load.
// One soft "music box" family: bell tones in a pentatonic scale through a warm low-pass,
// so even many sounds in a row stay calm. Each moment has its own sound and haptic strength.
import { mainOutput, sharedAudio } from './audioContext.js';
import { haptic } from './haptics.js';
import { DEFAULT_VOICE, voiceFor } from './worldVoices.js';

let enabled = true;
let hapticsEnabled = true;

/** The shared audio context, or null while sound effects are off. */
function audio() {
  return enabled ? sharedAudio() : null;
}

/** A single gliding tone. */
function tone(from, to, duration, { type = 'sine', volume = 0.12, delay = 0, attack = 0.01 } = {}) {
  const ctx = audio();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(mainOutput());
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** A music-box bell: a pure note with soft overtones and a long gentle fade. */
function bell(frequency, { delay = 0, volume = 0.1, duration = 0.6 } = {}) {
  tone(frequency, frequency, duration, { volume, delay, attack: 0.005 });
  tone(frequency * 2, frequency * 2, duration * 0.6, { volume: volume * 0.3, delay, attack: 0.005 });
  tone(frequency * 3.01, frequency * 3.01, duration * 0.3, { volume: volume * 0.1, delay, attack: 0.005 });
}

function feel(strength) {
  if (hapticsEnabled) haptic(strength);
}

/** The current world's voice (scale and instrument) for in-level sounds. */
let voice = DEFAULT_VOICE;
const voiceNote = (i) => voice.notes[Math.max(0, Math.min(voice.notes.length - 1, i))];

/** One note in the current world's instrument. */
function play(frequency, { delay = 0, volume = 0.1, duration = 0.5 } = {}) {
  switch (voice.timbre) {
    case 'pluck': // koto / oud: a bright attack that fades fast
      tone(frequency * 1.003, frequency, duration * 0.7, { type: 'triangle', volume, delay, attack: 0.002 });
      tone(frequency * 2, frequency * 2, duration * 0.25, { volume: volume * 0.3, delay, attack: 0.002 });
      break;
    case 'marimba': // a round wooden bar
      tone(frequency, frequency, duration * 0.5, { volume: volume * 1.1, delay, attack: 0.003 });
      tone(frequency * 4, frequency * 4, 0.05, { volume: volume * 0.2, delay, attack: 0.002 });
      break;
    case 'wood': // a soft woodblock with a warm body
      tone(frequency, frequency * 0.99, duration * 0.4, { type: 'triangle', volume, delay, attack: 0.003 });
      tone(frequency / 2, frequency / 2, duration * 0.3, { volume: volume * 0.4, delay, attack: 0.003 });
      break;
    case 'drop': // a water drop: a quick upward plink
      tone(frequency * 0.7, frequency * 1.3, 0.12, { volume, delay, attack: 0.004 });
      tone(frequency, frequency, duration * 0.5, { volume: volume * 0.4, delay: delay + 0.05, attack: 0.01 });
      break;
    case 'crystal': // a high bell with an echo off the mountains
      bell(frequency, { delay, volume: volume * 0.8, duration });
      bell(frequency, { delay: delay + 0.22, volume: volume * 0.25, duration });
      break;
    default:
      bell(frequency, { delay, volume, duration });
  }
}

/** A little nature sound for a world's start-up jingle. */
const ACCENTS = {
  chirp: (delay) => {
    tone(2600, 3400, 0.06, { volume: 0.03, delay });
    tone(2800, 3600, 0.07, { volume: 0.03, delay: delay + 0.09 });
  },
  hoot: (delay) => {
    tone(420, 380, 0.25, { volume: 0.05, delay, attack: 0.05 });
    tone(400, 360, 0.35, { volume: 0.05, delay: delay + 0.32, attack: 0.05 });
  },
  splash: (delay) => [0, 0.07, 0.15].forEach((d, i) => tone(900 + i * 300, 1500 + i * 300, 0.06, { volume: 0.03, delay: delay + d })),
};

// C major pentatonic, from C5 up.
const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
const note = (i) => NOTES[Math.max(0, Math.min(NOTES.length - 1, i))];

export const sfx = {
  configure({ sound, haptics }) {
    enabled = sound;
    hapticsEnabled = haptics;
  },
  unlock() {
    audio();
  },
  /** In-level sounds use this world's voice (null for daily puzzles, events and menus). */
  setWorldVoice(theme) {
    voice = voiceFor(theme);
  },

  // --- Playing a level ---
  /** A piece turns: a little wooden tick. */
  rotate() {
    tone(380, 520, 0.06, { type: 'triangle', volume: 0.07 });
    feel('light');
  },
  /** Another gem lights up: each one a step higher. */
  gemLit(count) {
    play(voiceNote(count + 1), { volume: 0.11, duration: 0.5 });
    feel('light');
  },
  /** One tap lit several gems: a rising run of chimes that grows with the combo. */
  combo(size) {
    const run = [3, 5, 7, 8, 10].slice(0, Math.min(5, size + 1));
    run.forEach((step, i) => play(voiceNote(step), { delay: i * 0.06, volume: 0.1, duration: 0.45 }));
    tone(note(8), note(10) * 1.02, 0.3, { volume: 0.04, delay: run.length * 0.06 });
    feel(size >= 4 ? 'celebrate' : 'success');
  },
  /** The beam hits a shadow crystal: a soft "hmm", not an error buzz. */
  shade() {
    tone(392, 330, 0.22, { volume: 0.07 });
    tone(196, 165, 0.25, { type: 'triangle', volume: 0.04 });
    feel('light');
  },
  /** A cracking mirror used its last turn: a little glassy crack (gentle, not scary). */
  crack() {
    tone(1800, 900, 0.09, { type: 'triangle', volume: 0.05, delay: 0.05 });
    tone(2400, 1200, 0.07, { type: 'triangle', volume: 0.04, delay: 0.1 });
    feel('medium');
  },
  /** A level begins: a little swoosh, then the world's own motif (and its nature sound). */
  levelStart() {
    tone(260, 620, 0.22, { volume: 0.05, attack: 0.08 });
    voice.motif.forEach((step, i) => play(voiceNote(step), { delay: 0.18 + i * 0.11, volume: 0.07, duration: 0.45 }));
    ACCENTS[voice.accent]?.(0.25 + voice.motif.length * 0.11);
  },
  /** Back to the start: a quick little rewind. */
  restart() {
    [4, 2, 0].forEach((step, i) => tone(note(step), note(step) * 0.98, 0.07, { type: 'triangle', volume: 0.05, delay: i * 0.05 }));
    feel('light');
  },
  /** Out of moves: a kind "awww", sliding gently down. Never harsh. */
  outOfMoves() {
    bell(note(4), { volume: 0.08 });
    bell(note(2), { delay: 0.18, volume: 0.07 });
    tone(note(1), note(0) * 0.94, 0.55, { volume: 0.06, delay: 0.36, attack: 0.04 });
    feel('soft');
  },
  /** A helper does its magic. */
  helper() {
    [5, 6, 7].forEach((step, i) => bell(note(step), { delay: i * 0.05, volume: 0.05, duration: 0.3 }));
    feel('light');
  },
  /** Solved! The fanfare grows with the stars, and bosses get an extra flourish. */
  win({ stars = 3, isBig = false } = {}) {
    const run = [0, 2, 3, 5, 7, 8, 10].slice(0, 3 + stars + (isBig ? 1 : 0));
    run.forEach((step, i) => play(voiceNote(step), { delay: i * 0.08, volume: 0.1, duration: 0.5 }));
    const end = run.length * 0.08;
    [0, 3, 5].forEach((step) => play(voiceNote(step + (stars === 3 ? 2 : 0)), { delay: end + 0.05, volume: 0.06, duration: 0.9 }));
    feel(stars === 3 || isBig ? 'celebrate' : 'success');
  },
  /** Each star landing on the win screen: a rising ding. */
  star(index) {
    bell(note(5 + index * 2), { volume: 0.1, duration: 0.45 });
    tone(note(5 + index * 2), note(5 + index * 2) * 1.5, 0.18, { volume: 0.03 });
    feel('light');
  },
  /** A whole world finished: the biggest fanfare. */
  worldComplete() {
    [0, 2, 3, 5, 3, 5, 7, 10].forEach((step, i) => bell(note(step), { delay: i * 0.1, volume: 0.1, duration: 0.6 }));
    [5, 7, 10].forEach((step) => bell(note(step), { delay: 0.9, volume: 0.07, duration: 1.2 }));
    feel('celebrate');
  },

  // --- Pals ---
  /** Your Pal grows into its next form: a magical glissando and a shimmering chord. */
  palGrow() {
    for (let i = 0; i <= 10; i++) bell(note(i), { delay: i * 0.045, volume: 0.06, duration: 0.4 });
    [5, 7, 9, 10].forEach((step) => bell(note(step), { delay: 0.55, volume: 0.07, duration: 1.4 }));
    feel('celebrate');
  },
  /** The player reaches a new level: a quick climbing sparkle that lands on a bright chord. */
  levelUp() {
    [0, 2, 4, 5, 7].forEach((step, i) => bell(note(step), { delay: i * 0.05, volume: 0.06, duration: 0.35 }));
    [7, 9].forEach((step) => bell(note(step), { delay: 0.3, volume: 0.07, duration: 1 }));
    feel('success');
  },
  /** A new Pal joins the team. */
  newPal() {
    tone(900, 1300, 0.08, { volume: 0.05 });
    tone(1000, 1500, 0.08, { volume: 0.05, delay: 0.1 });
    [3, 5, 7, 8].forEach((step, i) => bell(note(step), { delay: 0.25 + i * 0.08, volume: 0.08 }));
    feel('success');
  },
  /** A Pal says hi in the Grove: a cheerful chirp. */
  hello() {
    tone(880, 1320, 0.08, { volume: 0.06 });
    tone(990, 1480, 0.1, { volume: 0.06, delay: 0.11 });
    feel('light');
  },
  /** Decor set down in the Grove: a soft thump and a twinkle. */
  place() {
    tone(170, 95, 0.12, { volume: 0.09 });
    bell(note(7), { delay: 0.08, volume: 0.05, duration: 0.35 });
    feel('medium');
  },

  // --- Rewards and the shop ---
  /** Bought something: a classic two-note coin. */
  coin() {
    bell(note(6), { volume: 0.08, duration: 0.15 });
    bell(note(9), { delay: 0.08, volume: 0.09, duration: 0.5 });
    feel('light');
  },
  /** Collected a reward (gift, daily, weekly prize): a bright run up. */
  reward() {
    [3, 5, 7, 8, 10].forEach((step, i) => bell(note(step), { delay: i * 0.06, volume: 0.08, duration: 0.45 }));
    feel('success');
  },
  /** A chest opens: a wooden clunk, then treasure sparkles. */
  chest() {
    tone(140, 90, 0.16, { type: 'triangle', volume: 0.1 });
    tone(210, 150, 0.12, { type: 'triangle', volume: 0.06, delay: 0.06 });
    [5, 7, 8, 10, 9, 10].forEach((step, i) => bell(note(step), { delay: 0.25 + i * 0.06, volume: 0.07, duration: 0.4 }));
    feel('success');
  },

  // --- Moving around ---
  /** Switching tabs. */
  tab() {
    tone(700, 820, 0.05, { volume: 0.04 });
    feel('light');
  },
  /** Tapping something that's still locked: a soft "bonk". */
  locked() {
    tone(200, 130, 0.14, { volume: 0.09 });
    feel('double');
  },
  /** A small confirmation (a choice made, a setting changed). */
  sparkle() {
    bell(note(9), { volume: 0.05, duration: 0.3 });
    feel('light');
  },
  tap() {
    tone(660, 760, 0.05, { volume: 0.05 });
    feel('light');
  },
};
